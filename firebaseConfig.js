// ═══════════════════════════════════════════════════════════════════
// STEA Firebase Configuration
// Project: swahilitecheliteacademy
// ═══════════════════════════════════════════════════════════════════
//
// For LOCAL development: create a .env.local file at project root with:
//
//   VITE_FIREBASE_API_KEY=your_api_key
//   VITE_FIREBASE_AUTH_DOMAIN=swahilitecheliteacademy.firebaseapp.com
//   VITE_FIREBASE_PROJECT_ID=swahilitecheliteacademy
//   VITE_FIREBASE_STORAGE_BUCKET=swahilitecheliteacademy.appspot.com
//   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
//   VITE_FIREBASE_APP_ID=your_app_id
//   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
//
// For CLOUDFLARE PAGES production:
//   Set the same variables in:
//   Cloudflare Dashboard → Pages → stea → Settings → Environment variables
//
// Get values from:
//   Firebase Console → swahilitecheliteacademy → Project Settings → Your apps
// ═══════════════════════════════════════════════════════════════════

const env = (key, fallback = "") => {
  // Vite exposes import.meta.env for build-time env vars
  try {
    return (typeof import.meta !== "undefined" && import.meta.env?.[key]) || fallback;
  } catch { return fallback; }
};

export const firebaseConfig = {
  apiKey:            env("VITE_FIREBASE_API_KEY",            ""),
  authDomain:        env("VITE_FIREBASE_AUTH_DOMAIN",        "swahilitecheliteacademy.firebaseapp.com"),
  projectId:         env("VITE_FIREBASE_PROJECT_ID",         "swahilitecheliteacademy"),
  storageBucket:     env("VITE_FIREBASE_STORAGE_BUCKET",     "swahilitecheliteacademy.appspot.com"),
  messagingSenderId: env("VITE_FIREBASE_MESSAGING_SENDER_ID",""),
  appId:             env("VITE_FIREBASE_APP_ID",             ""),
  measurementId:     env("VITE_FIREBASE_MEASUREMENT_ID",     ""),
};

export const ADMIN_EMAIL = "isayamasika100@gmail.com";
