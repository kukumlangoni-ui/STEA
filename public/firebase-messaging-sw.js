// STEA Firebase Cloud Messaging Service Worker
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDMnbqLZBo-FpI1uL6mWf1pfLpKVKlHF9A",
  authDomain: "swahilitecheliteacademy.firebaseapp.com",
  projectId: "swahilitecheliteacademy",
  storageBucket: "swahilitecheliteacademy.firebasestorage.app",
  messagingSenderId: "869558429488",
  appId: "1:869558429488:web:b6d6614c1c40cb75ed4af5",
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  const { title, body, icon, data } = payload.notification || {};
  const notifOptions = {
    body: body || "Post mpya ipo STEA!",
    icon: icon || "/stea-icon.png",
    badge: "/stea-icon.png",
    data: { url: data?.url || "/" },
    vibrate: [200, 100, 200],
  };
  self.registration.showNotification(title || "STEA", notifOptions);
});

// Notification click — open correct page
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});
