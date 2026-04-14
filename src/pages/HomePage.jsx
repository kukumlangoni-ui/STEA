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
import AnimatedEarth from "../components/AnimatedEarth.jsx";

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

// ── Animated counter ─────────────────────────────────
// Removed unused Counter function

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
export default function HomePage({ goPage }) {
  const isMobile = useMobile();
  const communityLink = "https://wa.me/8619715852043";
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const heroOp = useTransform(scrollYProgress, [0, .8], [1, 0]);

  const { docs: tips,    loading: tipsLoading    } = useCollection("tips",    "createdAt", 6);
  const { docs: courses, loading: coursesLoading } = useCollection("courses", "createdAt", 3);
  // "updates" and "posts" are also valid collections admin can write to
  const { docs: updatesDocs, loading: updatesLoading } = useCollection("updates", "createdAt", 10);
  const { docs: postsDocs,   loading: postsLoading   } = useCollection("posts",   "createdAt", 10);
  const { docs: newsDocs,    loading: newsLoading     } = useCollection("news",    "createdAt", 10);

  // Merge all content sources admin can write to, deduplicate by id, sort newest first
  const updates = [...updatesDocs, ...postsDocs, ...newsDocs]
    .filter((item, index, self) => self.findIndex(t => t.id === item.id) === index)
    .sort((a, b) => {
      const getTs = d => d.createdAt?.seconds || d.createdAt?.toDate?.()?.getTime?.() / 1000 || 0;
      return getTs(b) - getTs(a);
    })
    .slice(0, 6);

  useEffect(() => {
    console.log("[Firestore Debug] Fetched posts:", postsDocs);
    console.log("[Firestore Debug] Merged updates:", updates);
    
    if (!tipsLoading    && tips.length    === 0) console.log("[homepage] tips: 0 docs — add content via Admin Panel → Tech Tips");
    if (!coursesLoading && courses.length === 0) console.log("[homepage] courses: 0 docs — add content via Admin Panel → Courses");
    if (!updatesLoading && !postsLoading && !newsLoading && updates.length === 0)
      console.log("[homepage] updates/posts/news: all empty — add content via Admin Panel → Tech Tips or create in 'updates' collection");
  }, [tips, tipsLoading, courses, coursesLoading, updates, updatesLoading, postsLoading, newsLoading, postsDocs]);

  const heroSub = "Everything you need in one place – exams, services, tech tips, shopping, and more. Simplify, explore, succeed.";

  return (
    <div style={{ minHeight: "100vh", background: "#0B0F1A", color: "#fff", fontFamily: "'Instrument Sans',system-ui,sans-serif", overflowX: "hidden" }}>

      {/* ════════════════════════════════
          HERO
      ════════════════════════════════ */}
      <section ref={heroRef} style={{
        position: "relative",
        minHeight: isMobile ? "85vh" : "100vh",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        background: "linear-gradient(to bottom, #0B0F1A, #12172F)"
      }}>
        {/* z-0: animated starfield + globe background */}
        <AnimatedEarth />

        {/* Gradient Overlay for readability */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle at center, transparent 0%, rgba(11,15,26,0.4) 100%)",
          zIndex: 5,
          pointerEvents: "none"
        }} />

        {/* z-10: hero content — must be above background */}
        <motion.div style={{ position: "relative", zIndex: 10, width: "100%", y: heroY, opacity: heroOp }}>
          <W>
            <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center", paddingTop: isMobile ? "clamp(80px,20vw,120px)" : "clamp(100px,14vw,160px)", paddingBottom: isMobile ? "clamp(40px,8vw,60px)" : "clamp(60px,8vw,100px)" }}>

              {/* Label pill */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5 }} style={{ marginBottom: isMobile ? 18 : 24 }}>
                <Tag>✨ Premium Multi-Service Ecosystem</Tag>
              </motion.div>

              {/* Headline */}
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .1, duration: .6 }}
                style={{ fontFamily: "'Bricolage Grotesque',sans-serif", textAlign: "center", marginBottom: isMobile ? 24 : 32 }}
              >
                <h1 style={{ fontSize: isMobile ? "clamp(36px,10vw,52px)" : "clamp(48px,7vw,88px)", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-.05em", margin: 0 }}>
                  Welcome to STEA
                </h1>
                <h2 style={{ 
                  marginTop: 8,
                  fontSize: isMobile ? "clamp(20px,5vw,28px)" : "clamp(24px,3vw,42px)", 
                  fontWeight: 800, 
                  background: `linear-gradient(135deg,${G} 30%,${G2} 100%)`, 
                  WebkitBackgroundClip: "text", 
                  WebkitTextFillColor: "transparent",
                  letterSpacing: "-.02em"
                }}>
                  Your Gateway to Everything
                </h2>
              </motion.div>

              {/* Sub */}
              <motion.p
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .2, duration: .5 }}
                style={{ color: "rgba(255,255,255,.65)", fontSize: isMobile ? 15 : "clamp(16px,2vw,21px)", lineHeight: 1.6, maxWidth: 700, margin: "0 auto clamp(24px,3vw,48px)", fontWeight: 500 }}>
                {heroSub}
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .3, duration: .5 }}
                style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center", justifyContent: "center" }}>
                <GoldBtn onClick={() => goPage("exams")} style={{ fontSize: isMobile ? 15 : 17, padding: isMobile ? "14px 32px" : "16px 40px", width: isMobile ? "100%" : "auto", justifyContent: "center", borderRadius: 16 }}>
                  Get Started <ArrowRight size={20} />
                </GoldBtn>
                <GoldBtn outline onClick={() => goPage("huduma")} style={{ fontSize: isMobile ? 15 : 17, padding: isMobile ? "14px 32px" : "16px 40px", width: isMobile ? "100%" : "auto", justifyContent: "center", borderRadius: 16 }}>
                  Explore Services
                </GoldBtn>
              </motion.div>

              {/* Service Grid - Floating feel */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.7 }}
                style={{ 
                  marginTop: isMobile ? 48 : 72,
                  display: "grid",
                  gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
                  gap: isMobile ? 12 : 24
                }}>
                <HeroServiceCard title="Student Center" icon="🎓" desc="Exams, past papers, courses" onClick={() => goPage("exams")} />
                <HeroServiceCard title="Services" icon="🛠️" desc="Digital & local essential services" onClick={() => goPage("huduma")} />
                <HeroServiceCard title="TechTips" icon="💡" desc="Guides, VPN, help & FAQ" onClick={() => goPage("tech")} />
                <HeroServiceCard title="Marketplace" icon="🛒" desc="Products, tools & resources" onClick={() => goPage("duka")} />
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
      <section style={{ padding: isMobile ? "24px 0" : "40px 0" }}>
        <W>
          <SectionHeader 
            tag="Platform Yetu"
            title={<>Kila Kitu Unahitaji <span style={{ color: G }}>Mahali Pamoja</span></>}
            desc="Kutoka kujifunza hadi kujipatia kipato — STEA ni jibu lako."
          />

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2,1fr)", gap: isMobile ? 12 : 22 }}>
            <PillarCard
              emoji="🎓" title="Student Center" tag="Exams"
              color="#10b981" path="exams"
              desc="NECTA Results, Past Papers, Notes na Kozi — kila kitu unachohitaji kufanikiwa kimasomo."
              goPage={goPage} delay={.04}
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
              goPage={goPage} delay={.12}
            />
            <PillarCard
              emoji="💼" title="Gigs & Kazi" tag="Opportunities"
              color="#f5a623" path="gigs"
              desc="Remote jobs, local gigs, freelance projects, na internships — pata kazi au tuma nafasi yako."
              goPage={goPage} delay={.16}
            />
            <PillarCard
              emoji="💸" title="Abroad Money Guide" tag="Money Guide"
              color="#10b981" path="money-guide"
              desc="Mwongozo wa kutuma na kubadilisha pesa kwa usalama ukiwa na wanafunzi, ndugu au marafiki nje ya nchi."
              goPage={goPage} delay={.20}
            />
            <PillarCard
              emoji="🛒" title="STEA Duka" tag="Marketplace"
              color="#f5a623" path="duka"
              desc="Nunua na uza bidhaa za tech, accounts, na digital assets kwa usalama zaidi."
              goPage={goPage} delay={.24}
            />
          </div>
        </W>
      </section>

      {/* ════════════════════════════════
          TECH HUB HIGHLIGHT
      ════════════════════════════════ */}
      <section style={{ padding: isMobile ? "24px 0" : "40px 0", background: "rgba(59,130,246,.03)", borderTop: "1px solid rgba(59,130,246,.1)", borderBottom: "1px solid rgba(59,130,246,.1)" }}>
        <W>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 24 : 60, alignItems: "center" }}>
            {/* Left */}
            <motion.div initial={{ opacity: 1, x: 0 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
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
                    <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 8, scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }} className="scrollbar-hide">
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
      <section style={{ padding: isMobile ? "24px 0" : "40px 0", overflow: "hidden" }}>
        <W>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 24 : 60, alignItems: "center" }}>
            {/* Left — Courses */}
            <motion.div initial={{ opacity: 1, y: 0 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <div style={{ background: "linear-gradient(145deg,rgba(16,185,129,0.12),transparent)", borderRadius: 28, border: "1px solid rgba(16,185,129,0.2)", padding: isMobile ? "24px" : "40px 36px", width: "100%", boxSizing: "border-box" }}>
                <div style={{ fontSize: 40, marginBottom: 20 }}>🎓</div>
                <h3 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: "clamp(24px,3vw,36px)", fontWeight: 900, letterSpacing: "-.03em", margin: "0 0 14px", lineHeight: 1.15, color: "#fff" }}>
                  Student Center
                </h3>
                <p style={{ color: "rgba(255,255,255,.6)", fontSize: isMobile ? 14 : 15, lineHeight: 1.65, marginBottom: isMobile ? 20 : 28 }}>
                  {isMobile ? "NECTA, past papers, notes, kozi — kila kitu unachohitaji kufanikiwa kimasomo mahali pamoja." : "Kila kitu unachohitaji kufanikiwa kimasomo — kutoka matokeo ya NECTA hadi kozi za skills."}
                </p>
                {!isMobile && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 28 }}>
                    {["NECTA Results","Past Papers","Study Notes","Online Courses","Univ. Guide","Scholarships"].map((item, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,.75)" }}>
                        <CheckCircle size={13} color="#10b981" /> {item}
                      </div>
                    ))}
                  </div>
                )}
                {isMobile && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: 24 }}>
                    {["NECTA Results","Past Papers","Study Notes","Kozi","Univ. Guide"].map((item, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.65)", background: "rgba(16,185,129,.08)", padding: "4px 10px", borderRadius: 20, border: "1px solid rgba(16,185,129,.15)" }}>
                        <CheckCircle size={10} color="#10b981" /> {item}
                      </div>
                    ))}
                  </div>
                )}
                <GoldBtn onClick={() => goPage("exams")} style={{ background: "#10b981", boxShadow: "0 8px 24px rgba(16,185,129,0.35)", width: "100%", justifyContent: "center" }}>
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
                <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 12, scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }} className="scrollbar-hide">
                  {courses.length > 0 ? courses.map(c => (
                    <div key={c.id} onClick={() => goPage("course-detail", c)}
                      style={{ flexShrink: 0, width: "80vw", maxWidth: 280, scrollSnapAlign: "start", background: "rgba(255,255,255,.03)", borderRadius: 20, border: "1px solid rgba(255,255,255,.06)", overflow: "hidden" }}>
                      <div style={{ height: 160, background: "rgba(255,255,255,.05)", position: "relative" }}>
                        {c.imageUrl ? <img src={c.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} referrerPolicy="no-referrer" /> : <div style={{ height: "100%", display: "grid", placeItems: "center", fontSize: 40 }}>📚</div>}
                        <div style={{ position: "absolute", top: 12, right: 12 }}>
                          <Tag color={G} style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>{c.newPrice || c.price}</Tag>
                        </div>
                      </div>
                      <div style={{ padding: 16 }}>
                        <div style={{ fontWeight: 800, fontSize: 16, lineHeight: 1.4, marginBottom: 8, height: 44, overflow: "hidden" }}>{c.title}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, color: G, fontSize: 13, fontWeight: 700 }}>
                          Anza Sasa <ArrowRight size={14} />
                        </div>
                      </div>
                    </div>
                  )) : [1,2].map(i => (
                    <div key={i} style={{ flexShrink: 0, width: "80vw", maxWidth: 280, height: 240, background: "rgba(255,255,255,.03)", borderRadius: 20, animation: "pulse 2s infinite" }} />
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
      <section style={{ padding: isMobile ? "24px 0" : "40px 0", background: "rgba(255,255,255,.01)", overflow: "hidden" }}>
        <W>
          <SectionHeader 
            tag="HABARI"
            title="Latest Updates"
            desc="Habari na taarifa za hivi punde kutoka STEA."
            align="left"
          />
          
          {updates.length > 0 ? (
            <div 
              style={{ 
                display: "flex", 
                gap: isMobile ? 16 : 24, 
                overflowX: "auto", 
                paddingBottom: isMobile ? 16 : 0,
                scrollSnapType: isMobile ? "x mandatory" : "none",
                WebkitOverflowScrolling: "touch"
              }}
              className="scrollbar-hide"
            >
              {updates.map((u, i) => (
                <motion.div 
                  key={u.id || i}
                  initial={{ opacity: 1, y: 0 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  style={{ 
                    background: "rgba(255,255,255,.03)", 
                    borderRadius: 20, 
                    border: "1px solid rgba(255,255,255,.06)", 
                    overflow: "hidden",
                    flexShrink: 0,
                    width: isMobile ? "calc(100vw - 48px)" : "calc(33.333% - 16px)",
                    scrollSnapAlign: "center"
                  }}
                >
                  {(u.imageUrl || u.image) && (
                    <div style={{ width: "100%", height: isMobile ? 180 : 160, overflow: "hidden", flexShrink: 0, background: "rgba(255,255,255,.04)" }}>
                      <img src={u.imageUrl || u.image} alt={u.title || ""}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        onError={e => { e.currentTarget.parentElement.style.display = "none"; }}
                      />
                    </div>
                  )}
                  <div style={{ padding: 20 }}>
                    <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                      <span style={{ fontSize: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".05em", color: G, background: `${G}15`, padding: "2px 8px", borderRadius: 4 }}>
                        {u.type || "Post"}
                      </span>
                    </div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 10, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{u.title}</h3>
                    <p style={{ fontSize: 14, color: "rgba(255,255,255,.5)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {((u.summary || u.description || u.content || "")
                        .replace(/<[^>]+>/g, "") // strip html tags if any
                        .substring(0, 110)
                        .trim() || "Soma zaidi...")}
                      {(u.summary || u.description || u.content || "").length > 110 ? "..." : ""}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(255,255,255,0.3)" }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>📰</div>
              <p>No posts found. Check back later for updates!</p>
            </div>
          )}
        </W>
      </section>

      {/* ════════════════════════════════
          VPN HIGHLIGHT
      ════════════════════════════════ */}
      <section style={{ padding: isMobile ? "24px 0" : "40px 0" }}>
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
      <section style={{ padding: isMobile ? "24px 0" : "40px 0" }}>
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
      <section style={{ padding: isMobile ? "24px 0" : "40px 0", background: "rgba(255,255,255,.01)" }}>
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
