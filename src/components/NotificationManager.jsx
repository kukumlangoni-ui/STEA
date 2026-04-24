/**
 * NotificationManager — FCM Push Notification handler
 * Requests permission, stores token in Firestore fcm_tokens
 */
import { useEffect, useState } from 'react';
import { getToken } from 'firebase/messaging';
import { getMessagingInstance, db } from '../firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';

const VAPID_KEY = 'BDlsejpFbn27TWmAFQLFCd72CncssIQbthLbEBe3h5al81IDX9LsOiQ2xt6AFirzUCbEg_eaiK3kE7L4hrnTqsE';

async function saveFCMToken(token, userId = null) {
  if (!db || !token) return;
  try {
    await setDoc(doc(collection(db, 'fcm_tokens'), token), {
      token,
      userId: userId || null,
      platform: 'web',
      userAgent: navigator.userAgent.slice(0, 200),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (e) {
    // Silently fail — don't break the app if token save fails
  }
}

async function requestAndSaveNotificationPermission(userId = null) {
  try {
    // Only supported browsers
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;
    
    // Don't re-ask if already denied
    if (Notification.permission === 'denied') return;
    
    const messaging = await getMessagingInstance();
    if (!messaging) return;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    if (token) await saveFCMToken(token, userId);
  } catch (e) {
    // Silently fail — notifications are a nice-to-have
  }
}

export const NotificationManager = ({ userId = null }) => {
  useEffect(() => {
    // Delay permission request by 4s to not interrupt initial page load
    const timer = setTimeout(() => {
      requestAndSaveNotificationPermission(userId);
    }, 4000);
    return () => clearTimeout(timer);
  }, [userId]);

  return null;
};

export default NotificationManager;
