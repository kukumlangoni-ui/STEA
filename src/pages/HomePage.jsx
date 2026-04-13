import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight, Zap,
  ChevronRight, BookOpen,
  Sparkles, Globe, LayoutGrid, CheckCircle
} from "lucide-react";
import { useCollection } from "../hooks/useFirestore.js";
import { BannerAd, InlineAd } from "../components/SponsoredAdsSection.jsx";
import { useMobile } from "../hooks/useMobile.js";
import AnimatedHeroBackground from "../components/AnimatedHeroBackground.jsx";

const G = "#F5A623";
const G2 = "#FFD17C";

// ── Tiny helpers ─────────────────────────────────────
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
      <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: "clamp(26px,4vw,52px)", fontWeight: 900, letterSpacing: "-.04em", margin: "12px 0 14px", lineHeight: 1.1 }}>
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

// ── Animated counter ─────────────────────────────────
function Counter({ to, suffix = "", prefix = "" }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const done = useRef(false);

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
    }, { threshold: .3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to]);

  return <span ref={ref}>{prefix}{val.toLocaleString()}{suffix}</span>;
}

// ── Pillar Card ──────────────────────────────────────
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
function MiniCard({ item, onRead, onPlay }) {
  const isMobile = useMobile();
  const [imgErr, setImgErr] = useState(false);
  const hasImg = (item.imageUrl || item.image) && !imgErr;
  const isVideo = item.type === "video";

  const handleClick = () => isVideo ? onPlay?.(item) : onRead?.(item);

  if (isMobile) {
    return (
      <div onClick={handleClick}
        style={{ 
          background: "rgba(255,255,255,0.03)", 
          borderRadius: 16, 
          border: "1px solid rgba(255,255,255,0.06)", 
          overflow: "hidden",
          cursor: "pointer",
          height: "100%"
        }}>
        <div style={{ height: 110, background: "rgba(255,255,255,0.05)", position: "relative" }}>
          {hasImg ? (
            <img src={item.imageUrl || item.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}
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
        <div style={{ padding: 12 }}>
          <h4 style={{ fontSize: 13, fontWeight: 800, margin: 0, lineHeight: 1.4, height: 36, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", color: "rgba(255,255,255,0.9)" }}>
            {item.title}
          </h4>
        </div>
      </div>
    );
  }

  return (
    <div onClick={handleClick}
      style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,.05)", cursor: "pointer" }}>
      <div style={{ width: 62, height: 62, borderRadius: 12, overflow: "hidden", flexShrink: 0, background: "rgba(255,255,255,.04)" }}>
        {hasImg ? (
          <img src={item.imageUrl || item.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}
            referrerPolicy="no-referrer" onError={() => setImgErr(true)} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", fontSize: 22, opacity: .5 }}>{isVideo ? "▶" : "📰"}</div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <span style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".07em", color: G, background: `${G}15`, padding: "2px 7px", borderRadius: 4 }}>
            {item.badge || (isVideo ? "Video" : "Article")}
          </span>
        </div>
        <h4 style={{ fontSize: 14, fontWeight: 800, margin: 0, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
          {item.title}
        </h4>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// HOMEPAGE
// ─────────────────────────────────────────────────────
export default function HomePage({ goPage, settings = {} }) {
  const isMobile = useMobile();
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const heroOp = useTransform(scrollYProgress, [0, .8], [1, 0]);

  const { docs: tips, loading: tipsLoading } = useCollection("tips", "createdAt", 4);
  const { docs: courses, loading: coursesLoading } = useCollection("courses", "createdAt", 3);
  const { docs: updatesDocs, loading: updatesLoading } = useCollection("updates", "createdAt", 3);
  const { docs: postsDocs, loading: postsLoading } = useCollection("posts", "createdAt", 3);
  
  // Merge updates and posts, sort by createdAt
  const updates = [...updatesDocs, ...postsDocs]
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
    .slice(0, 3);

  useEffect(() => {
    if (!tipsLoading && tips.length === 0) {
      console.log("[empty response reason] tips: Collection exists but returned 0 documents.");
    }
    if (!coursesLoading && courses.length === 0) {
      console.log("[empty response reason] courses: Collection exists but returned 0 documents.");
    }
    if (!updatesLoading && !postsLoading && updates.length === 0) {
      console.log("[empty response reason] updates/posts: Both collections returned 0 documents.");
    }
  }, [tips, tipsLoading, courses, coursesLoading, updates, updatesLoading, postsLoading]);

  const wa = settings.contact_info?.whatsapp || "8619715852043";
  const communityLink = settings.contact_info?.whatsappCommunity || `https://wa.me/${wa}`;
  const heroTitle1 = settings.hero?.title1 || "SwahiliTech";
  const heroTitle2 = settings.hero?.title2 || "Elite Academy";
  const heroSub = settings.hero?.subtitle || "Platform ya kwanza ya Tech kwa Watanzania — Kujifunza, Kubuni, na Kujipatia Kipato.";

  return (
    <div style={{ minHeight: "100vh", background: "#04050a", color: "#fff", fontFamily: "'Instrument Sans',system-ui,sans-serif" }}>

      {/* ════════════════════════════════
          HERO
      ════════════════════════════════ */}
      <section ref={heroRef} style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", overflow: "hidden" }}>
        <AnimatedHeroBackground />

        <motion.div style={{ position: "relative", zIndex: 2, width: "100%", y: heroY, opacity: heroOp }}>
          <W>
            <div style={{ maxWidth: 780, paddingTop: "clamp(100px,14vw,160px)", paddingBottom: "clamp(60px,8vw,100px)" }}>

              {/* Label pill */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5 }} style={{ marginBottom: isMobile ? 18 : 24 }}>
                <Tag>🚀 Tanzania · Tech · 2026</Tag>
              </motion.div>

              {/* Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .1, duration: .6 }}
                style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: isMobile ? "clamp(40px,10vw,56px)" : "clamp(44px,8vw,100px)", fontWeight: 900, lineHeight: isMobile ? 1 : .93, letterSpacing: "-.06em", margin: "0 0 clamp(16px,2vw,24px)" }}>
                <span style={{ display: "block" }}>{heroTitle1}</span>
                <span style={{ display: "block", background: `linear-gradient(135deg,${G} 30%,${G2} 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  {heroTitle2}
                </span>
              </motion.h1>

              {/* Sub */}
              <motion.p
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .2, duration: .5 }}
                style={{ color: "rgba(255,255,255,.6)", fontSize: isMobile ? 15 : "clamp(15px,2vw,20px)", lineHeight: 1.6, maxWidth: 580, margin: "0 0 clamp(24px,3vw,40px)", fontWeight: 500 }}>
                {isMobile ? "Platform namba moja ya Tech kwa Watanzania." : heroSub}
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .3, duration: .5 }}
                style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <GoldBtn onClick={() => goPage("courses")} style={{ fontSize: isMobile ? 15 : 16, padding: isMobile ? "14px 28px" : "15px 32px", width: isMobile ? "100%" : "auto", justifyContent: "center" }}>
                  🎓 Anza Kujifunza <ArrowRight size={18} />
                </GoldBtn>
                {!isMobile && (
                  <GoldBtn outline onClick={() => goPage("vpn")} style={{ fontSize: 16, padding: "14px 28px" }}>
                    🔒 STEA VPN
                  </GoldBtn>
                )}
              </motion.div>

              {/* Social proof */}
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .5, duration: .6 }}
                style={{ display: "flex", alignItems: "center", gap: isMobile ? 16 : 28, marginTop: isMobile ? 28 : 44, flexWrap: "wrap" }}>
                {[
                  { n: 10000, s: "+", label: "Wanafunzi" },
                  { n: 50, s: "+", label: "Tech Tips" },
                  { n: 5, s: " Stars", label: "Rating" },
                ].map((stat, i) => (
                  <div key={i} style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: isMobile ? 22 : 30, fontWeight: 900, color: "#fff", lineHeight: 1 }}>
                      <Counter to={stat.n} suffix={stat.s} />
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", fontWeight: 700, marginTop: 2 }}>{stat.label}</div>
                  </div>
                ))}
              </motion.div>
            </div>
          </W>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.8 }}
          style={{ position: "absolute", bottom: 28, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, opacity: .35 }}>
          <div style={{ width: 1, height: 36, background: "linear-gradient(to bottom, transparent, rgba(255,255,255,.5))" }} />
        </motion.div>
      </section>

      {/* Banner Ad */}
      <W><BannerAd /></W>

      {/* ════════════════════════════════
          QUICK ACCESS PILLARS
      ════════════════════════════════ */}
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
            <PillarCard
              emoji="🎓" title="Student Center" tag="Courses + NECTA"
              color="#10b981" path="exams"
              desc="Online courses, NECTA results, past papers, notes — elimu kamili kwa mkono wako."
              goPage={goPage} delay={0}
            />
            <PillarCard
              emoji="💡" title="Tech Hub" tag="AI + Tips"
              color="#3b82f6" path="tech"
              desc="AI Lab, Prompt Lab, Tech Tips na zana za dijiti — pata ujuzi wa kisasa kwa lugha ya Kiswahili."
              goPage={goPage} delay={.08}
            />
            <PillarCard
              emoji="📣" title="Huduma" tag="Business"
              color="#ec4899" path="huduma"
              desc="Tangaza bidhaa zako, website solutions, brand partnerships na huduma za vijana."
              goPage={goPage} delay={.16}
            />
            <PillarCard
              emoji="💼" title="Gigs & Kazi" tag="Opportunities"
              color="#f5a623" path="gigs"
              desc="Remote jobs, local gigs, freelance projects, na internships — pata kazi au tuma nafasi yako."
              goPage={goPage} delay={.24}
            />
          </div>
        </W>
      </section>

      {/* ════════════════════════════════
          TECH HUB HIGHLIGHT
      ════════════════════════════════ */}
      <section style={{ padding: isMobile ? "40px 0" : "clamp(40px,6vw,80px) 0", background: "rgba(59,130,246,.03)", borderTop: "1px solid rgba(59,130,246,.1)", borderBottom: "1px solid rgba(59,130,246,.1)" }}>
        <W>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 32 : 60, alignItems: "center" }}>
            {/* Left */}
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
                    { icon: <Zap size={16} />, label: "Prompt Lab — Maktaba ya prompts bora zaidi" },
                    { icon: <BookOpen size={16} />, label: "Tech Tips — Maujanja mapya kila siku" },
                    { icon: <Globe size={16} />, label: "Website Solutions — Websites bora na za siri" },
                    { icon: <LayoutGrid size={16} />, label: "Digital Tools — Zana za dijiti za bure" },
                  ].map((f, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, color: "rgba(255,255,255,.75)", fontSize: 14, fontWeight: 600 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(59,130,246,.15)", display: "grid", placeItems: "center", color: "#60a5fa", flexShrink: 0 }}>
                        {f.icon}
                      </div>
                      {f.label}
                    </div>
                  ))}
                </div>
              )}
              
              <GoldBtn onClick={() => goPage("ai")} style={{ background: "#3b82f6", boxShadow: "0 8px 24px rgba(59,130,246,0.35)", width: isMobile ? "100%" : "auto", justifyContent: "center" }}>
                Ingia AI Lab <ArrowRight size={16} />
              </GoldBtn>
            </motion.div>

            {/* Right — Live Tips */}
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
                    <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 8, scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }} className="no-scrollbar scrollbar-hide">
                      {tips.length > 0 ? tips.map(item => (
                        <div key={item.id} onClick={() => goPage("/tips")} style={{ flexShrink: 0, width: 240 }}>
                          <MiniCard item={item} onRead={() => goPage("/tips")} onPlay={() => goPage("/tips")} />
                        </div>
                      )) : [1,2].map(i => (
                        <div key={i} style={{ flexShrink: 0, width: 240, height: 80, background: "rgba(255,255,255,.03)", borderRadius: 12, animation: "pulse 2s infinite" }} />
                      ))}
                    </div>
                  ) : (
                    tips.length > 0 ? tips.slice(0, 4).map(item => (
                      <MiniCard key={item.id} item={item} onRead={() => goPage("/tips")} onPlay={() => goPage("/tips")} />
                    )) : [1,2,3].map(i => (
                      <div key={i} style={{ display: "flex", gap: 14, padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
                        <div style={{ width: 62, height: 62, borderRadius: 12, background: "rgba(255,255,255,.04)", flexShrink: 0, animation: "pulse 2s infinite" }} />
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

      {/* ════════════════════════════════
          STUDENT CENTER FEATURED
      ════════════════════════════════ */}
      <section style={{ padding: isMobile ? "40px 0" : "clamp(60px,8vw,110px) 0" }}>
        <W>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 24 : 60, alignItems: "center" }}>
            {/* Left — Courses */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <div style={{ background: "linear-gradient(145deg,rgba(16,185,129,0.12),transparent)", borderRadius: 28, border: "1px solid rgba(16,185,129,0.2)", padding: isMobile ? "28px 24px" : "40px 36px" }}>
                <div style={{ fontSize: 40, marginBottom: 20 }}>🎓</div>
                <h3 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: "clamp(24px,3vw,36px)", fontWeight: 900, letterSpacing: "-.03em", margin: "0 0 14px", lineHeight: 1.15, color: "#fff" }}>
                  Student Center
                </h3>
                <p style={{ color: "rgba(255,255,255,.6)", fontSize: 15, lineHeight: 1.7, marginBottom: 28 }}>
                  Kila kitu unachohitaji kufanikiwa kimasomo — kutoka matokeo ya NECTA hadi kozi za skills.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 32 }}>
                  {["NECTA Results","Past Papers","Study Notes","Online Courses","Univ. Guide","Scholarships"].map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,.8)" }}>
                      <CheckCircle size={14} color="#10b981" /> {item}
                    </div>
                  ))}
                </div>
                <GoldBtn onClick={() => goPage("exams")} style={{ background: "#10b981", boxShadow: "0 8px 24px rgba(16,185,129,0.35)", width: isMobile ? "100%" : "auto", justifyContent: "center" }}>
                  Fungua Student Center <ArrowRight size={16} />
                </GoldBtn>
              </div>
            </motion.div>

            {/* Right — courses list */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: .1 }}>
              <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h4 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: isMobile ? 18 : 22, fontWeight: 900, letterSpacing: "-.02em", margin: 0 }}>Kozi Mpya</h4>
                {!isMobile && (
                  <button onClick={() => goPage("courses")} style={{ background: "none", border: "none", color: G, fontWeight: 800, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                    Zote <ChevronRight size={12} />
                  </button>
                )}
              </div>
              
              {isMobile ? (
                <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 12, scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }} className="no-scrollbar">
                  {courses.length > 0 ? courses.map(c => (
                    <div key={c.id} onClick={() => goPage("course-detail", c)}
                      style={{ flexShrink: 0, width: 260, scrollSnapAlign: "start", background: "rgba(255,255,255,.03)", borderRadius: 20, border: "1px solid rgba(255,255,255,.06)", overflow: "hidden" }}>
                      <div style={{ height: 140, background: "rgba(255,255,255,.05)", position: "relative" }}>
                        {c.imageUrl ? <img src={c.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} referrerPolicy="no-referrer" /> : <div style={{ height: "100%", display: "grid", placeItems: "center", fontSize: 40 }}>📚</div>}
                        <div style={{ position: "absolute", top: 12, right: 12 }}>
                          <Tag color={G} style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>{c.newPrice || c.price}</Tag>
                        </div>
                      </div>
                      <div style={{ padding: 16 }}>
                        <div style={{ fontWeight: 800, fontSize: 15, lineHeight: 1.4, marginBottom: 8, height: 42, overflow: "hidden" }}>{c.title}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, color: G, fontSize: 12, fontWeight: 700 }}>
                          Anza Sasa <ArrowRight size={14} />
                        </div>
                      </div>
                    </div>
                  )) : [1,2].map(i => (
                    <div key={i} style={{ flexShrink: 0, width: 260, height: 220, background: "rgba(255,255,255,.03)", borderRadius: 20, animation: "pulse 2s infinite" }} />
                  ))}
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
                        <div style={{ fontWeight: 800, fontSize: 14, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{c.title}</div>
                        <div style={{ color: G, fontWeight: 900, fontSize: 14, marginTop: 4 }}>{c.newPrice || c.price}</div>
                      </div>
                    </div>
                  )) : [1,2,3].map(i => (
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

      {/* ════════════════════════════════
          LATEST UPDATES SECTION
      ════════════════════════════════ */}
      {updates.length > 0 && (
        <section style={{ padding: isMobile ? "40px 0" : "60px 0", background: "rgba(255,255,255,.01)" }}>
          <W>
            <SectionHeader 
              tag="HABARI"
              title="Latest Updates"
              desc="Habari na taarifa za hivi punde kutoka STEA."
              align="left"
            />
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: isMobile ? 16 : 24 }}>
              {updates.map((u, i) => (
                <motion.div 
                  key={u.id || i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  style={{ background: "rgba(255,255,255,.03)", borderRadius: 20, border: "1px solid rgba(255,255,255,.06)", overflow: "hidden" }}
                >
                  {u.imageUrl && (
                    <div style={{ width: "100%", height: 160, overflow: "hidden", flexShrink: 0 }}>
                      <img src={u.imageUrl} alt={u.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        referrerPolicy="no-referrer"
                        onError={e => { e.currentTarget.parentElement.style.display = "none"; }}
                      />
                    </div>
                  )}
                  <div style={{ padding: 20 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>{u.title}</h3>
                    <p style={{ fontSize: 14, color: "rgba(255,255,255,.5)", lineHeight: 1.5 }}>{u.content?.substring(0, 100)}...</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </W>
        </section>
      )}

      {/* ════════════════════════════════
          VPN HIGHLIGHT
      ════════════════════════════════ */}
      <section style={{ padding: isMobile ? "40px 0" : "clamp(60px,8vw,120px) 0" }}>
        <W>
          <div style={{ 
            background: "linear-gradient(135deg,#0a0c14,#05060a)",
            borderRadius: isMobile ? 24 : 32,
            border: "1px solid rgba(255,255,255,.06)",
            padding: isMobile ? "32px 24px" : "60px",
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
            gap: isMobile ? 32 : 60,
            alignItems: "center",
            position: "relative",
            overflow: "hidden"
          }}>
            {/* Glow */}
            <div style={{ position: "absolute", top: "-20%", right: "-10%", width: "60%", height: "140%", background: `radial-gradient(circle,${G}15,transparent 70%)`, filter: "blur(60px)", pointerEvents: "none" }} />

            <div>
              <Tag color={G} style={{ marginBottom: 20 }}>GUIDE</Tag>
              <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: "clamp(22px,3.5vw,44px)", fontWeight: 900, letterSpacing: "-.04em", margin: "0 0 14px", lineHeight: 1.1 }}>
                VPN Guide — Wasafiri & Expats
              </h2>
              <p style={{ color: "rgba(255,255,255,.55)", fontSize: 16, lineHeight: 1.7, marginBottom: 28 }}>
                Mwongozo wa kutumia VPN kwa safari, usalama na matumizi ya kimataifa.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <GoldBtn onClick={() => goPage("vpn")} style={{ width: isMobile ? "100%" : "auto", justifyContent: "center" }}>
                  Gundua zaidi <ArrowRight size={16} />
                </GoldBtn>
              </div>
            </div>

            <div style={{ position: "relative", display: isMobile ? "none" : "block" }}>
              <div style={{ background: "rgba(255,255,255,.03)", borderRadius: 24, border: "1px solid rgba(255,255,255,.08)", padding: 32, backdropFilter: "blur(10px)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: `${G}20`, display: "grid", placeItems: "center", fontSize: 24 }}>🛡️</div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 18 }}>Premium Protection</div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,.5)" }}>Active & Encrypted</div>
                  </div>
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
          </div>
        </W>
      </section>

      {/* Inline Ad */}
      <W><InlineAd index={0} /></W>

      {/* ════════════════════════════════
          DUKA + GIGS
      ════════════════════════════════ */}
      <section style={{ padding: isMobile ? "40px 0" : "clamp(60px,8vw,120px) 0" }}>
        <W>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 24 : 40 }}>
            {/* Duka */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              style={{ background: "rgba(255,255,255,.02)", borderRadius: 24, border: "1px solid rgba(255,255,255,.06)", padding: isMobile ? "28px 24px" : "40px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 32, marginBottom: 16 }}>🛒</div>
                <h3 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 28, fontWeight: 900, margin: "0 0 12px" }}>STEA Duka</h3>
                <p style={{ color: "rgba(255,255,255,.5)", fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
                  Nunua na uza bidhaa za tech, accounts, na digital assets kwa usalama zaidi.
                </p>
              </div>
              <GoldBtn onClick={() => goPage("duka")} style={{ width: isMobile ? "100%" : "auto", justifyContent: "center" }}>
                Ingia Sokoni <ArrowRight size={16} />
              </GoldBtn>
            </motion.div>

            {/* Gigs */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: .1 }}
              style={{ background: "rgba(255,255,255,.02)", borderRadius: 24, border: "1px solid rgba(255,255,255,.06)", padding: isMobile ? "28px 24px" : "40px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 32, marginBottom: 16 }}>💼</div>
                <h3 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 28, fontWeight: 900, margin: "0 0 12px" }}>Gigs & Kazi</h3>
                <p style={{ color: "rgba(255,255,255,.5)", fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
                  Pata kazi za remote, freelance projects, na nafasi za kazi nchini Tanzania.
                </p>
              </div>
              <GoldBtn onClick={() => goPage("gigs")} outline style={{ width: isMobile ? "100%" : "auto", justifyContent: "center" }}>
                Tafuta Kazi <ArrowRight size={16} />
              </GoldBtn>
            </motion.div>
          </div>
        </W>
      </section>

      {/* ════════════════════════════════
          SERVICES / BUSINESS
      ════════════════════════════════ */}
      <section style={{ padding: isMobile ? "40px 0" : "clamp(60px,8vw,120px) 0", background: "rgba(255,255,255,.01)" }}>
        <W>
          <SectionHeader 
            tag="Huduma Zetu"
            title={<>Tunasaidia Biashara <span style={{ color: G }}>Kukua</span></>}
            desc="Kutoka website solutions hadi matangazo — STEA ni mshirika wako wa kimkakati."
          />

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: isMobile ? 12 : 24 }}>
            {[
              { t: "Website Solutions", d: "Tunatengeneza websites za kisasa na zenye kasi kwa ajili ya biashara yako.", e: "🌐" },
              { t: "Digital Marketing", d: "Tangaza bidhaa zako kwa hadhira kubwa ya STEA kupitia banners na posts.", e: "📈" },
              { t: "Brand Partnership", d: "Fanya kazi na STEA kukuza brand yako kwa vijana wa Tanzania.", e: "🤝" },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * .1 }}
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

      {/* ════════════════════════════════
          WHATSAPP COMMUNITY
      ════════════════════════════════ */}
      <section style={{ padding: isMobile ? "60px 0" : "clamp(80px,10vw,160px) 0" }}>
        <W>
          <motion.div initial={{ opacity: 0, scale: .98 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
            style={{ 
              background: "linear-gradient(135deg,#25d366, #128c7e)",
              borderRadius: isMobile ? 28 : 40,
              padding: isMobile ? "48px 24px" : "80px 40px",
              textAlign: "center",
              color: "#fff",
              position: "relative",
              overflow: "hidden",
              boxShadow: "0 32px 80px rgba(37,211,102,.25)"
            }}>
            {/* Pattern */}
            <div style={{ position: "absolute", inset: 0, opacity: .1, backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
            
            <div style={{ position: "relative", zIndex: 2 }}>
              <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: isMobile ? 64 : 80, height: isMobile ? 64 : 80, borderRadius: "50%", background: "rgba(255,255,255,.2)", backdropFilter: "blur(10px)", fontSize: isMobile ? 32 : 40, marginBottom: 24 }}>
                💬
              </div>
              <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: "clamp(28px,4.5vw,60px)", fontWeight: 900, letterSpacing: "-.04em", margin: "0 0 16px", lineHeight: 1 }}>
                Jiunge na Community <br /> ya STEA WhatsApp
              </h2>
              <p style={{ fontSize: "clamp(15px,1.8vw,20px)", opacity: .9, maxWidth: 600, margin: "0 auto 36px", lineHeight: 1.6, fontWeight: 500 }}>
                Pata habari za tech, matokeo ya NECTA, na ofa za siri moja kwa moja kwenye simu yako.
              </p>
              <button 
                onClick={() => window.open(communityLink, "_blank")}
                style={{ 
                  background: "#fff", color: "#128c7e", border: "none", 
                  padding: isMobile ? "16px 32px" : "20px 48px", borderRadius: 99, 
                  fontSize: isMobile ? 16 : 18, fontWeight: 900, cursor: "pointer",
                  display: "inline-flex", alignItems: "center", gap: 12,
                  boxShadow: "0 12px 32px rgba(0,0,0,.15)",
                  transition: "transform .2s"
                }}
                onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
                onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
              >
                Jiunge Sasa <ArrowRight size={20} />
              </button>
            </div>
          </motion.div>
        </W>
      </section>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:.6} 50%{opacity:1} }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      `}</style>
    </div>
  );
}
