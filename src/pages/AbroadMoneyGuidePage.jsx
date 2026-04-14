/**
 * AbroadMoneyGuidePage.jsx — STEA Africa v2
 * Fixed: runtime crashes, null safety, integrated MoneySearch
 * All .map() calls are safe with optional chaining and fallback arrays
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe, ChevronDown, ArrowRight, MessageCircle,
  Shield, AlertTriangle, CheckCircle, HelpCircle,
  Eye, Banknote,
  TrendingUp, Clock, Star, Send, Info,
  Zap, MapPin, BadgeCheck, PhoneCall
} from "lucide-react";
import { useMobile } from "../hooks/useMobile.js";
import MoneySearch from "../components/MoneySearch.jsx";
import MONEY_METHODS_RAW from "../data/moneyMethods.json";

// ── Null-safe data access ─────────────────────────────────────────────────────
const MONEY_METHODS = Array.isArray(MONEY_METHODS_RAW) ? MONEY_METHODS_RAW : [];

// ── Brand tokens ──────────────────────────────────────────────────────────────
const G      = "#F5A623";
const G2     = "#FFD17C";
const DARK   = "#05060a";
const CARD   = "#0d0f1a";
const BORDER = "rgba(255,255,255,0.07)";
const GREEN  = "#10b981";
const BLUE   = "#3B82F6";
const PURPLE = "#8b5cf6";
const RED    = "#ef4444";

// ── WhatsApp links ────────────────────────────────────────────────────────────
const WA_MAIN  = "https://wa.me/8619715852043?text=" + encodeURIComponent("Habari STEA! Nahitaji msaada wa kutuma pesa nje ya nchi. Tafadhali niongoze.");
const WA_CHINA = "https://wa.me/8619715852043?text=" + encodeURIComponent("Habari STEA! Nahitaji msaada wa kutuma pesa China. Ninaomba mwongozo.");
const WA_RATE  = "https://wa.me/8619715852043?text=" + encodeURIComponent("Habari STEA! Ningependa kujua rate ya leo ya kubadilisha pesa. Tafadhali nisaidie.");
const WA_SAFE  = "https://wa.me/8619715852043?text=" + encodeURIComponent("Habari STEA! Nahitaji ushauri wa njia salama ya kutuma pesa nje ya nchi.");

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

function GoldBtn({ href, onClick, children, outline, small }) {
  const s = {
    display:"inline-flex", alignItems:"center", gap:10,
    padding: small ? "10px 20px" : "14px 28px",
    borderRadius:14, fontWeight:900, fontSize: small ? 13 : 15,
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
  if (!q || !a) return null;
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

// ── Static data (crash-safe) ──────────────────────────────────────────────────
const COUNTRIES = [
  { flag:"🇨🇳", name:"China", color:RED, active:true, badge:"Inaendelea",
    desc:"Mwongozo kamili wa kutuma pesa kwa wanafunzi na jamaa walioko China — pamoja na njia za kuaminika.",
    note:"China ina mfumo tofauti wa malipo. Alipay and WeChat Pay zinatawala. Zinahitaji setup maalum.",
    cta:"Angalia Mwongozo", link:WA_CHINA },
  { flag:"🇦🇪", name:"UAE / Dubai", color:"#f59e0b", active:false,
    desc:"Mwongozo wa kutuma pesa kwa jamaa na wanafunzi waliopo UAE — inakuja hivi karibuni.",
    note:"PayPal, bank transfer, and njia maalum za UAE zinafaa zaidi.",
    cta:"Inakuja Hivi Karibuni" },
  { flag:"🇮🇳", name:"India", color:"#f97316", active:false,
    desc:"Mwongozo wa kutuma pesa India — chaguzi nyingi za UPI, IMPS, and njia za kimataifa.",
    note:"India ina mfumo mzuri wa malipo ya ndani ambao unaweza kutumika kwa msaada mzuri.",
    cta:"Inakuja Hivi Karibuni" },
  { flag:"🌍", name:"Nchi Nyingine", color:BLUE, active:false,
    desc:"Kwa nchi nyingine — Ulaya, Amerika, Australia, Canada and zaidi — wasiliana nasi kwa msaada maalum.",
    note:"Kila nchi ina njia zake bora zaidi. Wasiliana nasi kwa ushauri mahususi.",
    cta:"Omba Msaada", link:WA_MAIN },
];

const STEPS = [
  { icon:<MapPin size={24}/>,     color:BLUE,   num:"01", title:"Chagua Nchi Unayotuma",         desc:"Tambua nchi ambayo mpokeaji yuko. Kila nchi ina njia bora zaidi inayofaa." },
  { icon:<Banknote size={24}/>,   color:G,      num:"02", title:"Chagua Njia ya Kutuma",         desc:"Kulingana na nchi and kiasi, chagua njia inayofaa — PayPal, benki, Alipay, au wakala." },
  { icon:<BadgeCheck size={24}/>, color:GREEN,  num:"03", title:"Thibitisha Maelezo ya Mpokeaji",desc:"Hakikisha jina, nambari, au akaunti ya mpokeaji ni sahihi kabisa — kosa moja linaweza kusababisha tatizo." },
  { icon:<TrendingUp size={24}/>, color:PURPLE, num:"04", title:"Angalia Rate na Gharama",       desc:"Tafuta rate ya sasa ya ubadilishaji and gharama zote kabla ya kutuma — usishtuke baadaye." },
  { icon:<Send size={24}/>,       color:RED,    num:"05", title:"Tuma kwa Tahadhari",             desc:"Fuata maelekezo yote, usifanye haraka. Angalia kila kitu mara mbili kabla ya kuthibitisha." },
  { icon:<CheckCircle size={24}/>,color:GREEN,  num:"06", title:"Hifadhi Uthibitisho",           desc:"Chapisha au save screenshot ya uthibitisho wa muamala — hii ni muhimu kama kuna tatizo." },
];

const PROBLEMS = [
  { icon:"📉", title:"Rate Kubadilika Haraka",    desc:"Rate ya ubadilishaji inaweza kubadilika kwa sekunde. Tuma haraka ukikubaliana na rate, au wasiliana nasi kujua wakati mzuri." },
  { icon:"⏳", title:"Ucheleweshaji wa Transfer", desc:"Bank transfers zinaweza kuchukua siku 2-7. Njia nyingine zinaweza kuwa haraka zaidi — panga mapema." },
  { icon:"💸", title:"Ada Kubwa Zisizotarajiwa",  desc:"Baadhi ya njia zina ada nyingi zilizofichwa. Angalia kwa makini ada za nje ya nchi kabla ya kutuma." },
  { icon:"🔒", title:"Vikwazo vya Akaunti",       desc:"PayPal and njia nyingine wakati mwingine zinashikilia pesa kwa sababu za usalama. Hii inaweza kusababisha msongo." },
  { icon:"⚠️", title:"Mawakala wa Ulaghai",       desc:"Kuna watu wanaodai kusaidia kutuma pesa lakini wanaporomoka. Kamwe usitumie mtu asiyejulikana bila uthibitisho." },
  { icon:"❓", title:"Mkanganyiko wa Platform",   desc:"Kuna njia nyingi sana — inaweza kuwa ngumu kujua ipi bora. STEA inaweza kukusaidia kuchagua inayokufaa." },
  { icon:"📋", title:"Maelezo Yasiyo Sahihi",     desc:"Kama jina au nambari ya mpokeaji si sahihi, pesa inaweza kupotea au kuchelewesha. Angalia mara mbili." },
];

const SAFETY_TIPS = [
  "Thibitisha jina and akaunti ya mpokeaji kabla ya kutuma",
  "Tumia njia zilizothibitishwa and zinazojulikana",
  "Epuka mawakala ambao haujui historia yao",
  "Omba uthibitisho wa muamala kila wakati",
  "Usifanye haraka bila ku-verify maelezo yote",
  "Hifadhi screenshot ya kila hatua ya muamala",
  "Kamwe usitume pesa kwa mtu usiyemjua vizuri",
  "Angalia rate rasmi — usiamini rate za siri zisizoweza kuthibitishwa",
];

const TESTIMONIALS = [
  { initials:"AM", name:"Amina M.", context:"Mzazi, Tanzania → China", color:RED, quote:"Nilikuwa sijui jinsi ya kumtumia mtoto wangu pesa China. STEA walinieleza hatua kwa hatua — sasa ninafanya peke yangu bila tatizo.", badge:"Imefanikiwa ✓" },
  { initials:"KJ", name:"Kelvin J.", context:"Mwanafunzi, Guilin University", color:BLUE, quote:"Alipay ilikuwa ngumu sana kusetup. Nikawasiliana na STEA, wakanisaidia mpaka ilifanya kazi. Wanaelewa hali halisi ya China.", badge:"China Verified ✓" },
  { initials:"FN", name:"Fatuma N.", context:"Mama, Dar es Salaam", color:GREEN, quote:"Nilikuwa naogopa kutuma pesa nje — nilifikiria ni ngumu sana. Nilipata mwongozo rahisi wa kuelewa. Asante STEA.", badge:"Imefanikiwa ✓" },
];

const FAQS = [
  { q:"Ni njia gani salama ya kutuma pesa China?", a:"China ni maalum sana — Alipay and WeChat Pay ndio njia zinazotawala. Bank transfer pia inaweza kufanya kazi lakini inachukua muda. Njia sahihi inategemea hali yako. Wasiliana na STEA kwa msaada maalum wa China." },
  { q:"PayPal na Alipay zinatofautianaje?", a:"PayPal ni ya kimataifa and inafanya kazi nchi nyingi lakini ina vikwazo China. Alipay ni ya China haswa and inahitaji setup maalum. Kwa kutuma pesa China, Alipay au njia mbadala za China zinafaa zaidi." },
  { q:"Je, STEA inatuma pesa moja kwa moja?", a:"Hapana. STEA haitoi huduma za kutuma pesa moja kwa moja kwa sasa. STEA ni mwongozo, msaada, and unganisho na njia salama au watu wa kuaminika. Tunakusaidia kuelewa and kufanya maamuzi sahihi." },
  { q:"Je, naweza kupata msaada wa manual/wakala?", a:"Ndiyo. STEA inaweza kukusaidia kupata njia au msaada wa kuaminika kwa hali ngumu — hasa China ambayo inahitaji msaada wa mtu anayeijua vizuri. Wasiliana nasi kupitia WhatsApp." },
  { q:"Rate inabadilikaje na ninajuaje rate ya sasa?", a:"Rate ya ubadilishaji inabadilika kila saa kulingana na masoko ya fedha duniani. Wasiliana na STEA kupata mwongozo wa rate ya sasa kabla ya kufanya maamuzi — hatutaki utumie rate potofu." },
  { q:"Nawezaje kuepuka ulaghai wa kutuma pesa?", a:"Kamwe usitumie mtu usiyemjua. Thibitisha maelezo ya mpokeaji kabla ya kutuma. Epuka deals za rate nzuri kupita kiasi — mara nyingi ni ulaghai. STEA inakusaidia kutambua njia za kweli and salama." },
];

// ════════════════════════════════════════════════════════════════════════════
export default function AbroadMoneyGuidePage() {
  const isMobile = useMobile();
  const [openMethod, setOpenMethod] = useState(null);

  return (
    <div style={{ minHeight:"100vh", background:DARK, color:"#fff", overflowX:"hidden", fontFamily:"'Instrument Sans',system-ui,sans-serif" }}>

      {/* ══ 1. HERO ══════════════════════════════════════════════════════════ */}
      <section style={{ padding:"100px 20px 80px", position:"relative", overflow:"hidden",
        background:"radial-gradient(ellipse at 70% -5%, rgba(245,166,35,.12) 0%, transparent 55%), radial-gradient(ellipse at 10% 80%, rgba(59,130,246,.08) 0%, transparent 50%)",
        textAlign:"center" }}>

        <div style={{ position:"absolute", inset:0, pointerEvents:"none", opacity:.06 }}>
          <svg width="100%" height="100%" viewBox="0 0 900 500" preserveAspectRatio="xMidYMid slice">
            <circle cx="450" cy="250" r="160" fill="none" stroke={G} strokeWidth="1"/>
            <circle cx="450" cy="250" r="260" fill="none" stroke={G} strokeWidth=".5"/>
            <circle cx="450" cy="250" r="380" fill="none" stroke={G} strokeWidth=".3"/>
            <line x1="0" y1="250" x2="900" y2="250" stroke={G} strokeWidth=".4"/>
            <line x1="450" y1="0" x2="450" y2="500" stroke={G} strokeWidth=".4"/>
            {[[200,150],[650,200],[300,350],[700,320],[450,250]].map(([x,y],i)=>(
              <circle key={i} cx={x} cy={y} r="4" fill={G} opacity=".6"/>
            ))}
          </svg>
        </div>

        <motion.div initial={{ opacity:0, y:28 }} animate={{ opacity:1, y:0 }} transition={{ duration:.5 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"8px 18px", background:`${G}14`, border:`1px solid ${G}25`, borderRadius:20, color:G, fontSize:13, fontWeight:700, marginBottom:28 }}>
            <Banknote size={15}/> Abroad Money Guide — Mwongozo wa Kutuma Pesa
          </div>

          <h1 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:"clamp(32px,5.5vw,64px)", fontWeight:900, lineHeight:1.08, letterSpacing:"-.04em", marginBottom:22, maxWidth:820, margin:"0 auto 22px" }}>
            Mwongozo wa Kutuma na Kubadilisha<br/>
            <span style={{ color:G }}>Pesa Kimataifa</span>
          </h1>

          <p style={{ color:"rgba(255,255,255,.6)", maxWidth:560, margin:"0 auto 42px", fontSize:17, lineHeight:1.75 }}>
            Jifunze njia salama za kutuma pesa kwa wanafunzi, ndugu, jamaa and marafiki walioko nje ya nchi.
          </p>

          <div style={{ display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap", marginBottom:40 }}>
            <GoldBtn href={WA_MAIN}><MessageCircle size={18}/> Anza Hapa</GoldBtn>
            <GoldBtn outline onClick={() => document.getElementById("search-section")?.scrollIntoView({ behavior:"smooth" })}>
              Tafuta Njia <ArrowRight size={16}/>
            </GoldBtn>
          </div>

          <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
            {["🇨🇳 China Guide Ipo","✅ Msaada wa WhatsApp","🔒 Mwongozo wa Usalama","📚 Elimu ya Bure"].map(t => (
              <div key={t} style={{ fontSize:12, color:"rgba(255,255,255,.4)", fontWeight:600, padding:"6px 12px", background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.07)", borderRadius:20 }}>{t}</div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ══ 2. SEARCH SECTION ════════════════════════════════════════════════ */}
      <section id="search-section" style={{ padding:"80px 0" }}>
        <W>
          <div style={{ maxWidth:700, margin:"0 auto" }}>
            <div style={{ textAlign:"center", marginBottom:40 }}>
              <SectionLabel color={G}><Zap size={13}/> Tafuta Haraka</SectionLabel>
              <h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:"clamp(24px,4vw,38px)", fontWeight:900, lineHeight:1.1, letterSpacing:"-.03em", marginBottom:12 }}>
                Tafuta Njia Inayokufaa
              </h2>
              <p style={{ color:"rgba(255,255,255,.5)", fontSize:15, maxWidth:480, margin:"0 auto" }}>
                Andika jina la platform, nchi, au aina ya huduma — upate maelezo kamili mara moja.
              </p>
            </div>

            <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:24, padding: isMobile ? "24px 20px" : "32px 36px",
              boxShadow:"0 24px 60px rgba(0,0,0,.4)" }}>
              <MoneySearch
                initialData={MONEY_METHODS}
                placeholder="Tafuta: PayPal, China, Alipay, Wakala, Bank..."
              />
            </div>
          </div>
        </W>
      </section>

      {/* ══ 3. COUNTRIES ═════════════════════════════════════════════════════ */}
      <section style={{ padding:"0 0 80px" }}>
        <W>
          <div style={{ textAlign:"center", marginBottom:52 }}>
            <SectionLabel color={BLUE}><Globe size={13}/> Nchi na Mwongozo</SectionLabel>
            <h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:"clamp(26px,4vw,40px)", fontWeight:900, lineHeight:1.1, letterSpacing:"-.03em", marginBottom:12 }}>
              Chagua Nchi Unayotuma Pesa
            </h2>
            <p style={{ color:"rgba(255,255,255,.5)", fontSize:16, maxWidth:500, margin:"0 auto" }}>
              Kila nchi ina njia zake bora. Tunaanza na China — and tunakuwa tunaongeza nchi zaidi.
            </p>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(260px, 1fr))", gap:18 }}>
            {(COUNTRIES || []).map((c, i) => (
              <motion.div key={i}
                initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:i*.08 }}
                style={{ background:CARD, border:`1px solid ${c.active ? `${c.color}35` : BORDER}`, borderRadius:22, padding:"26px 22px", position:"relative", overflow:"hidden" }}>
                {c.active && <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${c.color},${c.color}60)` }}/>}
                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
                  <div style={{ fontSize:36 }}>{c.flag || "🌍"}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:900, fontSize:18, marginBottom:4 }}>{c.name}</div>
                    <div style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 10px", borderRadius:20,
                      background: c.active ? `${c.color}18` : "rgba(255,255,255,.05)",
                      border:`1px solid ${c.active ? `${c.color}30` : "rgba(255,255,255,.07)"}`,
                      color: c.active ? c.color : "rgba(255,255,255,.4)",
                      fontSize:10, fontWeight:900, letterSpacing:".04em" }}>
                      {c.active ? <><Zap size={9}/> {c.badge || "Active"}</> : "Inakuja"}
                    </div>
                  </div>
                </div>
                <p style={{ fontSize:13.5, color:"rgba(255,255,255,.6)", lineHeight:1.65, marginBottom:14 }}>{c.desc}</p>
                {c.note && (
                  <div style={{ fontSize:12, padding:"8px 12px", background:`${c.color}0d`, borderRadius:8, color:`${c.color}cc`, fontWeight:700, borderLeft:`3px solid ${c.color}40`, marginBottom:18 }}>
                    💡 {c.note}
                  </div>
                )}
                {(c.active || c.link) ? (
                  <a href={c.link || WA_MAIN} target="_blank" rel="noreferrer"
                    style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"9px 18px", background:`linear-gradient(135deg,${c.color},${c.color}aa)`, color:"#fff", fontWeight:800, fontSize:13, borderRadius:10, textDecoration:"none" }}>
                    {c.cta || "Angalia"} <ArrowRight size={14}/>
                  </a>
                ) : (
                  <div style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"9px 18px", background:"rgba(255,255,255,.05)", color:"rgba(255,255,255,.35)", fontWeight:800, fontSize:13, borderRadius:10 }}>
                    <Clock size={13}/> {c.cta || "Inakuja"}
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:.2 }}
            style={{ marginTop:28, background:"rgba(239,68,68,.06)", border:"1px solid rgba(239,68,68,.22)", borderRadius:18, padding:"20px 24px", display:"flex", gap:16, alignItems:"flex-start" }}>
            <AlertTriangle size={22} color="#f87171" style={{ flexShrink:0, marginTop:2 }}/>
            <div>
              <div style={{ fontWeight:800, fontSize:15, color:"#f87171", marginBottom:6 }}>Unatuma pesa China? Inaweza kuwa ngumu zaidi kuliko unavyofikiri</div>
              <p style={{ fontSize:14, color:"rgba(255,255,255,.6)", lineHeight:1.65, margin:0 }}>
                China ina mfumo wa malipo tofauti kabisa — Alipay and WeChat Pay zinatawala, and zinahitaji setup maalum.
                <strong style={{ color:"#fff" }}> Wasiliana na STEA kwanza</strong> tukusaidie kufanya salama.
              </p>
            </div>
          </motion.div>
        </W>
      </section>

      {/* ══ 4. METHODS (compact, crash-safe) ════════════════════════════════ */}
      <section style={{ padding:"0 0 80px" }}>
        <W>
          <div style={{ textAlign:"center", marginBottom:48 }}>
            <SectionLabel color={GREEN}><Banknote size={13}/> Njia za Malipo</SectionLabel>
            <h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:"clamp(26px,4vw,40px)", fontWeight:900, lineHeight:1.1, letterSpacing:"-.03em", marginBottom:12 }}>
              Njia Maarufu za Kutuma Pesa
            </h2>
            <p style={{ color:"rgba(255,255,255,.5)", fontSize:16, maxWidth:520, margin:"0 auto" }}>
              Bonyeza kadi kuona maelezo zaidi. Tumia kisanduku cha utafutaji hapo juu kwa utafutaji wa haraka.
            </p>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(300px, 1fr))", gap:16 }}>
            {(MONEY_METHODS || []).map((m, i) => {
              if (!m) return null;
              const isOpen = openMethod === i;
              return (
                <motion.div key={m.id || i}
                  initial={{ opacity:0, y:18 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:i*.06 }}
                  onClick={() => setOpenMethod(isOpen ? null : i)}
                  style={{ background:CARD, border:`1px solid ${isOpen ? `${m.color || G}40` : BORDER}`, borderRadius:20, padding:"24px 22px", cursor:"pointer", transition:"all .2s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor=`${m.color || G}30`; e.currentTarget.style.transform="translateY(-3px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor= isOpen ? `${m.color || G}40` : BORDER; e.currentTarget.style.transform=""; }}>

                  <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:12 }}>
                    <div style={{ fontSize:32, lineHeight:1, flexShrink:0 }}>{m.emoji || "💳"}</div>
                    <div style={{ flex:1 }}>
                      <h3 style={{ fontWeight:900, fontSize:17, marginBottom:2, color:"#fff" }}>{m.name}</h3>
                      {m.speed && <div style={{ fontSize:11, color:"rgba(255,255,255,.4)", fontWeight:600 }}>⏱ {m.speed}</div>}
                    </div>
                    <motion.div animate={{ rotate:isOpen ? 180 : 0 }} transition={{ duration:.2 }}>
                      <ChevronDown size={16} color="rgba(255,255,255,.3)"/>
                    </motion.div>
                  </div>

                  <p style={{ fontSize:13.5, color:"rgba(255,255,255,.55)", lineHeight:1.65, margin:0 }}>{m.description || ""}</p>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }} exit={{ height:0, opacity:0 }} transition={{ duration:.22 }} style={{ overflow:"hidden" }}>
                        <div style={{ marginTop:16, paddingTop:16, borderTop:`1px solid ${BORDER}` }}>
                          {(m.strengths || []).length > 0 && (
                            <div style={{ marginBottom:12 }}>
                              <div style={{ fontSize:11, fontWeight:900, color:GREEN, letterSpacing:".06em", textTransform:"uppercase", marginBottom:8 }}>Faida</div>
                              {(m.strengths || []).map((s,j) => (
                                <div key={j} style={{ display:"flex", gap:8, alignItems:"flex-start", marginBottom:6 }}>
                                  <CheckCircle size={13} color={GREEN} style={{ flexShrink:0, marginTop:2 }}/>
                                  <span style={{ fontSize:13, color:"rgba(255,255,255,.7)" }}>{s}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {(m.limitations || []).length > 0 && (
                            <div style={{ marginBottom:14 }}>
                              <div style={{ fontSize:11, fontWeight:900, color:"#f87171", letterSpacing:".06em", textTransform:"uppercase", marginBottom:8 }}>Tahadhari</div>
                              {(m.limitations || []).map((lim,j) => (
                                <div key={j} style={{ display:"flex", gap:8, alignItems:"flex-start", marginBottom:6 }}>
                                  <AlertTriangle size={13} color="#f87171" style={{ flexShrink:0, marginTop:2 }}/>
                                  <span style={{ fontSize:13, color:"rgba(255,255,255,.65)" }}>{lim}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {m.waLink && (
                            <a href={m.waLink} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                              style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"8px 16px", background:`${m.color || G}15`, border:`1px solid ${m.color || G}30`, borderRadius:10, color:m.color || G, fontWeight:700, fontSize:12, textDecoration:"none" }}>
                              <MessageCircle size={13}/> Niambie zaidi
                            </a>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </W>
      </section>

      {/* ══ 5. HOW IT WORKS ══════════════════════════════════════════════════ */}
      <section style={{ padding:"0 0 80px" }}>
        <W>
          <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:26, padding:"clamp(32px,5vw,56px)" }}>
            <div style={{ textAlign:"center", marginBottom:48 }}>
              <SectionLabel color={BLUE}><Zap size={13}/> Hatua kwa Hatua</SectionLabel>
              <h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:"clamp(24px,3.5vw,38px)", fontWeight:900, lineHeight:1.1, letterSpacing:"-.03em" }}>
                Jinsi ya Kutuma Pesa Kimataifa
              </h2>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:`repeat(auto-fill, minmax(${isMobile ? "100%" : "300px"}, 1fr))`, gap:16 }}>
              {(STEPS || []).map((s, i) => (
                <motion.div key={i}
                  initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:i*.08 }}
                  style={{ background:"rgba(255,255,255,.02)", border:`1px solid ${BORDER}`, borderRadius:18, padding:"24px 20px", position:"relative", overflow:"hidden" }}>
                  <div style={{ position:"absolute", top:14, right:18, fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:44, fontWeight:900, color:"rgba(255,255,255,.04)" }}>{s.num}</div>
                  <div style={{ width:48, height:48, borderRadius:14, background:`${s.color}18`, color:s.color, display:"grid", placeItems:"center", marginBottom:16 }}>{s.icon}</div>
                  <h3 style={{ fontWeight:900, fontSize:16, marginBottom:8 }}>{s.title}</h3>
                  <p style={{ fontSize:13.5, color:"rgba(255,255,255,.55)", lineHeight:1.65, margin:0 }}>{s.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </W>
      </section>

      {/* ══ 6. PROBLEMS ══════════════════════════════════════════════════════ */}
      <section style={{ padding:"0 0 80px" }}>
        <W>
          <div style={{ textAlign:"center", marginBottom:48 }}>
            <SectionLabel color="#f97316"><AlertTriangle size={13}/> Changamoto</SectionLabel>
            <h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:"clamp(26px,4vw,40px)", fontWeight:900, lineHeight:1.1, letterSpacing:"-.03em", marginBottom:12 }}>
              Changamoto za Kawaida
            </h2>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))", gap:14 }}>
            {(PROBLEMS || []).map((p, i) => (
              <motion.div key={i}
                initial={{ opacity:0, y:14 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:i*.06 }}
                style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:18, padding:"22px 20px", display:"flex", gap:14, alignItems:"flex-start" }}>
                <div style={{ fontSize:28, lineHeight:1, flexShrink:0 }}>{p.icon}</div>
                <div>
                  <h4 style={{ fontWeight:800, fontSize:15, marginBottom:6 }}>{p.title}</h4>
                  <p style={{ fontSize:13, color:"rgba(255,255,255,.55)", lineHeight:1.65, margin:0 }}>{p.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </W>
      </section>

      {/* ══ 7. SAFETY ════════════════════════════════════════════════════════ */}
      <section style={{ padding:"0 0 80px" }}>
        <W>
          <div style={{ background:`linear-gradient(135deg, rgba(16,185,129,.08), rgba(16,185,129,.02))`, border:`1px solid rgba(16,185,129,.2)`, borderRadius:26, padding:"clamp(32px,5vw,56px)" }}>
            <div style={{ textAlign:"center", marginBottom:40 }}>
              <SectionLabel color={GREEN}><Shield size={13}/> Usalama</SectionLabel>
              <h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:"clamp(24px,3.5vw,38px)", fontWeight:900, lineHeight:1.1, letterSpacing:"-.03em" }}>
                Ushauri wa Usalama
              </h2>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:`repeat(auto-fill, minmax(${isMobile ? "100%" : "340px"}, 1fr))`, gap:12 }}>
              {(SAFETY_TIPS || []).map((tip, i) => (
                <motion.div key={i}
                  initial={{ opacity:0, x:-12 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }} transition={{ delay:i*.05 }}
                  style={{ display:"flex", gap:12, alignItems:"flex-start", background:"rgba(16,185,129,.05)", border:`1px solid rgba(16,185,129,.12)`, borderRadius:14, padding:"14px 16px" }}>
                  <CheckCircle size={16} color={GREEN} style={{ flexShrink:0, marginTop:2 }}/>
                  <span style={{ fontSize:14, color:"rgba(255,255,255,.78)", lineHeight:1.55, fontWeight:600 }}>{tip}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </W>
      </section>

      {/* ══ 8. RATE INFO ═════════════════════════════════════════════════════ */}
      <section style={{ padding:"0 0 80px" }}>
        <W>
          <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:22, padding:"clamp(28px,4vw,44px)", display:"flex", gap:24, alignItems:"flex-start", flexWrap:"wrap" }}>
            <div style={{ width:64, height:64, borderRadius:18, background:`${G}15`, display:"grid", placeItems:"center", flexShrink:0 }}>
              <TrendingUp size={30} color={G}/>
            </div>
            <div style={{ flex:1, minWidth:240 }}>
              <SectionLabel color={G}><Info size={12}/> Rate ya Ubadilishaji</SectionLabel>
              <h3 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:"clamp(20px,3vw,28px)", fontWeight:900, lineHeight:1.2, marginBottom:12 }}>
                Kuhusu Rate ya Kubadilisha Pesa
              </h3>
              <p style={{ fontSize:15, color:"rgba(255,255,255,.6)", lineHeight:1.75, marginBottom:20 }}>
                Rate hubadilika kila saa kulingana na soko la fedha duniani. Inategemea njia unayotumia, kiasi cha pesa, and nchi unayotuma. Usitegemee rate ya jana — angalia siku unayotuma.
              </p>
              <div style={{ background:"rgba(245,166,35,.08)", border:"1px solid rgba(245,166,35,.2)", borderRadius:12, padding:"14px 18px", marginBottom:20, display:"flex", gap:10, alignItems:"flex-start" }}>
                <Info size={16} color={G} style={{ flexShrink:0, marginTop:2 }}/>
                <p style={{ fontSize:13.5, color:"rgba(255,255,255,.65)", lineHeight:1.65, margin:0 }}>
                  <strong style={{ color:G }}>Ushauri:</strong> Wasiliana nasi kupata mwongozo wa rate ya sasa kabla ya kufanya maamuzi.
                </p>
              </div>
              <GoldBtn href={WA_RATE} small><PhoneCall size={15}/> Omba Rate ya Leo</GoldBtn>
            </div>
          </div>
        </W>
      </section>

      {/* ══ 9. STEA HELPS CTA ════════════════════════════════════════════════ */}
      <section style={{ padding:"0 0 80px" }}>
        <W>
          <div style={{ background:`linear-gradient(135deg, rgba(245,166,35,.1), rgba(245,166,35,.03))`, border:"1px solid rgba(245,166,35,.22)", borderRadius:24, padding:"clamp(32px,5vw,56px)", textAlign:"center" }}>
            <div style={{ fontSize:48, marginBottom:16 }}>💬</div>
            <h3 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:"clamp(22px,3.5vw,34px)", fontWeight:900, marginBottom:14, letterSpacing:"-.02em" }}>
              Tayari Kupata Msaada?
            </h3>
            <p style={{ color:"rgba(255,255,255,.6)", maxWidth:480, margin:"0 auto 36px", fontSize:16, lineHeight:1.7 }}>
              STEA inatoa mwongozo, ushauri, and msaada wa mawasiliano ya kuaminika kulingana na mahitaji ya kutuma pesa kimataifa.
            </p>
            <div style={{ display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap" }}>
              <GoldBtn href={WA_MAIN}><MessageCircle size={18}/> Omba Msaada WhatsApp</GoldBtn>
              <GoldBtn href={WA_SAFE} outline>Uliza Njia Salama</GoldBtn>
              <GoldBtn href={WA_RATE} outline><Zap size={15}/> Msaada wa Haraka</GoldBtn>
            </div>
            <div style={{ marginTop:28, display:"flex", gap:20, justifyContent:"center", flexWrap:"wrap" }}>
              {["✅ Mwongozo wa bure","✅ Kupitia WhatsApp","✅ Kiswahili"].map(t => (
                <div key={t} style={{ fontSize:13, color:"rgba(255,255,255,.4)", fontWeight:600 }}>{t}</div>
              ))}
            </div>
          </div>
        </W>
      </section>

      {/* ══ 10. TESTIMONIALS ═════════════════════════════════════════════════ */}
      <section style={{ padding:"0 0 80px" }}>
        <W>
          <div style={{ textAlign:"center", marginBottom:48 }}>
            <SectionLabel color={PURPLE}><Star size={13}/> Maoni</SectionLabel>
            <h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:"clamp(26px,4vw,40px)", fontWeight:900, lineHeight:1.1, letterSpacing:"-.03em" }}>
              Watu Wanasema Nini
            </h2>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))", gap:18 }}>
            {(TESTIMONIALS || []).map((t, i) => (
              <motion.div key={i}
                initial={{ opacity:0, y:18 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:i*.1 }}
                style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:22, padding:"28px 24px", position:"relative", overflow:"hidden" }}>
                <div style={{ position:"absolute", top:20, right:22, fontSize:48, color:`${G}15`, fontFamily:"Georgia,serif", lineHeight:1 }}>&ldquo;</div>
                <div style={{ display:"flex", gap:3, marginBottom:16 }}>
                  {[1,2,3,4,5].map(s => <Star key={s} size={13} fill={G} color={G}/>)}
                </div>
                <p style={{ fontSize:14.5, color:"rgba(255,255,255,.75)", lineHeight:1.75, fontStyle:"italic", marginBottom:22 }}>
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ width:44, height:44, borderRadius:14, background:`linear-gradient(135deg,${t.color || G},${t.color || G}80)`, display:"grid", placeItems:"center", fontWeight:900, fontSize:16, color:"#fff", flexShrink:0 }}>
                    {t.initials || "?"}
                  </div>
                  <div>
                    <div style={{ fontWeight:800, fontSize:15 }}>{t.name}</div>
                    <div style={{ fontSize:12, color:"rgba(255,255,255,.4)", fontWeight:600 }}>{t.context}</div>
                  </div>
                  {t.badge && (
                    <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:5, padding:"4px 10px", background:`${GREEN}12`, border:`1px solid ${GREEN}25`, borderRadius:20, color:GREEN, fontSize:10, fontWeight:900 }}>
                      <BadgeCheck size={11}/> {t.badge}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </W>
      </section>

      {/* ══ 11. FAQ ══════════════════════════════════════════════════════════ */}
      <section style={{ padding:"0 0 80px" }}>
        <W>
          <div style={{ textAlign:"center", marginBottom:44 }}>
            <SectionLabel color={BLUE}><HelpCircle size={13}/> FAQ</SectionLabel>
            <h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:"clamp(26px,4vw,40px)", fontWeight:900, lineHeight:1.1, letterSpacing:"-.03em" }}>
              Maswali Yanayoulizwa Mara kwa Mara
            </h2>
          </div>
          <div style={{ maxWidth:760, margin:"0 auto", display:"grid", gap:10 }}>
            {(FAQS || []).map((faq, i) => <FaqItem key={i} {...faq}/>)}
          </div>
        </W>
      </section>

      {/* ══ 12. DISCLAIMER ═══════════════════════════════════════════════════ */}
      <section style={{ padding:"0 0 clamp(80px,12vw,120px)" }}>
        <W>
          <div style={{ background:"rgba(255,255,255,.02)", border:`1px solid ${BORDER}`, borderRadius:20, padding:"28px 32px", display:"flex", gap:18, alignItems:"flex-start", flexWrap:"wrap" }}>
            <div style={{ width:44, height:44, borderRadius:12, background:"rgba(255,255,255,.04)", display:"grid", placeItems:"center", flexShrink:0 }}>
              <Eye size={22} color="rgba(255,255,255,.4)"/>
            </div>
            <div style={{ flex:1, minWidth:240 }}>
              <div style={{ fontWeight:800, fontSize:15, marginBottom:8 }}>Uwazi Kutoka STEA</div>
              <p style={{ fontSize:14, color:"rgba(255,255,255,.5)", lineHeight:1.8, margin:0 }}>
                <strong style={{ color:"#fff" }}>STEA haitoi huduma za kifedha moja kwa moja kwa sasa.</strong> Tunatoa mwongozo, ushauri, and msaada wa mawasiliano ya kuaminika kulingana na mahitaji ya mtumiaji.
                Tafadhali zingatia sheria za nchi yako and uthibitishe maelezo yote kabla ya kufanya muamala wowote wa kifedha.
              </p>
            </div>
          </div>
        </W>
      </section>

    </div>
  );
}
