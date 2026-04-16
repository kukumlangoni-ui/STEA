import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAds } from "../hooks/useAds.js";
import { X, ExternalLink, ArrowRight } from "lucide-react";
import { useMobile } from "../hooks/useMobile.js";

export function BannerAd() {
  const { ads } = useAds();
  const isMobile = useMobile();
  const [orderedAds, setOrderedAds] = useState([]);
  const [showSwipeHint, setShowSwipeHint] = useState(false);

  const G = "#F5A623";
  const G2 = "#FFD17C";

  const bannerAds = useMemo(() => ads.filter((ad) => ad.adType === "banner"), [ads]);

  useEffect(() => {
    Promise.resolve().then(() => {
      if (bannerAds.length === 0) {
        setOrderedAds([]);
        return;
      }

      const lastIdx = parseInt(localStorage.getItem("stea_last_ad_idx") || "-1");
      const nextIdx = (lastIdx + 1) % bannerAds.length;
      localStorage.setItem("stea_last_ad_idx", nextIdx.toString());

      const rotated = [
        ...bannerAds.slice(nextIdx),
        ...bannerAds.slice(0, nextIdx)
      ];
      setOrderedAds(rotated);

      if (rotated.length > 1 && !sessionStorage.getItem("stea_swipe_hint_shown")) {
        setShowSwipeHint(true);
        const timer = setTimeout(() => setShowSwipeHint(false), 5000);
        sessionStorage.setItem("stea_swipe_hint_shown", "true");
        return () => clearTimeout(timer);
      }
    });
  }, [bannerAds]);

  if (orderedAds.length === 0) return null;

  return (
    <div style={{ padding: isMobile ? "24px 0" : "48px 0", background: "transparent", position: "relative", overflow: "hidden" }}>
      {/* Swipe Hint Overlay */}
      <AnimatePresence>
        {showSwipeHint && isMobile && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 100,
              pointerEvents: "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
              background: "rgba(0,0,0,0.9)",
              padding: "24px 32px",
              borderRadius: 32,
              backdropFilter: "blur(12px)",
              border: `1px solid ${G}30`,
              boxShadow: `0 20px 60px rgba(0,0,0,0.8), 0 0 20px ${G}20`
            }}
          >
            <motion.div
              animate={{ x: [0, 40, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              style={{ color: G }}
            >
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
                <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
                <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
                <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
              </svg>
            </motion.div>
            <span style={{ color: "#fff", fontWeight: 900, fontSize: 13, textTransform: "uppercase", letterSpacing: 2, textAlign: "center" }}>
              Telezesha kuona zaidi
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        style={{
          display: "flex",
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          padding: isMobile ? "0 16px" : "0 4px",
          gap: isMobile ? 12 : 32
        }}
        className="scrollbar-hide"
      >
        {orderedAds.map((ad, idx) => (
          <div
            key={ad.id || idx}
            style={{
              minWidth: isMobile ? "calc(100vw - 32px)" : "100%",
              scrollSnapAlign: "center",
              flexShrink: 0
            }}
          >
            <a
              href={ad.ctaLink || "#"}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "block", textDecoration: "none" }}
            >
              <motion.div
                whileHover={isMobile ? {} : { y: -8, scale: 1.01 }}
                style={{
                  background: "linear-gradient(165deg, #12151e 0%, #080a0f 100%)",
                  borderRadius: isMobile ? 28 : 40,
                  overflow: "hidden",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  display: "flex",
                  flexDirection: isMobile ? "column" : "row",
                  alignItems: "stretch",
                  padding: isMobile ? 0 : 0,
                  position: "relative",
                  boxShadow: "0 32px 64px rgba(0,0,0,0.5)",
                  transition: "border-color 0.3s ease, box-shadow 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isMobile) {
                    e.currentTarget.style.borderColor = `${G}40`;
                    e.currentTarget.style.boxShadow = `0 40px 80px rgba(0,0,0,0.6), 0 0 30px ${G}15`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isMobile) {
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.06)";
                    e.currentTarget.style.boxShadow = "0 32px 64px rgba(0,0,0,0.5)";
                  }
                }}
              >
                {/* Ad Image */}
                {(ad.imageUrl || ad.image) && (
                  <div style={{ 
                    width: isMobile ? "100%" : "45%", 
                    height: isMobile ? 240 : 420, 
                    flexShrink: 0,
                    overflow: "hidden",
                    position: "relative",
                    background: "#000"
                  }}>
                    <img
                      src={ad.imageUrl || ad.image}
                      alt={ad.title}
                      style={{ 
                        width: "100%", 
                        height: "100%", 
                        objectFit: "cover",
                        transition: "transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)"
                      }}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                    {/* Gradient overlay on image */}
                    <div style={{ 
                      position: "absolute", 
                      inset: 0, 
                      background: isMobile 
                        ? "linear-gradient(to bottom, transparent 60%, rgba(8,10,15,1) 100%)"
                        : "linear-gradient(to right, transparent 70%, rgba(8,10,15,1) 100%)"
                    }} />
                  </div>
                )}

                {/* Ad Content */}
                <div style={{ 
                  flex: 1, 
                  minWidth: 0, 
                  padding: isMobile ? "24px 24px 32px" : "48px 60px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  position: "relative"
                }}>
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                       <span style={{ 
                         background: `${G}15`, 
                         color: G, 
                         fontSize: 11, 
                         padding: "5px 14px", 
                         borderRadius: 99, 
                         textTransform: "uppercase", 
                         fontWeight: 900, 
                         letterSpacing: "1px",
                         border: `1px solid ${G}30`
                       }}>
                        Featured Partner
                      </span>
                      {ad.clientName && (
                        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, fontWeight: 700 }}>
                          {ad.clientName}
                        </span>
                      )}
                    </div>
                    <h3 style={{ 
                      color: "#fff", 
                      fontSize: isMobile ? 28 : 42, 
                      fontWeight: 900,
                      margin: 0,
                      fontFamily: "'Bricolage Grotesque', sans-serif",
                      letterSpacing: "-0.04em",
                      lineHeight: 1.1
                    }}>
                      {ad.title}
                    </h3>
                  </div>
                  
                  <p style={{ 
                    color: "rgba(255,255,255,.55)", 
                    fontSize: isMobile ? 16 : 18, 
                    marginBottom: 32, 
                    lineHeight: 1.6,
                    maxWidth: 500,
                    display: "-webkit-box", 
                    WebkitLineClamp: 3, 
                    WebkitBoxOrient: "vertical", 
                    overflow: "hidden" 
                  }}>
                    {ad.shortText || ad.description}
                  </p>

                  <div style={{ display: "flex", alignItems: "center" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 10,
                        padding: isMobile ? "16px 32px" : "18px 40px",
                        background: `linear-gradient(135deg, ${G}, ${G2})`,
                        color: "#000",
                        borderRadius: 16,
                        fontWeight: 900,
                        fontSize: 16,
                        width: isMobile ? "100%" : "auto",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        boxShadow: `0 12px 24px ${G}30`,
                      }}
                    >
                      {ad.ctaText || "Explore Now"} <ArrowRight size={20} />
                    </div>
                  </div>
                </div>
              </motion.div>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}


export function InlineAd({ index }) {
  const { ads } = useAds();
  const isMobile = useMobile();
  const inlineAds = ads.filter((ad) => ad.adType === "inline");

  const G = "#F5A623";
  
  const ad = useMemo(() => {
    if (inlineAds.length === 0) return null;
    return inlineAds[index % inlineAds.length];
  }, [inlineAds, index]);

  if (!ad) return null;

  return (
    <div style={{ margin: isMobile ? "24px 0" : "40px 0" }}>
      <a
        href={ad.ctaLink || "#"}
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: "block", textDecoration: "none" }}
      >
        <motion.div
          whileHover={isMobile ? {} : { y: -4, scale: 1.01 }}
          style={{
            background: "rgba(255,255,255,0.03)",
            borderRadius: 24,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: "stretch",
            padding: isMobile ? 0 : 0,
            position: "relative",
            boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
            transition: "all 0.3s ease"
          }}
          onMouseEnter={(e) => {
            if (!isMobile) {
              e.currentTarget.style.borderColor = `${G}30`;
              e.currentTarget.style.boxShadow = `0 30px 60px rgba(0,0,0,0.4), 0 0 20px ${G}10`;
            }
          }}
          onMouseLeave={(e) => {
            if (!isMobile) {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
              e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.3)";
            }
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              background: `${G}15`,
              color: G,
              fontSize: 10,
              padding: "4px 10px",
              borderRadius: 8,
              textTransform: "uppercase",
              fontWeight: 900,
              zIndex: 10,
              border: `1px solid ${G}30`,
              letterSpacing: "0.5px"
            }}
          >
            Featured
          </div>

          {(ad.imageUrl || ad.image) && (
            <div style={{ 
              width: isMobile ? "100%" : 200, 
              height: isMobile ? 220 : 200, 
              flexShrink: 0,
              overflow: "hidden"
            }}>
              <img
                src={ad.imageUrl || ad.image}
                alt={ad.title}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                referrerPolicy="no-referrer"
                loading="lazy"
              />
            </div>
          )}

          <div style={{ flex: 1, minWidth: 0, padding: isMobile ? "24px" : "32px 40px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <h4 style={{ 
              color: "#fff", 
              fontSize: isMobile ? 20 : 24, 
              fontWeight: 900, 
              marginBottom: 8, 
              fontFamily: "'Bricolage Grotesque', sans-serif",
              letterSpacing: "-0.02em"
            }}>
              {ad.title}
            </h4>
            <p style={{ 
              color: "rgba(255,255,255,.5)", 
              fontSize: isMobile ? 14 : 15, 
              marginBottom: 20, 
              lineHeight: 1.6, 
              display: "-webkit-box", 
              WebkitLineClamp: 2, 
              WebkitBoxOrient: "vertical", 
              overflow: "hidden" 
            }}>
              {ad.shortText || ad.description}
            </p>
            <div style={{ 
              color: G, 
              fontWeight: 800, 
              fontSize: 14, 
              display: "flex", 
              alignItems: "center", 
              gap: 6,
              transition: "gap 0.2s"
            }}>
              {ad.ctaText || "Check it out"} <ExternalLink size={16} />
            </div>
          </div>
        </motion.div>
      </a>
    </div>
  );
}


export function PopupAd() {
  const { ads } = useAds();
  const isMobile = useMobile();
  const [show, setShow] = useState(false);

  const [ad, setAd] = useState(null);
  const popupAds = useMemo(() => ads.filter((ad) => ad.adType === "popup"), [ads]);

  const G = "#F5A623";
  const G2 = "#FFD17C";

  useEffect(() => {
    Promise.resolve().then(() => {
      if (popupAds.length > 0) {
        setAd(popupAds[Math.floor(Math.random() * popupAds.length)]);
      } else {
        setAd(null);
      }
    });
  }, [popupAds]);

  useEffect(() => {
    if (ad) {
      const timer = setTimeout(() => {
        setShow(true);
      }, 5000); // Show after 5 seconds
      
      return () => clearTimeout(timer);
    }
  }, [ad]);

  if (!ad) return null;

  return (
    <AnimatePresence>
      {show && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(8px)",
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            style={{
              width: "100%",
              maxWidth: 450,
              background: "#141823",
              borderRadius: 32,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.1)",
              position: "relative",
              boxShadow: "0 30px 60px rgba(0,0,0,0.6)",
            }}
          >
            <button
              onClick={() => setShow(false)}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "rgba(0,0,0,0.5)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#fff",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                zIndex: 20,
              }}
            >
              <X size={20} />
            </button>

            <div style={{ position: "relative", height: isMobile ? 300 : 250 }}>
              <img
                src={ad.imageUrl || ad.image}
                alt={ad.title}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                referrerPolicy="no-referrer"
              />
              <div style={{
                position: "absolute",
                top: 16,
                left: 16,
                background: "#F5A623",
                color: "#000",
                fontSize: 10,
                padding: "4px 10px",
                borderRadius: 8,
                fontWeight: 900,
                textTransform: "uppercase",
              }}>
                Sponsored
              </div>
            </div>

            <div style={{ padding: isMobile ? "24px" : "32px", textAlign: "center" }}>
              <h3 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 900, color: "#fff", marginBottom: 12, fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: "-0.02em" }}>
                {ad.title}
              </h3>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: isMobile ? 15 : 16, lineHeight: 1.6, marginBottom: 28 }}>
                {ad.shortText || ad.description}
              </p>
              <a
                href={ad.ctaLink || "#"}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShow(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  width: "100%",
                  padding: "16px",
                  background: `linear-gradient(135deg, ${G}, ${G2})`,
                  color: "#000",
                  borderRadius: 16,
                  fontWeight: 900,
                  fontSize: 16,
                  textDecoration: "none",
                  transition: "transform 0.2s",
                  boxShadow: `0 8px 20px ${G}30`
                }}
              >
                {ad.ctaText || "Get Started"} <ExternalLink size={18} />
              </a>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
