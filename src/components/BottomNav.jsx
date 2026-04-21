/**
 * BottomNav — Premium glass mobile navigation
 * Smooth active indicators · haptic-feel press · gold accents
 */
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Cpu, GraduationCap, ShoppingBag, Menu } from "lucide-react";

const G  = "#F5A623";
const G2 = "#FFD17C";

const ITEMS = [
  { to: "/",             icon: Home,          label: "Home",    match: (p) => p === "/" },
  { to: "/tech",        icon: Cpu,           label: "Tech",    match: (p) => p.startsWith("/tech") || p === "/ai" || p === "/tips" || p === "/prompts" },
  { to: "/exams",       icon: GraduationCap, label: "Student", match: (p) => p.startsWith("/exams") || p === "/courses" || p.startsWith("/university") },
  { to: "/duka/phones", icon: ShoppingBag,   label: "Duka",    match: (p) => p.startsWith("/duka") },
  { to: "/huduma",      icon: Menu,          label: "Menu",    match: (p) => p === "/huduma" || p.startsWith("/huduma") },
];

function NavItem({ to, icon: Icon, label, active }) {
  return (
    <Link
      to={to}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", gap: 3, flex: 1,
        textDecoration: "none",
        color: active ? G : "rgba(255,255,255,0.38)",
        transition: "color 0.2s ease",
        position: "relative",
        padding: "6px 0",
        WebkitTapHighlightColor: "transparent",
        userSelect: "none",
      }}
    >
      {/* Active background pill */}
      {active && (
        <motion.div
          layoutId="nav-pill"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 52,
            height: 36,
            borderRadius: 12,
            background: `linear-gradient(135deg, rgba(245,166,35,0.18), rgba(255,209,124,0.08))`,
            border: "1px solid rgba(245,166,35,0.2)",
          }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}

      <motion.div
        whileTap={{ scale: 0.85 }}
        style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <Icon
          size={20}
          strokeWidth={active ? 2.5 : 1.8}
          style={{
            filter: active ? `drop-shadow(0 0 6px rgba(245,166,35,0.5))` : "none",
            transition: "filter 0.25s ease",
          }}
        />
      </motion.div>

      <span style={{
        fontSize: 9.5, fontWeight: active ? 800 : 600,
        letterSpacing: "0.03em", position: "relative", zIndex: 1,
        transition: "font-weight 0.2s",
      }}>
        {label}
      </span>
    </Link>
  );
}

export default function BottomNav() {
  const location = useLocation();
  const path = location.pathname;

  return (
    <div style={{
      position: "fixed",
      bottom: 0, left: 0, right: 0,
      height: 64,
      background: "rgba(4, 5, 10, 0.92)",
      backdropFilter: "blur(32px) saturate(180%)",
      WebkitBackdropFilter: "blur(32px) saturate(180%)",
      borderTop: "1px solid rgba(255,255,255,0.08)",
      boxShadow: "0 -1px 0 rgba(255,255,255,0.05), 0 -16px 48px rgba(0,0,0,0.55)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-around",
      padding: "0 8px",
      paddingBottom: "env(safe-area-inset-bottom, 0px)",
      zIndex: 1000,
    }}>
      {ITEMS.map((item) => (
        <NavItem
          key={item.to}
          to={item.to}
          icon={item.icon}
          label={item.label}
          active={item.match(path)}
        />
      ))}
    </div>
  );
}
