import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Cpu, Zap, Globe, LayoutGrid, ArrowRight } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

export default function TechHubPage() {
  const { t } = useSettings();
  
  return (
    <div style={{ minHeight: "100vh", background: "#0a0b0f", color: "#fff", paddingBottom: 80 }}>
      {/* Hero Section */}
      <section style={{ 
        padding: "80px 20px 60px", 
        textAlign: "center",
        background: "radial-gradient(circle at top, rgba(59,130,246,0.1) 0%, transparent 50%)"
      }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", background: "rgba(59,130,246,0.1)", borderRadius: 20, color: "#3b82f6", fontSize: 14, fontWeight: 700, marginBottom: 24 }}>
            <Sparkles size={16} /> {t('nav_tech_hub')}
          </div>
          <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 900, lineHeight: 1.2, marginBottom: 16 }}>
            {t('tech_section_title')} <span style={{ color: "#3b82f6", display: 'block', marginTop: '8px' }}>{t('tech_section_title_hl')}</span>
          </h1>
          <p style={{ fontSize: "clamp(16px, 2vw, 18px)", color: "rgba(255,255,255,0.6)", lineHeight: 1.5, marginBottom: 40, maxWidth: 700, margin: "0 auto 40px" }}>
            {t('tech_section_desc')}
          </p>
        </div>
      </section>

      {/* Main Categories */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          <CategoryCard 
            to="/ai"
            icon={<Sparkles size={32} />}
            title="AI Lab"
            desc={t('nav_tech_ai_desc')}
            color="#a855f7"
          />
          <CategoryCard 
            to="/prompts"
            icon={<Cpu size={32} />}
            title="Prompt Lab"
            desc={t('nav_tech_prompt_desc')}
            color="#ec4899"
          />
          <CategoryCard 
            to="/tips"
            icon={<Zap size={32} />}
            title="Tech Tips"
            desc={t('nav_tech_tips_desc')}
            color="#3b82f6"
          />
          <CategoryCard 
            to="/digital-tools"
            icon={<LayoutGrid size={32} />}
            title={t('nav_tech_digi_label')}
            desc={t('nav_tech_digi_desc')}
            color="#10b981"
          />
          <CategoryCard 
            to="/websites"
            icon={<Globe size={32} />}
            title="Website Solutions"
            desc={t('nav_tech_web_desc')}
            color="#f5a623"
          />
        </div>
      </section>
    </div>
  );
}

function CategoryCard({ to, icon, title, desc, color }) {
  const { t } = useSettings();
  const [hov, setHov] = React.useState(false);
  return (
    <Link to={to} style={{
      background: hov ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
      border: `1px solid ${hov ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.08)"}`,
      borderRadius: 24,
      padding: 28,
      textDecoration: "none",
      display: "flex",
      flexDirection: "column",
      gap: 16,
      transition: "all 0.25s cubic-bezier(0.16,1,0.3,1)",
      transform: hov ? "translateY(-4px)" : "translateY(0)",
      boxShadow: hov ? "0 16px 40px rgba(0,0,0,0.4)" : "none",
      willChange: "transform",
    }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onTouchStart={() => setHov(true)}
      onTouchEnd={() => setHov(false)}>
      <div style={{ width: 58, height: 58, borderRadius: 18, background: `${color}15`, color: color, display: "flex", alignItems: "center", justifyContent: "center",
        transform: hov ? "scale(1.08)" : "scale(1)", transition: "transform 0.22s ease" }}>
        {icon}
      </div>
      <div>
        <h3 style={{ fontSize: 19, fontWeight: 800, color: "#fff", marginBottom: 6, letterSpacing: "-.02em" }}>{title}</h3>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, lineHeight: 1.6 }}>{desc}</p>
      </div>
      <div style={{ marginTop: "auto", paddingTop: 14, display: "flex", alignItems: "center", gap: 7, color: color, fontWeight: 800, fontSize: 13 }}>
        {t('action_open')} <ArrowRight size={14} style={{ transform: hov ? "translateX(4px)" : "", transition: "transform 0.2s ease" }} />
      </div>
    </Link>
  );
}
