import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Bell, LogOut, User, Settings,
  ShieldCheck, Cpu, Globe, Zap, GraduationCap, ShoppingBag,
  Briefcase, Sparkles, BookOpen, LayoutGrid, Wifi,
  HelpCircle, Megaphone, Star, Tag, Laptop, Smartphone,
  ChevronDown, ArrowRight,
} from "lucide-react";
import { useSettings } from "../contexts/SettingsContext";
import SettingsModal from "./SettingsModal";

const G = "#F5A623";
const G2 = "#FFD17C";

// ── Nav Taxonomy ─────────────────────────────────────
const getNav = (t) => [
  { id: "home", label: t('nav_home'), path: "/" },
  {
    id: "tech-hub", label: t('nav_tech_hub'),
    featured: { title: "Tech Hub", desc: t('nav_tech_hub_desc'), path: "/tech", icon: "💡" },
    cols: [
      {
        heading: t('nav_tech_tools_heading'),
        items: [
          { label: t('section_ai_lab'), desc: t('nav_tech_ai_desc'), path: "/ai", icon: <Sparkles size={15} />, hot: true },
          { label: t('section_prompt_lab'), desc: t('nav_tech_prompt_desc'), path: "/prompts", icon: <Cpu size={15} /> },
          { label: t('section_tech_tips'), desc: t('nav_tech_tips_desc'), path: "/tips", icon: <Zap size={15} /> },
        ],
      },
      {
        heading: t('nav_tech_sol_heading'),
        items: [
          { label: "Website Solutions", desc: t('nav_tech_web_desc'), path: "/websites", icon: <Globe size={15} /> },
          { label: t('nav_tech_digi_label'), desc: t('nav_tech_digi_desc'), path: "/digital-tools", icon: <LayoutGrid size={15} /> },
        ],
      },
    ],
  },
  {
    id: "vpn", label: t('nav_vpn'),
    featured: { title: "STEA VPN Guide", desc: t('nav_vpn_desc'), path: "/vpn", icon: "🔒" },
    cols: [
      {
        heading: t('nav_vpn_help_heading'),
        items: [
          { label: t('nav_vpn_guide_label'), desc: t('nav_vpn_guide_desc'), path: "/vpn", icon: <ShieldCheck size={15} /> },
          { label: t('nav_vpn_setup_label'), desc: t('nav_vpn_setup_desc'), path: "/vpn", icon: <Zap size={15} /> },
        ],
      },
    ],
  },
  {
    id: "exams", label: t('nav_exams'),
    featured: { title: t('nav_exams_title'), desc: t('nav_exams_desc'), path: "/exams", icon: "🎓" },
    cols: [
      {
        heading: t('nav_exams_res_heading'),
        items: [
          { label: t('nav_exams_necta_label'), desc: t('nav_exams_necta_desc'), path: "/exams/results", icon: <LayoutGrid size={15} />, hot: true },
          { label: t('nav_exams_past_label'), desc: t('nav_exams_past_desc'), path: "/exams/past-papers", icon: <BookOpen size={15} /> },
          { label: t('nav_exams_prac_label'), desc: t('nav_exams_prac_desc'), path: "/exams/practice", icon: <Star size={15} /> },
        ],
      },
      {
        heading: t('nav_exams_res_heading2'),
        items: [
          { label: t('nav_exams_notes_label'), desc: t('nav_exams_notes_desc'), path: "/exams/notes", icon: <BookOpen size={15} /> },
          { label: t('nav_exams_uni_label'), desc: t('nav_exams_uni_desc'), path: "/university-guide", icon: <GraduationCap size={15} />, hot: true, badge: "New" },
          { label: t('nav_exams_courses_label'), desc: t('nav_exams_courses_desc'), path: "/courses", icon: <GraduationCap size={15} /> },
        ],
      },
    ],
  },
  {
    id: "huduma", label: t('nav_huduma'),
    featured: { title: t('nav_huduma_title'), desc: t('nav_huduma_desc'), path: "/huduma", icon: "📣" },
    cols: [
      {
        heading: t('nav_huduma_biz_heading'),
        items: [
          { label: t('nav_huduma_ads_label'), desc: t('nav_huduma_ads_desc'), path: "/advertise", icon: <Megaphone size={15} />, hot: true, special: true },
          { label: t('nav_huduma_promo_label'), desc: t('nav_huduma_promo_desc'), path: "/advertise", icon: <Tag size={15} /> },
          { label: t('nav_huduma_brand_label'), desc: t('nav_huduma_brand_desc'), path: "/advertise", icon: <Star size={15} /> },
        ],
      },
      {
        heading: t('nav_huduma_digi_heading'),
        items: [
          { label: t('nav_huduma_web_label'), desc: t('nav_huduma_web_desc'), path: "/websites", icon: <Globe size={15} /> },
          { label: t('nav_huduma_sup_label'), desc: t('nav_huduma_sup_desc'), path: "/contact", icon: <HelpCircle size={15} /> },
          { label: t('nav_huduma_youth_label'), desc: t('nav_huduma_youth_desc'), path: "/about", icon: <Sparkles size={15} /> },
          { label: t('pillar_money_title'), desc: t('pillar_money_desc'), path: "/money-guide", icon: <Globe size={15} /> },
        ],
      },
    ],
  },
  {
    id: "duka", label: t('nav_duka'),
    featured: { title: t('nav_duka_title'), desc: t('nav_duka_desc'), path: "/duka/phones", icon: "🛍️" },
    cols: [
      {
        heading: t('nav_duka_cat_heading'),
        items: [
          { label: t('nav_duka_tech_label'), desc: t('nav_duka_tech_desc'), path: "/duka/phones", icon: <Smartphone size={15} />, hot: true },
          { label: t('nav_duka_acc_label'), desc: t('nav_duka_acc_desc'), path: "/duka/laptops", icon: <Laptop size={15} /> },
          { label: t('nav_duka_assets_label'), desc: t('nav_duka_assets_desc'), path: "/duka/accessories", icon: <ShoppingBag size={15} /> },
        ],
      },
      {
        heading: t('nav_duka_seller_heading'),
        items: [
          { label: t('nav_duka_sell_label'), desc: t('nav_duka_sell_desc'), path: "/duka/furniture", icon: <LayoutGrid size={15} /> },
          { label: t('nav_duka_dash_label'), desc: t('nav_duka_dash_desc'), path: "/duka/beauty", icon: <Sparkles size={15} /> },
          { label: t('nav_duka_uza_label'), desc: t('nav_duka_uza_desc'), path: "/sell", icon: <Tag size={15} />, badge: "Join" },
        ],
      },
    ],
  },
  {
    id: "gigs", label: t('nav_gigs'),
    featured: { title: t('nav_gigs_title'), desc: t('nav_gigs_desc'), path: "/gigs", icon: "💼" },
    cols: [
      {
        heading: t('nav_gigs_find_heading'),
        items: [
          { label: t('nav_gigs_remote_label'), desc: t('nav_gigs_remote_desc'), path: "/gigs?type=remote", icon: <Wifi size={15} />, hot: true },
          { label: t('nav_gigs_local_label'), desc: t('nav_gigs_local_desc'), path: "/gigs?type=local", icon: <Briefcase size={15} /> },
          { label: t('nav_gigs_free_label'), desc: t('nav_gigs_free_desc'), path: "/gigs?type=freelance", icon: <LayoutGrid size={15} /> },
        ],
      },
      {
        heading: t('nav_gigs_post_heading'),
        items: [
          { label: t('nav_gigs_post_label'), desc: t('nav_gigs_post_desc'), path: "/gigs?type=internship", icon: <GraduationCap size={15} /> },
          { label: t('nav_gigs_tuma_label'), desc: t('nav_gigs_tuma_desc'), path: "/gigs?action=post", icon: <Zap size={15} />, badge: "Bure" },
        ],
      },
    ],
  },
  { id: "about", label: t('nav_about'), path: "/about" },
];

// ── UserChip ─────────────────────────────────────────
function UserChip({ user, onLogout, onAdmin, onProfile, t }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const ini = (user.displayName || user.email || "S")[0].toUpperCase();
  const photoURL = user.photoURL;

  return (
    <div ref={ref} style={{ position: "relative", flexShrink: 0 }}>
      <button onClick={() => setOpen(v => !v)} aria-label="Account"
        style={{
          width: 36, height: 36, borderRadius: "50%", border: `2px solid ${open ? G : "rgba(245,166,35,.3)"}`,
          background: open ? G : "rgba(245,166,35,.12)", color: open ? "#111" : G,
          fontWeight: 900, fontSize: 14, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all .2s", overflow: "hidden",
          padding: 0,
        }}>
        {photoURL ? (
          <img src={photoURL} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} referrerPolicy="no-referrer" onError={e => { e.target.style.display = "none"; }} />
        ) : ini}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 6, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: .96 }}
            transition={{ duration: .14 }}
            style={{ position: "absolute", top: "calc(100% + 10px)", right: 0, minWidth: 220, background: "rgba(8,9,18,.99)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 16, boxShadow: "0 24px 60px rgba(0,0,0,.8)", padding: 8, zIndex: 10001, backdropFilter: "blur(20px)" }}>
            <div style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,.06)", marginBottom: 6 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.displayName || "STEA User"}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.35)", overflow: "hidden", textOverflow: "ellipsis", marginTop: 2 }}>{user.email}</div>
              {(user.role === "super_admin" || user.role === "admin" || user.role === "manager" || user.role === "seller" || user.role === "creator" || user.role === "reviewer") && (
                <div style={{ marginTop: 6, display: "inline-flex", alignItems: "center", gap: 4, fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".08em", color: G, background: `${G}15`, padding: "2px 8px", borderRadius: 4 }}>
                  <ShieldCheck size={9} /> {user.role.replace("_", " ")}
                </div>
              )}
            </div>
            {(user.role === "super_admin" || user.role === "admin" || user.role === "manager" || user.role === "seller" || user.role === "creator" || user.role === "reviewer") && (
              <MenuItem 
                icon={<ShieldCheck size={15} />} 
                label={
                  user.role === "seller" ? t('seller_dashboard') : 
                  user.role === "manager" ? `${(user.sector || "General").replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())} Manager` :
                  user.role === "creator" ? `${(user.sector || "General").replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())} Creator` :
                  user.role === "reviewer" ? `${(user.sector || "General").replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())} Reviewer` :
                  t('admin_panel')
                } 
                color={G} onClick={() => { setOpen(false); onAdmin(); }} />
            )}
            <MenuItem icon={<User size={15} />} label={t('user_profile')} onClick={() => { setOpen(false); onProfile(); }} />
            <div style={{ borderTop: "1px solid rgba(255,255,255,.06)", marginTop: 6, paddingTop: 6 }}>
              <MenuItem icon={<LogOut size={15} />} label={t('user_logout')} color="#ef4444" onClick={() => { setOpen(false); onLogout(); }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const MenuItem = ({ icon, label, color = "rgba(255,255,255,.8)", onClick }) => (
  <button onClick={onClick}
    style={{ width: "100%", padding: "10px 14px", border: "none", background: "transparent", color, fontWeight: 700, fontSize: 13, textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, borderRadius: 10, transition: "background .15s" }}
    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.05)"}
    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
    <span style={{ opacity: .7 }}>{icon}</span>{label}
  </button>
);

// ── Mega Menu Panel ──────────────────────────────────
function MegaMenu({ item, onClose, onTangazaNasi }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: .18, ease: [.4, 0, .2, 1] }}
      style={{
        position: "absolute",
        top: "calc(100% + 12px)",
        left: "50%",
        transform: "translateX(-50%)",
        width: item.cols?.length === 2 ? 520 : 300,
        background: "rgba(6,7,14,.98)",
        border: "1px solid rgba(255,255,255,.09)",
        borderRadius: 20,
        boxShadow: "0 32px 80px rgba(0,0,0,.75), 0 0 0 1px rgba(245,166,35,.05)",
        overflow: "hidden",
        zIndex: 9999,
      }}
    >
      {/* Featured header */}
      {item.featured && (
        <Link to={item.featured.path}
          onClick={(e) => {
            if (item.featured.path === "/advertise") { e.preventDefault(); onTangazaNasi(); }
            onClose();
          }}
          style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", background: "linear-gradient(135deg,rgba(245,166,35,.1),rgba(245,166,35,.03))", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(245,166,35,.15)", display: "grid", placeItems: "center", fontSize: 22, flexShrink: 0 }}>
            {item.featured.icon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "#fff", fontWeight: 800, fontSize: 14 }}>{item.featured.title}</span>
              {item.featured.badge && (
                <span style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".06em", color: "#111", background: G, padding: "2px 7px", borderRadius: 4 }}>{item.featured.badge}</span>
              )}
            </div>
            <div style={{ color: "rgba(255,255,255,.45)", fontSize: 12, marginTop: 2 }}>{item.featured.desc}</div>
          </div>
          <ArrowRight size={14} color="rgba(255,255,255,.25)" />
        </Link>
      )}

      {/* Columns */}
      <div style={{ display: "grid", gridTemplateColumns: item.cols?.length === 2 ? "1fr 1fr" : "1fr", padding: "10px 8px 10px" }}>
        {(item.cols || []).map((col, ci) => (
          <div key={ci} style={{ padding: "0 6px" }}>
            <div style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".12em", color: "rgba(255,255,255,.25)", padding: "6px 10px", marginBottom: 2 }}>
              {col.heading}
            </div>
            {col.items.map((it) => (
              <Link key={it.path + it.label} to={it.path}
                onClick={(e) => {
                  if (it.special || it.path === "/advertise") { e.preventDefault(); onTangazaNasi(); }
                  onClose();
                }}
                style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 12, color: "#fff", transition: "background .14s" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.05)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: it.hot ? `${G}18` : "rgba(255,255,255,.05)", display: "grid", placeItems: "center", color: it.hot ? G : "rgba(255,255,255,.4)", flexShrink: 0 }}>
                  {it.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{it.label}</span>
                    {it.badge && (
                      <span style={{ fontSize: 8, fontWeight: 900, textTransform: "uppercase", color: G, background: `${G}18`, padding: "1px 5px", borderRadius: 3 }}>{it.badge}</span>
                    )}
                    {it.hot && <span style={{ fontSize: 8, color: "#ef4444", fontWeight: 900 }}>●</span>}
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,.32)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ── Mobile Drawer ────────────────────────────────────
// ── Main Navbar ──────────────────────────────────────
export default function Navbar({ user, onAuth, onAdmin, onProfile, onSearch, onNotif, onTangazaNasi, onLogout }) {
  const [activeMenu, setActiveMenu] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const location = useLocation();
  const closeTimer = useRef(null);
  const { t } = useSettings();

  const NAV = getNav(t);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  // Close mega menu on route change
  useEffect(() => { 
    const timer = setTimeout(() => {
      setActiveMenu(null); 
    }, 0);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const handleMenuEnter = useCallback((id) => {
    clearTimeout(closeTimer.current);
    setActiveMenu(id);
  }, []);

  const handleMenuLeave = useCallback(() => {
    closeTimer.current = setTimeout(() => setActiveMenu(null), 120);
  }, []);

  const isNavItemActive = (item) => {
    if (item.path) return location.pathname === item.path;
    if (item.cols) {
      const allPaths = item.cols.flatMap(c => c.items.map(i => i.path));
      return allPaths.some(p => location.pathname.startsWith(p) && p !== "/");
    }
    return false;
  };

  return (
    <>
      <header style={{
        position: "sticky", top: 0, zIndex: 9000,
        marginBottom: scrolled ? -61 : -69,
        transition: "all .3s cubic-bezier(.4,0,.2,1)",
        background: scrolled
          ? "rgba(4, 5, 10, 0.9)"
          : "rgba(4, 5, 10, 0.6)",
        backdropFilter: "blur(28px) saturate(180%)",
        WebkitBackdropFilter: "blur(28px) saturate(180%)",
        borderBottom: scrolled
          ? "1px solid rgba(255,255,255,0.08)"
          : "1px solid rgba(255,255,255,0.04)",
        boxShadow: scrolled
          ? "0 1px 0 rgba(255,255,255,0.04), 0 8px 32px rgba(0,0,0,0.45)"
          : "none",
      }}>
        <div style={{
          maxWidth: 1300, margin: "0 auto",
          padding: scrolled ? "0 24px" : "0 24px",
          height: scrolled ? 60 : 68,
          display: "flex", alignItems: "center", gap: 8,
          transition: "height .3s",
        }}>

          {/* ── Logo ── */}
          <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10, flexShrink: 0, marginRight: 8 }}>
            <motion.div
              whileHover={{ scale: 1.05 }}
              style={{
                width: scrolled ? 34 : 38, height: scrolled ? 34 : 38, borderRadius: 11,
                background: `linear-gradient(135deg,${G},${G2})`,
                display: "grid", placeItems: "center",
                boxShadow: `0 6px 18px ${G}40`,
                transition: "all .3s",
              }}>
              <span style={{ color: "#111", fontWeight: 900, fontSize: scrolled ? 17 : 19 }}>S</span>
            </motion.div>
            <div>
              <div style={{ color: "#fff", fontWeight: 900, fontSize: scrolled ? 17 : 20, letterSpacing: "-.03em", lineHeight: 1, fontFamily: "'Bricolage Grotesque',sans-serif" }}>
                STEA
              </div>
              <div style={{ color: "rgba(255,255,255,.3)", fontSize: 8, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".14em", lineHeight: 1, marginTop: 2 }}>
                Kila Kitu Mahali Pamoja
              </div>
            </div>
          </Link>

          {/* ── Desktop Nav ── */}
          <nav id="desktopNav" style={{
            display: "flex", alignItems: "center", flex: 1, justifyContent: "center", gap: 2,
          }}>
            {NAV.map((item) => {
              const isActive = isNavItemActive(item);
              const isOpen = activeMenu === item.id;

              if (!item.cols) {
                return (
                  <Link key={item.id} to={item.path}
                    style={{
                      padding: "8px 13px", borderRadius: 10,
                      color: isActive ? G : "rgba(255,255,255,.65)",
                      fontWeight: isActive ? 800 : 700, fontSize: 13.5,
                      textDecoration: "none", transition: "all .15s",
                      background: isActive ? `${G}12` : "transparent",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.background = "rgba(255,255,255,.06)"; }}
                    onMouseLeave={e => { e.currentTarget.style.color = isActive ? G : "rgba(255,255,255,.65)"; e.currentTarget.style.background = isActive ? `${G}12` : "transparent"; }}>
                    {item.label}
                  </Link>
                );
              }

              return (
                <div key={item.id} style={{ position: "relative" }}
                  onMouseEnter={() => handleMenuEnter(item.id)}
                  onMouseLeave={handleMenuLeave}>
                  <button 
                    onClick={() => setActiveMenu(isOpen ? null : item.id)}
                    style={{
                    background: isOpen ? `${G}12` : "transparent",
                    border: "none",
                    padding: "8px 13px", borderRadius: 10,
                    color: isActive || isOpen ? G : "rgba(255,255,255,.65)",
                    fontWeight: isActive || isOpen ? 800 : 700, fontSize: 13.5,
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 4, transition: "all .15s",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.color = isActive || isOpen ? G : "#fff"; e.currentTarget.style.background = `${G}10`; }}
                    onMouseLeave={e => { e.currentTarget.style.color = isActive || isOpen ? G : "rgba(255,255,255,.65)"; e.currentTarget.style.background = isOpen ? `${G}12` : "transparent"; }}>
                    {item.label}
                    <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: .2 }}>
                      <ChevronDown size={13} />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <MegaMenu item={item} onClose={() => setActiveMenu(null)} onTangazaNasi={onTangazaNasi} />
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </nav>

          {/* ── Right Actions ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            {/* Search */}
            <button onClick={onSearch}
              style={{ width: 38, height: 38, borderRadius: 11, border: "1px solid rgba(255,255,255,.08)", background: "rgba(255,255,255,.04)", color: "rgba(255,255,255,.6)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s", WebkitTapHighlightColor: "transparent" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.09)"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "rgba(255,255,255,.14)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.04)"; e.currentTarget.style.color = "rgba(255,255,255,.6)"; e.currentTarget.style.borderColor = "rgba(255,255,255,.08)"; }}
              onTouchStart={e => { e.currentTarget.style.background = "rgba(255,255,255,.12)"; e.currentTarget.style.transform = "scale(0.93)"; }}
              onTouchEnd={e => { e.currentTarget.style.background = "rgba(255,255,255,.04)"; e.currentTarget.style.transform = ""; }}>
              <Search size={17} />
            </button>

            {/* Settings */}
            <button onClick={() => setSettingsOpen(true)}
              style={{ width: 38, height: 38, borderRadius: 11, border: "1px solid rgba(255,255,255,.08)", background: "rgba(255,255,255,.04)", color: "rgba(255,255,255,.6)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s", WebkitTapHighlightColor: "transparent" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.09)"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "rgba(255,255,255,.14)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.04)"; e.currentTarget.style.color = "rgba(255,255,255,.6)"; e.currentTarget.style.borderColor = "rgba(255,255,255,.08)"; }}
              onTouchStart={e => { e.currentTarget.style.background = "rgba(255,255,255,.12)"; e.currentTarget.style.transform = "scale(0.93)"; }}
              onTouchEnd={e => { e.currentTarget.style.background = "rgba(255,255,255,.04)"; e.currentTarget.style.transform = ""; }}>
              <Settings size={17} />
            </button>

            {/* Notif */}
            <button onClick={onNotif}
              style={{ width: 38, height: 38, borderRadius: 11, border: "1px solid rgba(255,255,255,.08)", background: "rgba(255,255,255,.04)", color: "rgba(255,255,255,.6)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", transition: "all .15s", WebkitTapHighlightColor: "transparent" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.09)"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "rgba(255,255,255,.14)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.04)"; e.currentTarget.style.color = "rgba(255,255,255,.6)"; e.currentTarget.style.borderColor = "rgba(255,255,255,.08)"; }}
              onTouchStart={e => { e.currentTarget.style.background = "rgba(255,255,255,.12)"; e.currentTarget.style.transform = "scale(0.93)"; }}
              onTouchEnd={e => { e.currentTarget.style.background = "rgba(255,255,255,.04)"; e.currentTarget.style.transform = ""; }}>
              <Bell size={17} />
              <span style={{ position: "absolute", top: 9, right: 9, width: 6, height: 6, background: G, borderRadius: "50%", border: "1.5px solid #04050b" }} />
            </button>

            {user ? (
              <UserChip user={user} onLogout={onLogout} onAdmin={onAdmin} onProfile={onProfile} t={t} />
            ) : (
              <button onClick={onAuth}
                style={{ height: 38, padding: "0 18px", borderRadius: 11, background: `linear-gradient(135deg,${G},${G2})`, color: "#111", fontWeight: 900, fontSize: 13, border: "none", cursor: "pointer", boxShadow: `0 4px 14px ${G}35`, transition: "all .2s", WebkitTapHighlightColor: "transparent" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 8px 22px ${G}45`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = `0 4px 14px ${G}35`; }}
                onTouchStart={e => { e.currentTarget.style.transform = "scale(0.95)"; }}
                onTouchEnd={e => { e.currentTarget.style.transform = ""; }}>
                {t('auth_login')}
              </button>
            )}

            {/* Hamburger — mobile */}
          </div>
        </div>
      </header>

      {/* Settings Modal */}
      {createPortal(
        <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />,
        document.body
      )}

      <style>{`
      `}</style>
    </>
  );
}
