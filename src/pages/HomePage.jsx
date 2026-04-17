import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ChevronRight
} from "lucide-react";
import { useCollection, useCollectionWhere } from "../hooks/useFirestore.js";
import { useNetwork } from "../hooks/useNetwork.js";
import { BannerAd } from "../components/SponsoredAdsSection.jsx";
import { useMobile } from "../hooks/useMobile.js";
import { usePWA } from "../contexts/PWAContext.jsx";
import { Skeleton, PostSkeleton, OfflineNotice } from "../components/Skeleton.jsx";
import AnimatedEarth from "../components/AnimatedEarth.jsx";
import { useSettings } from "../contexts/SettingsContext.jsx";
import AboutSection from "../components/AboutSection.jsx";
import TangazaNasi from "../components/TangazaNasi.jsx";
import ServiceRequestForm from "../components/services/ServiceRequestForm.jsx";

const G = "#F5A623";
const G2 = "#FFD17C";

// ── Tiny helpers ─────────────────────────────────────
const normalizeItem = (item) => ({
  ...item,
  title: item.title || item.name || "Untitled",
  image: item.imageUrl || item.image || (item.images && item.images[0]) || (item.carouselImages && item.carouselImages[0]) || "",
  text: item.summary || item.content || item.description || "",
  link: item.ctaUrl || item.url || item.affiliateLink || ""
});

const W = ({ children, style = {} }) => (
  <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 clamp(16px,4vw,48px)", ...style }}>
    {children}
  </div>
);

const Tag = ({ children, color = G, style = {} }) => (
  <div style={{
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "5px 14px", borderRadius: 999,
    background: `${color}14`, border: `1px solid ${color}28`,
    color, fontSize: 11, fontWeight: 900,
    textTransform: "uppercase", letterSpacing: ".1em",
    ...style
  }}>{children}</div>
);

const SectionHeader = ({ tag, title, desc, color = G, align = "center", onAction, actionLabel }) => {
  const isMobile = useMobile();
  return (
    <div style={{ textAlign: align, marginBottom: isMobile ? 32 : 56 }}>
      {tag && <Tag color={color} style={{ marginBottom: 16 }}>{tag}</Tag>}
      <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: "clamp(24px, 6vw, 48px)", fontWeight: 900, letterSpacing: "-.04em", margin: "12px 0 14px", lineHeight: 1.15, overflowWrap: "break-word", wordWrap: "break-word" }}>
        {title}
      </h2>
      {desc && <p style={{ color: "rgba(255,255,255,.48)", fontSize: "clamp(14px,1.5vw,18px)", maxWidth: 600, margin: align === "center" ? "0 auto" : "0", lineHeight: 1.6 }}>
        {desc}
      </p>}
      {onAction && isMobile && (
        <button onClick={onAction} style={{ background: "none", border: "none", color: G, fontWeight: 800, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, marginTop: 16, justifyContent: align === "center" ? "center" : "flex-start", width: "100%" }}>
          {actionLabel || "Zote"} <ChevronRight size={16} />
        </button>
      )}
    </div>
  );
};

const GoldBtn = ({ children, onClick, href, style = {}, outline }) => {
  const base = {
    display: "inline-flex", alignItems: "center", gap: 8,
    padding: "12px 24px", borderRadius: 12, fontWeight: 900, fontSize: 14,
    cursor: "pointer", transition: "all .25s cubic-bezier(.4,0,.2,1)",
    border: "none", textDecoration: "none",
    ...(outline
      ? { background: "transparent", color: G, border: `1.5px solid ${G}50` }
      : { background: `linear-gradient(135deg,${G},${G2})`, color: "#111", boxShadow: `0 6px 20px ${G}35` }
    ),
    ...style,
  };
  const Tag = href ? "a" : "button";
  return (
    <Tag href={href} onClick={onClick} style={base}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; if (!outline) e.currentTarget.style.boxShadow = `0 12px 32px ${G}45`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; if (!outline) e.currentTarget.style.boxShadow = `0 6px 20px ${G}35`; }}>
      {children}
    </Tag>
  );
};

// ── Pillar Card ──────────────────────────────────────
function HeroServiceCard({ title, icon, desc, onClick }) {
  const isMobile = useMobile();
  return (
    <motion.div
      whileHover={isMobile ? {} : { y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{
        background: "rgba(255,255,255,0.05)",
        backdropFilter: isMobile ? "none" : "blur(12px)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 20,
        padding: isMobile ? "16px 12px" : "24px 20px",
        cursor: "pointer",
        textAlign: "center",
        transition: "all 0.3s ease",
        boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minWidth: 0
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = "rgba(255,255,255,0.08)";
        e.currentTarget.style.borderColor = "rgba(245,166,35,0.3)";
        e.currentTarget.style.boxShadow = "0 15px 40px rgba(245,166,35,0.15)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = "rgba(255,255,255,0.05)";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
        e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.2)";
      }}
    >
      <div style={{ fontSize: 40, marginBottom: 16 }}>{icon}</div>
      <div style={{ fontSize: 16, fontWeight: 900, color: "#fff", marginBottom: 6 }}>{title}</div>
      {desc && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.4 }}>{desc}</div>}
    </motion.div>
  );
}

function PillarCard({ emoji, title, desc, tag, color, path, goPage, delay = 0 }) {
  const isMobile = useMobile();
  
  if (isMobile) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ delay, duration: .4 }}
        onClick={() => goPage(path)}
        style={{
          background: "rgba(255,255,255,0.03)",
          borderRadius: 20,
          border: "1px solid rgba(255,255,255,0.06)",
          padding: "16px",
          display: "flex",
          alignItems: "center",
          gap: 16,
          cursor: "pointer",
          position: "relative",
          overflow: "hidden"
        }}
      >
        <div style={{ 
          width: 48, height: 48, borderRadius: 14, 
          background: `${color}15`, border: `1px solid ${color}25`, 
          display: "flex", alignItems: "center", justifyContent: "center", 
          fontSize: 22, flexShrink: 0 
        }}>
          {emoji}
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 2 }}>{title}</h3>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", margin: 0 }}>{desc.split(".")[0]}.</p>
        </div>
        <ChevronRight size={18} color={color} style={{ opacity: 0.5 }} />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: .5 }}
      whileHover={{ y: -6 }}
      onClick={() => goPage(path)}
      style={{
        background: "linear-gradient(145deg,#0d1019,#090b12)",
        borderRadius: 24, border: "1px solid rgba(255,255,255,.06)",
        padding: "32px 28px",
        cursor: "pointer", position: "relative", overflow: "hidden",
        transition: "box-shadow .3s, border-color .3s",
        boxShadow: "0 8px 32px rgba(0,0,0,.3)",
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 20px 60px rgba(0,0,0,.5), 0 0 0 1px ${color}25`; e.currentTarget.style.borderColor = `${color}30`; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,.3)"; e.currentTarget.style.borderColor = "rgba(255,255,255,.06)"; }}
    >
      {/* Glow orb */}
      <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: `radial-gradient(circle,${color}22,transparent 70%)`, filter: "blur(20px)", pointerEvents: "none" }} />

      <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 52, height: 52, borderRadius: 16, background: `${color}15`, border: `1px solid ${color}25`, fontSize: 26, marginBottom: 18 }}>
        {emoji}
      </div>
      {tag && <div style={{ position: "absolute", top: 20, right: 20 }}><Tag color={color}>{tag}</Tag></div>}
      <h3 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 24, fontWeight: 900, letterSpacing: "-.03em", margin: "0 0 10px", lineHeight: 1.15 }}>
        {title}
      </h3>
      <p style={{ color: "rgba(255,255,255,.52)", fontSize: 15, lineHeight: 1.65, margin: "0 0 20px" }}>{desc}</p>
      <div style={{ display: "flex", alignItems: "center", gap: 6, color, fontWeight: 800, fontSize: 13 }}>
        Gundua zaidi <ChevronRight size={15} />
      </div>
    </motion.div>
  );
}

// ── Content Card ─────────────────────────────────────
function MiniCard({ item: rawItem, onRead, onPlay }) {
  const item = normalizeItem(rawItem);
  const [imgErr, setImgErr] = useState(false);
  const hasImg = item.image && !imgErr;
  const isVideo = item.type === "video";

  const handleClick = () => isVideo ? onPlay?.(item) : onRead?.(item);

  return (
    <div onClick={handleClick}
      style={{ 
        background: "rgba(255,255,255,0.03)", 
        borderRadius: 16, 
        border: "1px solid rgba(255,255,255,0.06)", 
        overflow: "hidden",
        cursor: "pointer",
        height: "100%",
        display: "flex",
        flexDirection: "column"
      }}>
      <div style={{ height: 140, background: "rgba(255,255,255,0.05)", position: "relative" }}>
        {hasImg ? (
          <img src={item.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}
            referrerPolicy="no-referrer" onError={() => setImgErr(true)} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", fontSize: 32, opacity: .3 }}>{isVideo ? "▶" : "📰"}</div>
        )}
        <div style={{ position: "absolute", top: 8, left: 8 }}>
          <span style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".07em", color: "#fff", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", padding: "3px 8px", borderRadius: 6 }}>
            {item.badge || (isVideo ? "Video" : "Article")}
          </span>
        </div>
      </div>
      <div style={{ padding: 16, flex: 1 }}>
        <h4 style={{ fontSize: 14, fontWeight: 800, margin: 0, lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", color: "rgba(255,255,255,0.9)" }}>
          {item.title}
        </h4>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// HOMEPAGE
// ─────────────────────────────────────────────────────
export default function HomePage({ goPage }) {
  const isMobile = useMobile();
  const { isOnline } = useNetwork();
  const { t } = useSettings();
  const { deferredPrompt, installApp, isInstalled } = usePWA();
  const [activeService, setActiveService] = useState(null);
  const communityLink = "https://wa.me/255757053354";
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0px", "80px"]);
  const heroOp = useTransform(scrollYProgress, [0, .8], [1, 0]);

  const { docs: tipsDocs,    loading: tipsLoading,    isOfflineData: tipsOffline    } = useCollection("tips",    "createdAt", 10);
  const { docs: coursesDocs, loading: coursesLoading } = useCollection("courses", "createdAt", 10);
  const { docs: updatesDocs, loading: updatesLoading, isOfflineData: updatesOffline } = useCollection("updates", "createdAt", 10);
  const { docs: postsDocs,   loading: postsLoading   } = useCollection("posts",   "createdAt", 10);
  const { docs: newsDocs,    loading: newsLoading     } = useCollection("news",    "createdAt", 10);
  const { docs: productsDocs, loading: productsLoading, isOfflineData: productsOffline } = useCollectionWhere("products", "sector", "==", "marketplace", "createdAt", 20);

  // Strict active filtering strategy to avoid rejected and pending content reaching homepage
  const filterFn = (item, isProduct = false) => {
    if (isProduct) {
      if (item.published === false && item.isActive === false) return false;
      if (item.status && item.status !== "active" && item.status !== "published" && item.status !== "approved") return false;
      return true;
    }
    
    // Legacy mapping - assume published unless strictly draft or rejected
    if (item.status === "draft" || item.status === "rejected" || item.status === "pending_review") return false;
    return true;
  };

  const tips = tipsDocs.filter(t => filterFn(t)).slice(0, 6);
  const courses = coursesDocs.filter(c => filterFn(c)).slice(0, 4);
  const products = productsDocs
    .filter(p => filterFn(p, true))
    .slice(0, 4);

  const updates = [...updatesDocs, ...postsDocs, ...newsDocs]
    .filter(u => filterFn(u))
    .filter((item, index, self) => self.findIndex(t => t.id === item.id) === index)
    .sort((a, b) => {
      const getTs = d => {
        const f = d.createdAt;
        if (!f) return 0;
        if (f.seconds) return f.seconds;
        if (f.toDate) return f.toDate().getTime() / 1000;
        if (typeof f === "number") return f / 1000;
        const t = new Date(f).getTime();
        return isNaN(t) ? 0 : t / 1000;
      };
      return getTs(b) - getTs(a);
    })
    .slice(0, 6);

  useEffect(() => {
    console.log("[HomePage Debug] updatesDocs:", updatesDocs.length);
    console.log("[HomePage Debug] postsDocs:", postsDocs.length);
    console.log("[HomePage Debug] newsDocs:", newsDocs.length);
    console.log("[HomePage Debug] productsDocs:", productsDocs.length);
    console.log("[HomePage Debug] Merged updates:", updates.length);
    console.log("[HomePage Debug] Filtered products:", products.length);
    
    if (!tipsLoading    && tips.length    === 0) console.log("[homepage] tips: 0 filtered docs");
    if (!coursesLoading && courses.length === 0) console.log("[homepage] courses: 0 filtered docs");
  }, [tips, tipsLoading, courses, coursesLoading, updates, updatesLoading, postsLoading, newsLoading, postsDocs, newsDocs, updatesDocs, productsDocs, products]);

  return (
    <div style={{ minHeight: "100vh", background: "#0B0F1A", color: "#fff", fontFamily: "'Instrument Sans',system-ui,sans-serif", overflowX: "hidden" }}>

      {/* HERO */}
      <section ref={heroRef} style={{
        position: "relative",
        minHeight: isMobile ? "85vh" : "100vh",
        overflow: "hidden",
        background: "linear-gradient(to bottom, #0B0F1A, #12172F)"
      }}>
        {/* Background layer container with overflow hidden to trap the Earth grid */}
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
          <AnimatedEarth />
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at center, transparent 0%, rgba(11,15,26,0.6) 100%)", zIndex: 5 }} />
          {/* Gradient mask at bottom to fade grid before the cards */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "300px", background: "linear-gradient(to top, rgba(11,15,26,0.95), transparent)", zIndex: 6 }} />
        </div>

        <motion.div style={{ position: "relative", zIndex: 10, width: "100%", y: heroY, opacity: heroOp }}>
          <W>
            <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center", paddingTop: isMobile ? "100px" : "140px", paddingBottom: isMobile ? "80px" : "120px" }}>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
                <Tag>{t('hero_tag')}</Tag>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .1 }} style={{ textAlign: "center", marginBottom: 32 }}>
                <h1 style={{ fontSize: isMobile ? "42px" : "72px", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-.05em", margin: 0 }}>
                  {t('hero_title')}
                </h1>
                <h2 style={{ marginTop: 8, fontSize: isMobile ? "24px" : "36px", fontWeight: 800, background: `linear-gradient(135deg,${G},${G2})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  {t('hero_subtitle')}
                </h2>
              </motion.div>
              <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .2 }} style={{ color: "rgba(255,255,255,.65)", fontSize: isMobile ? 16 : 20, maxWidth: 700, margin: "0 auto 40px" }}>
                {t('hero_desc')}
              </motion.p>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
                <GoldBtn onClick={() => goPage("exams")}>{t('action_get_started')} <ArrowRight size={20} /></GoldBtn>
                <GoldBtn outline onClick={() => goPage("huduma")}>{t('action_explore')}</GoldBtn>
                {deferredPrompt && !isInstalled && isMobile && (
                  <GoldBtn 
                    onClick={installApp} 
                    style={{ background: "#25D366", color: "#fff", border: "none" }}
                  >
                    PAKUA STEA APP
                  </GoldBtn>
                )}
              </div>
              <div style={{ marginTop: isMobile ? 64 : 80, display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: isMobile ? 16 : 24 }}>
                <HeroServiceCard title={t('pillar_exams_title')} icon="🎓" desc={t('pillar_exams_tag')} onClick={() => goPage("exams")} />
                <HeroServiceCard title={t('pillar_huduma_title')} icon="🛠️" desc={t('pillar_huduma_tag')} onClick={() => goPage("huduma")} />
                <HeroServiceCard title={t('pillar_tech_title')} icon="💡" desc={t('pillar_tech_tag')} onClick={() => goPage("tech")} />
                <HeroServiceCard title={t('pillar_duka_title')} icon="🛒" desc={t('pillar_duka_tag')} onClick={() => goPage("duka/phones")} />
              </div>
            </div>
          </W>
        </motion.div>
      </section>

      {/* SPONSORED ADS */}
      <section style={{ padding: isMobile ? "20px 0 40px 0" : "40px 0 60px 0" }}>
        <W><BannerAd /></W>
      </section>

      {/* PILLARS */}
      <section style={{ padding: "40px 0" }}>
        <W>
          <OfflineNotice isOffline={!isOnline} isOfflineData={tipsOffline || productsOffline || updatesOffline} />
          <SectionHeader tag={t('pillar_section_tag')} title={<>{t('pillar_section_title')} <span style={{ color: G }}>{t('pillar_section_title_hl')}</span></>} desc={t('pillar_section_desc')} />
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2,1fr)", gap: 20 }}>
            <PillarCard emoji="🎓" title={t('pillar_exams_title')} tag={t('pillar_exams_tag')} color="#10b981" path="exams" desc={t('pillar_exams_desc')} goPage={goPage} delay={.04} />
            <PillarCard emoji="💡" title={t('pillar_tech_title')} tag={t('pillar_tech_tag')} color="#3b82f6" path="tech" desc={t('pillar_tech_desc')} goPage={goPage} delay={.08} />
            <PillarCard emoji="📣" title={t('pillar_huduma_title')} tag={t('pillar_huduma_tag')} color="#ec4899" path="huduma" desc={t('pillar_huduma_desc')} goPage={goPage} delay={.12} />
            <PillarCard emoji="💼" title={t('pillar_gigs_title')} tag={t('pillar_gigs_tag')} color="#f5a623" path="gigs" desc={t('pillar_gigs_desc')} goPage={goPage} delay={.16} />
            <PillarCard emoji="💸" title={t('pillar_money_title')} tag={t('pillar_money_tag')} color="#10b981" path="money-guide" desc={t('pillar_money_desc')} goPage={goPage} delay={.20} />
            <PillarCard emoji="🛒" title={t('pillar_duka_title')} tag={t('pillar_duka_tag')} color="#f5a623" path="duka/phones" desc={t('pillar_duka_desc')} goPage={goPage} delay={.24} />
          </div>
        </W>
      </section>

      {/* TECH HUB */}
      <section style={{ padding: "40px 0", background: "rgba(59,130,246,.03)" }}>
        <W>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 40, alignItems: "center" }}>
            <div>
              <SectionHeader align={isMobile ? "center" : "left"} tag={t('tech_section_tag')} title={<>{t('tech_section_title')} <span style={{ color: "#60a5fa" }}>{t('tech_section_title_hl')}</span></>} desc={t('tech_section_desc')} color="#3b82f6" />
              <GoldBtn onClick={() => goPage("ai")} style={{ background: "#3b82f6", width: isMobile ? "100%" : "auto", justifyContent: "center" }}>{t('tech_action')} <ArrowRight size={16} /></GoldBtn>
            </div>
            <div>
              <div style={{ background: "rgba(255,255,255,.03)", borderRadius: 24, padding: "24px", overflow: "hidden" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                  <span style={{ fontWeight: 800 }}>{t('tips_title')}</span>
                  <button onClick={() => goPage("tips")} style={{ background: "none", border: "none", color: G, fontWeight: 800, cursor: "pointer" }}>{t('action_view_all')}</button>
                </div>
                <style>{`
                  .hide-scrollbar::-webkit-scrollbar { display: none; }
                  .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                  .tips-slider-card { flex: 0 0 calc(50% - 8px); scroll-snap-align: start; }
                  @media (max-width: 767px) {
                    .tips-slider-card { flex: 0 0 85%; }
                  }
                `}</style>
                <div className="hide-scrollbar" style={{ 
                  display: "flex", 
                  overflowX: "auto", 
                  gap: 16, 
                  paddingBottom: 8,
                  scrollSnapType: "x mandatory",
                  WebkitOverflowScrolling: "touch"
                }}>
                  {tipsLoading ? (
                    [1,2].map(i => (
                      <div key={i} className="tips-slider-card">
                        <PostSkeleton />
                      </div>
                    ))
                  ) : tips.map(item => (
                    <div key={item.id} className="tips-slider-card">
                      <MiniCard item={item} onRead={() => goPage("/tips")} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </W>
      </section>

      {/* DUKA + GIGS */}
      <section style={{ padding: "40px 0" }}>
        <W>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 24 }}>
            <div style={{ background: "rgba(255,255,255,.02)", borderRadius: 24, padding: "32px", border: "1px solid rgba(255,255,255,.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ fontSize: 32 }}>🛒</div>
                  <h3 style={{ fontSize: 24, fontWeight: 900, margin: 0 }}>{t('pillar_duka_title')}</h3>
                </div>
                <button onClick={() => goPage("duka/phones")} style={{ background: "none", border: "none", color: G, fontWeight: 800, cursor: "pointer" }}>{t('action_view_all')}</button>
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
                {productsLoading ? (
                  [1,2,3,4].map(i => <Skeleton key={i} height="100px" />)
                ) : products.slice(0, 4).map(p => {
                  const item = normalizeItem(p);
                  return (
                    <div key={p.id} onClick={() => goPage("duka/phones")} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 16, overflow: "hidden", cursor: "pointer" }}>
                      <div style={{ height: 100, background: "rgba(255,255,255,0.05)" }}>
                        {item.image && <img src={item.image} style={{ width: "100%", height: "100%", objectFit: "cover" }} referrerPolicy="no-referrer" />}
                      </div>
                      <div style={{ padding: 10 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.title}</div>
                        <div style={{ fontSize: 11, color: G, fontWeight: 900, marginTop: 2 }}>{p.price ? `${p.price} TZS` : "Contact"}</div>
                      </div>
                    </div>
                  );
                })}
                {products.length === 0 && !productsLoading && (
                  <div style={{ gridColumn: "span 2", padding: 20, textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 12 }}>No products yet</div>
                )}
              </div>
              
              <GoldBtn onClick={() => goPage("duka/phones")} style={{ width: "100%", justifyContent: "center" }}>{t('action_explore')}</GoldBtn>
            </div>
            <div style={{ background: "rgba(255,255,255,.02)", borderRadius: 24, padding: "32px", border: "1px solid rgba(255,255,255,.06)", display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>💼</div>
              <h3 style={{ fontSize: 24, fontWeight: 900, marginBottom: 12 }}>{t('pillar_gigs_title')}</h3>
              <p style={{ color: "rgba(255,255,255,.5)", marginBottom: "auto", paddingBottom: 24 }}>{t('pillar_gigs_desc')}</p>
              <GoldBtn onClick={() => goPage("gigs")} outline style={{ width: "100%", justifyContent: "center" }}>{t('action_view_all')}</GoldBtn>
            </div>
          </div>
        </W>
      </section>

      {/* COURSES */}
      {courses.length > 0 && (
        <section style={{ padding: "40px 0", background: "rgba(16,185,129,0.03)" }}>
          <W>
            <SectionHeader 
              tag="COURSES" 
              title={<>{t('student_courses_title')} <span style={{ color: "#10b981" }}>STEA Academy</span></>} 
              desc={t('pillar_exams_desc')} 
              color="#10b981" 
            />
            <style>{`
              .hide-scrollbar::-webkit-scrollbar { display: none; }
              .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
              .slider-card { flex: 0 0 calc(33.333% - 14px); scroll-snap-align: start; }
              @media (max-width: 1024px) {
                .slider-card { flex: 0 0 calc(50% - 10px); }
              }
              @media (max-width: 767px) {
                .slider-card { flex: 0 0 85%; }
              }
            `}</style>
            <div className="hide-scrollbar" style={{ 
              display: "flex", 
              overflowX: "auto", 
              gap: 20, 
              paddingBottom: 20,
              scrollSnapType: "x mandatory",
              WebkitOverflowScrolling: "touch"
            }}>
              {courses.map(c => {
                const item = normalizeItem(c);
                return (
                  <div key={c.id} className="slider-card" onClick={() => goPage("exams")} style={{ 
                    background: "rgba(255,255,255,.03)", 
                    borderRadius: 24, 
                    overflow: "hidden", 
                    border: "1px solid rgba(255,255,255,.06)", 
                    cursor: "pointer" 
                  }}>
                    <div style={{ height: 140, background: "rgba(255,255,255,0.05)", position: "relative" }}>
                      {item.image && <img src={item.image} style={{ width: "100%", height: "100%", objectFit: "cover" }} referrerPolicy="no-referrer" />}
                      <div style={{ position: "absolute", bottom: 12, left: 12 }}>
                        <Tag color="#10b981" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>{c.category || "Skill"}</Tag>
                      </div>
                    </div>
                    <div style={{ padding: 20 }}>
                      <h4 style={{ fontSize: 16, fontWeight: 900, marginBottom: 8, lineHeight: 1.3 }}>{item.title}</h4>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.4)", fontSize: 12 }}>
                        <span>{c.lessons || "0"} Lessons</span>
                        <span>•</span>
                        <span>{c.duration || "Self-paced"}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </W>
        </section>
      )}

      {/* SERVICES */}
      <section style={{ padding: "40px 0", background: "rgba(255,255,255,.01)" }}>
        <W>
          <SectionHeader tag={t('huduma_tag')} title={<>{t('huduma_title')} <span style={{ color: G }}>{t('pillar_section_title_hl')}</span></>} desc={t('huduma_desc')} />
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 20 }}>
            {[
              { t: t('nav_huduma_web_label'), d: t('nav_huduma_web_desc'), e: "🌐", type: "website" },
              { t: t('nav_huduma_promo_label'), d: t('nav_huduma_promo_desc'), e: "📈", type: "promotion" },
              { t: t('nav_huduma_brand_label'), d: t('nav_huduma_brand_desc'), e: "🤝", type: "partnership" },
            ].map((s, i) => (
              <div key={i} onClick={() => setActiveService(s.type)} style={{ background: "rgba(255,255,255,.03)", borderRadius: 20, padding: "24px", cursor: "pointer", border: "1px solid rgba(255,255,255,.06)" }}>
                <div style={{ fontSize: 28, marginBottom: 16 }}>{s.e}</div>
                <h4 style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>{s.t}</h4>
                <p style={{ color: "rgba(255,255,255,.5)", fontSize: 14 }}>{s.d}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 40 }}><TangazaNasi /></div>
        </W>
      </section>

      <AnimatePresence>
        {activeService && (
          <ServiceRequestForm 
            isOpen={!!activeService} 
            onClose={() => setActiveService(null)} 
            serviceType={activeService}
          />
        )}
      </AnimatePresence>

      {/* UPDATES */}
      <section style={{ padding: "40px 0" }}>
        <W>
          <SectionHeader tag={t('updates_tag')} title={t('updates_title')} desc={t('updates_desc')} align="left" />
          <style>{`
            .hide-scrollbar::-webkit-scrollbar { display: none; }
            .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            .slider-card { flex: 0 0 calc(33.333% - 14px); scroll-snap-align: start; }
            @media (max-width: 1024px) {
              .slider-card { flex: 0 0 calc(50% - 10px); }
            }
            @media (max-width: 767px) {
              .slider-card { flex: 0 0 85%; }
            }
          `}</style>
          <div className="hide-scrollbar" style={{ 
            display: "flex", 
            overflowX: "auto", 
            gap: 20, 
            paddingBottom: 20,
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch"
          }}>
            {updatesLoading ? (
               [1,2,3].map(i => (
                 <div key={i} className="slider-card">
                   <PostSkeleton />
                 </div>
               ))
            ) : updates.map(u => {
              const item = normalizeItem(u);
              return (
                <div key={u.id} className="slider-card" style={{ 
                  background: "rgba(255,255,255,.03)", 
                  borderRadius: 20, 
                  overflow: "hidden", 
                  border: "1px solid rgba(255,255,255,.06)" 
                }}>
                  {item.image && <img src={item.image} alt="" style={{ width: "100%", height: 160, objectFit: "cover" }} referrerPolicy="no-referrer" />}
                  <div style={{ padding: 20 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>{item.title}</h3>
                    <p style={{ fontSize: 14, color: "rgba(255,255,255,.5)" }}>{item.text}</p>
                  </div>
                </div>
              );
            })}
            {updates.length === 0 && !updatesLoading && (
              <div style={{ width: "100%", padding: 60, textAlign: "center", background: "rgba(255,255,255,0.02)", borderRadius: 20 }}>
                <p style={{ color: "rgba(255,255,255,0.3)" }}>No updates available at the moment.</p>
              </div>
            )}
          </div>
        </W>
      </section>

      <AboutSection />

      {/* WHATSAPP */}
      <section style={{ padding: "80px 0" }}>
        <W>
          <div style={{ background: "linear-gradient(135deg,#25d366, #128c7e)", borderRadius: 40, padding: "60px 40px", textAlign: "center", color: "#fff" }}>
            <h2 style={{ fontSize: "40px", fontWeight: 900, marginBottom: 16 }}>{t('community_title')}</h2>
            <p style={{ fontSize: "20px", opacity: .9, marginBottom: 32 }}>{t('community_desc')}</p>
            <button onClick={() => window.open(communityLink, "_blank")} style={{ background: "#fff", color: "#128c7e", padding: "16px 40px", borderRadius: 99, fontWeight: 900, border: "none", cursor: "pointer" }}>{t('community_action')} <ArrowRight size={20} /></button>
          </div>
        </W>
      </section>

    </div>
  );
}
