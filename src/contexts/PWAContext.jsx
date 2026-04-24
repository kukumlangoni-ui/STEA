import React, { createContext, useContext, useState, useEffect } from 'react';

const PWAContext = createContext();

export const PWAProvider = ({ children }) => {
  const [deferredPrompt,    setDeferredPrompt]    = useState(null);
  const [isInstalled,       setIsInstalled]       = useState(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    );
  });
  const [showInstallSuccess, setShowInstallSuccess] = useState(false);
  const [updateAvailable,    setUpdateAvailable]    = useState(false);

  useEffect(() => {
    // ── Install prompt ──────────────────────────────────────
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowInstallSuccess(true);
      setTimeout(() => setShowInstallSuccess(false), 5000);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // ── Service Worker: detect updates and auto-refresh ─────
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        // Check for updates every 60 seconds
        const checkInterval = setInterval(() => registration.update(), 60_000);

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New SW installed — tell it to skip waiting, then reload
              setUpdateAvailable(true);
              newWorker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });

        // When the SW controlling this page changes, reload to get fresh assets
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (updateAvailable) {
            window.location.reload();
          }
        });

        return () => clearInterval(checkInterval);
      }).catch(() => {});
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [updateAvailable]);

  const installApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  return (
    <PWAContext.Provider value={{ deferredPrompt, isInstalled, installApp, showInstallSuccess, updateAvailable }}>
      {children}
    </PWAContext.Provider>
  );
};

export const usePWA = () => {
  const context = useContext(PWAContext);
  if (!context) throw new Error('usePWA must be used within a PWAProvider');
  return context;
};
