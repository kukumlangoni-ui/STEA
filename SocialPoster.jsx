import { Link, useLocation } from "react-router-dom";
import { Home, Cpu, GraduationCap, ShoppingBag, LayoutGrid } from "lucide-react";

const G = "#F5A623";

function NavItem({ to, icon: Icon, label, active }) {
  return (
    <Link to={to} style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", gap: 3, flex: 1,
      textDecoration: "none",
      color: active ? G : "rgba(255,255,255,0.38)",
      transition: "color .2s",
      minWidth: 0, padding: "0 4px",
    }}>
      <div style={{
        padding: "6px 14px", borderRadius: 14,
        background: active ? `${G}18` : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "background .2s",
      }}>
        <Icon size={21} strokeWidth={active ? 2.5 : 1.8} />
      </div>
      <span style={{
        fontSize: 10, fontWeight: active ? 800 : 600,
        letterSpacing: "0.01em", lineHeight: 1,
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        maxWidth: "100%",
      }}>
        {label}
      </span>
    </Link>
  );
}

export default function BottomNav() {
  const { pathname } = useLocation();

  const items = [
    { to: "/",      icon: Home,         label: "Home",    active: pathname === "/" },
    { to: "/tech",  icon: Cpu,          label: "Tech",    active: pathname.startsWith("/tech") || pathname === "/ai" || pathname === "/tips" || pathname === "/prompts" },
    { to: "/exams", icon: GraduationCap,label: "Student", active: pathname.startsWith("/exams") || pathname === "/courses" || pathname === "/university-guide" },
    { to: "/duka",  icon: ShoppingBag,  label: "Duka",    active: pathname.startsWith("/duka") },
    { to: "/huduma",icon: LayoutGrid,   label: "Zaidi",   active: pathname === "/huduma" || pathname === "/gigs" || pathname === "/vpn" },
  ];

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      /* Total height: 60px bar + safe area inset */
      background: "rgba(8, 9, 14, 0.92)",
      backdropFilter: "blur(24px)",
      WebkitBackdropFilter: "blur(24px)",
      borderTop: "1px solid rgba(255,255,255,0.07)",
      display: "flex", alignItems: "flex-start",
      justifyContent: "space-around",
      padding: "8px 4px 0",
      paddingBottom: "calc(8px + env(safe-area-inset-bottom, 0px))",
      zIndex: 1000,
    }}>
      {items.map(item => <NavItem key={item.to} {...item} />)}
    </div>
  );
}
