import { useState, useEffect, useRef } from "react";
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
  orderBy,
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
  // Track whether we've ever received data, to avoid flicker
  const hasData = useRef(docs.length > 0);

  useEffect(() => {
    const db = getFirebaseDb();
    if (!db) {
      setTimeout(() => setLoading(false), 0);
      return;
    }

    // Safety timeout — never stuck loading forever
    const timer = setTimeout(() => setLoading(false), 8000);
    let unsubFallback = null;

    // Primary query: ordered by field desc
    const q = query(
      collection(db, colName),
      orderBy(orderField, "desc"),
      limit(limitCount)
    );

    const unsub = onSnapshot(
      q,
      { includeMetadataChanges: false },
      (snap) => {
        clearTimeout(timer);
        setError(null);

        if (snap.empty && !hasData.current) {
          console.log(`[empty response reason] ${colName}: Collection is empty or query returned no results.`);
          // Collection may have docs without the orderField — try without orderBy
          if (!unsubFallback) {
            const fallbackQ = query(collection(db, colName), limit(limitCount));
            unsubFallback = onSnapshot(fallbackQ, (fallbackSnap) => {
              const fetched = fallbackSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
              hasData.current = fetched.length > 0;
              setDocs(fetched);
              setLoading(false);
            }, (err) => {
              console.error(`Fallback error fetching ${colName}:`, err.message);
              setError(err);
              setLoading(false);
            });
          }
          // Don't set loading:false yet — wait for fallback
          return;
        }

        // We have docs from the ordered query
        if (unsubFallback) {
          unsubFallback();
          unsubFallback = null;
        }

        const fetched = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        console.log(`[${colName.includes('tip') ? 'posts' : colName.includes('deal') ? 'tools' : colName} fetch] Received ${fetched.length} docs.`);
        hasData.current = fetched.length > 0;

        // Client-side sort handles null serverTimestamp on pending writes
        // (docs just written have null createdAt until server confirms)
        fetched.sort((a, b) => {
          const getTime = (item) => {
            // Prefer updatedAt for recency, fallback to createdAt
            const f = item.updatedAt || item[orderField];
            if (!f) return Date.now() + 10000; // pending write — put at top
            if (f?.toDate) return f.toDate().getTime();
            if (typeof f === "number") return f;
            const t = new Date(f).getTime();
            return isNaN(t) ? 0 : t;
          };
          return getTime(b) - getTime(a);
        });

        // Serialize timestamps for cache
        const cacheable = fetched.map(d => {
          const copy = { ...d };
          for (const key in copy) {
            if (copy[key]?.toDate) copy[key] = copy[key].toDate().toISOString();
          }
          return copy;
        });
        try {
          localStorage.setItem(`stea_cache_${colName}`, JSON.stringify(cacheable));
        } catch (e) {
          console.warn(`Failed to cache ${colName} to localStorage:`, e);
          // Optionally clear old cache if it's too big
          localStorage.removeItem(`stea_cache_${colName}`);
        }

        setDocs(fetched);
        setLoading(false);
      },
      (err) => {
        clearTimeout(timer);
        console.error(`Error fetching ${colName}:`, err.message);
        
        // Fallback if primary query fails (e.g., missing index)
        if (err.message.includes("index") || err.code === 'failed-precondition') {
          console.warn(`Falling back to unordered query for ${colName} due to missing index.`);
          if (!unsubFallback) {
            const fallbackQ = query(collection(db, colName), limit(limitCount));
            unsubFallback = onSnapshot(fallbackQ, (fallbackSnap) => {
              const fetched = fallbackSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
              hasData.current = fetched.length > 0;
              
              // Client-side sort
              fetched.sort((a, b) => {
                const getTime = (item) => {
                  const f = item.updatedAt || item[orderField];
                  if (!f) return Date.now() + 10000;
                  if (f?.toDate) return f.toDate().getTime();
                  if (typeof f === "number") return f;
                  const t = new Date(f).getTime();
                  return isNaN(t) ? 0 : t;
                };
                return getTime(b) - getTime(a);
              });
              
              setDocs(fetched);
              setLoading(false);
            }, (fallbackErr) => {
              console.error(`Fallback error fetching ${colName}:`, fallbackErr.message);
              setError(fallbackErr);
              setLoading(false);
            });
          }
          return;
        }

        setError(err);
        if (err.message.includes("insufficient permissions")) {
          try { handleFirestoreError(err, OperationType.LIST, colName); } catch {
            // Error handled
          }
        }
        setLoading(false);
      }
    );

    return () => {
      clearTimeout(timer);
      unsub();
      if (unsubFallback) unsubFallback();
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
