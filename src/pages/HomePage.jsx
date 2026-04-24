/**
 * STEA Homepage — Premium Mobile-First Redesign
 * 12-section cinematic layout · no repetition · horizontal scroll content
 */
import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  ArrowRight, ChevronRight, Search, Sparkles, GraduationCap,
  Cpu, ShoppingBag, Wrench, Globe, Star, Zap, TrendingUp,
  BookOpen, Users, Trophy, Download, MessageCircle, ExternalLink,
  Bell, X, Check
} from "lucide-react";
import { useCollection, useCollectionWhere } from "../hooks/useFirestore.js";
import { useNetwork } from "../hooks/useNetwork.js";
import { BannerAd } from "../components/SponsoredAdsSection.jsx";
import { useMobile } from "../hooks/useMobile.js";
import { usePWA } from "../contexts/PWAContext.jsx";
import { Skeleton, PostSkeleton, OfflineNotice } from "../components/Skeleton.jsx";
import AnimatedEarth from "../components/AnimatedEarth.jsx";
import { useSettings } from "../contexts/SettingsContext.jsx";
import ServiceRequestForm from "../components/services/ServiceRequestForm.jsx";

const G  = "#F5A623";
const G2 = "#FFD17C";
const BG = "#06080f";

// ── Ease curves ────────────────────────────────────────
const SPRING = [0.16, 1, 0.3, 1];

// ── Layout wrapper ─────────────────────────────────────
const W = ({ children, style = {} }) => (
  <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 clamp(16px,4vw,40px)", ...style }}>
    {children}
  </div>
);

// ── Helpers ────────────────────────────────────────────
const normalizeItem = (item) => ({
  ...item,
  title: item.title || item.name || "Untitled",
  image: item.imageUrl || item.image || (item.images?.[0]) || "",
  text:  item.summary || item.content || item.description || "",
  link:  item.ctaUrl  || item.url || item.affiliateLink || "",
});

// ── Horizontal scroll row ─────────────────────────────
function HScrollRow({ children, gap = 16 }) {
  return (
    <div style={{
      display: "flex", overflowX: "auto", gap,
      paddingBottom: 8, paddingLeft: "clamp(16px,4vw,40px)",
      paddingRight: "clamp(16px,4vw,40px)",
      scrollSnapType: "x mandatory",
      WebkitOverflowScrolling: "touch",
      scrollbarWidth: "none",
      msOverflowStyle: "none",
      margin: "0 calc(-1 * clamp(16px,4vw,40px))",
    }}>
      <style>{`.hscroll-row::-webkit-scrollbar{display:none}`}</style>
      {children}
    </div>
  );
}

// ── Section label pill ────────────────────────────────
function Label({ children, color = G, icon }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "5px 14px", borderRadius: 999,
      background: `${color}12`, border: `1px solid ${color}22`,
      color, fontSize: 11, fontWeight: 900,
      textTransform: "uppercase", letterSpacing: "0.1em",
      marginBottom: 14,
    }}>
      {icon && icon} {children}
    </div>
  );
}

// ── Section header ────────────────────────────────────
function SectionHead({ label, labelColor = G, labelIcon, title, desc, action, actionText = "View All", align = "left" }) {
  return (
    <div style={{ marginBottom: 24, textAlign: align }}>
      {label && <Label color={labelColor} icon={labelIcon}>{label}</Label>}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <h2 style={{
          fontFamily: "'Bricolage Grotesque',sans-serif",
          fontSize: "clamp(20px,3vw,30px)", fontWeight: 900,
          letterSpacing: "-.035em", lineHeight: 1.18, margin: 0,
          maxWidth: action ? "70%" : "100%",
        }}>{title}</h2>
        {action && (
          <button onClick={action} style={{
            display: "flex", alignItems: "center", gap: 5,
            background: "none", border: "none",
            color: G, fontWeight: 800, fontSize: 13,
            cursor: "pointer", flexShrink: 0,
            padding: "4px 0",
          }}>
            {actionText} <ChevronRight size={14} />
          </button>
        )}
      </div>
      {desc && <p style={{ color: "rgba(255,255,255,.45)", fontSize: 14, marginTop: 6, lineHeight: 1.65, maxWidth: 560 }}>{desc}</p>}
    </div>
  );
}

// ── Gold button ────────────────────────────────────────
function GoldBtn({ children, onClick, href, outline, small, style = {}, icon }) {
  const base = {
    display: "inline-flex", alignItems: "center", gap: 8,
    padding: small ? "10px 20px" : "13px 26px",
    borderRadius: 14, fontWeight: 900, fontSize: small ? 13 : 14,
    cursor: "pointer", border: "none", textDecoration: "none",
    transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
    position: "relative", overflow: "hidden",
    ...(outline
      ? { background: "transparent", color: G, border: `1.5px solid ${G}40` }
      : { background: `linear-gradient(135deg,${G},${G2})`, color: "#111", boxShadow: `0 6px 22px ${G}35` }
    ),
    ...style,
  };
  const Tag = href ? "a" : "button";
  return (
    <Tag href={href} onClick={onClick} target={href ? "_blank" : undefined} rel={href ? "noreferrer" : undefined} style={base}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px) scale(1.02)"; if (!outline) e.currentTarget.style.boxShadow = `0 12px 32px ${G}45`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; if (!outline) e.currentTarget.style.boxShadow = `0 6px 22px ${G}35`; }}>
      {icon && icon}{children}
    </Tag>
  );
}

// ─────────────────────────────────────────────────────
// 1. ANNOUNCEMENT STRIP
// ─────────────────────────────────────────────────────
const ANNOUNCEMENTS = [
  "🎓 Student Center — NECTA Results, Past Papers & Scholarships",
  "🌍 Now available in English and Kiswahili",
  "⚡ New: Daily Quizzes & Weekly Challenges live now",
  "🛒 STEA Shop — buy tech products safely in Tanzania",
  "🤖 AI Lab updated with new Swahili-optimized prompts",
];

function AnnouncementStrip() {
  const [idx, setIdx] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % ANNOUNCEMENTS.length), 4000);
    return () => clearInterval(t);
  }, []);

  if (dismissed) return null;

  return (
    <div style={{
      background: `linear-gradient(90deg, ${G}18, rgba(255,209,124,0.1), ${G}18)`,
      borderBottom: `1px solid ${G}20`,
      height: 38, display: "flex", alignItems: "center",
      overflow: "hidden", position: "relative",
    }}>
      <div style={{ flex: 1, overflow: "hidden", padding: "0 clamp(16px,4vw,40px)" }}>
        <AnimatePresence mode="wait">
          <motion.span key={idx}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            style={{ fontSize: 12, fontWeight: 700, color: G, display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {ANNOUNCEMENTS[idx]}
          </motion.span>
        </AnimatePresence>
      </div>
      <button onClick={() => setDismissed(true)} style={{ background: "none", border: "none", color: "rgba(255,255,255,.35)", cursor: "pointer", padding: "0 12px", flexShrink: 0, lineHeight: 1 }}>
        <X size={14} />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// 3. HERO
// ─────────────────────────────────────────────────────
function StatChip({ value, label, delay = 0, color }) {
  const ref = useRef(null);
  const [displayed, setDisplayed] = useState("0");
  const [animated, setAnimated] = useState(false);
  const isMobile = useMobile();

  const chipColor = color || G;

  // Parse numeric value for counting
  const isNumeric = /[\d]/.test(value);
  const numMatch  = value?.match(/([\d.]+)([KkMm+]*.*)/)
  const numPart   = numMatch ? parseFloat(numMatch[1]) : null;
  const suffix    = numMatch ? numMatch[2] : "";

  useEffect(() => {
    if (!isNumeric || animated) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      obs.disconnect();
      setAnimated(true);
      let start = 0;
      const end   = numPart;
      const step  = end / 40;
      const timer = setInterval(() => {
        start += step;
        if (start >= end) { clearInterval(timer); setDisplayed(value); }
        else {
          const disp = end >= 100 ? Math.round(start) : start.toFixed(1);
          setDisplayed(disp + suffix);
        }
      }, 30);
      return () => clearInterval(timer);
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [isNumeric, animated, numPart, suffix, value]);

  useEffect(() => {
    if (!isNumeric) { setTimeout(() => setDisplayed(value), delay * 1000 + 300); }
    else setDisplayed("0");
  }, []);

  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 16, scale: .88 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: .38 + delay * .08, duration: .5, ease: [0.16,1,0.3,1] }}
      style={{ padding: isMobile ? "10px 16px" : "12px 22px",
        background: "rgba(255,255,255,.06)", border: `1px solid ${chipColor}25`,
        borderRadius: 14, backdropFilter: "blur(12px)", textAlign: "center",
        minWidth: isMobile ? 64 : 80 }}>
      <div style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontWeight:900,
        fontSize: isMobile?17:20, color: chipColor, lineHeight:1, marginBottom:3 }}>
        {displayed || value}
      </div>
      <div style={{ fontSize:10, color:"rgba(255,255,255,.38)", fontWeight:700, letterSpacing:".04em" }}>
        {label}
      </div>
    </motion.div>
  );
}

function useCountUp(target, duration=1800, start=false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const isNumeric = /^\d/.test(target);
    if (!isNumeric) { setCount(target); return; }
    const numericTarget = parseFloat(target.replace(/[^0-9.]/g,''));
    const suffix = target.replace(/[\d.]/g,'');
    const step = (ts) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * numericTarget) + suffix);
      if (progress < 1) requestAnimationFrame(step);
      else setCount(target);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return count;
}


function HeroSection({ goPage, sectorsRef, deferredPrompt, installApp, isInstalled, t }) {
  const isMobile = useMobile();
  const heroRef  = useRef(null);
  const statsRef = useRef(null);
  const [statsStarted, setStatsStarted] = useState(false);
  const { scrollYProgress } = useScroll({ target: heroRef, offset:["start start","end start"] });
  const heroY  = useTransform(scrollYProgress, [0,1], ["0px","60px"]);
  const heroOp = useTransform(scrollYProgress, [0,.85], [1, 0]);

  // Start stats counter when stats come into view
  useEffect(() => {
    if (!statsRef.current) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setStatsStarted(true); obs.disconnect(); } }, { threshold:.3 });
    obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  const CARDS = [
    { emoji:"🎓", title:"Student Center", sub:"Exams",        path:"exams",       color:"#10b981" },
    { emoji:"💡", title:"Tech Hub",       sub:"AI + Tips",    path:"tech",        color:"#3b82f6" },
    { emoji:"🛠️", title:"Our Services",  sub:"Business",     path:"huduma",      color:"#ec4899" },
    { emoji:"🛒", title:"STEA Shop",      sub:"Marketplace",  path:"duka/phones", color:G         },
  ];

  const STATS = [
    { num:"5K+",   label:"Daily Users",          color:G },
    { num:"1.2K+", label:"Students Joined",       color:"#60a5fa" },
    { num:"100+",  label:"Courses & Resources",   color:"#34d399" },
    { num:"🇹🇿",   label:"Built for TZ",          color:"rgba(255,255,255,.7)" },
  ];

  return (
    <section ref={heroRef} style={{
      position:"relative",
      minHeight: isMobile ? "100svh" : "100vh",
      overflow:"hidden",
      background:"linear-gradient(180deg,#060a14 0%,#0b1020 60%,#07090f 100%)",
    }}>
      {/* ── Animated earth globe ── */}
      <div style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none", zIndex:1 }}>
        <AnimatedEarth />
        {/* Radial dim over globe for text readability */}
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 80% 70% at 50% 40%,rgba(6,10,20,.45) 0%,rgba(6,10,20,.75) 60%,rgba(6,10,20,.96) 100%)", zIndex:5 }} />
        {/* Bottom fade */}
        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"35%", background:"linear-gradient(to top,#07090f 0%,rgba(7,9,15,.8) 60%,transparent 100%)", zIndex:6 }} />
      </div>

      {/* ── Mesh colour accents ── */}
      <div style={{ position:"absolute", inset:0, pointerEvents:"none", zIndex:2,
        background:"radial-gradient(ellipse 70% 50% at 8% 5%,rgba(245,166,35,.09) 0%,transparent 55%), radial-gradient(ellipse 60% 45% at 92% 12%,rgba(59,130,246,.08) 0%,transparent 50%), radial-gradient(ellipse 40% 35% at 50% 95%,rgba(139,92,246,.06) 0%,transparent 50%)"
      }} />

      {/* ── Content ── */}
      <motion.div style={{ position:"relative", zIndex:10, width:"100%", y:heroY, opacity:heroOp }}>
        <W>
          <div style={{ textAlign:"center", paddingTop:isMobile?"clamp(96px,22vw,124px)":"clamp(120px,13vw,160px)" }}>

            {/* Badge */}
            <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ duration:.45, ease:SPRING }} style={{ marginBottom:22 }}>
              <span style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"6px 18px", borderRadius:999, background:`${G}12`, border:`1px solid ${G}28`, color:G, fontSize:11, fontWeight:900, letterSpacing:".09em", textTransform:"uppercase" }}>
                <Sparkles size={11} /> Tanzania's Digital Ecosystem
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity:0, y:28 }} animate={{ opacity:1, y:0 }}
              transition={{ delay:.07, duration:.65, ease:SPRING }}
              style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:isMobile?"clamp(36px,11vw,54px)":"clamp(52px,7vw,80px)", fontWeight:900, lineHeight:1.06, letterSpacing:"-.055em", margin:"0 0 14px", textShadow:"0 4px 48px rgba(0,0,0,.6)", color:"#fff" }}>
              One Platform.<br />
              <span style={{ background:`linear-gradient(135deg,${G},${G2})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
                Build. Learn. Earn.
              </span>
            </motion.h1>

            {/* Taglines */}
            <motion.p initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:.15, duration:.5, ease:SPRING }}
              style={{ color:"rgba(255,255,255,.58)", fontSize:isMobile?15:18, margin:"0 auto 8px", lineHeight:1.65, maxWidth:520 }}>
              Jifunze. Jenga. Pata Kipato.
            </motion.p>
            <motion.p initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:.2, duration:.5, ease:SPRING }}
              style={{ color:"rgba(255,255,255,.32)", fontSize:isMobile?12.5:14, margin:"0 auto 34px", lineHeight:1.65, maxWidth:440 }}>
              Everything you need to grow in one place.
            </motion.p>

            {/* CTAs */}
            <motion.div initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:.27, duration:.52, ease:SPRING }}
              style={{ display:"flex", gap:12, flexWrap:"wrap", justifyContent:"center", marginBottom:36 }}>
              <GoldBtn onClick={() => sectorsRef.current?.scrollIntoView({ behavior:"smooth" })} icon={<Sparkles size={14} />}>
                Get Started
              </GoldBtn>
              <GoldBtn outline onClick={() => goPage("huduma")}>
                Explore Sectors <ArrowRight size={14} />
              </GoldBtn>
              {deferredPrompt && !isInstalled && isMobile && (
                <GoldBtn onClick={installApp} style={{ background:"#22c55e", boxShadow:"0 6px 20px rgba(34,197,94,.3)", border:"none" }}>
                  <Download size={14} /> Install App
                </GoldBtn>
              )}
            </motion.div>

            {/* Animated stat chips */}
            <div ref={statsRef} style={{ display:"flex", gap:isMobile?8:14, flexWrap:"wrap", justifyContent:"center", marginBottom:isMobile?32:44 }}>
              {STATS.map((s, i) => (
                <StatChip key={s.label} value={s.num} label={s.label} delay={i * .06} color={s.color} />
              ))}
            </div>
          </div>

          {/* ── 2×2 Sector Cards ── */}
          <motion.div
            ref={sectorsRef}
            initial={{ opacity:0, y:32 }} animate={{ opacity:1, y:0 }}
            transition={{ delay:.38, duration:.65, ease:SPRING }}
            style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:isMobile?10:16, paddingBottom:isMobile?36:56 }}>
            {CARDS.map((card, i) => (
              <motion.div key={card.path}
                initial={{ opacity:0, y:22 }} animate={{ opacity:1, y:0 }}
                transition={{ delay:.42 + i*.07, duration:.52, ease:SPRING }}
                whileTap={{ scale:.95 }}
                onClick={() => goPage(card.path)}
                style={{
                  padding:isMobile?"20px 14px":"28px 24px",
                  borderRadius:isMobile?20:24,
                  background:"linear-gradient(145deg,rgba(255,255,255,.07),rgba(255,255,255,.02))",
                  backdropFilter:"blur(20px) saturate(150%)",
                  WebkitBackdropFilter:"blur(20px) saturate(150%)",
                  border:"1px solid rgba(255,255,255,.1)",
                  boxShadow:"0 4px 24px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.08)",
                  cursor:"pointer", textAlign:"center",
                  transition:"all .28s cubic-bezier(0.34,1.56,0.64,1)",
                  WebkitTapHighlightColor:"transparent",
                  position:"relative", overflow:"hidden",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform="translateY(-5px)";
                  e.currentTarget.style.borderColor=`${card.color}50`;
                  e.currentTarget.style.boxShadow=`0 18px 44px rgba(0,0,0,.5), 0 0 0 1px ${card.color}22, inset 0 1px 0 rgba(255,255,255,.12)`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform="";
                  e.currentTarget.style.borderColor="rgba(255,255,255,.1)";
                  e.currentTarget.style.boxShadow="0 4px 24px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.08)";
                }}
              >
                {/* Glow orb */}
                <div style={{ position:"absolute", top:-28, right:-28, width:90, height:90, borderRadius:"50%", background:`radial-gradient(circle,${card.color}25,transparent 70%)`, filter:"blur(20px)", pointerEvents:"none" }} />
                {/* Top inner highlight */}
                <div style={{ position:"absolute", top:0, left:0, right:0, height:1, background:"linear-gradient(90deg,transparent,rgba(255,255,255,.12),transparent)", pointerEvents:"none" }} />
                {/* Icon */}
                <div style={{ fontSize:isMobile?30:36, lineHeight:1, marginBottom:isMobile?10:13, position:"relative", zIndex:1 }}>
                  {card.emoji}
                </div>
                {/* Title */}
                <div style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:isMobile?14:17, fontWeight:900, letterSpacing:"-.025em", color:"#fff", marginBottom:4, lineHeight:1.2, position:"relative", zIndex:1 }}>
                  {card.title}
                </div>
                {/* Subtitle */}
                <div style={{ fontSize:isMobile?11:12, fontWeight:700, color:`${card.color}aa`, position:"relative", zIndex:1 }}>
                  {card.sub}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </W>
      </motion.div>
    </section>
  );
}


// ─────────────────────────────────────────────────────
// 4. TRUST CHIPS
// ─────────────────────────────────────────────────────
const TRUST_CHIPS = [
  { icon: "🇹🇿", label: "Built for Tanzania" },
  { icon: "🎓", label: "Student Tools" },
  { icon: "⚡", label: "Tech Growth" },
  { icon: "💼", label: "Business Support" },
  { icon: "🌍", label: "Kiswahili + English" },
  { icon: "🔒", label: "Safe & Secure" },
  { icon: "📱", label: "Mobile First" },
];

function TrustChips() {
  return (
    <div style={{ background: "rgba(255,255,255,.02)", borderTop: "1px solid rgba(255,255,255,.05)", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
      <div style={{ overflowX: "auto", scrollbarWidth: "none", padding: "16px clamp(16px,4vw,40px)" }}>
        <div style={{ display: "flex", gap: 10, width: "max-content" }}>
          {TRUST_CHIPS.map((chip) => (
            <div key={chip.label} style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "7px 14px", borderRadius: 999,
              background: "rgba(255,255,255,.05)",
              border: "1px solid rgba(255,255,255,.08)",
              fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,.75)",
              whiteSpace: "nowrap", flexShrink: 0,
            }}>
              <span>{chip.icon}</span> {chip.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// 5. MAIN SECTORS
// ─────────────────────────────────────────────────────
const SECTORS = [
  {
    id: "exams",
    path: "exams",
    icon: <GraduationCap size={26} />,
    emoji: "🎓",
    color: "#10b981",
    title: "Student Center",
    desc: "NECTA results, past papers, study notes, scholarships, and university guidance.",
    tag: "Education",
  },
  {
    id: "tech",
    path: "tech",
    icon: <Cpu size={26} />,
    emoji: "⚡",
    color: "#3b82f6",
    title: "Tech Hub",
    desc: "AI Lab, Prompt Lab, tech tips, and digital tools — daily content in Swahili.",
    tag: "Technology",
  },
  {
    id: "huduma",
    path: "huduma",
    icon: <Wrench size={26} />,
    emoji: "🛠️",
    color: "#ec4899",
    title: "Our Services",
    desc: "Website design, product promotion, brand partnerships, and digital support.",
    tag: "Services",
  },
  {
    id: "duka",
    path: "duka/phones",
    icon: <ShoppingBag size={26} />,
    emoji: "🛒",
    color: G,
    title: "STEA Shop",
    desc: "Buy tech products, accounts, and digital assets safely and securely.",
    tag: "Marketplace",
  },
];

function SectorCard({ sector, goPage, index }) {
  const isMobile = useMobile();
  const [hov, setHov] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.07, duration: 0.55, ease: SPRING }}
      whileTap={{ scale: 0.97 }}
      onClick={() => goPage(sector.path)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onTouchStart={() => setHov(true)}
      onTouchEnd={() => setTimeout(() => setHov(false), 250)}
      style={{
        flexShrink: 0,
        width: isMobile ? "clamp(240px,74vw,284px)" : "100%",
        scrollSnapAlign: "start",
        background: hov
          ? `linear-gradient(145deg,rgba(255,255,255,.09) 0%,rgba(255,255,255,.04) 100%)`
          : `linear-gradient(145deg,rgba(255,255,255,.06) 0%,rgba(255,255,255,.02) 100%)`,
        backdropFilter: "blur(20px) saturate(140%)",
        WebkitBackdropFilter: "blur(20px) saturate(140%)",
        border: `1px solid ${hov ? sector.color + "55" : "rgba(255,255,255,.09)"}`,
        borderRadius: 26,
        padding: isMobile ? "24px 22px" : "32px 28px",
        cursor: "pointer",
        position: "relative", overflow: "hidden",
        transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
        boxShadow: hov
          ? `0 24px 64px rgba(0,0,0,.55), 0 0 0 1px ${sector.color}25, inset 0 1px 0 rgba(255,255,255,.12), inset 0 -1px 0 rgba(0,0,0,.15)`
          : "0 4px 24px rgba(0,0,0,.3), inset 0 1px 0 rgba(255,255,255,.07), inset 0 -1px 0 rgba(0,0,0,.1)",
        transform: hov ? "translateY(-6px)" : "translateY(0)",
        willChange: "transform",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {/* Top inner highlight */}
      <div style={{ position:"absolute", top:0, left:0, right:0, height:1, background:"linear-gradient(90deg,transparent,rgba(255,255,255,.14),transparent)", pointerEvents:"none" }} />

      {/* Radial glow — top right */}
      <div style={{ position:"absolute", top:-40, right:-40, width:180, height:180, borderRadius:"50%", background:`radial-gradient(circle,${sector.color}22,transparent 68%)`, filter:"blur(32px)", pointerEvents:"none", opacity:hov?1:0.4, transition:"opacity 0.35s" }} />
      {/* Radial glow — bottom left */}
      <div style={{ position:"absolute", bottom:-20, left:-20, width:110, height:110, borderRadius:"50%", background:`radial-gradient(circle,${sector.color}14,transparent 70%)`, filter:"blur(22px)", pointerEvents:"none", opacity:hov?0.65:0.15, transition:"opacity 0.35s" }} />

      {/* Category badge */}
      <div style={{ position:"absolute", top:18, right:18, padding:"4px 12px", borderRadius:999, background:`${sector.color}18`, color:sector.color, border:`1px solid ${sector.color}30`, fontSize:10, fontWeight:900, textTransform:"uppercase", letterSpacing:"0.1em" }}>
        {sector.tag}
      </div>

      {/* Icon */}
      <div style={{ width:isMobile?52:60, height:isMobile?52:60, borderRadius:isMobile?17:20, background:`linear-gradient(135deg,${sector.color}22,${sector.color}08)`, border:`1px solid ${sector.color}28`, boxShadow:hov?`0 8px 24px ${sector.color}28`:"none", display:"flex", alignItems:"center", justifyContent:"center", color:sector.color, marginBottom:isMobile?18:22, transition:"all 0.28s cubic-bezier(0.34,1.56,0.64,1)", transform:hov?"scale(1.12)":"scale(1)", position:"relative", zIndex:1 }}>
        {sector.icon}
      </div>

      {/* Title */}
      <h3 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:isMobile?19:22, fontWeight:900, letterSpacing:"-.03em", margin:"0 0 8px", lineHeight:1.15, position:"relative", zIndex:1, color:"#fff" }}>
        {sector.title}
      </h3>

      {/* Desc */}
      <p style={{ color:"rgba(255,255,255,.44)", fontSize:isMobile?13:13.5, lineHeight:1.7, margin:"0 0 22px", position:"relative", zIndex:1 }}>
        {sector.desc}
      </p>

      {/* CTA */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", position:"relative", zIndex:1 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6, color:sector.color, fontWeight:800, fontSize:13 }}>
          Explore <ChevronRight size={14} style={{ transform:hov?"translateX(5px)":"", transition:"transform 0.22s ease" }} />
        </div>
        <div style={{ width:28, height:28, borderRadius:8, background:`${sector.color}14`, border:`1px solid ${sector.color}20`, display:"flex", alignItems:"center", justifyContent:"center", color:sector.color, opacity:hov?1:0.5, transition:"opacity 0.2s", fontSize:14, fontWeight:800 }}>→</div>
      </div>
    </motion.div>
  );
}


// ─────────────────────────────────────────────────────
// 6. CONTENT ROW — generic horizontal scroll preview
// ─────────────────────────────────────────────────────
function ContentCard({ item: raw, onClick }) {
  const item = normalizeItem(raw);
  const [imgErr, setImgErr] = useState(false);
  const hasImg = item.image && !imgErr;
  const isVideo = raw.type === "video";

  return (
    <div onClick={onClick} style={{
      flexShrink: 0, width: "clamp(200px,58vw,240px)",
      scrollSnapAlign: "start", cursor: "pointer",
      background: "rgba(255,255,255,.04)",
      borderRadius: 18, overflow: "hidden",
      border: "1px solid rgba(255,255,255,.07)",
      transition: "border-color 0.2s, box-shadow 0.2s",
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.14)"; e.currentTarget.style.boxShadow = "0 12px 36px rgba(0,0,0,.4)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.07)"; e.currentTarget.style.boxShadow = "none"; }}>
      {/* Thumbnail */}
      <div style={{ height: 130, background: "rgba(255,255,255,.06)", position: "relative", overflow: "hidden" }}>
        {hasImg
          ? <img src={item.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} referrerPolicy="no-referrer" onError={() => setImgErr(true)} />
          : <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", fontSize: 28, opacity: .2 }}>{isVideo ? "▶" : "📰"}</div>
        }
        {isVideo && (
          <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(0,0,0,.6)", backdropFilter: "blur(6px)", display: "grid", placeItems: "center", fontSize: 14 }}>▶</div>
          </div>
        )}
        <div style={{ position: "absolute", top: 8, left: 8 }}>
          <span style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".06em", color: "#fff", background: "rgba(0,0,0,.55)", backdropFilter: "blur(4px)", padding: "3px 8px", borderRadius: 6 }}>
            {raw.badge || raw.category || (isVideo ? "Video" : "Article")}
          </span>
        </div>
      </div>
      {/* Text */}
      <div style={{ padding: "12px 14px" }}>
        <h4 style={{ fontSize: 13.5, fontWeight: 800, margin: 0, lineHeight: 1.4,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
          color: "rgba(255,255,255,.9)" }}>
          {item.title}
        </h4>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// 7. WEBSITE SOLUTIONS CARD
// ─────────────────────────────────────────────────────
function WebsiteCard({ item: raw, goPage }) {
  const item = normalizeItem(raw);
  const [imgErr, setImgErr] = useState(false);
  const hasImg = item.image && !imgErr;

  return (
    <div onClick={() => goPage("websites")} style={{
      flexShrink: 0, width: "clamp(220px,65vw,260px)",
      scrollSnapAlign: "start", cursor: "pointer",
      borderRadius: 20, overflow: "hidden",
      background: "rgba(255,255,255,.04)",
      border: "1px solid rgba(255,255,255,.07)",
      transition: "all 0.22s ease",
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.16)"; e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 16px 44px rgba(0,0,0,.45)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.07)"; e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "none"; }}>
      {/* Image */}
      <div style={{ height: 150, background: "rgba(255,255,255,.07)", position: "relative", overflow: "hidden" }}>
        {hasImg
          ? <img src={item.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} referrerPolicy="no-referrer" onError={() => setImgErr(true)} />
          : <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", fontSize: 32, opacity: .15 }}>🌐</div>
        }
        {/* Overlay */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(0,0,0,.65),transparent 60%)" }} />
        <div style={{ position: "absolute", bottom: 10, left: 12, right: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#fff", marginBottom: 2, lineHeight: 1.3 }}>{item.title}</div>
          {raw.category && <div style={{ fontSize: 10, color: "rgba(255,255,255,.55)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em" }}>{raw.category}</div>}
        </div>
      </div>
      {/* Visit link */}
      <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: G, display: "flex", alignItems: "center", gap: 5 }}>
          <ExternalLink size={12} /> Visit Website
        </span>
        <ChevronRight size={14} color="rgba(255,255,255,.25)" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// SHOP PREVIEW CARD
// ─────────────────────────────────────────────────────
function ShopPreviewCard({ item, raw, goPage }) {
  const [imgErr, setImgErr] = useState(false);
  const hasImg = item.image && !imgErr;
  return (
    <div onClick={() => goPage("duka/phones")} style={{
      flexShrink:0, width:"clamp(168px,50vw,208px)", scrollSnapAlign:"start",
      cursor:"pointer", borderRadius:18, overflow:"hidden",
      background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.07)",
      transition:"all .2s ease", display:"flex", flexDirection:"column",
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor=`${G}35`; e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow=`0 12px 32px rgba(0,0,0,.4)`; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor="rgba(255,255,255,.07)"; e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow="none"; }}
    >
      {/* Image */}
      <div style={{ height:148, background:"rgba(255,255,255,.06)", position:"relative", flexShrink:0, overflow:"hidden" }}>
        {hasImg
          ? <img src={item.image} alt={item.title} style={{ width:"100%", height:"100%", objectFit:"cover", transition:"transform .4s ease" }}
              onMouseEnter={e=>e.target.style.transform="scale(1.05)"} onMouseLeave={e=>e.target.style.transform=""}
              referrerPolicy="no-referrer" onError={() => setImgErr(true)} />
          : <div style={{ width:"100%", height:"100%", display:"grid", placeItems:"center", fontSize:30, opacity:.1 }}>🛒</div>
        }
        {raw.category && (
          <div style={{ position:"absolute", top:8, left:10, padding:"3px 9px", borderRadius:6, background:"rgba(0,0,0,.65)", backdropFilter:"blur(6px)", color:"#fff", fontSize:9, fontWeight:900, textTransform:"uppercase", letterSpacing:".07em" }}>
            {raw.category}
          </div>
        )}
      </div>
      {/* Content */}
      <div style={{ padding:"12px 14px", flex:1, display:"flex", flexDirection:"column" }}>
        <div style={{ fontSize:13.5, fontWeight:800, marginBottom:6, lineHeight:1.35, color:"rgba(255,255,255,.9)",
          display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
          {item.title}
        </div>
        <div style={{ marginTop:"auto", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ fontSize:13, color:G, fontWeight:900 }}>
            {raw.price ? `${raw.price} TZS` : "Contact"}
          </div>
          <div style={{ fontSize:10, fontWeight:800, color:G, padding:"4px 9px", borderRadius:7, background:`${G}14`, border:`1px solid ${G}22` }}>
            View →
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// 9. WHY STEA CARDS
// ─────────────────────────────────────────────────────
const WHY_CARDS = [
  { icon: <BookOpen size={22} />, color: "#10b981", title: "Learn", desc: "NECTA prep, past papers, notes, and online courses." },
  { icon: <Zap size={22} />,      color: "#3b82f6", title: "Build Skills", desc: "AI tools, tech tips, and digital skills in Swahili." },
  { icon: <TrendingUp size={22} />,color: G,        title: "Grow", desc: "Promote your business and reach more customers." },
  { icon: <ShoppingBag size={22} />,color: "#a855f7",title: "Shop", desc: "Safe, trusted marketplace for tech products in TZ." },
];

// ─────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────

// ── Gigs Preview Section ───────────────────────────────
function GigsPreviewSection({ goPage }) {
  const isMobile = useMobile();
  const { docs: gigsDocs, loading } = useCollection("gigs", "createdAt", 6);
  const gigs = gigsDocs.filter(g => g.active !== false && g.status !== "draft").slice(0, 6);

  if (loading) {
    return (
      <div style={{ display:"flex", gap:14, overflowX:"auto", padding:"0 clamp(16px,4vw,40px) 8px", scrollbarWidth:"none" }}>
        {[1,2,3].map(i => <div key={i} style={{ flexShrink:0, width:220, height:120, borderRadius:16, background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.06)" }} />)}
      </div>
    );
  }

  if (gigs.length === 0) {
    return (
      <W>
        <div style={{ padding:"32px 28px", borderRadius:20, background:"rgba(59,130,246,.06)", border:"1px solid rgba(59,130,246,.15)", display:"flex", alignItems:"center", gap:20, flexWrap:"wrap" }}>
          <div style={{ fontSize:40 }}>💼</div>
          <div>
            <h3 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:18, fontWeight:900, margin:"0 0 6px" }}>Gigs & Kazi — Coming Soon</h3>
            <p style={{ color:"rgba(255,255,255,.45)", fontSize:13, margin:"0 0 14px", lineHeight:1.65 }}>Remote jobs, freelance opportunities, and local gigs in Tanzania.</p>
            <button onClick={() => goPage("gigs")} style={{ padding:"9px 20px", borderRadius:10, background:"rgba(59,130,246,.15)", border:"1px solid rgba(59,130,246,.3)", color:"#60a5fa", fontWeight:800, fontSize:13, cursor:"pointer" }}>
              Explore Gigs →
            </button>
          </div>
        </div>
      </W>
    );
  }

  return (
    <div style={{ display:"flex", gap:14, overflowX:"auto", padding:"0 clamp(16px,4vw,40px) 8px", scrollSnapType:"x mandatory", WebkitOverflowScrolling:"touch", scrollbarWidth:"none" }}>
      {gigs.map((gig, i) => (
        <div key={gig.id || i} onClick={() => goPage("gigs")}
          style={{ flexShrink:0, width:"clamp(220px,62vw,280px)", scrollSnapAlign:"start", borderRadius:16,
            background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.07)", padding:"16px 18px", cursor:"pointer",
            transition:"all .2s ease" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor="rgba(255,255,255,.14)"; e.currentTarget.style.transform="translateY(-3px)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor="rgba(255,255,255,.07)"; e.currentTarget.style.transform=""; }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10, flexWrap:"wrap" }}>
            <span style={{ padding:"3px 9px", borderRadius:6, background:"rgba(59,130,246,.15)", border:"1px solid rgba(59,130,246,.25)", color:"#60a5fa", fontSize:10, fontWeight:900, textTransform:"uppercase" }}>
              {gig.type || gig.jobType || "Remote"}
            </span>
            {gig.salary && <span style={{ fontSize:11, color:"#4ade80", fontWeight:800 }}>{gig.salary}</span>}
          </div>
          <h4 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:15, fontWeight:800, margin:"0 0 6px", lineHeight:1.35,
            display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
            {gig.title || gig.name || "Opportunity"}
          </h4>
          <p style={{ fontSize:12.5, color:"rgba(255,255,255,.4)", margin:"0 0 12px", lineHeight:1.55,
            display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
            {gig.description || gig.desc || ""}
          </p>
          <div style={{ fontSize:11, color:"rgba(255,255,255,.3)", fontWeight:700 }}>
            {gig.company || gig.location || "Tanzania"}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HomePage({ goPage }) {
  const isMobile = useMobile();
  const { isOnline } = useNetwork();
  const { t } = useSettings();
  const { deferredPrompt, installApp, isInstalled } = usePWA();
  const [activeService, setActiveService] = useState(null);
  const sectorsRef = useRef(null);

  // ── Firestore data ──────────────────────────────────
  const { docs: tipsDocs,     loading: tipsLoading,     isOfflineData: tipsOffline     } = useCollection("tips",     "createdAt", 12);
  const { docs: coursesDocs,  loading: coursesLoading                                  } = useCollection("courses",  "createdAt", 8);
  const { docs: updatesDocs,  loading: updatesLoading,  isOfflineData: updatesOffline  } = useCollection("updates",  "createdAt", 10);
  const { docs: websitesDocs, loading: websitesLoading                                 } = useCollection("websites", "createdAt", 10);
  const { docs: postsDocs                                                               } = useCollection("posts",   "createdAt", 10);
  const { docs: productsDocs, loading: productsLoading, isOfflineData: productsOffline } = useCollectionWhere("products", "sector", "==", "marketplace", "createdAt", 8);

  const filterFn = (item, isProduct = false) => {
    if (isProduct) {
      if (item.published === false && item.isActive === false) return false;
      if (item.status && !["active","published","approved"].includes(item.status)) return false;
      return true;
    }
    if (["draft","rejected","pending_review"].includes(item.status)) return false;
    return true;
  };

  const tips     = tipsDocs.filter(d => filterFn(d)).slice(0, 8);
  const courses  = coursesDocs.filter(d => filterFn(d)).slice(0, 6);
  const products = productsDocs.filter(d => filterFn(d, true)).slice(0, 6);
  const websites = websitesDocs.filter(d => filterFn(d)).slice(0, 8);
  const updates  = [...updatesDocs, ...postsDocs]
    .filter(d => filterFn(d))
    .filter((d, i, arr) => arr.findIndex(x => x.id === d.id) === i)
    .sort((a, b) => {
      const ts = d => d.createdAt?.seconds || (d.createdAt?.toDate ? d.createdAt.toDate().getTime() / 1000 : 0);
      return ts(b) - ts(a);
    })
    .slice(0, 8);

  const isOffline = !isOnline;

  return (
    <div style={{ minHeight: "100vh", background: BG, color: "#fff", fontFamily: "'Instrument Sans',system-ui,sans-serif", overflowX: "hidden", paddingBottom: isMobile ? 72 : 0 }}>

      {/* ── 1. ANNOUNCEMENT STRIP ─────────────────── */}
      <AnnouncementStrip />

      {/* ── 3. HERO ───────────────────────────────── */}
      <HeroSection
        goPage={goPage} sectorsRef={sectorsRef}
        deferredPrompt={deferredPrompt} installApp={installApp} isInstalled={isInstalled} t={t}
      />


      {/* ── OFFLINE NOTICE ────────────────────────── */}
      {(isOffline || tipsOffline || productsOffline || updatesOffline) && (
        <W style={{ paddingTop: 16 }}>
          <OfflineNotice isOffline={isOffline} isOfflineData={tipsOffline || productsOffline || updatesOffline} />
        </W>
      )}



      {/* ── BANNER AD ─────────────────────────────── */}
      <W style={{ paddingBottom: 32 }}>
        <BannerAd />
      </W>

      {/* ── 6a. TRENDING IN TECH HUB ──────────────── */}
      <section style={{ padding: "clamp(32px,5vw,56px) 0", borderTop: "1px solid rgba(255,255,255,.05)" }}>
        <W>
          <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true, margin:"-80px" }} transition={{ duration:.52, ease:[0.16,1,0.3,1] }}>
          <SectionHead
            label="Tech Hub" labelColor="#3b82f6" labelIcon={<Cpu size={11} />}
            title="Trending in Tech Hub"
            action={() => goPage("tips")} actionText="View All"
          />
          </motion.div>
        </W>
        <HScrollRow gap={14}>
          {tipsLoading
            ? [1,2,3,4].map(i => <div key={i} style={{ flexShrink:0, width:220, scrollSnapAlign:"start" }}><PostSkeleton /></div>)
            : tips.length > 0
              ? tips.map(item => <ContentCard key={item.id} item={item} onClick={() => goPage("tips")} />)
              : <div style={{ padding: "40px clamp(16px,4vw,40px)", color: "rgba(255,255,255,.3)", fontSize: 14 }}>No tech content yet</div>
          }
        </HScrollRow>
      </section>

      {/* ── 6b. EXPLORE LEARNING & RESOURCES ────── */}
      {(coursesLoading || courses.length > 0) && (
        <section style={{ padding: "clamp(32px,5vw,56px) 0", borderTop: "1px solid rgba(255,255,255,.05)", background: "rgba(16,185,129,.02)" }}>
          <W>
            <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true, margin:"-80px" }} transition={{ duration:.52, ease:[0.16,1,0.3,1] }}>
            <SectionHead
              label="Learning & Resources" labelColor="#10b981" labelIcon={<GraduationCap size={11} />}
              title="Explore Learning & Resources"
              desc="Online courses and digital resources."
              action={() => goPage("courses")} actionText="Explore All"
            />
            </motion.div>
          </W>
          <HScrollRow gap={14}>
            {coursesLoading
              ? [1,2,3].map(i => <div key={i} style={{ flexShrink:0, width:220, scrollSnapAlign:"start" }}><PostSkeleton /></div>)
              : courses.slice(0, 6).map(item => {
                const isFreeItem = item.free || item.courseType === "free" || !item.newPrice || (item.price||"").toLowerCase().includes("bure") || (item.newPrice||"").toLowerCase().includes("bure");
                const hasImg = item.imageUrl || item.image || item.thumbnailUrl;
                return (
                  <div key={item.id} onClick={() => goPage("course-detail", item)} style={{
                    flexShrink: 0, width: "clamp(210px,60vw,250px)", scrollSnapAlign: "start",
                    cursor: "pointer", borderRadius: 18, overflow: "hidden",
                    background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)",
                    transition: "all .2s ease",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor="rgba(255,255,255,.14)"; e.currentTarget.style.transform="translateY(-3px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor="rgba(255,255,255,.07)"; e.currentTarget.style.transform=""; }}
                  >
                    <div style={{ height: 136, background: "rgba(255,255,255,.06)", position: "relative", overflow:"hidden" }}>
                      {hasImg
                        ? <img src={item.imageUrl || item.image || item.thumbnailUrl} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} referrerPolicy="no-referrer" />
                        : <div style={{ width:"100%", height:"100%", display:"grid", placeItems:"center", fontSize:28, opacity:.1 }}>📚</div>
                      }
                      <div style={{ position:"absolute", top:8, left:10, padding:"3px 9px", borderRadius:6, background:"rgba(0,0,0,.6)", backdropFilter:"blur(6px)", color:"#fff", fontSize:9, fontWeight:900, textTransform:"uppercase" }}>
                        {item.level || "Beginner"}
                      </div>
                      {isFreeItem && (
                        <div style={{ position:"absolute", top:8, right:10, padding:"3px 9px", borderRadius:6, background:"rgba(245,166,35,.9)", color:"#111", fontSize:9, fontWeight:900, textTransform:"uppercase" }}>
                          Free
                        </div>
                      )}
                    </div>
                    <div style={{ padding:"12px 14px" }}>
                      <h4 style={{ fontSize:13.5, fontWeight:800, margin:"0 0 5px", lineHeight:1.38, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
                        {item.title || item.name}
                      </h4>
                      <div style={{ display:"flex", alignItems:"center", gap:8, color:"rgba(255,255,255,.35)", fontSize:11, marginBottom:10 }}>
                        {item.language && <span>🌐 {item.language}</span>}
                        {item.duration && <><span style={{opacity:.3}}>·</span><span>⏱ {item.duration}</span></>}
                      </div>
                      <span style={{ fontSize:11, fontWeight:800, color:"#10b981", padding:"3px 9px", borderRadius:7, background:"rgba(16,185,129,.12)", border:"1px solid rgba(16,185,129,.2)" }}>
                        {isFreeItem ? "Watch Free" : "View Course"}
                      </span>
                    </div>
                  </div>
                );
              })
            }
          </HScrollRow>
        </section>
      )}

      {/* ── 7. WEBSITE SOLUTIONS ──────────────────── */}
      {(websitesLoading || websites.length > 0) && (
        <section style={{ padding: "clamp(32px,5vw,56px) 0", borderTop: "1px solid rgba(255,255,255,.05)" }}>
          <W>
            <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true, margin:"-80px" }} transition={{ duration:.52, ease:[0.16,1,0.3,1] }}>
            <SectionHead
              label="Website Solutions" labelColor="#a855f7" labelIcon={<Globe size={11} />}
              title="Featured Website Solutions"
              action={() => goPage("websites")} actionText="Browse All"
            />
            </motion.div>
          </W>
          <HScrollRow gap={14}>
            {websitesLoading
              ? [1,2,3].map(i => <div key={i} style={{ flexShrink:0, width:240, scrollSnapAlign:"start" }}><PostSkeleton /></div>)
              : websites.length > 0
                ? websites.map(item => <WebsiteCard key={item.id} item={item} goPage={goPage} />)
                : null
            }
          </HScrollRow>
        </section>
      )}

      {/* ── 6c. NEW IN SHOP ───────────────────────── */}
      {(productsLoading || products.length > 0) && (
        <section style={{ padding: "clamp(32px,5vw,56px) 0", borderTop: "1px solid rgba(255,255,255,.05)", background: `rgba(245,166,35,.02)` }}>
          <W>
            <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true, margin:"-80px" }} transition={{ duration:.52, ease:[0.16,1,0.3,1] }}>
            <SectionHead
              label="STEA Shop" labelColor={G} labelIcon={<ShoppingBag size={11} />}
              title="New in Shop"
              action={() => goPage("duka/phones")} actionText="Visit Shop"
            />
            </motion.div>
          </W>
          <HScrollRow gap={14}>
            {productsLoading
              ? [1,2,3,4].map(i => <div key={i} style={{ flexShrink:0, width:200, scrollSnapAlign:"start", borderRadius:18, background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.06)", height:240 }}><PostSkeleton /></div>)
              : products.map(raw => {
                const item = normalizeItem(raw);
                return (
                  <ShopPreviewCard key={raw.id} item={item} raw={raw} goPage={goPage} />
                );
              })
            }
          </HScrollRow>
        </section>
      )}
      {/* ── 6d. LATEST UPDATES ────────────────────── */}
      {updates.length > 0 && (
        <section style={{ padding: "clamp(32px,5vw,56px) 0", borderTop: "1px solid rgba(255,255,255,.05)" }}>
          <W>
            <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true, margin:"-80px" }} transition={{ duration:.52, ease:[0.16,1,0.3,1] }}>
            <SectionHead
              label="Updates" labelColor="#fb923c" labelIcon={<Bell size={11} />}
              title="Tech News & Updates"
              action={() => goPage("updates")} actionText="View All"
            />
            </motion.div>
          </W>
          <HScrollRow gap={14}>
            {updates.map(item => <ContentCard key={item.id} item={item} onClick={() => goPage("updates")} />)}
          </HScrollRow>
        </section>
      )}

      {/* ── 7b. VPN / SECURE CONNECTION ──────────── */}
      <section style={{ padding: "clamp(32px,5vw,56px) 0", borderTop: "1px solid rgba(255,255,255,.05)", background: "rgba(139,92,246,.02)" }}>
        <W>
          <div onClick={() => goPage("vpn")} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: 24, padding: isMobile ? "22px 20px" : "28px 32px",
            background: "linear-gradient(135deg,rgba(139,92,246,.1),rgba(59,130,246,.06))",
            border: "1px solid rgba(139,92,246,.2)", borderRadius: 24,
            cursor: "pointer",
            transition: "all .22s ease",
          }}
            onMouseEnter={e => { e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow="0 16px 40px rgba(0,0,0,.4)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow="none"; }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 16 : 24 }}>
              <div style={{ width: isMobile?48:60, height: isMobile?48:60, borderRadius: isMobile?14:18, background: "rgba(139,92,246,.15)", border: "1px solid rgba(139,92,246,.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: isMobile?22:28, flexShrink:0 }}>
                🔒
              </div>
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", borderRadius: 999, background: "rgba(139,92,246,.15)", border: "1px solid rgba(139,92,246,.25)", color: "#a78bfa", fontSize: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 8 }}>
                  🛡️ Security
                </div>
                <h3 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: isMobile?17:22, fontWeight: 900, margin: "0 0 6px", letterSpacing: "-.025em" }}>
                  VPN & Secure Internet Guide
                </h3>
                <p style={{ color: "rgba(255,255,255,.45)", fontSize: isMobile?12.5:14, margin: 0, lineHeight: 1.6 }}>
                  Browse safely, access blocked content, and protect your data online.
                </p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#a78bfa", fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
              {!isMobile && "Explore"} <ChevronRight size={18} />
            </div>
          </div>
        </W>
      </section>

      {/* ── 7c. SPORTS — safe mode ────────────────── */}
      <section style={{ padding: "clamp(32px,5vw,56px) 0", borderTop: "1px solid rgba(255,255,255,.05)" }}>
        <W>
          <SectionHead
            label="Sports Hub" labelColor="#ef4444" labelIcon={<Star size={11} />}
            title="Live Sports & Scores"
            desc="Football, basketball, and more — live updates coming soon."
          />
          <div style={{
            padding: isMobile ? "32px 24px" : "48px 40px",
            background: "linear-gradient(135deg,rgba(239,68,68,.06),rgba(251,146,60,.04))",
            border: "1px solid rgba(239,68,68,.15)", borderRadius: 24,
            textAlign: "center",
          }}>
            <div style={{ fontSize: isMobile?40:52, marginBottom: 16 }}>⚽</div>
            <h3 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: isMobile?20:26, fontWeight: 900, margin: "0 0 12px", letterSpacing: "-.03em" }}>
              Sports Hub Coming Soon
            </h3>
            <p style={{ color: "rgba(255,255,255,.45)", fontSize: isMobile?13:15, lineHeight: 1.72, maxWidth: 460, margin: "0 auto 24px" }}>
              Live football scores, match results, and sports updates — we're working on bringing you the best sports experience.
            </p>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 20px", borderRadius: 999, background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.2)", color: "#fca5a5", fontSize: 12, fontWeight: 700 }}>
              🔴 Live data returning soon
            </div>
          </div>
        </W>
      </section>

      {/* ── GIGS & KAZI PREVIEW ────────────────── */}
      <section style={{ padding: "clamp(32px,5vw,56px) 0", borderTop: "1px solid rgba(255,255,255,.05)", background: "rgba(59,130,246,.015)" }}>
        <W>
          <SectionHead
            label="Gigs & Kazi" labelColor="#3b82f6" labelIcon={<Star size={11} />}
            title="Gigs & Opportunities"
            desc="Find remote work, freelance projects, and local opportunities."
            action={() => goPage("gigs")} actionText="View All"
          />
        </W>
        <GigsPreviewSection goPage={goPage} />
      </section>

      {/* ── GIGS & KAZI PREVIEW ──────────────── */}
      <section style={{ padding: "clamp(32px,5vw,56px) 0", borderTop: "1px solid rgba(255,255,255,.05)", background: "rgba(59,130,246,.02)" }}>
        <W>
          <SectionHead
            label="Gigs & Kazi" labelColor="#3b82f6" labelIcon={<Zap size={11} />}
            title="Gigs & Opportunities"
            desc="Remote, local, and freelance opportunities in Tanzania."
            action={() => goPage("gigs")} actionText="View All"
          />
        </W>
        <HScrollRow gap={14}>
          {[
            { emoji:"💻", title:"Web Developer", sub:"Remote · Freelance", color:"#3b82f6", pay:"Negotiate" },
            { emoji:"🎬", title:"Video Editor", sub:"Part-time · Online", color:"#a855f7", pay:"50,000/=" },
            { emoji:"✍️", title:"Content Writer", sub:"Freelance · Swahili", color:"#10b981", pay:"Per Article" },
            { emoji:"📱", title:"Social Media Manager", sub:"Remote · Monthly", color:G, pay:"150,000/=" },
          ].map((gig, i) => (
            <motion.div key={i}
              initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
              transition={{ delay:i*.07, duration:.45, ease:[0.16,1,0.3,1] }}
              onClick={() => goPage("gigs")}
              style={{ flexShrink:0, width:"clamp(200px,58vw,240px)", scrollSnapAlign:"start",
                borderRadius:18, overflow:"hidden", cursor:"pointer",
                background:"rgba(255,255,255,.04)", border:`1px solid ${gig.color}20`,
                padding:"20px 18px", transition:"all .2s ease" }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=`${gig.color}45`;e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow=`0 12px 32px rgba(0,0,0,.4)`;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=`${gig.color}20`;e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="none";}}>
              <div style={{ fontSize:32, marginBottom:12 }}>{gig.emoji}</div>
              <h4 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:15, fontWeight:900, margin:"0 0 5px", letterSpacing:"-.02em" }}>{gig.title}</h4>
              <div style={{ fontSize:11, color:"rgba(255,255,255,.4)", fontWeight:700, marginBottom:12 }}>{gig.sub}</div>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <span style={{ fontSize:12, fontWeight:800, color:gig.color, padding:"3px 10px", borderRadius:7, background:`${gig.color}12`, border:`1px solid ${gig.color}20` }}>{gig.pay}</span>
                <span style={{ fontSize:11, color:"rgba(255,255,255,.3)", fontWeight:700 }}>Apply →</span>
              </div>
            </motion.div>
          ))}
        </HScrollRow>
      </section>

      {/* ── 8. SINGLE FEATURED CTA ────────────────── */}
      <section style={{ padding: "clamp(40px,6vw,72px) 0", borderTop: "1px solid rgba(255,255,255,.05)" }}>
        <W>
          <motion.div
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            style={{
              borderRadius: 28, overflow: "hidden", position: "relative",
              background: "linear-gradient(135deg,#0e1a2e,#0a1220)",
              border: "1px solid rgba(59,130,246,.2)",
              padding: isMobile ? "32px 24px" : "48px 56px",
              display: isMobile ? "block" : "flex",
              alignItems: "center", justifyContent: "space-between", gap: 40,
            }}>
            {/* Glows */}
            <div style={{ position: "absolute", top: -60, left: -60, width: 250, height: 250, borderRadius: "50%", background: "radial-gradient(circle,rgba(59,130,246,.15),transparent 70%)", filter: "blur(40px)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: `radial-gradient(circle,${G}12,transparent 70%)`, filter: "blur(40px)", pointerEvents: "none" }} />

            <div style={{ position: "relative", zIndex: 1, marginBottom: isMobile ? 24 : 0 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 14px", borderRadius: 999, background: "rgba(59,130,246,.12)", border: "1px solid rgba(59,130,246,.25)", color: "#60a5fa", fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 16 }}>
                <TrendingUp size={11} /> Grow With STEA
              </div>
              <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: isMobile ? 24 : 32, fontWeight: 900, letterSpacing: "-.035em", margin: "0 0 10px", lineHeight: 1.2 }}>
                Advertise to 10,000+<br />Students &amp; Professionals
              </h2>
              <p style={{ color: "rgba(255,255,255,.5)", fontSize: 14, lineHeight: 1.7, margin: 0, maxWidth: 420 }}>
                Reach your target audience in Tanzania through STEA's growing platform. Product promos, brand partnerships, and digital campaigns.
              </p>
            </div>
            <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 12, flexShrink: 0 }}>
              <GoldBtn onClick={() => goPage("advertise")} icon={<TrendingUp size={15} />}>
                Advertise With Us
              </GoldBtn>
              <GoldBtn outline onClick={() => window.open("https://wa.me/255757053354", "_blank")} icon={<MessageCircle size={15} />}>
                WhatsApp Us
              </GoldBtn>
            </div>
          </motion.div>
        </W>
      </section>

      {/* ── 9. WHY STEA ───────────────────────────── */}
      <section style={{ padding: "clamp(40px,6vw,72px) 0", borderTop: "1px solid rgba(255,255,255,.05)", background: "rgba(255,255,255,.01)" }}>
        <W>
          <SectionHead
            label="Why STEA" align="center"
            title="Built for the way you live"
            desc="One platform covering everything a modern Tanzanian needs online."
          />
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: isMobile ? 12 : 20 }}>
            {WHY_CARDS.map((card, i) => (
              <motion.div key={card.title}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.07, duration: 0.45, ease: SPRING }}
                style={{
                  padding: isMobile ? "20px 16px" : "28px 22px",
                  background: "rgba(255,255,255,.04)",
                  border: "1px solid rgba(255,255,255,.07)",
                  borderRadius: 20, textAlign: isMobile ? "center" : "left",
                }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: `${card.color}14`, border: `1px solid ${card.color}22`, display: "flex", alignItems: "center", justifyContent: "center", color: card.color, marginBottom: 14, margin: isMobile ? "0 auto 14px" : "0 0 14px" }}>
                  {card.icon}
                </div>
                <h3 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 17, fontWeight: 900, margin: "0 0 6px", letterSpacing: "-.02em" }}>{card.title}</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,.45)", lineHeight: 1.62, margin: 0 }}>{card.desc}</p>
              </motion.div>
            ))}
          </div>
        </W>
      </section>

      {/* ── 10. FUTURE APP / DOWNLOAD ─────────────── */}
      <section style={{ padding: "clamp(40px,6vw,72px) 0", borderTop: "1px solid rgba(255,255,255,.05)" }}>
        <W>
          <motion.div
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            style={{
              borderRadius: 28, position: "relative", overflow: "hidden",
              background: `linear-gradient(135deg,${G}14,rgba(255,209,124,.06),rgba(245,166,35,.03))`,
              border: `1px solid ${G}22`,
              padding: isMobile ? "36px 24px" : "52px 56px",
              textAlign: isMobile ? "center" : "left",
              display: isMobile ? "block" : "flex", alignItems: "center", justifyContent: "space-between", gap: 40,
            }}>
            {/* Glows */}
            <div style={{ position: "absolute", top: -80, right: -80, width: 320, height: 320, borderRadius: "50%", background: G, filter: "blur(120px)", opacity: 0.06, pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: -40, left: -40, width: 200, height: 200, borderRadius: "50%", background: G, filter: "blur(80px)", opacity: 0.04, pointerEvents: "none" }} />

            <div style={{ position: "relative", zIndex: 1, marginBottom: isMobile ? 28 : 0 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 14px", borderRadius: 999, background: `${G}14`, border: `1px solid ${G}28`, color: G, fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 18 }}>
                <Sparkles size={11} /> Coming Soon
              </div>
              <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: isMobile ? 26 : 34, fontWeight: 900, letterSpacing: "-.04em", margin: "0 0 12px", lineHeight: 1.18 }}>
                STEA App — Your Digital Life,<br />
                <span style={{ background: `linear-gradient(135deg,${G},${G2})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Always in Your Pocket</span>
              </h2>
              <p style={{ color: "rgba(255,255,255,.5)", fontSize: 14, lineHeight: 1.72, margin: "0 0 20px", maxWidth: 480 }}>
                We're building STEA into a full downloadable app for Android. Student tools, tech content, shopping, and services — one tap away.
              </p>
              {/* Feature pills */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: isMobile ? "center" : "flex-start" }}>
                {["Offline Access","Push Notifications","Faster Experience","Play Store Ready"].map(f => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 999, background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.1)", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,.7)" }}>
                    <Check size={11} color={G} /> {f}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 12, flexShrink: 0, alignItems: isMobile ? "center" : "flex-start" }}>
              {deferredPrompt && !isInstalled ? (
                <GoldBtn onClick={installApp} icon={<Download size={15} />}>
                  Install STEA Now
                </GoldBtn>
              ) : (
                <GoldBtn onClick={() => window.open("https://wa.me/255757053354?text=I%20want%20to%20know%20when%20STEA%20App%20launches", "_blank")} icon={<Bell size={15} />}>
                  Notify Me at Launch
                </GoldBtn>
              )}
              <GoldBtn outline onClick={() => goPage("exams")} icon={<ArrowRight size={15} />}>
                Use Web Version
              </GoldBtn>
            </div>
          </motion.div>
        </W>
      </section>

      {/* ── 11. FINAL CTA ─────────────────────────── */}
      <section style={{ padding: "clamp(48px,7vw,80px) 0", borderTop: "1px solid rgba(255,255,255,.05)" }}>
        <W>
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
            style={{ textAlign: "center", maxWidth: 640, margin: "0 auto" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 14px", borderRadius: 999, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", color: "rgba(255,255,255,.55)", fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 24 }}>
              <Users size={11} /> Join the Community
            </div>
            <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: isMobile ? 28 : 40, fontWeight: 900, letterSpacing: "-.04em", margin: "0 0 16px", lineHeight: 1.15 }}>
              Ready to simplify your{" "}
              <span style={{ background: `linear-gradient(135deg,${G},${G2})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>digital life?</span>
            </h2>
            <p style={{ color: "rgba(255,255,255,.48)", fontSize: 16, lineHeight: 1.75, marginBottom: 36 }}>
              Join thousands of Tanzanians already using STEA every day.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
              <GoldBtn onClick={() => sectorsRef.current?.scrollIntoView({ behavior: "smooth" })} icon={<Sparkles size={15} />}>
                Get Started — It's Free
              </GoldBtn>
              <GoldBtn outline href="https://wa.me/255757053354" icon={<MessageCircle size={15} />}>
                Chat on WhatsApp
              </GoldBtn>
            </div>
          </motion.div>
        </W>
      </section>

      {/* ── SERVICE FORM MODAL ────────────────────── */}
      <AnimatePresence>
        {activeService && (
          <ServiceRequestForm
            isOpen={!!activeService}
            onClose={() => setActiveService(null)}
            serviceType={activeService}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
