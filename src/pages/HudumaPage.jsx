import { Link } from 'react-router-dom';
import { Megaphone, Globe, Sparkles, ArrowRight, Banknote, Zap, Users, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useMobile } from '../hooks/useMobile';
import { useSettings } from '../contexts/SettingsContext';
import TangazaNasi from '../components/TangazaNasi';
import ServiceRequestForm from '../components/services/ServiceRequestForm';

const G = '#F5A623';

function CategoryCard({ to, icon, title, desc, color, delay=0, onClick }) {
  const isMobile = useMobile();
  const content = (
    <motion.div
      initial={{ opacity:0, y:18 }}
      whileInView={{ opacity:1, y:0 }}
      viewport={{ once:true }}
      transition={{ delay, duration:.4 }}
      style={{ height: '100%' }}
    >
      <div style={{
        background:'rgba(255,255,255,.03)',
        border:'1px solid rgba(255,255,255,.08)',
        borderRadius:22,
        padding: isMobile ? '22px 20px' : '32px 28px',
        textDecoration:'none',
        display:'flex',
        flexDirection: isMobile ? 'row' : 'column',
        alignItems: isMobile ? 'center' : 'flex-start',
        gap: isMobile ? 16 : 20,
        transition:'border-color .2s, transform .2s',
        minHeight: isMobile ? 0 : 200,
        cursor: 'pointer',
        height: '100%'
      }}
        onClick={onClick}
        onMouseEnter={e => { e.currentTarget.style.borderColor=`${color}35`; e.currentTarget.style.transform='translateY(-3px)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,.08)'; e.currentTarget.style.transform=''; }}
      >
        <div style={{ width:isMobile?46:60, height:isMobile?46:60, borderRadius:isMobile?14:18, background:`${color}15`, color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          {icon}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <h3 style={{ fontSize:isMobile?16:20, fontWeight:800, color:'#fff', marginBottom:isMobile?4:10 }}>{title}</h3>
          <p style={{ color:'rgba(255,255,255,.5)', fontSize:isMobile?13:14, lineHeight:1.55, margin:0 }}>{desc}</p>
        </div>
        {!isMobile && (
          <div style={{ display:'flex', alignItems:'center', gap:8, color, fontWeight:700, fontSize:14, marginTop:'auto', paddingTop:16 }}>
            Fungua <ArrowRight size={16}/>
          </div>
        )}
      </div>
    </motion.div>
  );

  if (to) {
    return <Link to={to} style={{ textDecoration: 'none' }}>{content}</Link>;
  }
  return content;
}

export default function HudumaPage() {
  const isMobile = useMobile();
  const { t } = useSettings();
  const [activeService, setActiveService] = useState(null);

  const CATS = [
    { type: 'advertise',   icon:<Megaphone size={28}/>, title: t('nav_huduma_ads_label'), desc: t('nav_huduma_ads_desc'), color:'#ec4899' },
    { type: 'promotion',   icon:<Zap size={28}/>,       title: t('nav_huduma_promo_label'), desc: t('nav_huduma_promo_desc'), color:G },
    { type: 'partnership', icon:<Users size={28}/>,     title: t('nav_huduma_brand_label'), desc: t('nav_huduma_brand_desc'), color:'#a855f7' },
    { type: 'website',     icon:<Globe size={28}/>,     title: t('nav_huduma_web_label'), desc: t('nav_huduma_web_desc'), color:'#3b82f6' },
    { type: 'support',     icon:<ShieldCheck size={28}/>,title: t('nav_huduma_sup_label'), desc: t('nav_huduma_sup_desc'), color:'#10b981' },
    { type: 'youth',       icon:<Sparkles size={28}/>,  title: t('nav_huduma_youth_label'),  desc: t('nav_huduma_youth_desc'), color:G },
    { to:'/money-guide',   icon:<Banknote size={28}/>, title: t('pillar_money_title'),desc: t('pillar_money_desc'), color:'#10b981' },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#05060a", color: "#fff", paddingBottom: 80, fontFamily:"'Instrument Sans',sans-serif" }}>
      {/* Hero Section */}
      <section style={{ 
        padding: isMobile ? "100px 20px 40px" : "140px 20px 80px", 
        textAlign: "center",
        background: "radial-gradient(circle at top, rgba(245,166,35,0.08) 0%, transparent 50%)"
      }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", background: "rgba(245,166,35,0.1)", borderRadius: 20, color: G, fontSize: 13, fontWeight: 700, marginBottom: 24 }}
          >
            <Sparkles size={16} /> {t('nav_huduma_title')}
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: "clamp(32px, 5vw, 56px)", fontWeight: 900, lineHeight: 1.1, marginBottom: 24, letterSpacing:'-.03em' }}
          >
            {t('nav_huduma_title')} <br/>
            <span style={{ color: G }}>{t('pillar_section_title_hl')}</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{ fontSize: "clamp(16px, 2vw, 19px)", color: "rgba(255,255,255,0.6)", lineHeight: 1.7, marginBottom: 40, maxWidth: 600, margin: "0 auto 40px" }}
          >
            {t('nav_huduma_desc')}
          </motion.p>
        </div>
      </section>

      {/* Main Categories */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
          {CATS.map((cat, i) => (
            <CategoryCard 
              key={i} 
              {...cat} 
              delay={i * 0.05} 
              onClick={cat.type ? () => setActiveService(cat.type) : undefined}
            />
          ))}
        </div>
      </section>

      <AnimatePresence>
        {activeService && (
          <ServiceRequestForm 
            isOpen={!!activeService} 
            onClose={() => setActiveService(null)} 
            serviceType={activeService}
          />
        )}
      </AnimatePresence>

      {/* Reusable Tangaza Nasi Section */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px" }}>
        <TangazaNasi />
      </div>
    </div>
  );
}

