import { Link } from 'react-router-dom';
import { Megaphone, Globe, HelpCircle, Sparkles, ArrowRight, Banknote } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMobile } from '../hooks/useMobile';

const G = '#F5A623';

const CATS = [
  { to:'/money-guide',icon:<Banknote size={28}/>, title:'Abroad Money Guide',desc:'Mwongozo wa kutuma na kubadilisha pesa kwa usalama kwa wanafunzi na jamaa nje ya nchi.', color:'#10b981' },
  { to:'/advertise', icon:<Megaphone size={28}/>, title:'Tangaza Nasi',    desc:'Weka bidhaa au huduma yako mbele ya maelfu ya watumiaji wa STEA.',                      color:'#ec4899' },
  { to:'/websites',  icon:<Globe size={28}/>,     title:'Website Solutions',desc:'Tunatengeneza websites bora, za kisasa na zenye usalama wa hali ya juu.',              color:'#3b82f6' },
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
        {isMobile && <ArrowRight size={18} color={color} style={{ flexShrink:0, opacity:.6 }}/>}
      </Link>
    </motion.div>
  );
}

export default function HudumaPage() {
  const isMobile = useMobile();
  return (
    <div style={{ minHeight:'100vh', background:'#0a0b0f', color:'#fff', paddingBottom: isMobile ? 96 : 80 }}>
      <section style={{
        padding: isMobile ? '88px 20px 44px' : '100px 20px 60px',
        textAlign:'center',
        background:'radial-gradient(ellipse at 50% -10%, rgba(236,72,153,.12) 0%, transparent 55%)',
      }}>
        <div style={{ maxWidth:680, margin:'0 auto' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'7px 16px', background:'rgba(236,72,153,.12)', borderRadius:20, color:'#f472b6', fontSize:13, fontWeight:700, marginBottom:22 }}>
            <Megaphone size={15}/> STEA Huduma
          </div>
          <h1 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:'clamp(28px,6vw,52px)', fontWeight:900, lineHeight:1.08, letterSpacing:'-.04em', marginBottom:18 }}>
            Huduma za Kidijitali<br/>
            <span style={{ color:'#f472b6' }}>Kwa Ajili Yako</span>
          </h1>
          <p style={{ fontSize:'clamp(14px,1.8vw,18px)', color:'rgba(255,255,255,.55)', lineHeight:1.65, maxWidth:540, margin:'0 auto' }}>
            Kutoka kutangaza biashara yako hadi kutengeneza websites za kisasa, STEA ipo hapa kukusaidia.
          </p>
        </div>
      </section>

      <section style={{ maxWidth:1100, margin:'0 auto', padding:`0 ${isMobile?16:28}px` }}>
        <div style={{
          display:'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(min(300px,100%), 1fr))',
          gap: isMobile ? 12 : 20,
        }}>
          {CATS.map((c,i) => <CategoryCard key={c.to} {...c} delay={i*.07}/>)}
        </div>
      </section>
    </div>
  );
}
