import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Globe, ChevronDown, ArrowRight, MessageCircle,
  Smartphone, Laptop, Monitor, Zap, CheckCircle,
  HelpCircle, BookOpen, Star, AlertTriangle,
  Wifi, Eye
} from "lucide-react";
import { useSettings } from "../contexts/SettingsContext";

const G    = "#F5A623";
const G2   = "#FFD17C";
const DARK = "#05060a";
const CARD = "#0d0f1a";
const BORDER = "rgba(255,255,255,0.07)";
const BLUE = "#3B82F6";

const W = ({ children, style = {} }) => (
  <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 clamp(16px,4vw,40px)", ...style }}>
    {children}
  </div>
);

function SectionLabel({ children, color = G }) {
  return (
    <div style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"6px 16px", borderRadius:999, background:`${color}12`, border:`1px solid ${color}25`, color, fontSize:11, fontWeight:900, textTransform:"uppercase", letterSpacing:".1em", marginBottom:20 }}>
      {children}
    </div>
  );
}

function GoldButton({ href, onClick, children, outline }) {
  const s = {
    display:"inline-flex", alignItems:"center", gap:10,
    padding:"14px 28px", borderRadius:14, fontWeight:900, fontSize:15,
    cursor:"pointer", textDecoration:"none", border:"none", transition:"all .2s",
    ...(outline
      ? { background:"transparent", color:G, border:`1.5px solid ${G}50` }
      : { background:`linear-gradient(135deg,${G},${G2})`, color:"#111", boxShadow:`0 6px 20px ${G}35` }
    ),
  };
  if (href) return <a href={href} target="_blank" rel="noreferrer" style={s}>{children}</a>;
  return <button onClick={onClick} style={s}>{children}</button>;
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border:`1px solid ${open ? `${G}40` : BORDER}`, borderRadius:14, overflow:"hidden", transition:"border-color .2s" }}>
      <button onClick={() => setOpen(v => !v)}
        style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 22px", background:"none", border:"none", color:"#fff", fontWeight:700, fontSize:15, textAlign:"left", cursor:"pointer", gap:16 }}>
        <span>{q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration:.2 }}>
          <ChevronDown size={17} color={G}/>
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }} exit={{ height:0, opacity:0 }} transition={{ duration:.22 }} style={{ overflow:"hidden" }}>
            <div style={{ padding:"0 22px 20px", color:"rgba(255,255,255,.65)", lineHeight:1.75, fontSize:14 }}>{a}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function VpnHelpPage() {
  const { t } = useSettings();
  const [activeGuide, setActiveGuide] = useState(null);

  const WA_LINK = "https://wa.me/255757053354?text=" + encodeURIComponent(
    "Habari STEA! Nahitaji msaada wa VPN. Ninaenda [eleza hali yako]."
  );
  const WA_SETUP = "https://wa.me/255757053354?text=" + encodeURIComponent(
    "Habari STEA! Nahitaji setup help ya VPN. Kifaa changu ni [eleza] na ninaenda [nchi]."
  );

  const COUNTRIES = [
    { flag:"🇨🇳", name:"China",            color:"#ef4444", urgent:true,
      problem: t('vpn_china_problem'),
      note: t('vpn_china_note') },
    { flag:"🇦🇪", name:"Dubai / UAE",       color:"#f59e0b",
      problem: t('vpn_uae_problem'),
      note: t('vpn_uae_note') },
    { flag:"🇮🇳", name:"India",             color:"#f97316",
      problem: t('vpn_india_problem'),
      note: t('vpn_india_note') },
    { flag:"🇸🇦", name:"Saudi Arabia",      color:"#10b981",
      problem: t('vpn_saudi_problem'),
      note: t('vpn_saudi_note') },
    { flag:"🇶🇦", name:"Qatar",             color:"#8b5cf6",
      problem: t('vpn_qatar_problem'),
      note: t('vpn_qatar_note') },
    { flag:"🌍", name: t('vpn_other_countries'),       color:BLUE,
      problem: t('vpn_other_problem'),
      note: t('vpn_other_note') },
  ];

  const GUIDE_CATS = [
    { icon:"🇨🇳", title: t('vpn_cat_china_title'),      color:"#ef4444", for: t('vpn_cat_china_for'),
      desc: t('vpn_cat_china_desc'),
      tips: [t('vpn_cat_china_tip1'), t('vpn_cat_china_tip2'), t('vpn_cat_china_tip3')] },
    { icon:"🎓", title: t('vpn_cat_student_title'),    color:BLUE,      for: t('vpn_cat_student_for'),
      desc: t('vpn_cat_student_desc'),
      tips: [t('vpn_cat_student_tip1'), t('vpn_cat_student_tip2'), t('vpn_cat_student_tip3')] },
    { icon:"💰", title: t('vpn_cat_budget_title'),        color:"#10b981", for: t('vpn_cat_budget_for'),
      desc: t('vpn_cat_budget_desc'),
      tips: [t('vpn_cat_budget_tip1'), t('vpn_cat_budget_tip2'), t('vpn_cat_budget_tip3')] },
    { icon:"📱", title: t('vpn_cat_mobile_title'),        color:"#a855f7", for: t('vpn_cat_mobile_for'),
      desc: t('vpn_cat_mobile_desc'),
      tips: [t('vpn_cat_mobile_tip1'), t('vpn_cat_mobile_tip2'), t('vpn_cat_mobile_tip3')] },
    { icon:"💻", title: t('vpn_cat_laptop_title'),        color:"#f59e0b", for: t('vpn_cat_laptop_for'),
      desc: t('vpn_cat_laptop_desc'),
      tips: [t('vpn_cat_laptop_tip1'), t('vpn_cat_laptop_tip2'), t('vpn_cat_laptop_tip3')] },
    { icon:"⚡", title: t('vpn_cat_setup_title'),           color:G,         for: t('vpn_cat_setup_for'),
      desc: t('vpn_cat_setup_desc'),
      tips: [t('vpn_cat_setup_tip1'), t('vpn_cat_setup_tip2'), t('vpn_cat_setup_tip3')] },
  ];

  const FAQS = [
    { q: t('vpn_faq1_q'), a: t('vpn_faq1_a') },
    { q: t('vpn_faq2_q'), a: t('vpn_faq2_a') },
    { q: t('vpn_faq3_q'), a: t('vpn_faq3_a') },
    { q: t('vpn_faq4_q'), a: t('vpn_faq4_a') },
    { q: t('vpn_faq5_q'), a: t('vpn_faq5_a') },
    { q: t('vpn_faq6_q'), a: t('vpn_faq6_a') },
    { q: t('vpn_faq7_q'), a: t('vpn_faq7_a') },
  ];

  return (
    <div style={{ minHeight:"100vh", background:DARK, color:"#fff", overflowX:"hidden", fontFamily:"'Instrument Sans',system-ui,sans-serif" }}>

      {/* ── HERO ── */}
      <section style={{ padding:"100px 20px 80px", background:"radial-gradient(ellipse at 60% -10%, rgba(59,130,246,.16) 0%, transparent 55%), radial-gradient(ellipse at 10% 80%, rgba(245,166,35,.08) 0%, transparent 50%)", textAlign:"center", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, pointerEvents:"none", opacity:.07 }}>
          <svg width="100%" height="100%" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice">
            <circle cx="400" cy="250" r="180" fill="none" stroke={BLUE} strokeWidth="1"/>
            <circle cx="400" cy="250" r="280" fill="none" stroke={BLUE} strokeWidth=".5"/>
            <circle cx="400" cy="250" r="380" fill="none" stroke={BLUE} strokeWidth=".3"/>
            <line x1="0" y1="250" x2="800" y2="250" stroke={BLUE} strokeWidth=".5"/>
            <line x1="400" y1="0" x2="400" y2="500" stroke={BLUE} strokeWidth=".5"/>
          </svg>
        </div>

        <motion.div initial={{ opacity:0, y:28 }} animate={{ opacity:1, y:0 }} transition={{ duration:.5 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"8px 18px", background:"rgba(59,130,246,.12)", border:"1px solid rgba(59,130,246,.2)", borderRadius:20, color:"#93c5fd", fontSize:13, fontWeight:700, marginBottom:28 }}>
            <Globe size={15}/> {t('vpn_hero_tag')}
          </div>

          <h1 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:"clamp(36px,6vw,68px)", fontWeight:900, lineHeight:1.08, letterSpacing:"-.04em", marginBottom:22 }}>
            {t('vpn_hero_title')}
          </h1>

          <p style={{ color:"rgba(255,255,255,.6)", maxWidth:580, margin:"0 auto 40px", fontSize:17, lineHeight:1.75 }}>
            {t('vpn_hero_desc')}
          </p>

          <div style={{ display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap", marginBottom: 40 }}>
            <GoldButton href={WA_LINK}>
              <MessageCircle size={18}/> {t('vpn_action_help')}
            </GoldButton>
            <GoldButton outline onClick={() => document.getElementById("guide-cats")?.scrollIntoView({ behavior:"smooth" })}>
              {t('vpn_action_read')} <ArrowRight size={16}/>
            </GoldButton>
          </div>

          <div style={{ color: "rgba(255,255,255,.35)", fontSize: 13, fontWeight: 500, maxWidth: 500, margin: "0 auto" }}>
            {t('vpn_disclaimer')}
          </div>
        </motion.div>
      </section>

      {/* ── SECTION 2: COUNTRIES ── */}
      <section style={{ padding:"80px 0" }}>
        <W>
          <div style={{ textAlign:"center", marginBottom:52 }}>
            <SectionLabel color={BLUE}><Globe size={13}/> {t('vpn_countries_tag')}</SectionLabel>
            <h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:"clamp(26px,4vw,40px)", fontWeight:900, lineHeight:1.1, letterSpacing:"-.03em", marginBottom:12 }}>
              {t('vpn_countries_title')}
            </h2>
            <p style={{ color:"rgba(255,255,255,.5)", fontSize:16, maxWidth:500, margin:"0 auto" }}>
              {t('vpn_countries_desc')}
            </p>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(300px, 1fr))", gap:18, marginBottom:28 }}>
            {COUNTRIES.map((c, i) => (
              <motion.div key={i}
                initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:i*.07 }}
                style={{ background:CARD, border:`1px solid ${c.urgent ? `${c.color}30` : BORDER}`, borderRadius:20, padding:"24px 22px", position:"relative", overflow:"hidden" }}>
                {c.urgent && <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${c.color},${c.color}80)` }}/>}
                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
                  <div style={{ fontSize:32 }}>{c.flag}</div>
                  <div>
                    <div style={{ fontWeight:900, fontSize:18 }}>{c.name}</div>
                    {c.urgent && <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:10, fontWeight:900, color:c.color, textTransform:"uppercase", letterSpacing:".06em" }}><AlertTriangle size={10}/> {t('duka_ref_label')}</div>}
                  </div>
                </div>
                <p style={{ fontSize:13.5, color:"rgba(255,255,255,.65)", lineHeight:1.65, marginBottom:12 }}>{c.problem}</p>
                <div style={{ fontSize:12, padding:"8px 12px", background:`${c.color}0d`, borderRadius:8, color:`${c.color}cc`, fontWeight:700, borderLeft:`3px solid ${c.color}40` }}>
                  💡 {c.note}
                </div>
              </motion.div>
            ))}
          </div>

          <div style={{ background:"rgba(239,68,68,.06)", border:"1px solid rgba(239,68,68,.2)", borderRadius:18, padding:"20px 24px", display:"flex", gap:16, alignItems:"flex-start" }}>
            <AlertTriangle size={22} color="#f87171" style={{ flexShrink:0, marginTop:2 }}/>
            <div>
              <div style={{ fontWeight:800, fontSize:15, color:"#f87171", marginBottom:6 }}>{t('vpn_china_urgent_title')}</div>
              <p style={{ fontSize:14, color:"rgba(255,255,255,.6)", lineHeight:1.65, margin:0 }}>
                {t('vpn_china_urgent_desc')}
              </p>
            </div>
          </div>
        </W>
      </section>

      {/* ── SECTION 3: HOW STEA HELPS ── */}
      <section style={{ padding:"0 0 80px" }}>
        <W>
          <div style={{ textAlign:"center", marginBottom:48 }}>
            <SectionLabel><Shield size={13}/> {t('vpn_helps_tag')}</SectionLabel>
            <h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:"clamp(26px,4vw,40px)", fontWeight:900, lineHeight:1.1, letterSpacing:"-.03em", marginBottom:12 }}>
              {t('vpn_helps_title')}
            </h2>
            <p style={{ color:"rgba(255,255,255,.5)", fontSize:16 }}>
              {t('vpn_helps_desc')}
            </p>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))", gap:20 }}>
            {[
              { num:"01", icon:<Globe size={28}/>,    color:BLUE,      title: t('vpn_step1_title'),     desc: t('vpn_step1_desc') },
              { num:"02", icon:<Star size={28}/>,     color:G,         title: t('vpn_step2_title'), desc: t('vpn_step2_desc') },
              { num:"03", icon:<Zap size={28}/>,      color:"#10b981", title: t('vpn_step3_title'),      desc: t('vpn_step3_desc') },
            ].map((s, i) => (
              <motion.div key={i}
                initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:i*.1 }}
                style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:22, padding:"32px 28px", position:"relative", overflow:"hidden" }}>
                <div style={{ position:"absolute", top:16, right:20, fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:52, fontWeight:900, color:"rgba(255,255,255,.04)" }}>{s.num}</div>
                <div style={{ width:60, height:60, borderRadius:18, background:`${s.color}15`, color:s.color, display:"grid", placeItems:"center", marginBottom:20 }}>{s.icon}</div>
                <h3 style={{ fontWeight:900, fontSize:19, marginBottom:10 }}>{s.title}</h3>
                <p style={{ fontSize:14, color:"rgba(255,255,255,.55)", lineHeight:1.7, margin:0 }}>{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </W>
      </section>

      {/* ── SECTION 4: GUIDE CATEGORIES ── */}
      <section id="guide-cats" style={{ padding:"0 0 80px" }}>
        <W>
          <div style={{ marginBottom:48 }}>
            <SectionLabel color={BLUE}><BookOpen size={13}/> {t('vpn_guide_tag')}</SectionLabel>
            <h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:"clamp(26px,4vw,40px)", fontWeight:900, lineHeight:1.1, letterSpacing:"-.03em", marginBottom:12 }}>
              {t('vpn_guide_title')}
            </h2>
            <p style={{ color:"rgba(255,255,255,.5)", fontSize:15, maxWidth:540 }}>
              {t('vpn_guide_desc')}
            </p>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(320px, 1fr))", gap:18 }}>
            {GUIDE_CATS.map((cat, i) => (
              <motion.div key={i}
                initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:i*.06 }}
                onClick={() => setActiveGuide(activeGuide === i ? null : i)}
                style={{ background:CARD, border:`1px solid ${activeGuide === i ? `${cat.color}40` : BORDER}`, borderRadius:20, padding:"26px 24px", cursor:"pointer", transition:"all .2s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor=`${cat.color}30`; e.currentTarget.style.transform="translateY(-3px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor= activeGuide===i ? `${cat.color}40` : BORDER; e.currentTarget.style.transform=""; }}>

                <div style={{ display:"flex", alignItems:"flex-start", gap:16, marginBottom:14 }}>
                  <div style={{ fontSize:36, flexShrink:0 }}>{cat.icon}</div>
                  <div style={{ flex:1 }}>
                    <h3 style={{ fontWeight:900, fontSize:17, marginBottom:4 }}>{cat.title}</h3>
                    <div style={{ fontSize:12, color:`${cat.color}cc`, fontWeight:700 }}>{cat.for}</div>
                  </div>
                  <motion.div animate={{ rotate: activeGuide===i ? 180 : 0 }} transition={{ duration:.2 }}>
                    <ChevronDown size={16} color="rgba(255,255,255,.3)"/>
                  </motion.div>
                </div>

                <p style={{ fontSize:13.5, color:"rgba(255,255,255,.55)", lineHeight:1.65, margin:0 }}>{cat.desc}</p>

                <AnimatePresence>
                  {activeGuide === i && (
                    <motion.div initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }} exit={{ height:0, opacity:0 }} transition={{ duration:.22 }} style={{ overflow:"hidden" }}>
                      <div style={{ marginTop:16, paddingTop:16, borderTop:`1px solid ${BORDER}` }}>
                        {cat.tips.map((tip, j) => (
                          <div key={j} style={{ display:"flex", gap:10, alignItems:"flex-start", marginBottom:8 }}>
                            <CheckCircle size={14} color={cat.color} style={{ flexShrink:0, marginTop:2 }}/>
                            <span style={{ fontSize:13, color:"rgba(255,255,255,.7)" }}>{tip}</span>
                          </div>
                        ))}
                        <a href={WA_LINK} target="_blank" rel="noreferrer"
                          onClick={e => e.stopPropagation()}
                          style={{ display:"inline-flex", alignItems:"center", gap:7, marginTop:12, padding:"8px 16px", background:`${cat.color}15`, border:`1px solid ${cat.color}30`, borderRadius:10, color:cat.color, fontWeight:700, fontSize:12, textDecoration:"none" }}>
                          <MessageCircle size={13}/> {t('nav_huduma_sup_label')}
                        </a>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </W>
      </section>

      {/* ── SECTION 5: DEVICES ── */}
      <section style={{ padding:"0 0 80px" }}>
        <W>
          <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:24, padding:"40px clamp(24px,5vw,56px)" }}>
            <div style={{ textAlign:"center", marginBottom:36 }}>
              <SectionLabel><Wifi size={13}/> {t('vpn_devices_tag')}</SectionLabel>
              <h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:"clamp(24px,3.5vw,36px)", fontWeight:900, lineHeight:1.1, letterSpacing:"-.03em", marginBottom:8 }}>
                {t('vpn_devices_title')}
              </h2>
              <p style={{ color:"rgba(255,255,255,.45)", fontSize:15 }}>{t('vpn_devices_desc')}</p>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))", gap:16 }}>
              {[
                { icon:<Smartphone size={32}/>, name:"Android",      color:"#10b981", note: t('vpn_device_android_note') },
                { icon:<Smartphone size={32}/>, name:"iPhone (iOS)", color:BLUE,       note: t('vpn_device_ios_note') },
                { icon:<Monitor size={32}/>,    name:"Windows",      color:G,           note: t('vpn_device_windows_note') },
                { icon:<Laptop size={32}/>,     name:"MacBook",      color:"#a855f7",   note: t('vpn_device_mac_note') },
              ].map((d, i) => (
                <div key={i} style={{ background:"rgba(255,255,255,.02)", border:`1px solid ${BORDER}`, borderRadius:16, padding:"24px 20px", textAlign:"center" }}>
                  <div style={{ color:d.color, marginBottom:12, display:"flex", justifyContent:"center" }}>{d.icon}</div>
                  <div style={{ fontWeight:800, fontSize:16, marginBottom:4 }}>{d.name}</div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,.4)", fontWeight:600 }}>{d.note}</div>
                  <div style={{ marginTop:10, fontSize:11, color:"#10b981", fontWeight:900 }}>✓ {t('vpn_device_works')}</div>
                </div>
              ))}
            </div>
          </div>
        </W>
      </section>

      {/* ── SECTION 6: GET HELP CTA ── */}
      <section style={{ padding:"0 0 80px" }}>
        <W>
          <div style={{ background:`linear-gradient(135deg, rgba(245,166,35,.1), rgba(245,166,35,.03))`, border:"1px solid rgba(245,166,35,.2)", borderRadius:28, padding:"clamp(40px,6vw,72px) clamp(24px,5vw,56px)", textAlign:"center" }}>
            <div style={{ fontSize:52, marginBottom:20 }}>🛡️</div>
            <SectionLabel><HelpCircle size={13}/> {t('nav_huduma_sup_label')}</SectionLabel>
            <h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:"clamp(26px,4vw,40px)", fontWeight:900, lineHeight:1.1, letterSpacing:"-.03em", marginBottom:16 }}>
              {t('vpn_cta_title')}
            </h2>
            <p style={{ color:"rgba(255,255,255,.6)", maxWidth:520, margin:"0 auto 40px", fontSize:16, lineHeight:1.7 }}>
              {t('vpn_cta_desc')}
            </p>
            <div style={{ display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap" }}>
              <GoldButton href={WA_LINK}>
                <MessageCircle size={18}/> {t('vpn_action_help')}
              </GoldButton>
              <GoldButton href={WA_SETUP} outline>
                {t('vpn_cta_action_setup')}
              </GoldButton>
            </div>
          </div>
        </W>
      </section>

      {/* ── SECTION 7: TRUST DISCLAIMER ── */}
      <section style={{ padding:"0 0 80px" }}>
        <W>
          <div style={{ background:"rgba(255,255,255,.02)", border:`1px solid ${BORDER}`, borderRadius:20, padding:"28px 32px", display:"flex", gap:18, alignItems:"flex-start" }}>
            <div style={{ width:44, height:44, borderRadius:12, background:"rgba(255,255,255,.05)", display:"grid", placeItems:"center", flexShrink:0 }}>
              <Eye size={22} color="rgba(255,255,255,.4)"/>
            </div>
            <div>
              <div style={{ fontWeight:800, fontSize:15, marginBottom:8 }}>{t('vpn_transparency_title')}</div>
              <p style={{ fontSize:14, color:"rgba(255,255,255,.55)", lineHeight:1.75, margin:0 }}>
                {t('vpn_transparency_desc')}
              </p>
            </div>
          </div>
        </W>
      </section>

      {/* ── SECTION 8: FAQ ── */}
      <section style={{ padding:"0 0 clamp(80px,12vw,120px)" }}>
        <W>
          <div style={{ textAlign:"center", marginBottom:44 }}>
            <SectionLabel color={BLUE}><HelpCircle size={13}/> {t('vpn_faq_tag')}</SectionLabel>
            <h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:"clamp(26px,4vw,40px)", fontWeight:900, lineHeight:1.1, letterSpacing:"-.03em" }}>
              {t('vpn_faq_title')}
            </h2>
          </div>
          <div style={{ maxWidth:760, margin:"0 auto", display:"grid", gap:10 }}>
            {FAQS.map((faq, i) => <FaqItem key={i} {...faq}/>)}
          </div>
        </W>
      </section>

    </div>
  );
}
