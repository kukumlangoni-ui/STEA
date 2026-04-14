import { Link } from 'react-router-dom';
import { Megaphone, Globe, HelpCircle, Sparkles, ArrowRight, Banknote } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMobile } from '../hooks/useMobile';

const G = '#F5A623';

const CATS = [
  { to:'/money-guide',icon:<Banknote size={28}/>, title:'Abroad Money Guide',desc:'Mwongozo wa kutuma na kubadilisha pesa kwa usalama kwa wanafunzi na jamaa nje ya nchi.', color:'#10b981' },
  { to:'/advertise', icon:<Megaphone size={28}/>, title:'Tangaza Nasi',    desc:'Weka bidhaa au huduma yako mbele ya maelfu ya watumiaji wa STEA.',                      color:'#ec4899' },
  { to:'/websites',  icon:<Globe size={28}/>,     title:'Website Solutions',desc:'Tunatengeneza websites bora, za kisasa na yenye usalama wa hali ya juu.',              color:'#3b82f6' },
  { to:'/contact',   icon:<HelpCircle size={28}/>,title:'Digital Support', desc:'Pata msaada wa kiufundi na ushauri wa kidijitali kutoka kwa wataalamu wetu.',          color:'#10b981' },
  { to:'/about',     icon:<Sparkles size={28}/>,  title:'Youth Services',  desc:'Huduma maalum kwa vijana zinazolenga kukuza vipaji na ujuzi wa kidijitali.',           color:G         },
];

function CategoryCard({ to, icon, title, desc, color, delay=0 }) {
  const isMobile = useMobile();
  return (
    <motion.div
      initial={{ opacity:0, y:18 }}
      whileInView={{ opacity:1, y:0 }}
      viewport={{ once:true }}
      transition={{ delay, duration:.4 }}
    >
      <Link to={to} style={{
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
      }}
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
      </Link>
    </motion.div>
  );
}

export default function HudumaPage() {
  const isMobile = useMobile();
  return (
    <div style={{ minHeight: "100vh", background: "#05060a", color: "#fff", paddingBottom: 80, fontFamily:"'Instrument Sans',sans-serif" }}>
      {/* Hero Section */}
      <section style={{ 
        padding: isMobile ? "80px 20px 40px" : "120px 20px 80px", 
        textAlign: "center",
        background: "radial-gradient(circle at top, rgba(245,166,35,0.08) 0%, transparent 50%)"
      }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", background: "rgba(245,166,35,0.1)", borderRadius: 20, color: G, fontSize: 13, fontWeight: 700, marginBottom: 24 }}>
            <Sparkles size={16} /> STEA Huduma
          </div>
          <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: "clamp(32px, 5vw, 56px)", fontWeight: 900, lineHeight: 1.1, marginBottom: 24, letterSpacing:'-.03em' }}>
            Huduma za Kidijitali <br/>
            <span style={{ color: G }}>Kwa Ajili Yako</span>
          </h1>
          <p style={{ fontSize: "clamp(16px, 2vw, 19px)", color: "rgba(255,255,255,0.6)", lineHeight: 1.7, marginBottom: 40, maxWidth: 600, margin: "0 auto 40px" }}>
            Kutoka kutangaza biashara yako hadi kutengeneza websites za kisasa, STEA ipo hapa kukusaidia kufanikiwa.
          </p>
        </div>
      </section>

      {/* Main Categories */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
          {CATS.map((cat, i) => (
            <CategoryCard key={i} {...cat} delay={i * 0.1} />
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section style={{ maxWidth: 800, margin: "80px auto 0", padding: "0 20px", textAlign: "center" }}>
        <div style={{ background:'rgba(255,255,255,.02)', border:'1px solid rgba(255,255,255,.05)', borderRadius:24, padding: isMobile ? '40px 24px' : '60px 40px' }}>
          <h2 style={{ fontSize:28, fontWeight:900, marginBottom:16 }}>Je, una hitaji maalum?</h2>
          <p style={{ color:'rgba(255,255,255,.5)', marginBottom:32, lineHeight:1.6 }}>Wasiliana nasi moja kwa moja kwa msaada wa kiufundi au ushauri wa kidijitali.</p>
          <a href="https://wa.me/255971585204" target="_blank" rel="noreferrer" style={{
            display:'inline-flex', alignItems:'center', gap:10, padding:'16px 32px', background:G, color:'#111', borderRadius:14, fontWeight:900, textDecoration:'none', fontSize:16
          }}>
            Ongea Nasi WhatsApp <ArrowRight size={20}/>
          </a>
        </div>
      </section>
    </div>
  );
}
