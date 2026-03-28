import { useEffect, useMemo, useState } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  where,
  onSnapshot,
  doc,
  updateDoc,
  increment,
  getDoc,
  serverTimestamp,
} from "../firebase.js";
import { getFirebaseDb, handleFirestoreError, OperationType } from "../firebase.js";

/* =========================================================
   Helpers
========================================================= */

export function fmtViews(value) {
  const n = Number(value || 0);

  if (n >= 1000000) {
    return `${(n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 1)}M`;
  }
  if (n >= 1000) {
    return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  }
  return `${n}`;
}

export function timeAgo(input) {
  if (!input) return "just now";

  let date;

  // Firestore Timestamp
  if (typeof input?.toDate === "function") {
    date = input.toDate();
  }
  // seconds object
  else if (input?.seconds) {
    date = new Date(input.seconds * 1000);
  }
  // JS Date or string
  else {
    date = new Date(input);
  }

  if (Number.isNaN(date.getTime())) return "just now";

  const now = new Date();
  const diffMs = now - date;
  const sec = Math.floor(diffMs / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  const week = Math.floor(day / 7);
  const month = Math.floor(day / 30);
  const year = Math.floor(day / 365);

  if (sec < 30) return "just now";
  if (sec < 60) return `${sec}s ago`;
  if (min < 60) return `${min}m ago`;
  if (hr < 24) return `${hr}h ago`;
  if (day < 7) return `${day}d ago`;
  if (week < 5) return `${week}w ago`;
  if (month < 12) return `${month}mo ago`;
  return `${year}y ago`;
}

/* =========================================================
   useCollection Hook
   Usage examples:
   useCollection("tips")
   useCollection("updates", { orderField: "createdAt", direction: "desc", max: 6 })
   useCollection("deals", { filters: [{ field: "active", op: "==", value: true }] })
========================================================= */

export function useCollection(
  collectionName,
  options = {}
) {
  const {
    orderField = "createdAt",
    direction = "desc",
    max = null,
    filters = [],
    enabled = true,
  } = options;

  const db = getFirebaseDb();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState(null);

  const queryConfig = useMemo(() => {
    return {
      collectionName,
      orderField,
      direction,
      max,
      filters,
      enabled,
    };
  }, [collectionName, orderField, direction, max, filters, enabled]);

  useEffect(() => {
    if (!enabled || !collectionName) {
      setLoading(false);
      setData([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const constraints = [];

      if (Array.isArray(filters)) {
        filters.forEach((f) => {
          if (f?.field && f?.op && f?.value !== undefined) {
            constraints.push(where(f.field, f.op, f.value));
          }
        });
      }

      if (orderField) {
        constraints.push(orderBy(orderField, direction));
      }

      if (max) {
        constraints.push(limit(max));
      }

      const q = query(collection(db, collectionName), ...constraints);

      const unsub = onSnapshot(
        q,
        (snapshot) => {
          const rows = snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }));

          setData(rows);
          setLoading(false);
        },
        (err) => {
          console.error(`[useCollection:${collectionName}]`, err);
          setError(err);
          setLoading(false);
        }
      );

      return () => unsub();
    } catch (err) {
      console.error(`[useCollection:${collectionName}]`, err);
      setError(err);
      setLoading(false);
    }
  }, [db, queryConfig, enabled, collectionName, orderField, direction, max, filters]);

  return { data, loading, error };
}

/* =========================================================
   incrementViews
   Safe view increment with 1-per-device-per-day local cache
========================================================= */

export async function incrementViews(collectionName, docId) {
  if (!collectionName || !docId) return false;

  const db = getFirebaseDb();
  const today = new Date().toISOString().slice(0, 10);
  const localKey = `stea_viewed_${collectionName}_${docId}_${today}`;

  try {
    // stop duplicate increments on same device same day
    if (typeof window !== "undefined" && localStorage.getItem(localKey)) {
      return false;
    }

    const ref = doc(db, collectionName, docId);

    // optional existence check
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      console.warn(`Document not found: ${collectionName}/${docId}`);
      return false;
    }

    await updateDoc(ref, {
      views: increment(1),
      updatedAt: serverTimestamp(),
    });

    if (typeof window !== "undefined") {
      localStorage.setItem(localKey, "1");
    }

    return true;
  } catch (error) {
    console.error(`incrementViews failed for ${collectionName}/${docId}`, error);
    try {
      handleFirestoreError(error, OperationType.UPDATE, `${collectionName}/${docId}`);
    } catch {
      // prevent UI crash if error formatter throws
    }
    return false;
  }
}

/* =========================================================
   Optional helper: one document live
========================================================= */

export function useDocument(collectionName, docId, enabled = true) {
  const db = getFirebaseDb();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled || !collectionName || !docId) {
      setLoading(false);
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const ref = doc(db, collectionName, docId);

      const unsub = onSnapshot(
        ref,
        (snapshot) => {
          if (!snapshot.exists()) {
            setData(null);
          } else {
            setData({
              id: snapshot.id,
              ...snapshot.data(),
            });
          }
          setLoading(false);
        },
        (err) => {
          console.error(`[useDocument:${collectionName}/${docId}]`, err);
          setError(err);
          setLoading(false);
        }
      );

      return () => unsub();
    } catch (err) {
      console.error(`[useDocument:${collectionName}/${docId}]`, err);
      setError(err);
      setLoading(false);
    }
  }, [db, collectionName, docId, enabled]);

  return { data, loading, error };
}

