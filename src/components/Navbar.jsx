import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Bell, X, LogOut, User,
  ShieldCheck, Cpu, Globe, Zap, GraduationCap, ShoppingBag,
  Briefcase, Sparkles, BookOpen, LayoutGrid, Wifi,
  HelpCircle, Megaphone, Star, Tag, Laptop, Smartphone,
  ChevronDown, ArrowRight, Menu,
} from "lucide-react";

const G = "#F5A623";
const G2 = "#FFD17C";

// ── Nav Taxonomy ─────────────────────────────────────
const NAV = [
  { id: "home", label: "Home", path: "/" },
  {
    id: "tech-hub", label: "Tech Hub",
    featured: { title: "Tech Hub", desc: "Zana za AI, Prompts na Tips", path: "/tech", icon: "💡" },
    cols: [
      {
        heading: "Zana za Tech",
        items: [
          { label: "AI Lab", desc: "ChatGPT, Gemini na zaidi", path: "/ai", icon: <Sparkles size={15} />, hot: true },
          { label: "Prompt Lab", desc: "Prompts bora za AI", path: "/prompts", icon: <Cpu size={15} /> },
          { label: "Tech Tips", desc: "Maujanja ya Android, iPhone & PC", path: "/tips", icon: <Zap size={15} /> },
        ],
      },
      {
        heading: "Suluhisho",
        items: [
          { label: "Website Solutions", desc: "Websites bora na za siri", path: "/websites", icon: <Globe size={15} /> },
          { label: "Digital Tools", desc: "Zana za dijiti za bure", path: "/digital-tools", icon: <LayoutGrid size={15} /> },
        ],
      },
    ],
  },
  {
    id: "vpn", label: "VPN",
    featured: { title: "STEA VPN Guide", desc: "Msaada wa VPN kwa wasafiri", path: "/vpn", icon: "🔒" },
    cols: [
      {
        heading: "Msaada",
        items: [
          { label: "VPN Guide", desc: "Mwongozo wa VPN", path: "/vpn", icon: <ShieldCheck size={15} /> },
          { label: "Setup Help", desc: "Msaada wa setup", path: "/vpn", icon: <Zap size={15} /> },
        ],
      },
    ],
  },
  {
    id: "exams", label: "Exams Hub",
    featured: { title: "Student Center", desc: "Matokeo, Past Papers, Notes", path: "/exams", icon: "🎓" },
    cols: [
      {
        heading: "Mitihani & Matokeo",
        items: [
          { label: "NECTA Results", desc: "Matokeo ya NECTA yote", path: "/exams/results", icon: <LayoutGrid size={15} />, hot: true },
          { label: "Past Papers", desc: "Mitihani iliyopita", path: "/exams/past-papers", icon: <BookOpen size={15} /> },
          { label: "Practice & Quiz", desc: "Jipime uwezo wako", path: "/exams/practice", icon: <Star size={15} /> },
        ],
      },
      {
        heading: "Nyenzo",
        items: [
          { label: "Study Notes", desc: "Notes za masomo yote", path: "/exams/notes", icon: <BookOpen size={15} /> },
          { label: "University Guide", desc: "Mwongozo wa kujiunga chuo", path: "/university-guide", icon: <GraduationCap size={15} />, hot: true, badge: "New" },
          { label: "Online Courses", desc: "Kozi za skills za kisasa", path: "/courses", icon: <GraduationCap size={15} /> },
        ],
      },
    ],
  },
  {
    id: "huduma", label: "Huduma",
    featured: { title: "Huduma Hub", desc: "Huduma za kidijitali kwako", path: "/huduma", icon: "📣" },
    cols: [
      {
        heading: "Biashara",
        items: [
          { label: "Tangaza Nasi", desc: "Advertise kwenye STEA", path: "/advertise", icon: <Megaphone size={15} />, hot: true, special: true },
          { label: "Product Promotion", desc: "Tangaza bidhaa zako", path: "/advertise", icon: <Tag size={15} /> },
          { label: "Brand Partnerships", desc: "Fanya kazi nasi", path: "/advertise", icon: <Star size={15} /> },
        ],
      },
      {
        heading: "Dijiti",
        items: [
          { label: "Website Solutions", desc: "Ujenzi wa websites", path: "/websites", icon: <Globe size={15} /> },
          { label: "Digital Support", desc: "Msaada wa dijiti", path: "/contact", icon: <HelpCircle size={15} /> },
          { label: "Youth Services", desc: "Huduma za vijana", path: "/about", icon: <Sparkles size={15} /> },
        ],
      },
    ],
  },
  {
    id: "duka", label: "Duka",
    featured: { title: "STEA Marketplace", desc: "Simu, Laptops, Accessories na zaidi", path: "/duka", icon: "🛍️" },
    cols: [
      {
        heading: "Bidhaa",
        items: [
          { label: "Simu", desc: "iPhone, Samsung, Tecno...", path: "/duka/phones", icon: <Smartphone size={15} />, hot: true },
          { label: "Laptops", desc: "HP, Dell, MacBook...", path: "/duka/laptops", icon: <Laptop size={15} /> },
          { label: "Accessories", desc: "Chargers, earbuds na zaidi", path: "/duka/accessories", icon: <ShoppingBag size={15} /> },
        ],
      },
      {
        heading: "Zaidi",
        items: [
          { label: "Samani", desc: "Sofa, Vitanda, Meza...", path: "/duka/furniture", icon: <LayoutGrid size={15} /> },
          { label: "Beauty & Urembo", desc: "Perfumes, skincare...", path: "/duka/beauty", icon: <Sparkles size={15} /> },
          { label: "Uza STEA", desc: "Wasiliana nasi uuze", path: "/sell", icon: <Tag size={15} />, badge: "Join" },
        ],
      },
    ],
  },
  {
    id: "gigs", label: "Gigs",
    featured: { title: "STEA Gigs", desc: "Pata kazi, gigs na internships Tanzania", path: "/gigs", icon: "💼" },
    cols: [
      {
        heading: "Fursa za Kazi",
        items: [
          { label: "Remote Jobs", desc: "Kazi za mbali — earn online", path: "/gigs?type=remote", icon: <Wifi size={15} />, hot: true },
          { label: "Local Gigs", desc: "Kazi za karibu nawe", path: "/gigs?type=local", icon: <Briefcase size={15} /> },
          { label: "Freelance", desc: "Miradi ya freelance", path: "/gigs?type=freelance", icon: <LayoutGrid size={15} /> },
        ],
      },
      {
        heading: "Fursa Zaidi",
        items: [
          { label: "Internships", desc: "Mafunzo ya vitendo", path: "/gigs?type=internship", icon: <GraduationCap size={15} /> },
          { label: "Tuma Gig Yako", desc: "Weka nafasi yako bure", path: "/gigs?action=post", icon: <Zap size={15} />, badge: "Bure" },
        ],
      },
    ],
  },
  { id: "about", label: "About", path: "/about" },
];

// ── UserChip ─────────────────────────────────────────
function UserChip({ user, onLogout, onAdmin, onProfile }) {
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
              {user.role === "admin" && (
                <div style={{ marginTop: 6, display: "inline-flex", alignItems: "center", gap: 4, fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".08em", color: G, background: `${G}15`, padding: "2px 8px", borderRadius: 4 }}>
                  <ShieldCheck size={9} /> Admin
                </div>
              )}
            </div>
            {user.role === "admin" && (
              <MenuItem icon={<ShieldCheck size={15} />} label="Admin Panel" color={G} onClick={() => { setOpen(false); onAdmin(); }} />
            )}
            <MenuItem icon={<User size={15} />} label="My Profile" onClick={() => { setOpen(false); onProfile(); }} />
            <div style={{ borderTop: "1px solid rgba(255,255,255,.06)", marginTop: 6, paddingTop: 6 }}>
              <MenuItem icon={<LogOut size={15} />} label="Logout" color="#ef4444" onClick={() => { setOpen(false); onLogout(); }} />
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
function MobileDrawer({ open, onClose, user, onAuth, onAdmin, onProfile, onLogout, onTangazaNasi }) {
  const [expanded, setExpanded] = useState(null);
  const location = useLocation();

  useEffect(() => {
    if (open) { document.body.style.overflow = "hidden"; }
    else { 
      document.body.style.overflow = ""; 
      const timer = setTimeout(() => setExpanded(null), 0);
      return () => clearTimeout(timer);
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => { onClose(); }, [location.pathname, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: "fixed", inset: 0, zIndex: 9800, background: "rgba(2,3,8,.7)", backdropFilter: "blur(8px)" }} />

          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 280 }}
            style={{
              position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 9900,
              width: "min(340px, 92vw)",
              background: "#08090f",
              border: "1px solid rgba(255,255,255,.07)",
              borderRight: "none",
              display: "flex", flexDirection: "column",
              overflowY: "auto",
            }}>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 20px 14px", borderBottom: "1px solid rgba(255,255,255,.06)", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: `linear-gradient(135deg,${G},${G2})`, display: "grid", placeItems: "center" }}>
                  <span style={{ color: "#111", fontWeight: 900, fontSize: 16 }}>S</span>
                </div>
                <span style={{ color: "#fff", fontWeight: 900, fontSize: 18, letterSpacing: "-.02em" }}>STEA</span>
              </div>
              <button onClick={onClose}
                style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.04)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={18} />
              </button>
            </div>

            {/* User strip */}
            {user ? (
              <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,.06)", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: `${G}18`, border: `1.5px solid ${G}40`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: G, fontSize: 15, overflow: "hidden", flexShrink: 0 }}>
                  {user.photoURL ? <img src={user.photoURL} style={{ width: "100%", height: "100%", objectFit: "cover" }} referrerPolicy="no-referrer" /> : (user.displayName || user.email || "S")[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.displayName || "STEA User"}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,.35)", overflow: "hidden", textOverflow: "ellipsis" }}>{user.email}</div>
                </div>
              </div>
            ) : (
              <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
                <button onClick={() => { onClose(); onAuth(); }}
                  style={{ width: "100%", height: 44, borderRadius: 12, border: "none", background: `linear-gradient(135deg,${G},${G2})`, color: "#111", fontWeight: 900, cursor: "pointer", fontSize: 14 }}>
                  Ingia / Jisajili
                </button>
              </div>
            )}

            {/* Nav items */}
            <div style={{ flex: 1, overflowY: "auto", padding: "8px 12px" }}>
              {/* Home */}
              <Link to="/" onClick={onClose}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 15, marginBottom: 2 }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.05)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                🏠 Home
              </Link>

              {NAV.filter(n => n.cols).map((item) => {
                const isExpanded = expanded === item.id;
                return (
                  <div key={item.id}>
                    <button onClick={() => setExpanded(isExpanded ? null : item.id)}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, border: "none", background: isExpanded ? "rgba(245,166,35,.07)" : "transparent", color: isExpanded ? G : "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", textAlign: "left", marginBottom: 2 }}>
                      <span style={{ flex: 1 }}>
                        {item.id === "tech-hub" && "💡 "}
                        {item.id === "vpn" && "🔒 "}
                        {item.id === "exams" && "📚 "}
                        {item.id === "huduma" && "📣 "}
                        {item.id === "duka" && "🛍️ "}
                        {item.id === "gigs" && "💼 "}
                        {item.label}
                      </span>
                      <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: .2 }}>
                        <ChevronDown size={16} />
                      </motion.div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: .22 }}
                          style={{ overflow: "hidden", paddingLeft: 8, marginBottom: 4 }}
                        >
                          {(item.cols || []).flatMap(col => col.items).map(it => (
                            <Link key={it.path + it.label} to={it.path}
                              onClick={(e) => {
                                if (it.special || it.path === "/advertise") { e.preventDefault(); onTangazaNasi(); }
                                onClose();
                              }}
                              style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", borderRadius: 10, color: "rgba(255,255,255,.75)", fontSize: 14, fontWeight: 600, marginBottom: 1 }}
                              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.04)"}
                              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                              <span style={{ color: it.hot ? G : "rgba(255,255,255,.3)", flexShrink: 0 }}>{it.icon}</span>
                              <span style={{ flex: 1 }}>{it.label}</span>
                              {it.badge && <span style={{ fontSize: 9, fontWeight: 900, color: G, background: `${G}15`, padding: "2px 6px", borderRadius: 3 }}>{it.badge}</span>}
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}

              {/* About */}
              <Link to="/about" onClick={onClose}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 15, marginTop: 2 }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.05)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                ℹ️ About
              </Link>
            </div>

            {/* Bottom actions */}
            {user && (
              <div style={{ padding: "12px 20px 20px", borderTop: "1px solid rgba(255,255,255,.06)", display: "grid", gap: 6, flexShrink: 0 }}>
                {user.role === "admin" && (
                  <button onClick={() => { onClose(); onAdmin(); }}
                    style={{ height: 42, borderRadius: 11, border: `1px solid ${G}30`, background: `${G}10`, color: G, fontWeight: 800, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <ShieldCheck size={15} /> Admin Panel
                  </button>
                )}
                <button onClick={() => { onClose(); onProfile(); }}
                  style={{ height: 42, borderRadius: 11, border: "1px solid rgba(255,255,255,.08)", background: "rgba(255,255,255,.03)", color: "rgba(255,255,255,.7)", fontWeight: 700, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <User size={15} /> My Profile
                </button>
                <button onClick={() => { onClose(); onLogout(); }}
                  style={{ height: 42, borderRadius: 11, border: "1px solid rgba(239,68,68,.2)", background: "rgba(239,68,68,.06)", color: "#ef4444", fontWeight: 700, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <LogOut size={15} /> Logout
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Main Navbar ──────────────────────────────────────
export default function Navbar({ user, onAuth, onAdmin, onProfile, onSearch, onNotif, onTangazaNasi, onLogout }) {
  const [activeMenu, setActiveMenu] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const closeTimer = useRef(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  // Close mega menu on route change
  useEffect(() => { 
    const timer = setTimeout(() => {
      setActiveMenu(null); 
      setMobileOpen(false); 
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
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 9000,
        transition: "all .35s cubic-bezier(.4,0,.2,1)",
        background: scrolled ? "rgba(4,5,11,.92)" : "transparent",
        backdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,.06)" : "1px solid transparent",
        boxShadow: scrolled ? "0 8px 32px rgba(0,0,0,.4)" : "none",
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
                SwahiliTech
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
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {/* Search */}
            <button onClick={onSearch}
              style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid rgba(255,255,255,.08)", background: "rgba(255,255,255,.04)", color: "rgba(255,255,255,.55)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.08)"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.04)"; e.currentTarget.style.color = "rgba(255,255,255,.55)"; }}>
              <Search size={16} />
            </button>

            {/* Notif */}
            <button onClick={onNotif}
              style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid rgba(255,255,255,.08)", background: "rgba(255,255,255,.04)", color: "rgba(255,255,255,.55)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", transition: "all .15s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.08)"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.04)"; e.currentTarget.style.color = "rgba(255,255,255,.55)"; }}>
              <Bell size={16} />
              <span style={{ position: "absolute", top: 8, right: 8, width: 6, height: 6, background: G, borderRadius: "50%", border: "1.5px solid #04050b" }} />
            </button>

            {user ? (
              <UserChip user={user} onLogout={onLogout} onAdmin={onAdmin} onProfile={onProfile} />
            ) : (
              <button onClick={onAuth}
                style={{ height: 36, padding: "0 18px", borderRadius: 10, background: `linear-gradient(135deg,${G},${G2})`, color: "#111", fontWeight: 900, fontSize: 13, border: "none", cursor: "pointer", boxShadow: `0 4px 14px ${G}35`, transition: "all .2s" }}
                onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
                onMouseLeave={e => e.currentTarget.style.transform = ""}>
                Ingia
              </button>
            )}

            {/* Hamburger — mobile */}
            <button id="hamburger" onClick={() => setMobileOpen(true)}
              style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.04)", color: "#fff", cursor: "pointer", display: "none", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
              <Menu size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {createPortal(
        <MobileDrawer
          open={mobileOpen} onClose={() => setMobileOpen(false)}
          user={user} onAuth={onAuth} onAdmin={onAdmin} onProfile={onProfile}
          onLogout={onLogout} onTangazaNasi={onTangazaNasi}
        />,
        document.body
      )}

      <style>{`
        @media (max-width: 1023px) {
          #desktopNav { display: none !important; }
          #hamburger { display: flex !important; }
        }
      `}</style>
    </>
  );
}
