import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Zap, ChevronRight, BookOpen,
  Sparkles, Globe, LayoutGrid, CheckCircle,
} from "lucide-react";
import { useCollection } from "../hooks/useFirestore.js";
import { BannerAd, InlineAd } from "../components/SponsoredAdsSection.jsx";
import { useMobile } from "../hooks/useMobile.js";
import AnimatedHeroBackground from "../components/AnimatedHeroBackground.jsx";

const G  = "#F5A623";
const G2 = "#FFD17C";

// ─── Shared helpers ──────────────────────────────────────────────────────────

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
    ...style,
  }}>{children}</div>
);

const SectionHeader = ({ tag, title, desc, color = G, align = "center", onAction, actionLabel }) => {
  const isMobile = useMobile();
  return (
    <div style={{ textAlign: align, marginBottom: isMobile ? 32 : 56 }}>
      {tag && <Tag color={color} style={{ marginBottom: 16 }}>{tag}</Tag>}
      <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: "clamp(26px,4vw,52px)", fontWeight: 900, letterSpacing: "-.04em", margin: "12px 0 14px", lineHeight: 1.1 }}>
        {title}
      </h2>
      {desc && (
        <p style={{ color: "rgba(255,255,255,.48)", fontSize: "clamp(14px,1.5vw,18px)", maxWidth: 600, margin: align === "center" ? "0 auto" : "0", lineHeight: 1.6 }}>
          {desc}
        </p>
      )}
      {onAction && isMobile && (
        <button onClick={onAction} style={{ background: "none", border: "none", color: G, fontWeight: 800, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, marginTop: 16, justifyContent: align === "center" ? "center" : "flex-start", width: "100%" }}>
          {actionLabel || "Zote"} <ChevronRight size={16} />
        </button>
      )}
    </div>
  );
};

const GoldBtn = ({ children, onClick, href, style = {}, outline, size = "md" }) => {
  const padding = size === "sm" ? "9px 20px" : "11px 26px";
  const fontSize = size === "sm" ? 13 : 14;
  const base = {
    display: "inline-flex", alignItems: "center", gap: 7,
    padding, borderRadius: 10, fontWeight: 900, fontSize,
    cursor: "pointer", transition: "all .22s cubic-bezier(.4,0,.2,1)",
    border: "none", textDecoration: "none",
    ...(outline
      ? { background: "transparent", color: G, border: `1.5px solid ${G}45`, padding }
      : { background: `linear-gradient(135deg,${G},${G2})`, color: "#111", boxShadow: `0 4px 16px ${G}30` }
    ),
    ...style,
  };
  const El = href ? "a" : "button";
  return (
    <El href={href} onClick={onClick} style={base}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-2px)";
        if (!outline) e.currentTarget.style.boxShadow = `0 10px 28px ${G}50`;
        else e.currentTarget.style.borderColor = `${G}80`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "";
        if (!outline) e.currentTarget.style.boxShadow = `0 4px 16px ${G}30`;
        else e.currentTarget.style.borderColor = `${G}45`;
      }}>
      {children}
    </El>
  );
};

// ── Animated counter ──────────────────────────────────────────────────────────
function Counter({ to, suffix = "", prefix = "" }) {
  const [val, setVal] = useState(0);
  const ref   = useRef(null);
  const done  = useRef(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !done.current) {
        done.current = true;
        let start = 0;
        const step = to / 60;
        const t = setInterval(() => {
          start += step;
          if (start >= to) { setVal(to); clearInterval(t); }
          else setVal(Math.floor(start));
        }, 16);
      }
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to]);
  return <span ref={ref}>{prefix}{val.toLocaleString()}{suffix}</span>;
}

// ── Pillar Card ───────────────────────────────────────────────────────────────
function PillarCard({ emoji, title, desc, tag, color, path, goPage, delay = 0 }) {
  const isMobile = useMobile();
  if (isMobile) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }} transition={{ delay, duration: 0.4 }}
        onClick={() => goPage(path)}
        style={{ background: "rgba(255,255,255,0.03)", borderRadius: 20, border: "1px solid rgba(255,255,255,0.06)", padding: "16px", display: "flex", alignItems: "center", gap: 16, cursor: "pointer", position: "relative", overflow: "hidden" }}
      >
        <div style={{ width: 48, height: 48, borderRadius: 14, background: `${color}15`, border: `1px solid ${color}25`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{emoji}</div>
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
      initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }} transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -6 }} onClick={() => goPage(path)}
      style={{ background: "linear-gradient(145deg,#0d1019,#090b12)", borderRadius: 24, border: "1px solid rgba(255,255,255,.06)", padding: "32px 28px", cursor: "pointer", position: "relative", overflow: "hidden", transition: "box-shadow .3s, border-color .3s", boxShadow: "0 8px 32px rgba(0,0,0,.3)" }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 20px 60px rgba(0,0,0,.5), 0 0 0 1px ${color}25`; e.currentTarget.style.borderColor = `${color}30`; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,.3)"; e.currentTarget.style.borderColor = "rgba(255,255,255,.06)"; }}
    >
      <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: `radial-gradient(circle,${color}22,transparent 70%)`, filter: "blur(20px)", pointerEvents: "none" }} />
      <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 52, height: 52, borderRadius: 16, background: `${color}15`, border: `1px solid ${color}25`, fontSize: 26, marginBottom: 18 }}>{emoji}</div>
      {tag && <div style={{ position: "absolute", top: 20, right: 20 }}><Tag color={color}>{tag}</Tag></div>}
      <h3 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 24, fontWeight: 900, letterSpacing: "-.03em", margin: "0 0 10px", lineHeight: 1.15 }}>{title}</h3>
      <p style={{ color: "rgba(255,255,255,.52)", fontSize: 15, lineHeight: 1.65, margin: "0 0 20px" }}>{desc}</p>
      <div style={{ display: "flex", alignItems: "center", gap: 6, color, fontWeight: 800, fontSize: 13 }}>Gundua zaidi <ChevronRight size={15} /></div>
    </motion.div>
  );
}

// ── Mini content card ─────────────────────────────────────────────────────────
function MiniCard({ item, onRead, onPlay }) {
  const isMobile = useMobile();
  const [imgErr, setImgErr] = useState(false);
  const hasImg = (item.imageUrl || item.image) && !imgErr;
  const isVideo = item.type === "video";
  const handleClick = () => isVideo ? onPlay?.(item) : onRead?.(item);

  if (isMobile) {
    return (
      <div onClick={handleClick} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden", cursor: "pointer", height: "100%" }}>
        <div style={{ height: 110, background: "rgba(255,255,255,0.05)", position: "relative" }}>
          {hasImg ? (
            <img src={item.imageUrl || item.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} referrerPolicy="no-referrer" onError={() => setImgErr(true)} />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", fontSize: 32, opacity: 0.3 }}>{isVideo ? "▶" : "📰"}</div>
          )}
          <div style={{ position: "absolute", top: 8, left: 8 }}>
            <span style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".07em", color: "#fff", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", padding: "3px 8px", borderRadius: 6 }}>
              {item.badge || (isVideo ? "Video" : "Article")}
            </span>
          </div>
        </div>
        <div style={{ padding: 12 }}>
          <h4 style={{ fontSize: 13, fontWeight: 800, margin: 0, lineHeight: 1.4, height: 36, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", color: "rgba(255,255,255,0.9)" }}>{item.title}</h4>
        </div>
      </div>
    );
  }
  return (
    <div onClick={handleClick} style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,.05)", cursor: "pointer" }}>
      <div style={{ width: 62, height: 62, borderRadius: 12, overflow: "hidden", flexShrink: 0, background: "rgba(255,255,255,.04)" }}>
        {hasImg ? <img src={item.imageUrl || item.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} referrerPolicy="no-referrer" onError={() => setImgErr(true)} /> : <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", fontSize: 22, opacity: 0.5 }}>{isVideo ? "▶" : "📰"}</div>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <span style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".07em", color: G, background: `${G}15`, padding: "2px 7px", borderRadius: 4 }}>{item.badge || (isVideo ? "Video" : "Article")}</span>
        </div>
        <h4 style={{ fontSize: 14, fontWeight: 800, margin: 0, lineHeight: 1.3, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{item.title}</h4>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HOMEPAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function HomePage({ goPage, settings = {} }) {
  const isMobile = useMobile();
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY  = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);
  const heroOp = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  const { docs: tips,    loading: tipsLoading    } = useCollection("tips",    "createdAt", 6);
  const { docs: courses, loading: coursesLoading } = useCollection("courses", "createdAt", 3);
  const { docs: updatesDocs } = useCollection("updates", "createdAt", 4);
  const { docs: postsDocs   } = useCollection("posts",   "createdAt", 4);
  const { docs: newsDocs    } = useCollection("news",    "createdAt", 3);

  const updates = [...updatesDocs, ...postsDocs, ...newsDocs]
    .filter((item, idx, self) => self.findIndex(t => t.id === item.id) === idx)
    .sort((a, b) => {
      const ts = d => d.createdAt?.seconds || d.createdAt?.toDate?.()?.getTime?.() / 1000 || 0;
      return ts(b) - ts(a);
    })
    .slice(0, 3);

  const wa            = settings.contact_info?.whatsapp || "8619715852043";
  const communityLink = settings.contact_info?.whatsappCommunity || `https://wa.me/${wa}`;
  const heroTitle1    = settings.hero?.title1   || "SwahiliTech";
  const heroTitle2    = settings.hero?.title2   || "Elite Academy";
  const heroSub       = settings.hero?.subtitle || "Platform ya kwanza ya Tech kwa Watanzania — Kujifunza, Kubuni, na Kujipatia Kipato.";

  // Typed animation for hero badge
  const badges = ["Tanzania · Tech · 2026", "Jifunza · Kubuni · Pata Pesa", "Platform #1 ya Tech 🇹🇿"];
  const [badgeIdx, setBadgeIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setBadgeIdx(i => (i + 1) % badges.length), 3200);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#04050a", color: "#fff", fontFamily: "'Instrument Sans',system-ui,sans-serif" }}>

      {/* ═══════════════════════════════════════════════════
          HERO — compact, cinematic, mobile-first
      ═══════════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        style={{
          position: "relative",
          // On mobile: viewport height minus ticker (~30px) and navbar (~60px) = natural viewport
          minHeight: isMobile ? "calc(100svh - 30px)" : "100svh",
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
        }}
      >
        <AnimatedHeroBackground />

        <motion.div
          style={{ position: "relative", zIndex: 2, width: "100%", y: heroY, opacity: heroOp }}
        >
          <W>
            <div
              style={{
                maxWidth: isMobile ? "100%" : 720,
                // Tighter padding — brings content up, removes dead space
                paddingTop:    isMobile ? "clamp(72px,18vw,96px)"  : "clamp(88px,10vw,120px)",
                paddingBottom: isMobile ? "clamp(32px,8vw,52px)"   : "clamp(48px,6vw,80px)",
              }}
            >

              {/* ── Badge ── */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                style={{ marginBottom: isMobile ? 14 : 20 }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={badgeIdx}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Tag>🚀 {badges[badgeIdx]}</Tag>
                  </motion.div>
                </AnimatePresence>
              </motion.div>

              {/* ── Headline ── */}
              <motion.h1
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: 0.55 }}
                style={{
                  fontFamily: "'Bricolage Grotesque',sans-serif",
                  // Tighter font scale on mobile — prevents overflow and fits naturally
                  fontSize: isMobile
                    ? "clamp(38px,9.5vw,52px)"
                    : "clamp(52px,7.5vw,96px)",
                  fontWeight: 900,
                  lineHeight: isMobile ? 1.03 : 0.93,
                  letterSpacing: isMobile ? "-.04em" : "-.06em",
                  margin: `0 0 ${isMobile ? "12px" : "20px"}`,
                }}
              >
                <span style={{ display: "block", color: "#fff" }}>{heroTitle1}</span>
                <span style={{
                  display: "block",
                  background: `linear-gradient(135deg, ${G} 20%, ${G2} 80%)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  // Subtle text shadow for depth
                  filter: "drop-shadow(0 0 24px rgba(245,166,35,.35))",
                }}>
                  {heroTitle2}
                </span>
              </motion.h1>

              {/* ── Subtitle ── */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.5 }}
                style={{
                  color: "rgba(255,255,255,.58)",
                  fontSize: isMobile ? 14 : "clamp(15px,1.8vw,19px)",
                  lineHeight: 1.6,
                  maxWidth: isMobile ? "100%" : 520,
                  margin: `0 0 ${isMobile ? "20px" : "32px"}`,
                  fontWeight: 500,
                }}
              >
                {isMobile
                  ? "Platform namba moja ya Tech kwa Watanzania."
                  : heroSub}
              </motion.p>

              {/* ── CTAs ── */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28, duration: 0.45 }}
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                {/* Primary — slightly more compact than original */}
                <GoldBtn
                  onClick={() => goPage("courses")}
                  style={{
                    fontSize: isMobile ? 14 : 15,
                    padding: isMobile ? "11px 22px" : "12px 28px",
                    width: isMobile ? "100%" : "auto",
                    justifyContent: "center",
                    borderRadius: 11,
                  }}
                >
                  🎓 Anza Kujifunza <ArrowRight size={16} />
                </GoldBtn>

                {/* Secondary */}
                {!isMobile ? (
                  <GoldBtn
                    outline
                    onClick={() => goPage("vpn")}
                    style={{ fontSize: 14, padding: "11px 22px", borderRadius: 11 }}
                  >
                    🔒 STEA VPN
                  </GoldBtn>
                ) : (
                  // On mobile show a ghost link instead of a full button
                  <button
                    onClick={() => goPage("exams")}
                    style={{
                      background: "none", border: "none", color: "rgba(255,255,255,.5)",
                      fontSize: 13, fontWeight: 700, cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 5,
                    }}
                  >
                    Angalia NECTA Results <ChevronRight size={14} />
                  </button>
                )}
              </motion.div>

              {/* ── Stats row — compact ── */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.44, duration: 0.55 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: isMobile ? 0 : 4,
                  marginTop: isMobile ? 22 : 36,
                  flexWrap: "nowrap",
                  overflow: "hidden",
                }}
              >
                {[
                  { n: 10000, s: "+", label: "Wanafunzi" },
                  { n: 50,    s: "+", label: "Tech Tips" },
                  { n: 5,     s: "★", label: "Rating" },
                ].map((stat, i) => (
                  <>
                    {i > 0 && (
                      <div
                        key={`div-${i}`}
                        style={{
                          width: 1,
                          height: isMobile ? 28 : 32,
                          background: "rgba(255,255,255,.12)",
                          margin: isMobile ? "0 14px" : "0 24px",
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <div key={i} style={{ flexShrink: 0 }}>
                      <div style={{
                        fontFamily: "'Bricolage Grotesque',sans-serif",
                        fontSize: isMobile ? 18 : 26,
                        fontWeight: 900,
                        color: "#fff",
                        lineHeight: 1,
                        letterSpacing: "-.02em",
                      }}>
                        <Counter to={stat.n} suffix={stat.s} />
                      </div>
                      <div style={{
                        fontSize: isMobile ? 10 : 11,
                        color: "rgba(255,255,255,.38)",
                        fontWeight: 700,
                        marginTop: 3,
                        textTransform: "uppercase",
                        letterSpacing: ".06em",
                      }}>
                        {stat.label}
                      </div>
                    </div>
                  </>
                ))}

                {/* Live indicator */}
                {!isMobile && (
                  <div style={{
                    marginLeft: "auto",
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "6px 14px",
                    borderRadius: 99,
                    background: "rgba(34,197,94,.08)",
                    border: "1px solid rgba(34,197,94,.18)",
                  }}>
                    <div style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: "#22c55e",
                      boxShadow: "0 0 8px #22c55e",
                      animation: "livePulse 2s ease-in-out infinite",
                    }} />
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#22c55e", letterSpacing: ".06em" }}>
                      LIVE
                    </span>
                  </div>
                )}
              </motion.div>

              {/* Trust logos row — subtle social proof */}
              {!isMobile && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    marginTop: 28,
                    paddingTop: 20,
                    borderTop: "1px solid rgba(255,255,255,.06)",
                  }}
                >
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,.25)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", whiteSpace: "nowrap" }}>
                    Inakubaliwa na
                  </span>
                  {["🏦 M-Pesa", "📱 WhatsApp", "🔒 Cloudflare", "🌍 NECTA"].map((b, i) => (
                    <span key={i} style={{ fontSize: 12, color: "rgba(255,255,255,.32)", fontWeight: 700, whiteSpace: "nowrap" }}>{b}</span>
                  ))}
                </motion.div>
              )}
            </div>
          </W>
        </motion.div>

        {/* Scroll hint — subtle line */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          style={{
            position: "absolute",
            bottom: isMobile ? 16 : 24,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            opacity: 0.3,
            pointerEvents: "none",
          }}
        >
          <div style={{ width: 1, height: isMobile ? 28 : 36, background: "linear-gradient(to bottom, transparent, rgba(255,255,255,.6))" }} />
          <div style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(255,255,255,.6)" }} />
        </motion.div>
      </section>

      {/* Banner Ad */}
      <W><BannerAd /></W>

      {/* ═══════════════════════════════════════════════════
          QUICK ACCESS PILLARS
      ═══════════════════════════════════════════════════ */}
      <section style={{ padding: isMobile ? "40px 0" : "clamp(60px,8vw,120px) 0" }}>
        <W>
          {!isMobile && (
            <SectionHeader
              tag="Platform Yetu"
              title={<>Kila Kitu Unahitaji <span style={{ color: G }}>Mahali Pamoja</span></>}
              desc="Kutoka kujifunza hadi kujipatia kipato — STEA ni jibu lako."
            />
          )}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2,1fr)", gap: isMobile ? 12 : 22 }}>
            <PillarCard emoji="🎓" title="Student Center" tag="Courses + NECTA" color="#10b981" path="exams"
              desc="Online courses, NECTA results, past papers, notes — elimu kamili kwa mkono wako." goPage={goPage} delay={0} />
            <PillarCard emoji="💡" title="Tech Hub" tag="AI + Tips" color="#3b82f6" path="tech"
              desc="AI Lab, Prompt Lab, Tech Tips na zana za dijiti — pata ujuzi wa kisasa kwa lugha ya Kiswahili." goPage={goPage} delay={0.08} />
            <PillarCard emoji="📣" title="Huduma" tag="Business" color="#ec4899" path="huduma"
              desc="Tangaza bidhaa zako, website solutions, brand partnerships na huduma za vijana." goPage={goPage} delay={0.16} />
            <PillarCard emoji="💼" title="Gigs & Kazi" tag="Opportunities" color="#f5a623" path="gigs"
              desc="Remote jobs, local gigs, freelance projects, na internships — pata kazi au tuma nafasi yako." goPage={goPage} delay={0.24} />
          </div>
        </W>
      </section>

      {/* ═══════════════════════════════════════════════════
          TECH HUB HIGHLIGHT
      ═══════════════════════════════════════════════════ */}
      <section style={{ padding: isMobile ? "40px 0" : "clamp(40px,6vw,80px) 0", background: "rgba(59,130,246,.03)", borderTop: "1px solid rgba(59,130,246,.1)", borderBottom: "1px solid rgba(59,130,246,.1)" }}>
        <W>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 24 : 60, alignItems: "center" }}>
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <SectionHeader
                align={isMobile ? "center" : "left"}
                tag="💡 Tech Hub"
                title={<>AI na Tech kwa Lugha ya <span style={{ color: "#60a5fa" }}>Kiswahili</span></>}
                desc="Tumia ChatGPT, Gemini na AI tools zingine kwa Kiswahili. Pata prompts, maujanja na zana bora za dijiti kila siku."
                color="#3b82f6"
              />
              {!isMobile && (
                <div style={{ display: "grid", gap: 12, marginBottom: 28 }}>
                  {[
                    { icon: <Sparkles size={16} />, label: "AI Lab — Zana za AI zilizofunzwa kwa Kiswahili" },
                    { icon: <Zap size={16} />,       label: "Prompt Lab — Maktaba ya prompts bora zaidi" },
                    { icon: <BookOpen size={16} />,  label: "Tech Tips — Maujanja mapya kila siku" },
                    { icon: <Globe size={16} />,     label: "Website Solutions — Websites bora na za siri" },
                    { icon: <LayoutGrid size={16} />,label: "Digital Tools — Zana za dijiti za bure" },
                  ].map((f, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, color: "rgba(255,255,255,.75)", fontSize: 14, fontWeight: 600 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(59,130,246,.15)", display: "grid", placeItems: "center", color: "#60a5fa", flexShrink: 0 }}>{f.icon}</div>
                      {f.label}
                    </div>
                  ))}
                </div>
              )}
              <GoldBtn onClick={() => goPage("ai")} style={{ background: "#3b82f6", boxShadow: "0 8px 24px rgba(59,130,246,0.35)", width: isMobile ? "100%" : "auto", justifyContent: "center" }}>
                Ingia AI Lab <ArrowRight size={16} />
              </GoldBtn>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div style={{ background: "rgba(255,255,255,.03)", borderRadius: 24, border: "1px solid rgba(255,255,255,.07)", overflow: "hidden" }}>
                <div style={{ padding: "18px 24px", borderBottom: "1px solid rgba(255,255,255,.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 800, fontSize: 15 }}>Tech Tips za Leo</span>
                  <button onClick={() => goPage("tips")} style={{ background: "none", border: "none", color: G, fontWeight: 800, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                    Zote <ChevronRight size={14} />
                  </button>
                </div>
                <div style={{ padding: "8px 24px 16px" }}>
                  {isMobile ? (
                    <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 8, scrollSnapType: "x mandatory" }} className="no-scrollbar">
                      {tips.length > 0 ? tips.map(item => (
                        <div key={item.id} onClick={() => goPage("/tips")} style={{ flexShrink: 0, width: 240 }}>
                          <MiniCard item={item} onRead={() => goPage("/tips")} onPlay={() => goPage("/tips")} />
                        </div>
                      )) : [1, 2].map(i => (
                        <div key={i} style={{ flexShrink: 0, width: 240, height: 80, background: "rgba(255,255,255,.03)", borderRadius: 12 }} />
                      ))}
                    </div>
                  ) : (
                    tips.length > 0
                      ? tips.slice(0, 4).map(item => <MiniCard key={item.id} item={item} onRead={() => goPage("/tips")} onPlay={() => goPage("/tips")} />)
                      : [1, 2, 3].map(i => (
                          <div key={i} style={{ display: "flex", gap: 14, padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
                            <div style={{ width: 62, height: 62, borderRadius: 12, background: "rgba(255,255,255,.04)", flexShrink: 0 }} />
                            <div style={{ flex: 1, display: "grid", gap: 8, alignContent: "center" }}>
                              <div style={{ height: 12, borderRadius: 6, background: "rgba(255,255,255,.04)", width: "80%" }} />
                              <div style={{ height: 10, borderRadius: 5, background: "rgba(255,255,255,.03)", width: "55%" }} />
                            </div>
                          </div>
                        ))
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </W>
      </section>

      {/* ═══════════════════════════════════════════════════
          STUDENT CENTER
      ═══════════════════════════════════════════════════ */}
      <section style={{ padding: isMobile ? "40px 0" : "clamp(60px,8vw,110px) 0" }}>
        <W>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 20 : 60, alignItems: "center" }}>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <div style={{ background: "linear-gradient(145deg,rgba(16,185,129,0.12),transparent)", borderRadius: 28, border: "1px solid rgba(16,185,129,0.2)", padding: isMobile ? "28px 24px" : "40px 36px" }}>
                <div style={{ fontSize: 40, marginBottom: 20 }}>🎓</div>
                <h3 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: "clamp(24px,3vw,36px)", fontWeight: 900, letterSpacing: "-.03em", margin: "0 0 14px", lineHeight: 1.15 }}>Student Center</h3>
                <p style={{ color: "rgba(255,255,255,.6)", fontSize: isMobile ? 14 : 15, lineHeight: 1.65, marginBottom: isMobile ? 16 : 28 }}>
                  {isMobile ? "NECTA, past papers, notes, courses — kila kitu mahali pamoja." : "Kila kitu unachohitaji kufanikiwa kimasomo — kutoka matokeo ya NECTA hadi kozi za skills."}
                </p>
                {!isMobile ? (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 28 }}>
                    {["NECTA Results", "Past Papers", "Study Notes", "Online Courses", "Univ. Guide", "Scholarships"].map((item, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,.75)" }}>
                        <CheckCircle size={13} color="#10b981" /> {item}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 10px", marginBottom: 20 }}>
                    {["NECTA Results", "Past Papers", "Study Notes", "Kozi", "Univ. Guide"].map((item, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,.65)", background: "rgba(16,185,129,.08)", padding: "4px 10px", borderRadius: 20, border: "1px solid rgba(16,185,129,.15)" }}>
                        <CheckCircle size={11} color="#10b981" /> {item}
                      </div>
                    ))}
                  </div>
                )}
                <GoldBtn onClick={() => goPage("exams")} style={{ background: "#10b981", boxShadow: "0 8px 24px rgba(16,185,129,0.35)", width: isMobile ? "100%" : "auto", justifyContent: "center" }}>
                  Fungua Student Center <ArrowRight size={16} />
                </GoldBtn>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h4 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: isMobile ? 18 : 22, fontWeight: 900, letterSpacing: "-.02em", margin: 0 }}>Kozi Mpya</h4>
                {!isMobile && (
                  <button onClick={() => goPage("courses")} style={{ background: "none", border: "none", color: G, fontWeight: 800, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                    Zote <ChevronRight size={12} />
                  </button>
                )}
              </div>
              {isMobile ? (
                <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 12, scrollSnapType: "x mandatory" }} className="no-scrollbar">
                  {courses.length > 0 ? courses.map(c => (
                    <div key={c.id} onClick={() => goPage("course-detail", c)}
                      style={{ flexShrink: 0, width: 260, scrollSnapAlign: "start", background: "rgba(255,255,255,.03)", borderRadius: 20, border: "1px solid rgba(255,255,255,.06)", overflow: "hidden" }}>
                      <div style={{ height: 140, background: "rgba(255,255,255,.05)", position: "relative" }}>
                        {c.imageUrl ? <img src={c.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} referrerPolicy="no-referrer" /> : <div style={{ height: "100%", display: "grid", placeItems: "center", fontSize: 40 }}>📚</div>}
                        <div style={{ position: "absolute", top: 12, right: 12 }}><Tag color={G} style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>{c.newPrice || c.price}</Tag></div>
                      </div>
                      <div style={{ padding: 16 }}>
                        <div style={{ fontWeight: 800, fontSize: 15, lineHeight: 1.4, marginBottom: 8, height: 42, overflow: "hidden" }}>{c.title}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, color: G, fontSize: 12, fontWeight: 700 }}>Anza Sasa <ArrowRight size={14} /></div>
                      </div>
                    </div>
                  )) : [1, 2].map(i => <div key={i} style={{ flexShrink: 0, width: 260, height: 220, background: "rgba(255,255,255,.03)", borderRadius: 20 }} />)}
                </div>
              ) : (
                <div style={{ display: "grid", gap: 12 }}>
                  {courses.length > 0 ? courses.map(c => (
                    <div key={c.id} onClick={() => goPage("course-detail", c)}
                      style={{ display: "flex", gap: 14, background: "rgba(255,255,255,.03)", borderRadius: 14, border: "1px solid rgba(255,255,255,.05)", padding: "14px", cursor: "pointer", transition: "background .15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.05)"}
                      onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,.03)"}>
                      <div style={{ width: 56, height: 56, borderRadius: 12, overflow: "hidden", flexShrink: 0, background: "rgba(255,255,255,.05)", display: "grid", placeItems: "center", fontSize: 22 }}>
                        {c.imageUrl ? <img src={c.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} referrerPolicy="no-referrer" /> : "📚"}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: 14, lineHeight: 1.3, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{c.title}</div>
                        <div style={{ color: G, fontWeight: 900, fontSize: 14, marginTop: 4 }}>{c.newPrice || c.price}</div>
                      </div>
                    </div>
                  )) : [1, 2, 3].map(i => (
                    <div key={i} style={{ display: "flex", gap: 14, background: "rgba(255,255,255,.03)", borderRadius: 14, padding: "14px", border: "1px solid rgba(255,255,255,.05)" }}>
                      <div style={{ width: 56, height: 56, borderRadius: 12, background: "rgba(255,255,255,.05)", flexShrink: 0 }} />
                      <div style={{ flex: 1, display: "grid", gap: 8, alignContent: "center" }}>
                        <div style={{ height: 13, borderRadius: 6, background: "rgba(255,255,255,.05)", width: "75%" }} />
                        <div style={{ height: 11, borderRadius: 5, background: "rgba(255,255,255,.03)", width: "40%" }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </W>
      </section>

      {/* Latest Updates */}
      {updates.length > 0 && (
        <section style={{ padding: isMobile ? "40px 0" : "60px 0", background: "rgba(255,255,255,.01)" }}>
          <W>
            <SectionHeader tag="HABARI" title="Latest Updates" desc="Habari na taarifa za hivi punde kutoka STEA." align="left" />
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: isMobile ? 16 : 24 }}>
              {updates.map((u, i) => (
                <motion.div key={u.id || i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  style={{ background: "rgba(255,255,255,.03)", borderRadius: 20, border: "1px solid rgba(255,255,255,.06)", overflow: "hidden" }}>
                  {(u.imageUrl || u.image) && (
                    <div style={{ width: "100%", height: 160, overflow: "hidden", background: "rgba(255,255,255,.04)" }}>
                      <img src={u.imageUrl || u.image} alt={u.title || ""} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} referrerPolicy="no-referrer" onError={e => { e.currentTarget.parentElement.style.display = "none"; }} />
                    </div>
                  )}
                  <div style={{ padding: 20 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>{u.title}</h3>
                    <p style={{ fontSize: 14, color: "rgba(255,255,255,.5)", lineHeight: 1.5 }}>
                      {((u.summary || u.description || u.content || "").replace(/<[^>]+>/g, "").substring(0, 110).trim() || "Soma zaidi...")}
                      {(u.summary || u.description || u.content || "").length > 110 ? "..." : ""}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </W>
        </section>
      )}

      {/* VPN Highlight */}
      <section style={{ padding: isMobile ? "40px 0" : "clamp(60px,8vw,120px) 0" }}>
        <W>
          <div style={{ background: "linear-gradient(135deg,#0a0c14,#05060a)", borderRadius: isMobile ? 24 : 32, border: "1px solid rgba(255,255,255,.06)", padding: isMobile ? "32px 24px" : "60px", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 32 : 60, alignItems: "center", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: "-20%", right: "-10%", width: "60%", height: "140%", background: `radial-gradient(circle,${G}15,transparent 70%)`, filter: "blur(60px)", pointerEvents: "none" }} />
            <div>
              <Tag color={G} style={{ marginBottom: 20 }}>GUIDE</Tag>
              <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: "clamp(22px,3.5vw,44px)", fontWeight: 900, letterSpacing: "-.04em", margin: "0 0 14px", lineHeight: 1.1 }}>VPN Guide — Wasafiri & Expats</h2>
              <p style={{ color: "rgba(255,255,255,.55)", fontSize: 16, lineHeight: 1.7, marginBottom: 28 }}>Mwongozo wa kutumia VPN kwa safari, usalama na matumizi ya kimataifa.</p>
              <GoldBtn onClick={() => goPage("vpn")} style={{ width: isMobile ? "100%" : "auto", justifyContent: "center" }}>
                Gundua zaidi <ArrowRight size={16} />
              </GoldBtn>
            </div>
            {!isMobile && (
              <div>
                <div style={{ background: "rgba(255,255,255,.03)", borderRadius: 24, border: "1px solid rgba(255,255,255,.08)", padding: 32 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: `${G}20`, display: "grid", placeItems: "center", fontSize: 24 }}>🛡️</div>
                    <div><div style={{ fontWeight: 800, fontSize: 18 }}>Premium Protection</div><div style={{ fontSize: 13, color: "rgba(255,255,255,.5)" }}>Active & Encrypted</div></div>
                  </div>
                  <div style={{ display: "grid", gap: 12 }}>
                    {["No Logs Policy", "Unlimited Bandwidth", "5G Optimized Servers", "M-Pesa Payments"].map((f, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "rgba(255,255,255,.7)" }}>
                        <CheckCircle size={14} color={G} /> {f}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </W>
      </section>

      <W><InlineAd index={0} /></W>

      {/* Duka + Gigs */}
      <section style={{ padding: isMobile ? "40px 0" : "clamp(60px,8vw,120px) 0" }}>
        <W>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 24 : 40 }}>
            {[
              { emoji: "🛒", title: "STEA Duka", desc: "Nunua na uza bidhaa za tech, accounts, na digital assets kwa usalama zaidi.", page: "duka", label: "Ingia Sokoni", outline: false },
              { emoji: "💼", title: "Gigs & Kazi", desc: "Pata kazi za remote, freelance projects, na nafasi za kazi nchini Tanzania.", page: "gigs", label: "Tafuta Kazi", outline: true },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                style={{ background: "rgba(255,255,255,.02)", borderRadius: 24, border: "1px solid rgba(255,255,255,.06)", padding: isMobile ? "28px 24px" : "40px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 32, marginBottom: 16 }}>{s.emoji}</div>
                  <h3 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 28, fontWeight: 900, margin: "0 0 12px" }}>{s.title}</h3>
                  <p style={{ color: "rgba(255,255,255,.5)", fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>{s.desc}</p>
                </div>
                <GoldBtn onClick={() => goPage(s.page)} outline={s.outline} style={{ width: isMobile ? "100%" : "auto", justifyContent: "center" }}>
                  {s.label} <ArrowRight size={16} />
                </GoldBtn>
              </motion.div>
            ))}
          </div>
        </W>
      </section>

      {/* Services */}
      <section style={{ padding: isMobile ? "40px 0" : "clamp(60px,8vw,120px) 0", background: "rgba(255,255,255,.01)" }}>
        <W>
          <SectionHeader tag="Huduma Zetu" title={<>Tunasaidia Biashara <span style={{ color: G }}>Kukua</span></>} desc="Kutoka website solutions hadi matangazo — STEA ni mshirika wako wa kimkakati." />
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: isMobile ? 12 : 24 }}>
            {[
              { t: "Website Solutions", d: "Tunatengeneza websites za kisasa na zenye kasi kwa ajili ya biashara yako.", e: "🌐" },
              { t: "Digital Marketing",  d: "Tangaza bidhaa zako kwa hadhira kubwa ya STEA kupitia banners na posts.",   e: "📈" },
              { t: "Brand Partnership", d: "Fanya kazi na STEA kukuza brand yako kwa vijana wa Tanzania.",                e: "🤝" },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                style={{ background: "rgba(255,255,255,.03)", borderRadius: 20, border: "1px solid rgba(255,255,255,.06)", padding: "24px", textAlign: isMobile ? "center" : "left" }}>
                <div style={{ fontSize: 28, marginBottom: 16 }}>{s.e}</div>
                <h4 style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>{s.t}</h4>
                <p style={{ color: "rgba(255,255,255,.5)", fontSize: 14, lineHeight: 1.6, margin: 0 }}>{s.d}</p>
              </motion.div>
            ))}
          </div>
          <div style={{ marginTop: 40, textAlign: "center" }}>
            <GoldBtn onClick={() => goPage("huduma")} style={{ width: isMobile ? "100%" : "auto", justifyContent: "center" }}>
              Angalia Huduma Zote <ArrowRight size={16} />
            </GoldBtn>
          </div>
        </W>
      </section>

      {/* WhatsApp Community CTA */}
      <section style={{ padding: isMobile ? "60px 0" : "clamp(80px,10vw,160px) 0" }}>
        <W>
          <motion.div initial={{ opacity: 0, scale: 0.98 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
            style={{ background: "linear-gradient(135deg,#25d366,#128c7e)", borderRadius: isMobile ? 28 : 40, padding: isMobile ? "48px 24px" : "80px 40px", textAlign: "center", color: "#fff", position: "relative", overflow: "hidden", boxShadow: "0 32px 80px rgba(37,211,102,.25)" }}>
            <div style={{ position: "absolute", inset: 0, opacity: 0.1, backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
            <div style={{ position: "relative", zIndex: 2 }}>
              <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: isMobile ? 64 : 80, height: isMobile ? 64 : 80, borderRadius: "50%", background: "rgba(255,255,255,.2)", backdropFilter: "blur(10px)", fontSize: isMobile ? 32 : 40, marginBottom: 24 }}>💬</div>
              <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: "clamp(28px,4.5vw,60px)", fontWeight: 900, letterSpacing: "-.04em", margin: "0 0 16px", lineHeight: 1 }}>
                Jiunge na Community <br /> ya STEA WhatsApp
              </h2>
              <p style={{ fontSize: "clamp(15px,1.8vw,20px)", opacity: 0.9, maxWidth: 600, margin: "0 auto 36px", lineHeight: 1.6, fontWeight: 500 }}>
                Pata habari za tech, matokeo ya NECTA, na ofa za siri moja kwa moja kwenye simu yako.
              </p>
              <button onClick={() => window.open(communityLink, "_blank")}
                style={{ background: "#fff", color: "#128c7e", border: "none", padding: isMobile ? "16px 32px" : "20px 48px", borderRadius: 99, fontSize: isMobile ? 16 : 18, fontWeight: 900, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 12, boxShadow: "0 12px 32px rgba(0,0,0,.15)", transition: "transform .2s" }}
                onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
                onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
                Jiunge Sasa <ArrowRight size={20} />
              </button>
            </div>
          </motion.div>
        </W>
      </section>

      <style>{`
        @keyframes pulse      { 0%,100%{opacity:.6} 50%{opacity:1} }
        @keyframes shimmer    { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes livePulse  { 0%,100%{opacity:1;box-shadow:0 0 8px #22c55e} 50%{opacity:.5;box-shadow:0 0 16px #22c55e} }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
