import { collection, doc, getDocs, query, where, limit, updateDoc, serverTimestamp } from "../firebase.js";

export const assignConfigToUser = async (db, userId, planDays, planType) => {
  const sourcesRef = collection(db, "vpnSources");
  const q = query(sourcesRef, where("status", "==", "available"), where("type", "==", "paid"), limit(1));
  const sourceSnap = await getDocs(q);

  if (sourceSnap.empty) {
    throw new Error("Hakuna subscription sources zinazopatikana sasa hivi. Tafadhali wasiliana na admin.");
  }

  const sourceDoc = sourceSnap.docs[0];
  const userRef = doc(db, "users", userId);

  const now = new Date();
  const endDate = new Date(now.getTime() + planDays * 24 * 60 * 60 * 1000);

  await updateDoc(userRef, {
    "vpn.status": "active",
    "vpn.planType": planType,
    "vpn.startDate": now,
    "vpn.endDate": endDate,
    "vpn.assignedSourceId": sourceDoc.id,
    "vpn.configLink": sourceDoc.data().configUrl,
    "vpn.lastRotatedAt": now,
    "vpn.approvedByAdmin": true,
    "vpn.configAssigned": true,
  });
};

export const startVpnTrial = async (db, userId, trialHours) => {
  const sourcesRef = collection(db, "vpnSources");

  // Try trial-type first, fallback to any available source
  let sourceDoc = null;
  const qTrial = query(sourcesRef, where("status", "==", "available"), where("type", "==", "trial"), limit(1));
  const trialSnap = await getDocs(qTrial);

  if (!trialSnap.empty) {
    sourceDoc = trialSnap.docs[0];
  } else {
    // Fallback: use any available source (trial config can be shared)
    const qAny = query(sourcesRef, where("status", "==", "available"), limit(1));
    const anySnap = await getDocs(qAny);
    if (!anySnap.empty) {
      sourceDoc = anySnap.docs[0];
    }
  }

  if (!sourceDoc) {
    throw new Error("Hakuna trial subscription source inayopatikana sasa hivi. Tafadhali wasiliana na admin.");
  }

  const userRef = doc(db, "users", userId);
  const now = new Date();
  const endsAt = new Date(now.getTime() + trialHours * 60 * 60 * 1000);

  await updateDoc(userRef, {
    "vpn.status": "trial",
    "vpn.trialEligible": false,
    "vpn.trialStartedAt": now,
    "vpn.trialEndsAt": endsAt,
    "vpn.assignedSourceId": sourceDoc.id,
    "vpn.configLink": sourceDoc.data().configUrl,
    "vpn.configAssigned": true,
    "vpn.lastRotatedAt": now,
  });
};

export const expireUserVpnAccess = async (db, userId, assignedSourceId) => {
  const userRef = doc(db, "users", userId);
  const now = new Date();

  // Update user document to expired state
  await updateDoc(userRef, {
    "vpn.status": "expired",
    "vpn.configAssigned": false,
    "vpn.configLink": null,
    "vpn.assignedSourceId": null,
    "vpn.expiredAt": now,
  });

  // If we have the source ID, mark it available again (for non-shared sources)
  if (assignedSourceId) {
    try {
      const sourceRef = doc(db, "vpnSources", assignedSourceId);
      await updateDoc(sourceRef, {
        status: "available",
        assignedTo: null,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      // Non-critical: source might be shared and already available
      console.warn("Could not reset source status:", e.message);
    }
  }
};

export const rotateExpiredConfigs = async (db) => {
  const now = new Date();
  let expiredCount = 0;

  const usersRef = collection(db, "users");
  const usersSnap = await getDocs(usersRef);

  for (const userDoc of usersSnap.docs) {
    const data = userDoc.data();

    if (data.vpn?.status === 'active' && data.vpn?.endDate) {
      const endDate = data.vpn.endDate.toDate ? data.vpn.endDate.toDate() : new Date(data.vpn.endDate);
      if (endDate < now) {
        await expireUserVpnAccess(db, userDoc.id, data.vpn.assignedSourceId);
        expiredCount++;
      }
    }

    if (data.vpn?.status === 'trial' && data.vpn?.trialEndsAt) {
      const endsAt = data.vpn.trialEndsAt.toDate ? data.vpn.trialEndsAt.toDate() : new Date(data.vpn.trialEndsAt);
      if (endsAt < now) {
        await expireUserVpnAccess(db, userDoc.id, data.vpn.assignedSourceId);
        expiredCount++;
      }
    }
  }

  return { expiredCount };
};
