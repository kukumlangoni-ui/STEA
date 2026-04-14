import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Cpu, Zap, Globe, LayoutGrid, ArrowRight } from 'lucide-react';

export default function TechHubPage() {
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
            <Sparkles size={16} /> STEA Tech Hub
          </div>
          <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: "clamp(32px, 5vw, 56px)", fontWeight: 900, lineHeight: 1.1, marginBottom: 24 }}>
            Gundua Ulimwengu wa <br/>
            <span style={{ color: "#3b82f6" }}>Teknolojia na AI</span>
          </h1>
          <p style={{ fontSize: "clamp(16px, 2vw, 20px)", color: "rgba(255,255,255,0.6)", lineHeight: 1.6, marginBottom: 40, maxWidth: 600, margin: "0 auto 40px" }}>
            Jifunze maujanja ya simu na kompyuta, tumia zana za AI, na gundua digital tools za kurahisisha maisha yako.
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
            desc="Tumia ChatGPT, Gemini na zana zingine za AI kwa Kiswahili."
            color="#a855f7"
          />
          <CategoryCard 
            to="/prompts"
            icon={<Cpu size={32} />}
            title="Prompt Lab"
            desc="Jifunze jinsi ya kuandika prompts bora za AI ili kupata majibu sahihi."
            color="#ec4899"
          />
          <CategoryCard 
            to="/tips"
            icon={<Zap size={32} />}
            title="Tech Tips"
            desc="Maujanja ya Android, iPhone, na PC kwa matumizi ya kila siku."
            color="#3b82f6"
          />
          <CategoryCard 
            to="/digital-tools"
            icon={<LayoutGrid size={32} />}
            title="Digital Tools"
            desc="Zana za dijiti za bure na premium kurahisisha kazi zako."
            color="#10b981"
          />
          <CategoryCard 
            to="/websites"
            icon={<Globe size={32} />}
            title="Website Solutions"
            desc="Pata website bora na za kisasa kwa ajili ya biashara yako."
            color="#f5a623"
          />
        </div>
      </section>
    </div>
  );
}

function CategoryCard({ to, icon, title, desc, color }) {
  return (
    <Link to={to} style={{ 
      background: "rgba(255,255,255,0.03)", 
      border: "1px solid rgba(255,255,255,0.08)", 
      borderRadius: 24, 
      padding: 32, 
      textDecoration: "none",
      display: "flex",
      flexDirection: "column",
      gap: 16,
      transition: "all 0.3s"
    }} className="hover:bg-white/5 hover:-translate-y-1">
      <div style={{ width: 64, height: 64, borderRadius: 20, background: `${color}15`, color: color, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {icon}
      </div>
      <div>
        <h3 style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 8 }}>{title}</h3>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, lineHeight: 1.5 }}>{desc}</p>
      </div>
      <div style={{ marginTop: "auto", paddingTop: 16, display: "flex", alignItems: "center", gap: 8, color: color, fontWeight: 700, fontSize: 14 }}>
        Fungua <ArrowRight size={16} />
      </div>
    </Link>
  );
}
