import { useState, useEffect, useRef } from "react";
import {
  getFirebaseDb,
  collection, onSnapshot, query, limit, doc, updateDoc, increment, orderBy,
} from "../firebase.js";

// ── useCollection ─────────────────────────────────────────────────────────────
// Fetches a Firestore collection with real-time updates.
// Strategy:
//   1. Show cached data immediately (no flicker)
//   2. Start ordered query (by orderField desc)
//   3. If that fails (missing index), fall back to unordered query
//   4. Sort client-side so UI is always newest-first
// ─────────────────────────────────────────────────────────────────────────────

const CACHE_PREFIX = "stea_col_";

function readCache(colName) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + colName);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function writeCache(colName, docs) {
  try {
    const serializable = docs.map(d => {
      const copy = { ...d };
      for (const k in copy) {
        if (copy[k]?.toDate) copy[k] = copy[k].toDate().toISOString();
      }
      return copy;
    });
    localStorage.setItem(CACHE_PREFIX + colName, JSON.stringify(serializable));
  } catch (e) {
    // Cache full — clear this entry and try again
    try { localStorage.removeItem(CACHE_PREFIX + colName); } catch {}
  }
}

// Client-side sort: newest first, handles Firestore Timestamp, ISO string, number, null
function sortDocs(docs, field = "createdAt") {
  return [...docs].sort((a, b) => {
    const ts = d => {
      const v = d[field] || d.updatedAt || d.createdAt;
      if (!v) return 0;
      if (v?.toDate)   return v.toDate().getTime();
      if (v?.seconds)  return v.seconds * 1000;
      if (typeof v === "number") return v;
      const t = new Date(v).getTime();
      return isNaN(t) ? 0 : t;
    };
    return ts(b) - ts(a);
  });
}

export function useCollection(colName, orderField = "createdAt", limitCount = 50) {
  const cached = readCache(colName);
  const [docs,    setDocs]    = useState(cached);
  const [loading, setLoading] = useState(cached.length === 0);
  const [error,   setError]   = useState(null);

  const hasData = useRef(cached.length > 0);
  const fallbackRef = useRef(null);

  useEffect(() => {
    const db = getFirebaseDb();
    if (!db) { setLoading(false); return; }

    // Safety: never hang loading > 10 s
    const safetyTimer = setTimeout(() => setLoading(false), 10_000);

    const applyDocs = (rawDocs) => {
      const sorted = sortDocs(rawDocs, orderField);
      const sliced = limitCount ? sorted.slice(0, limitCount) : sorted;
      hasData.current = sliced.length > 0;
      setDocs(sliced);
      writeCache(colName, sliced);
      setLoading(false);
      setError(null);
    };

    const startFallback = () => {
      if (fallbackRef.current) return;
      const fallbackQ = query(collection(db, colName), limit(Math.max(limitCount * 2, 100)));
      fallbackRef.current = onSnapshot(fallbackQ,
        snap => {
          clearTimeout(safetyTimer);
          applyDocs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        },
        err => {
          clearTimeout(safetyTimer);
          console.error(`[${colName}] fallback error:`, err.message);
          setError(err);
          setLoading(false);
        }
      );
    };

    // Primary ordered query
    const primaryQ = query(
      collection(db, colName),
      orderBy(orderField, "desc"),
      limit(limitCount)
    );

    const unsub = onSnapshot(
      primaryQ,
      { includeMetadataChanges: false },
      snap => {
        clearTimeout(safetyTimer);
        if (fallbackRef.current) { fallbackRef.current(); fallbackRef.current = null; }

        if (snap.empty) {
          // Don't wipe existing docs on empty snap — could be a bad query or cold start
          // Try fallback which uses a simpler query
          if (!hasData.current) {
            startFallback();
          }
          // If we already had data (from cache or previous snap), keep it while fallback runs
          setLoading(false);
          return;
        }
        applyDocs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      },
      err => {
        clearTimeout(safetyTimer);
        // Missing composite index → fall back gracefully
        if (err.code === "failed-precondition" || err.message?.includes("index")) {
          console.warn(`[${colName}] ordered query needs index, using fallback`);
          startFallback();
          return;
        }
        // Permission denied or other error
        console.error(`[${colName}] error:`, err.message);
        setError(err);
        setLoading(false);
      }
    );

    return () => {
      clearTimeout(safetyTimer);
      unsub();
      if (fallbackRef.current) { fallbackRef.current(); fallbackRef.current = null; }
    };
  }, [colName, orderField, limitCount]);

  return { docs, loading, error };
}

// ── incrementViews ────────────────────────────────────────────
export async function incrementViews(colName, docId) {
  const db = getFirebaseDb();
  if (!db || !colName || !docId) return;
  try {
    await updateDoc(doc(db, colName, docId), { views: increment(1) });
  } catch (e) {
    console.warn("incrementViews:", e.message);
  }
}

// ── Time helpers ──────────────────────────────────────────────
export function timeAgo(timestamp) {
  if (!timestamp) return "";
  const date = timestamp?.toDate ? timestamp.toDate()
             : timestamp?.seconds ? new Date(timestamp.seconds * 1000)
             : new Date(timestamp);
  if (isNaN(date.getTime())) return "";
  const s = Math.floor((Date.now() - date) / 1000);
  if (s < 60)  return "sasa hivi";
  if (s < 3600) return `dakika ${Math.floor(s / 60)} zilizopita`;
  if (s < 86400) return `masaa ${Math.floor(s / 3600)} yaliyopita`;
  if (s < 2592000) return `siku ${Math.floor(s / 86400)} zilizopita`;
  return `miezi ${Math.floor(s / 2592000)} iliyopita`;
}

export function fmtViews(v) {
  if (!v) return "0";
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + "M";
  if (v >= 1_000)     return (v / 1_000).toFixed(1) + "K";
  return String(v);
}
