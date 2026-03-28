import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
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
  addDoc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDMnbqLZBo-FpI1uL6mWf1pfLpKVKlHF9A",
  authDomain: "swahilitecheliteacademy.firebaseapp.com",
  projectId: "swahilitecheliteacademy",
  storageBucket: "swahilitecheliteacademy.firebasestorage.app",
  messagingSenderId: "869558429488",
  appId: "1:869558429488:web:b6d6614c1c40cb75ed4af5",
  measurementId: "G-9CBGRJPLT4",
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

let analytics = null;

if (typeof window !== "undefined") {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch((error) => {
      console.warn("Firebase analytics not supported:", error);
    });
}

/* =========================================================
   Helpers expected by useFirestore.js
========================================================= */

export const getFirebaseDb = () => db;

export const OperationType = {
  CREATE: "create",
  READ: "read",
  UPDATE: "update",
  DELETE: "delete",
};

export function handleFirestoreError(error, operation = "unknown", target = "") {
  console.error(`[Firestore ${operation}] ${target}`, error);

  const code = error?.code || "";
  const message = error?.message || "Unknown Firestore error";

  if (code.includes("permission-denied")) {
    return {
      ok: false,
      code,
      message: "Permission denied. Check Firestore rules or admin access.",
    };
  }

  if (code.includes("unavailable")) {
    return {
      ok: false,
      code,
      message: "Firestore service unavailable. Check internet or Firebase status.",
    };
  }

  if (code.includes("not-found")) {
    return {
      ok: false,
      code,
      message: "Requested Firestore document was not found.",
    };
  }

  return {
    ok: false,
    code,
    message,
  };
}

/* =========================================================
   Main exports
========================================================= */

export { app, auth, db, storage, analytics };

/* =========================================================
   Firestore function re-exports
   These are used by useFirestore.js and possibly other files
========================================================= */

export {
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
  addDoc,
  setDoc,
  deleteDoc,
};

export default app;

