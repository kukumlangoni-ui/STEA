import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAds } from "../hooks/useAds.js";
import { X, ExternalLink, ArrowRight } from "lucide-react";
import { useMobile } from "../hooks/useMobile.js";
import { Skeleton, OfflineNotice } from "./Skeleton.jsx";
import { useNetwork } from "../hooks/useNetwork.js";

export function BannerAd() {
  const { ads, loading, isOfflineData } = useAds();
  const isMobile = useMobile();
  const { isOnline } = useNetwork();


  const G = "#F5A623";

  const bannerAds = useMemo(() => ads.filter((ad) => !ad.adType || ad.adType === "banner"), [ads]);

  const featured = useMemo(() => {
	  const activeFeatured = bannerAds.filter(a => a.isFeatured);
	  return activeFeatured.length > 0 ? activeFeatured[0] : bannerAds[0];
  }, [bannerAds]);

  const secondary = useMemo(() => {
	  if (!featured) return [];
	  return bannerAds.filter(a => a.id !== featured.id).slice(0, 3);
  }, [bannerAds, featured]);

  const orderedAds = useMemo(() => {
    if (featured) return [featured, ...secondary];
    return bannerAds;
  }, [featured, secondary, bannerAds]);

  if (loading) {
    return (
      <div style={{ padding: isMobile ? "24px 0" : "48px 0" }}>
        <Skeleton width="100%" height={isMobile ? "300px" : "420px"} borderRadius={isMobile ? "24px" : "40px"} />
      </div>
    );
  }

  if (!featured && bannerAds.length === 0) return null;

  return (
    <div style={{ padding: isMobile ? "24px 0" : "48px 0", background: "transparent", position: "relative", overflow: "hidden" }}>
      <OfflineNotice isOffline={!isOnline} isOfflineData={isOfflineData} />
      {/* Subtle swipe hint */}
      <AnimatePresence>
        {isMobile && orderedAds.length > 1 && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            style={{
              position: "absolute",
              top: 16,
              right: 20,
              zIndex: 100,
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(4px)",
              borderRadius: 20,
              padding: "6px 14px",
              display: "flex",
              alignItems: "center",
              gap: 6,
              border: "1px solid rgba(255,255,255,0.1)",
              pointerEvents: "none"
            }}
          >
            <span style={{ fontSize: 10, fontWeight: 800, color: "#fff", textTransform: "uppercase" }}>Slide</span>
            <ArrowRight size={14} color={G} />
          </motion.div>
        )}
      </AnimatePresence>

      <div
        style={{
          display: "flex",
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
          padding: isMobile ? "0 16px" : "0 4px",
          gap: isMobile ? 12 : 32
        }}
        className="scrollbar-hide"
      >
        {orderedAds.map((ad, idx) => (
          <div
            key={ad.id || idx}
            style={{
              minWidth: idx === 0 
                ? (isMobile ? "calc(100vw - 32px)" : "800px") 
                : (isMobile ? "calc(100vw - 48px)" : "350px"),
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
                  background: "#0e1018",
                  borderRadius: isMobile ? 24 : 40,
                  overflow: "hidden",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  display: "flex",
                  flexDirection: isMobile ? "column" : (idx === 0 ? "row" : "column"),
                  alignItems: "stretch",
                  height: idx === 0 ? (isMobile ? 440 : 420) : (isMobile ? 400 : 400),
                  position: "relative",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
                  transition: "all 0.3s ease",
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
                {/* Ad Content */}
                {(ad.imageUrl || ad.image) && (
                  <div style={{ 
                    width: idx === 0 && !isMobile ? "45%" : "100%", 
                    height: idx === 0 && !isMobile ? "100%" : 250, 
                    flexShrink: 0,
                    overflow: "hidden",
                    position: "relative",
                    background: "#000"
                  }}>
                    {ad.mediaType === "video" || String(ad.imageUrl || ad.image).match(/\.(mp4|webm|ogg)$/i) ? (
                      <video
                        src={ad.imageUrl || ad.image}
                        autoPlay
                        loop
                        muted
                        playsInline
                        style={{ 
                          width: "100%", 
                          height: "100%", 
                          objectFit: "cover"
                        }}
                      />
                    ) : (
                      <img
                        src={ad.imageUrl || ad.image}
                        alt={ad.title}
                        style={{ 
                          width: "100%", 
                          height: "100%", 
                          objectFit: "cover"
                        }}
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                    )}
                  </div>
                )}

                <div style={{ 
                  flex: 1, 
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-start",
                  position: "relative"
                }}>
                  <h3 style={{ 
                    color: "#fff", 
                    fontSize: idx === 0 ? (isMobile ? 24 : 32) : 20, 
                    fontWeight: 900,
                    margin: "0 0 10px",
                    fontFamily: "'Bricolage Grotesque', sans-serif"
                  }}>
                    {ad.title}
                  </h3>
                  
                  <p style={{ 
                    color: "rgba(255,255,255,.6)", 
                    fontSize: 14, 
                    marginBottom: 20, 
                    lineHeight: 1.5,
                    display: "-webkit-box", 
                    WebkitLineClamp: 2, 
                    WebkitBoxOrient: "vertical", 
                    overflow: "hidden" 
                  }}>
                    {ad.shortText || ad.description}
                  </p>

                  <div style={{ display: "flex", alignItems: "center" }}>
                    <div
                      style={{
                        padding: "10px 20px",
                        background: `${G}20`,
                        color: G,
                        borderRadius: 12,
                        fontWeight: 900,
                        fontSize: 13,
                        display: "flex",
                        alignItems: "center",
                        gap: 8
                      }}
                    >
                      {ad.ctaText || "Explore"} <ArrowRight size={14} />
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
              {ad.mediaType === "video" || String(ad.imageUrl || ad.image).match(/\.(mp4|webm|ogg)$/i) ? (
                <video
                  src={ad.imageUrl || ad.image}
                  autoPlay
                  loop
                  muted
                  playsInline
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <img
                  src={ad.imageUrl || ad.image}
                  alt={ad.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
              )}
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
              {ad.mediaType === "video" || String(ad.imageUrl || ad.image).match(/\.(mp4|webm|ogg)$/i) ? (
                <video
                  src={ad.imageUrl || ad.image}
                  autoPlay
                  loop
                  muted
                  playsInline
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <img
                  src={ad.imageUrl || ad.image}
                  alt={ad.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  referrerPolicy="no-referrer"
                />
              )}
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
