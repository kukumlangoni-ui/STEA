import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth, GoogleAuthProvider,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signInWithPopup, signInWithRedirect, getRedirectResult,
  signOut, onAuthStateChanged, sendPasswordResetEmail,
} from "firebase/auth";
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, getDoc, setDoc, onSnapshot, query, orderBy, limit,
  serverTimestamp, increment, where, getDocFromServer, runTransaction,
  getFirestore, enableIndexedDbPersistence,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { firebaseConfig } from '../firebaseConfig.js';

// ── Admin emails ──────────────────────────────────────
export const ADMIN_EMAILS = [
  "isayamasika100@gmail.com",
  "kukumlangoni@gmail.com",
  "swahilitecheliteacademy@gmail.com",
];
export const isAdminEmail = (email) =>
  !!(email && ADMIN_EMAILS.includes(email.trim().toLowerCase()));
export const ADMIN_EMAIL = ADMIN_EMAILS[0];

export const normalizeEmail = (email) => {
  if (!email) return "";
  const t = email.trim().toLowerCase();
  return t.includes("@") ? t : `${t}@gmail.com`;
};

// ── Check config is valid ──────────────────────────────
const configIsValid = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== "" &&
  firebaseConfig.projectId &&
  firebaseConfig.projectId.includes("swahilitecheliteacademy")
);

if (!configIsValid) {
  console.error(
    "[firebase] ⚠️  Firebase config is missing or uses placeholder values.\n" +
    "Set VITE_FIREBASE_* environment variables in:\n" +
    "  • .env.local (local dev)\n" +
    "  • Cloudflare Pages Dashboard → Settings → Environment variables (production)"
  );
}

// ── Firebase init (once) ──────────────────────────────
let app, auth, db, storage;

try {
  app     = getApps().length ? getApp() : initializeApp(firebaseConfig);
  auth    = getAuth(app);
  db      = getFirestore(app);
  storage = getStorage(app);

  if (configIsValid) {
    console.log("[firebase] ✅ Initialized:", firebaseConfig.projectId);
  }
} catch (e) {
  console.error("[firebase] Init error:", e.message);
  // Don't throw — let the app render with graceful empty states
}

// ── Offline persistence (helps with "posts disappear" issue) ──
// Only enable once and only if db was successfully initialized
let _persistenceEnabled = false;
export const enableOfflinePersistence = async () => {
  if (_persistenceEnabled || !db) return;
  try {
    await enableIndexedDbPersistence(db);
    _persistenceEnabled = true;
    console.log("[firebase] IndexedDB persistence enabled");
  } catch (e) {
    if (e.code === "failed-precondition") {
      console.warn("[firebase] Persistence: multiple tabs open, disabled");
    } else if (e.code === "unimplemented") {
      console.warn("[firebase] Persistence: browser not supported");
    }
  }
};

// ── Google Auth helper: popup with redirect fallback ──
// On mobile or when popups are blocked, use redirect instead
export const signInWithGoogleSafe = async (auth) => {
  const isMobileUA = /Android|iPhone|iPad/i.test(navigator.userAgent);
  const provider = new GoogleAuthProvider();
  provider.addScope("email");
  provider.addScope("profile");

  if (isMobileUA) {
    // Mobile: use redirect (more reliable than popup on phones)
    await signInWithRedirect(auth, provider);
    return null; // Result comes from getRedirectResult on next load
  }

  try {
    return await signInWithPopup(auth, provider);
  } catch (e) {
    if (e.code === "auth/popup-blocked" || e.code === "auth/popup-closed-by-user") {
      // Fall back to redirect
      await signInWithRedirect(auth, provider);
      return null;
    }
    throw e;
  }
};

// ── Analytics: lazy + safe ────────────────────────────
export const getAnalyticsInstance = async () => {
  if (!configIsValid) return null;
  try {
    if (typeof window === "undefined" || !("indexedDB" in window)) return null;
    const { getAnalytics, isSupported } = await import("firebase/analytics");
    if (await isSupported()) return getAnalytics(app);
    return null;
  } catch { return null; }
};

// ── Cloud Messaging: lazy + safe ──────────────────────
export const getMessagingInstance = async () => {
  if (!configIsValid) return null;
  try {
    if (!("Notification" in window) || !navigator.serviceWorker) return null;
    const { getMessaging } = await import("firebase/messaging");
    return getMessaging(app);
  } catch { return null; }
};

// ── Named exports ──────────────────────────────────────
export { auth, db, storage, GoogleAuthProvider };
export {
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signInWithPopup, signInWithRedirect, getRedirectResult,
  signOut, onAuthStateChanged, sendPasswordResetEmail,
};
export {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, getDoc, setDoc, onSnapshot, query, orderBy, limit,
  serverTimestamp, increment, where, getDocFromServer, runTransaction,
};
export { ref, uploadBytes, getDownloadURL };

// ── Compat helpers ────────────────────────────────────
export const initFirebase    = () => ({ auth, db });
export const getFirebaseAuth = () => auth;
export const getFirebaseDb   = () => db;

// ── OperationType ─────────────────────────────────────
export const OperationType = {
  CREATE: "create", UPDATE: "update", DELETE: "delete",
  LIST: "list", GET: "get", WRITE: "write",
};

// ── Error handler ─────────────────────────────────────
export function handleFirestoreError(error, operationType, path) {
  console.error(`[firestore] ${operationType} on "${path}":`, {
    code: error?.code,
    msg:  error?.message,
    user: auth?.currentUser?.email ?? "unauthenticated",
  });
  throw error;
}

// ── Connection test ───────────────────────────────────
export async function testConnection() {
  if (!db) return false;
  try {
    await getDocFromServer(doc(db, "_connection_test_", "ping"));
    return true;
  } catch (e) {
    return e?.code === "permission-denied"; // reached server = good
  }
}
