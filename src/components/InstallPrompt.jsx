import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, CheckCircle } from 'lucide-react';
import { usePWA } from '../contexts/PWAContext';
import { useMobile } from '../hooks/useMobile';

const G = "#F5A623";

export const InstallPrompt = () => {
  const { deferredPrompt, installApp, showInstallSuccess, isInstalled } = usePWA();
  const [showPrompt, setShowPrompt] = useState(false);
  const isMobile = useMobile();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (deferredPrompt && !isInstalled) {
        // Check if dismissed recently (e.g., within 3 days instead of 7 to be more persistent)
        const dismissedAt = localStorage.getItem('stea_pwa_dismissed');
        if (dismissedAt) {
          const daysSinceDismissed = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
          if (daysSinceDismissed < 3) {
            setShowPrompt(false);
            return;
          }
        }
        setShowPrompt(true);
      } else {
        setShowPrompt(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [deferredPrompt, isInstalled]);

  const handleInstall = async () => {
    await installApp();
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('stea_pwa_dismissed', Date.now().toString());
    setShowPrompt(false);
  };

  return (
    <>
      <AnimatePresence>
        {showInstallSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'fixed',
              top: 80,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 100000,
              background: '#0a0c14',
              border: `1px solid ${G}40`,
              borderRadius: 16,
              padding: '12px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              color: '#fff',
              fontWeight: 600,
              fontSize: 14
            }}
          >
            <CheckCircle size={20} color={G} />
            App imewekwa kwenye simu yako
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPrompt && isMobile && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            style={{
              position: 'fixed',
              bottom: 84, // Higher to avoid overlap with bottom nav
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 9999,
              width: 'calc(100% - 32px)',
              maxWidth: 400,
              background: '#0a0c14',
              borderRadius: 24,
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 24px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 20
            }}
          >
            <button 
              onClick={handleDismiss}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: 'rgba(255,255,255,0.05)',
                border: 'none',
                borderRadius: '50%',
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'rgba(255,255,255,0.5)',
                cursor: 'pointer'
              }}
            >
              <X size={16} />
            </button>

            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: 18,
                background: `linear-gradient(135deg, ${G}, #FFD17C)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: `0 8px 24px ${G}40`
              }}>
                <span style={{ color: '#111', fontWeight: 900, fontSize: 32, fontFamily: "'Bricolage Grotesque', sans-serif" }}>S</span>
              </div>
              <div>
                <h3 style={{ margin: 0, color: '#fff', fontSize: 18, fontWeight: 900, fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                  Install STEA App
                </h3>
                <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.5 }}>
                  Weka STEA kwenye simu yako kwa ajili ya kupata huduma haraka zaidi.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                onClick={handleDismiss}
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.03)',
                  color: 'rgba(255,255,255,0.8)',
                  padding: '14px',
                  borderRadius: 16,
                  border: '1px solid rgba(255,255,255,0.05)',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                Baadaye
              </button>
              <button 
                onClick={handleInstall}
                style={{
                  flex: 1,
                  background: `linear-gradient(135deg, ${G}, #FFD17C)`,
                  color: '#000',
                  padding: '14px',
                  borderRadius: 16,
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 900,
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: `0 6px 16px ${G}30`
                }}
              >
                <Download size={18} /> PAKUA
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
