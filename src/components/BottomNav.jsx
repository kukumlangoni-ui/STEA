import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Search, GraduationCap, Cpu, Menu } from "lucide-react";

const G = "#F5A623";

const NavItem = ({ to, icon: Icon, label, active }) => (
  <Link
    to={to}
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      flex: 1,
      textDecoration: "none",
      color: active ? G : "rgba(255,255,255,0.4)",
      transition: "all 0.2s",
      position: "relative",
    }}
  >
    <div style={{
      padding: "6px 16px",
      borderRadius: 16,
      background: active ? `${G}15` : "transparent",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "all 0.2s"
    }}>
      <Icon size={20} strokeWidth={active ? 2.5 : 2} />
    </div>
    <span style={{ fontSize: 10, fontWeight: active ? 800 : 600, letterSpacing: "0.02em" }}>{label}</span>
  </Link>
);

export default function BottomNav() {
  const location = useLocation();
  const path = location.pathname;

  return (
    <div style={{
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      height: 72,
      background: "rgba(10, 11, 15, 0.85)",
      backdropFilter: "blur(20px)",
      borderTop: "1px solid rgba(255,255,255,0.08)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-around",
      padding: "0 8px",
      zIndex: 1000,
      paddingBottom: "env(safe-area-inset-bottom)",
    }}>
      <NavItem to="/" icon={Home} label="Home" active={path === "/"} />
      <NavItem to="/tech" icon={Cpu} label="Tech" active={path.startsWith("/tech") || path === "/ai" || path === "/tips" || path === "/prompts"} />
      <NavItem to="/exams" icon={GraduationCap} label="Student" active={path.startsWith("/exams") || path === "/courses"} />
      <NavItem to="/duka" icon={Search} label="Duka" active={path.startsWith("/duka")} />
      <NavItem to="/huduma" icon={Menu} label="Menu" active={path === "/huduma"} />
    </div>
  );
}
