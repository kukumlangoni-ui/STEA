import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';

const G = "#F5A623";

export const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if dismissed recently (e.g., within 7 days)
    const dismissedAt = localStorage.getItem('stea_pwa_dismissed');
    if (dismissedAt) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        return; // Don't show if dismissed within 7 days
      }
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    const handleAppInstalled = () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowPrompt(false);
      }
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('stea_pwa_dismissed', Date.now().toString());
    setShowPrompt(false);
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            width: 'calc(100% - 48px)',
            maxWidth: 400,
            background: '#0a0c14',
            borderRadius: 20,
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}
        >
          <button 
            onClick={handleDismiss}
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              background: 'rgba(255,255,255,0.05)',
              border: 'none',
              borderRadius: '50%',
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer'
            }}
          >
            <X size={14} />
          </button>

          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: `linear-gradient(135deg, ${G}, #FFD17C)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: `0 8px 20px ${G}40`
            }}>
              <span style={{ color: '#111', fontWeight: 900, fontSize: 28, fontFamily: "'Bricolage Grotesque', sans-serif" }}>S</span>
            </div>
            <div>
              <h3 style={{ margin: 0, color: '#fff', fontSize: 17, fontWeight: 800, fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                Install STEA App
              </h3>
              <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.4 }}>
                Pata huduma zote za STEA haraka zaidi moja kwa moja kwenye simu yako.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
            <button onClick={handleDismiss} style={{
              flex: 1,
              background: 'rgba(255,255,255,0.05)',
              color: '#fff',
              padding: '12px',
              borderRadius: 12,
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 14,
              transition: 'background 0.2s'
            }}>
              Later
            </button>
            <button onClick={handleInstall} style={{
              flex: 1,
              background: `linear-gradient(135deg, ${G}, #FFD17C)`,
              color: '#111',
              padding: '12px',
              borderRadius: 12,
              border: 'none',
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: `0 4px 12px ${G}30`
            }}>
              <Download size={16} /> Install
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
