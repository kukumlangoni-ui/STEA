import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth, GoogleAuthProvider,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signInWithPopup, signOut, onAuthStateChanged, sendPasswordResetEmail,
} from "firebase/auth";
import {
  getFirestore, collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, getDoc, setDoc, onSnapshot, query, orderBy, limit,
  serverTimestamp, increment, where,
} from "firebase/firestore";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import firebaseConfig from "../firebase-applet-config.json";

// ── VAPID Key — get from Firebase Console > Project Settings > Cloud Messaging > Web Push certificates
// Replace this placeholder with your actual VAPID key
const VAPID_KEY = "YOUR_VAPID_KEY_HERE";

const ADMIN_EMAIL = "swahilitechacademy@gmail.com";

// Helper to normalize email input (appends @gmail.com if domain is missing)
export const normalizeEmail = (email) => {
  if (!email) return "";
  const trimmed = email.trim().toLowerCase();
  if (!trimmed.includes("@")) {
    return `${trimmed}@gmail.com`;
  }
  return trimmed;
};

// ── Init (safe, runs once) ────────────────────────────
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// FCM Messaging — only init in browser (not in SW)
let messaging = null;
try {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    messaging = getMessaging(app);
  }
} catch (e) {
  console.warn("[FCM] Messaging init skipped:", e.message);
}

// Request notification permission + get FCM token
export async function requestNotificationPermission() {
  if (!messaging) return null;
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    if (token) {
      // Save token to Firestore (dedup by token)
      await setDoc(doc(db, "fcm_tokens", token), {
        token,
        createdAt: serverTimestamp(),
        platform: navigator.userAgent,
      }, { merge: true });
    }
    return token;
  } catch (e) {
    console.warn("[FCM] Token error:", e.message);
    return null;
  }
}

// Send push notification to all tokens (called from admin on new post)
// Requires fcmServerKey in firebase-applet-config.json
export async function sendPushNotification({ title, body, url }) {
  const serverKey = firebaseConfig.fcmServerKey;
  if (!serverKey || serverKey === "YOUR_FCM_SERVER_KEY") {
    console.warn("[FCM] fcmServerKey not set in firebase-applet-config.json");
    return;
  }
  try {
    // Get all saved tokens
    const snap = await getDocs(collection(db, "fcm_tokens"));
    const tokens = snap.docs.map(d => d.data().token).filter(Boolean);
    if (!tokens.length) return;

    // Send in batches of 500 (FCM limit)
    const batches = [];
    for (let i = 0; i < tokens.length; i += 500) {
      batches.push(tokens.slice(i, i + 500));
    }
    await Promise.allSettled(
      batches.map(batch =>
        fetch("https://fcm.googleapis.com/fcm/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `key=${serverKey}`,
          },
          body: JSON.stringify({
            registration_ids: batch,
            notification: { title, body, icon: "/stea-icon.png", click_action: url },
            data: { url },
            webpush: {
              notification: { icon: "/stea-icon.png", badge: "/stea-icon.png" },
              fcm_options: { link: url },
            },
          }),
        })
      )
    );
    console.log("[FCM] Notifications sent to", tokens.length, "devices");
  } catch (e) {
    console.error("[FCM] Send error:", e.message);
  }
}

export { messaging, VAPID_KEY, onMessage };

export { auth, db, ADMIN_EMAIL, GoogleAuthProvider };
export {
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signInWithPopup, signOut, onAuthStateChanged, sendPasswordResetEmail,
};
export {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, getDoc, setDoc, onSnapshot, query, orderBy, limit,
  serverTimestamp, increment, where,
};

// For backward compatibility with existing code
export const initFirebase = () => ({ auth, db });
export const getFirebaseAuth = () => auth;
export const getFirebaseDb = () => db;

export const OperationType = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LIST: 'list',
  GET: 'get',
  WRITE: 'write',
};

function safeStringify(obj) {
  const cache = new Set();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (cache.has(value)) {
        return; // Discard circular reference
      }
      cache.add(value);
    }
    return value;
  });
}

export function handleFirestoreError(error, operationType, path) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  const errorJson = safeStringify(errInfo);
  console.error('Firestore Error: ', errorJson);
  throw new Error(errorJson);
}
