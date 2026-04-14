import { useState, useEffect } from "react";
import {
  getFirebaseDb,
  collection,
  onSnapshot,
  query,
  limit,
  doc,
  updateDoc,
  increment,
  handleFirestoreError,
  OperationType,
} from "../firebase.js";

export function useCollection(colName, orderField = "createdAt", limitCount = 50) {
  const [docs, setDocs] = useState(() => {
    try {
      const cached = localStorage.getItem(`stea_cache_${colName}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (err) {
      console.warn(`Failed to parse cache for ${colName}:`, err.message);
    }
    return [];
  });
  const [loading, setLoading] = useState(docs.length === 0);
  const [error, setError] = useState(null);

  useEffect(() => {
    const db = getFirebaseDb();
    if (!db) {
      Promise.resolve().then(() => setLoading(false));
      return;
    }

    const timer = setTimeout(() => setLoading(false), 8000);

    // REMOVED orderBy to prevent missing index errors from hiding data
    // We will sort entirely on the client side.
    const q = query(collection(db, colName), limit(limitCount));

    const unsub = onSnapshot(
      q,
      { includeMetadataChanges: false },
      (snap) => {
        clearTimeout(timer);
        setError(null);

        if (snap.empty) {
          console.log(`[useCollection] ${colName} is empty.`);
          setDocs([]);
          setLoading(false);
          return;
        }

        const fetched = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        console.log(`Fetched ${colName}:`, fetched);
        console.log(`[useCollection] ${colName} fetched ${fetched.length} docs.`);

        // Client-side sort handles missing createdAt fields
        fetched.sort((a, b) => {
          const getTime = (item) => {
            const f = item.updatedAt || item[orderField] || item.createdAt;
            if (!f) return 0; // Put items without dates at the bottom
            if (f?.toDate) return f.toDate().getTime();
            if (typeof f === "number") return f;
            const t = new Date(f).getTime();
            return isNaN(t) ? 0 : t;
          };
          return getTime(b) - getTime(a);
        });

        // Cache
        const cacheable = fetched.map(d => {
          const copy = { ...d };
          for (const key in copy) {
            if (copy[key]?.toDate) copy[key] = copy[key].toDate().toISOString();
          }
          return copy;
        });
        try {
          localStorage.setItem(`stea_cache_${colName}`, JSON.stringify(cacheable));
        } catch {
          localStorage.removeItem(`stea_cache_${colName}`);
        }

        setDocs(fetched);
        setLoading(false);
      },
      (err) => {
        clearTimeout(timer);
        console.error(`[useCollection] Error fetching ${colName}:`, err.message);
        setError(err);
        
        if (err.message.includes("insufficient permissions")) {
          try { 
            handleFirestoreError(err, OperationType.LIST, colName); 
          } catch {
            // Error already logged by handleFirestoreError
          }
        }
        setLoading(false);
      }
    );

    return () => {
      clearTimeout(timer);
      unsub();
    };
  }, [colName, orderField, limitCount]);

  return { docs, loading, error };
}

export async function incrementViews(colName, docId) {
  const db = getFirebaseDb();
  if (!db) return;
  try {
    await updateDoc(doc(db, colName, docId), { views: increment(1) });
  } catch (e) {
    console.warn("incrementViews error:", e.message);
  }
}

export function timeAgo(timestamp) {
  if (!timestamp) return "";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  if (isNaN(date.getTime())) return "";
  const seconds = Math.floor((new Date() - date) / 1000);
  const intervals = [
    [31536000, "year"],
    [2592000, "month"],
    [86400, "day"],
    [3600, "hour"],
    [60, "minute"],
  ];
  for (const [s, label] of intervals) {
    const n = Math.floor(seconds / s);
    if (n >= 1) return `${n} ${label}${n > 1 ? "s" : ""} ago`;
  }
  return "just now";
}

export function fmtViews(v) {
  if (!v) return "0";
  if (v >= 1000000) return (v / 1000000).toFixed(1) + "M";
  if (v >= 1000) return (v / 1000).toFixed(1) + "K";
  return String(v);
}
