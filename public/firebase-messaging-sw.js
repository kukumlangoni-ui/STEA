/* global importScripts, firebase */
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDMnbqLZBo-FpI1uL6mWf1pfLpKVKlHF9A",
  authDomain: "swahilitecheliteacademy.firebaseapp.com",
  projectId: "swahilitecheliteacademy",
  storageBucket: "swahilitecheliteacademy.firebasestorage.app",
  messagingSenderId: "869558429488",
  appId: "1:869558429488:web:b6d6614c1c40cb75ed4af5",
});

const messaging = firebase.messaging();

// Handle background push notifications
messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification || {};
  self.registration.showNotification(title || 'STEA', {
    body: body || 'You have a new notification.',
    icon: icon || '/icons/pwa-192.png',
    badge: '/icons/pwa-192.png',
    vibrate: [100, 50, 100],
    data: payload.data || {},
    actions: [{ action: 'open', title: 'Open STEA' }],
  });
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
