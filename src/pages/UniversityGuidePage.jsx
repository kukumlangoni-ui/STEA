import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap, BookOpen, CreditCard, Calendar, Users,
  ChevronDown, ArrowRight, CheckCircle, Star, MapPin,
  FileText, AlertCircle, Bot, Trophy, Zap,
  ExternalLink, Sparkles, School, Download, Search
} from "lucide-react";

const G  = "#F5A623";
const G2 = "#FFD17C";
const DARK   = "#05060a";
const CARD   = "#0e101a";
const BORDER = "rgba(255,255,255,0.08)";
const NEUTRAL = "rgba(255,255,255,0.6)";
const BLUE = G;
const GREEN = G;
const PURPLE = G;

const W = ({ children, style = {} }) => (
  <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 clamp(16px,4vw,40px)", ...style }}>
    {children}
  </div>
);
const labelSt = { display:"block", fontSize:11, fontWeight:800, color:"rgba(255,255,255,0.4)", marginBottom:8, letterSpacing:"0.06em", textTransform:"uppercase" };
const selSt   = { width:"100%", height:50, borderRadius:12, border:`1px solid ${BORDER}`, background:"rgba(255,255,255,0.05)", color:"#fff", padding:"0 16px", outline:"none", fontSize:14, fontFamily:"inherit", appearance:"none", cursor:"pointer" };
const btnGold = { display:"inline-flex", alignItems:"center", gap:10, background:`linear-gradient(135deg,${G},${G2})`, color:"#111", padding:"14px 28px", borderRadius:14, fontWeight:900, fontSize:15, border:"none", cursor:"pointer", boxShadow:`0 8px 24px ${G}40`, transition:"all .2s" };

const COMBO_MAP = {
  PCM:   { courses:["Computer Science","Software Engineering","Electrical Engineering","Mechanical Engineering","Mathematics","Data Science","Informatics"],        unis:["UDSM","ARU","NM-AIST","UDOM","CoET"],   demand:"Juu Sana",  color:G },
  PCB:   { courses:["Medicine & Surgery","Pharmacy","Nursing","Biochemistry","Biology","Dentistry","Medical Laboratory Science"],                                    unis:["MUHAS","UDSM","KCMUCo","CUHAS"],        demand:"Juu Sana",  color:G },
  HGE:   { courses:["Geography","Environmental Management","Urban Planning","Tourism","History","Social Work","Land Management"],                                    unis:["UDSM","UDOM","Mzumbe","ARU","OUT"],     demand:"Wastani",   color:G },
  HKL:   { courses:["Law (LLB)","Linguistics","Literature","Journalism","International Relations","Public Administration","Political Science"],                      unis:["UDSM","ARU","SAUT","OUT","Mzumbe"],    demand:"Juu",       color:G },
  EGM:   { courses:["Economics","Business Administration","Banking & Finance","Accountancy","Statistics","Actuarial Science","Commerce"],                            unis:["UDSM","IFM","Mzumbe","ARU","SAUT"],    demand:"Juu",       color:G },
  CBG:   { courses:["Commerce","Business Administration","Accountancy","Entrepreneurship","Finance","HRM","Tax Management"],                                         unis:["Mzumbe","IFM","DUCE","ARU","SAUT"],    demand:"Juu",       color:G },
  PGM:   { courses:["Agriculture","Veterinary Science","Food Science","Forestry","Environmental Science","Animal Science"],                                          unis:["SUA (Sokoine)","UDSM","NM-AIST"],      demand:"Wastani",   color:G },
  Other: { courses:["Education","Social Work","Library Science","Public Administration","Development Studies"],                                                       unis:["UDSM","OUT","DUCE","Mzumbe","SAUT"],  demand:"Wastani",   color:NEUTRAL },
};

const UNIS = [
  { name:"University of Dar es Salaam (UDSM)",         location:"Dar es Salaam",       type:"Serikali", programs:["Engineering","Law","Medicine","Science","Arts","Commerce","Education"],      fees:"TSH 1.5M–3M/mwaka",   rating:5, url:"https://www.udsm.ac.tz" },
  { name:"Muhimbili University (MUHAS)",                location:"Dar es Salaam",       type:"Serikali", programs:["Medicine","Pharmacy","Nursing","Dentistry","Allied Health"],                 fees:"TSH 2M–5M/mwaka",     rating:5, url:"https://www.muhas.ac.tz" },
  { name:"University of Dodoma (UDOM)",                 location:"Dodoma",               type:"Serikali", programs:["Science","Arts","Education","Business","Law","Engineering"],                fees:"TSH 1.2M–2.5M/mwaka", rating:4, url:"https://www.udom.ac.tz" },
  { name:"Mzumbe University",                           location:"Morogoro / DSM",       type:"Serikali", programs:["Business","Law","Public Administration","Accountancy","HRM"],                fees:"TSH 1.5M–2.5M/mwaka", rating:4, url:"https://www.mzumbe.ac.tz" },
  { name:"Ardhi University (ARU)",                      location:"Dar es Salaam",       type:"Serikali", programs:["Architecture","Land Management","Real Estate","Urban Planning","Civil Eng"], fees:"TSH 1.5M–3M/mwaka",   rating:4, url:"https://www.aru.ac.tz" },
  { name:"Institute of Finance Management (IFM)",       location:"Dar es Salaam",       type:"Serikali", programs:["Accountancy","Banking","Insurance","Finance","Tax Management"],              fees:"TSH 1.5M–2.5M/mwaka", rating:4, url:"https://www.ifm.ac.tz" },
  { name:"Sokoine University of Agriculture (SUA)",     location:"Morogoro",             type:"Serikali", programs:["Agriculture","Veterinary","Food Science","Forestry","Environmental"],        fees:"TSH 1.2M–2.5M/mwaka", rating:4, url:"https://www.sua.ac.tz" },
  { name:"St. Augustine University (SAUT)",             location:"Mwanza",               type:"Binafsi",  programs:["Business","Engineering","Law","Science","Education","Arts"],                fees:"TSH 2M–4M/mwaka",     rating:4, url:"https://www.saut.ac.tz" },
  { name:"Nelson Mandela African Institute (NM-AIST)",  location:"Arusha",               type:"Serikali", programs:["Computer Science","Engineering","Water Resources","Life Sciences"],          fees:"TSH 2M–4M/mwaka",     rating:4, url:"https://www.nm-aist.ac.tz" },
  { name:"Open University of Tanzania (OUT)",           location:"Nchi Nzima (Online)",  type:"Serikali", programs:["Education","Science","Arts","Law","Business"],                               fees:"TSH 800K–1.5M/mwaka", rating:3, url:"https://www.out.ac.tz" },
];

const DEADLINES = [
  { label:"Maombi ya TCU (1st Round)",  date:"Januari – Machi",    color:G,      note:"Fungua mara baada ya ACSEE results",   urgent:false },
  { label:"Matokeo ya Chaguo la 1",     date:"Aprili",              color:G,     note:"Angalia TCU portal au tovuti ya chuo", urgent:false },
  { label:"Maombi ya HESLB",            date:"Februari – Aprili",   color:G,         note:"Tumia OLAMS: olas.heslb.go.tz",        urgent:true  },
  { label:"Chaguo la 2 (2nd Round)",    date:"Aprili – Mei",        color:G,    note:"Kwa waliokosa au wanaotaka kubadilisha",urgent:false },
  { label:"Malipo ya Ada ya Awali",     date:"Kabla ya Kujisajili", color:G, note:"Lazima ulipe kabla ya registration",   urgent:true  },
  { label:"Usajili Chuoni",             date:"Septemba – Oktoba",   color:G,     note:"Semester huanza baada ya usajili",     urgent:false },
  { label:"HESLB – Round 2",            date:"Julai – Agosti",      color:G,      note:"Kwa wanafunzi walioko chuoni tayari",  urgent:false },
  { label:"Jibu la Mkopo wa HESLB",     date:"Oktoba – Novemba",    color:G,         note:"Angalia status kwenye OLAMS portal",   urgent:false },
];

const PDF_GUIDES = [
  { title:"Mwongozo wa TCU 2025",      desc:"Jinsi ya kuomba chuo kupitia TCU hatua kwa hatua",   icon:"📄", size:"Tovuti ya TCU",  url:"https://tcu.go.tz" },
  { title:"Mwongozo wa HESLB",         desc:"Jinsi ya kupata mkopo — nyaraka na hatua kamili",     icon:"📋", size:"Tovuti ya HESLB", url:"https://www.heslb.go.tz" },
  { title:"OLAMS Portal (Apply Mkopo)",desc:"Omba mkopo wa HESLB moja kwa moja hapa",              icon:"💳", size:"Portal ya OLAMS",  url:"https://olas.heslb.go.tz" },
  { title:"Orodha ya Vyuo Tanzania",   desc:"Vyuo vyote vilivyoidhinishwa na TCU Tanzania",        icon:"🏛️", size:"Tovuti ya TCU",  url:"https://tcu.go.tz" },
];

function Faq({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border:`1px solid ${open ? G+"40" : BORDER}`, borderRadius:14, overflow:"hidden", transition:"border-color .2s" }}>
      <button onClick={() => setOpen(v => !v)} style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 22px", background:"none", border:"none", color:"#fff", fontWeight:700, fontSize:14, textAlign:"left", cursor:"pointer", gap:16 }}>
        <span>{q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration:.2 }}>
          <ChevronDown size={16} color={G}/>
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }} exit={{ height:0, opacity:0 }} transition={{ duration:.22 }} style={{ overflow:"hidden" }}>
            <div style={{ padding:"0 22px 18px", color:"rgba(255,255,255,.6)", lineHeight:1.7, fontSize:14 }}>{a}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StepCard({ num, icon, title, desc, color, note, link }) {
  return (
    <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
      style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:20, padding:"26px 24px", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:12, right:16, fontSize:40, fontWeight:900, color:"rgba(255,255,255,.04)", fontFamily:"'Bricolage Grotesque',sans-serif" }}>{num}</div>
      <div style={{ width:48, height:48, borderRadius:14, background:`${color}18`, color, display:"grid", placeItems:"center", marginBottom:16 }}>{icon}</div>
      <h3 style={{ fontWeight:800, fontSize:16, marginBottom:8 }}>{title}</h3>
      <p style={{ fontSize:13.5, color:"rgba(255,255,255,.55)", lineHeight:1.65, marginBottom: note||link ? 12 : 0 }}>{desc}</p>
      {note && <div style={{ fontSize:12, padding:"8px 12px", background:`${G}10`, borderRadius:8, color:G, fontWeight:700 }}>💡 {note}</div>}
      {link && <a href={link} target="_blank" rel="noreferrer" style={{ display:"inline-flex", alignItems:"center", gap:6, fontSize:12, color:G, fontWeight:700, textDecoration:"none", marginTop: note ? 8 : 0 }}><ExternalLink size={12}/> Fungua Tovuti</a>}
    </motion.div>
  );
}

function UniCard({ uni }) {
  return (
    <motion.div whileHover={{ y:-4 }} style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:20, padding:"22px 20px", transition:"all .25s" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor=`${G}30`; e.currentTarget.style.boxShadow="0 12px 32px rgba(0,0,0,.4)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor=BORDER; e.currentTarget.style.boxShadow="none"; }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
        <div style={{ flex:1, marginRight:10 }}>
          <div style={{ fontWeight:900, fontSize:14, lineHeight:1.3, marginBottom:4 }}>{uni.name}</div>
          <div style={{ display:"flex", alignItems:"center", gap:5, color:"rgba(255,255,255,.4)", fontSize:12 }}><MapPin size={11}/>{uni.location}</div>
        </div>
        <span style={{ fontSize:10, fontWeight:900, padding:"3px 9px", borderRadius:6, background: uni.type==="Serikali"?"rgba(245,166,35,.12)":"rgba(245,166,35,.12)", color: G, flexShrink:0 }}>{uni.type}</span>
      </div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:12 }}>
        {uni.programs.slice(0,4).map((p,i) => <span key={i} style={{ padding:"3px 8px", background:"rgba(59,130,246,.1)", borderRadius:6, fontSize:11, fontWeight:700, color:"#93c5fd" }}>{p}</span>)}
        {uni.programs.length>4 && <span style={{ padding:"3px 8px", background:"rgba(255,255,255,.05)", borderRadius:6, fontSize:11, color:"rgba(255,255,255,.35)" }}>+{uni.programs.length-4}</span>}
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontSize:12, color:G, fontWeight:700 }}>{uni.fees}</div>
        <div style={{ display:"flex", gap:2 }}>{[1,2,3,4,5].map(s => <Star key={s} size={11} fill={s<=uni.rating?G:"transparent"} color={s<=uni.rating?G:"rgba(255,255,255,.15)"}/>)}</div>
      </div>
      <a href={uni.url} target="_blank" rel="noreferrer" style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:11, color:"rgba(255,255,255,.35)", fontWeight:700, textDecoration:"none", marginTop:10 }}>
        <ExternalLink size={10}/> Tovuti Rasmi
      </a>
    </motion.div>
  );
}

function TabBtn({ label, icon, active, onClick }) {
  return (
    <button onClick={onClick} style={{ padding:"9px 18px", borderRadius:12, border:"none", background: active?`linear-gradient(135deg,${G},${G2})`:"rgba(255,255,255,.05)", color: active?"#111":"rgba(255,255,255,.55)", fontWeight: active?800:700, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:7, transition:"all .2s", flexShrink:0, boxShadow: active?`0 4px 14px ${G}30`:"none" }}>
      {icon}{label}
    </button>
  );
}

function CourseTool() {
  const [level, setLevel] = useState("Form 6 (ACSEE)");
  const [combo, setCombo] = useState("");
  const [result, setResult] = useState(null);
  return (
    <div style={{ background:"rgba(59,130,246,.05)", border:"1px solid rgba(59,130,246,.15)", borderRadius:24, padding:"32px 28px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
        <div style={{ width:48, height:48, borderRadius:14, background:`${G}15`, display:"grid", placeItems:"center", color:G }}><Bot size={26}/></div>
        <div>
          <div style={{ fontWeight:900, fontSize:18 }}>Mshauri wa Kozi</div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,.4)" }}>Weka taarifa zako upate mapendekezo bora</div>
        </div>
      </div>
      <div style={{ display:"grid", gap:16, marginBottom:20 }}>
        <div><label style={labelSt}>Kiwango chako</label>
          <select value={level} onChange={e => { setLevel(e.target.value); setResult(null); }} style={selSt}>
            <option>Form 6 (ACSEE)</option><option>Form 4 (CSEE)</option><option>Diploma / Certificate</option>
          </select>
        </div>
        {level==="Form 6 (ACSEE)" && (
          <div><label style={labelSt}>Combination yako</label>
            <select value={combo} onChange={e => { setCombo(e.target.value); setResult(null); }} style={selSt}>
              <option value="">-- Chagua Combination --</option>
              {Object.keys(COMBO_MAP).filter(k => k!=="Other").map(k => <option key={k} value={k}>{k}</option>)}
              <option value="Other">Nyingine / Sijui</option>
            </select>
          </div>
        )}
      </div>
      <button onClick={() => { const k=COMBO_MAP[combo]?combo:"Other"; setResult({ combo:combo||"Chaguo lako", ...COMBO_MAP[k] }); }}
        disabled={level==="Form 6 (ACSEE)"&&!combo}
        style={{ ...btnGold, width:"100%", justifyContent:"center", opacity: level==="Form 6 (ACSEE)"&&!combo ? 0.4 : 1, cursor: level==="Form 6 (ACSEE)"&&!combo?"not-allowed":"pointer" }}>
        <Sparkles size={16}/> Nipa Mapendekezo
      </button>
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }} style={{ overflow:"hidden" }}>
            <div style={{ marginTop:24, padding:20, background:"rgba(34,197,94,.06)", border:"1px solid rgba(34,197,94,.15)", borderRadius:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                <div style={{ fontWeight:800, fontSize:14, color:G }}>✅ Mapendekezo ya {result.combo}</div>
                <span style={{ fontSize:11, fontWeight:900, padding:"3px 10px", borderRadius:6, background:`${result.color}15`, color:result.color }}>Mahitaji: {result.demand}</span>
              </div>
              {result.courses.map((c,i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom: i<result.courses.length-1?`1px solid ${BORDER}`:"none" }}>
                  <Star size={13} color={G} fill={G}/><span style={{ fontSize:14, color:"rgba(255,255,255,.8)" }}>{c}</span>
                </div>
              ))}
              <div style={{ fontSize:11, fontWeight:800, color:"rgba(255,255,255,.4)", marginTop:14, marginBottom:8 }}>VYUO VINAVYOPENDEKEZWA:</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                {result.unis.map((u,i) => <span key={i} style={{ padding:"4px 12px", background:"rgba(59,130,246,.1)", border:"1px solid rgba(59,130,246,.2)", borderRadius:8, fontSize:12, fontWeight:700, color:"#93c5fd" }}>{u}</span>)}
              </div>
              <p style={{ fontSize:12, color:"rgba(255,255,255,.25)", marginTop:14, lineHeight:1.5 }}>Hii ni mapendekezo ya msingi. Angalia mahitaji kamili ya kila chuo kwenye tovuti rasmi zao kabla ya kuomba.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AIChatPlaceholder() {
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState([
    { role:"bot", text:"Habari! Mimi ni msaidizi wa STEA University Guide. Unaweza kuniuliza maswali kuhusu kuomba chuo, HESLB, au combination zako. Ninakusaidia kupata njia sahihi! 🎓" }
  ]);
  const QUICK_QS = ["Ninaweza kuomba TCU vipi?","Combination yangu ni PCM, kozi zipi?","HESLB inahitaji nyaraka gani?","Vyuo gani bora kwa Law?"];
  const ANSWERS = {
    default:"Swali zuri! Kwa maelezo ya kina, tembelea tab zinazohusika hapo juu au nenda kwenye tovuti rasmi za TCU na HESLB. STEA inakusaidia kuelewa mchakato huu hatua kwa hatua! 💪",
    pcm:"PCM inakuwezesha kusomea: Computer Science, Engineering (Electrical, Mechanical, Civil), Mathematics, Data Science na zaidi. Vyuo kama UDSM, ARU, na NM-AIST vinakubali PCM. Tazama tab 'Mshauri Kozi' kwa undani zaidi! 🎯",
    tcu:"Kuomba TCU: Nenda tcu.go.tz, fungua akaunti, jaza taarifa, chagua kozi 2-3, lipa ada ya maombi, kisha wasilisha. Tazama tab 'Kuomba Chuo' kwa hatua kamili! 📝",
    heslb:"HESLB inahitaji: NIDA, Cheti cha kuzaliwa, Matokeo ya Form 4 na 6, Admission Letter, Taarifa za mapato ya familia, na Picha za pasporti. Nenda tab 'Mkopo HESLB' kupata maelezo kamili! 💳",
    law:"Kwa Law, vyuo bora ni: UDSM (bora zaidi), ARU, SAUT, na Mzumbe. Combination zinazofaa ni HKL, HGL, au EGM. Combination yenye History, Literature na Kiswahili inafaa pia! ⚖️",
  };
  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMsgs(m => [...m, { role:"user", text:userMsg }]);
    setInput("");
    setTimeout(() => {
      const low = userMsg.toLowerCase();
      let reply = ANSWERS.default;
      if (low.includes("pcm")||low.includes("combination")) reply = ANSWERS.pcm;
      else if (low.includes("tcu")||low.includes("omba")) reply = ANSWERS.tcu;
      else if (low.includes("heslb")||low.includes("mkopo")||low.includes("nyaraka")) reply = ANSWERS.heslb;
      else if (low.includes("law")||low.includes("sheria")) reply = ANSWERS.law;
      setMsgs(m => [...m, { role:"bot", text:reply }]);
    }, 800);
  };
  return (
    <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:24, overflow:"hidden" }}>
      <div style={{ padding:"18px 24px", borderBottom:`1px solid ${BORDER}`, display:"flex", alignItems:"center", gap:12, background:`${G}08` }}>
        <div style={{ width:40, height:40, borderRadius:12, background:`${G}20`, display:"grid", placeItems:"center", color:G }}><Bot size={22}/></div>
        <div>
          <div style={{ fontWeight:800, fontSize:15 }}>STEA AI Msaidizi</div>
          <div style={{ fontSize:12, color:G, fontWeight:700, display:"flex", alignItems:"center", gap:5 }}>
            <div style={{ width:7, height:7, borderRadius:"50%", background:G }}/> Yuko Mtandaoni
          </div>
        </div>
      </div>
      <div style={{ height:260, overflowY:"auto", padding:"16px 16px 8px" }}>
        {msgs.map((m,i) => (
          <div key={i} style={{ display:"flex", justifyContent: m.role==="user"?"flex-end":"flex-start", marginBottom:12 }}>
            <div style={{ maxWidth:"80%", padding:"10px 14px", borderRadius: m.role==="user"?"14px 14px 4px 14px":"14px 14px 14px 4px", background: m.role==="user"?`linear-gradient(135deg,${G},${G2})`:"rgba(255,255,255,.06)", color: m.role==="user"?"#111":"rgba(255,255,255,.85)", fontSize:13, lineHeight:1.6, fontWeight: m.role==="user"?700:400 }}>
              {m.text}
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding:"6px 16px 10px", display:"flex", gap:6, overflowX:"auto", scrollbarWidth:"none" }}>
        {QUICK_QS.map((q,i) => (
          <button key={i} onClick={() => setInput(q)} style={{ padding:"5px 12px", borderRadius:999, fontSize:11, fontWeight:700, border:`1px solid ${BORDER}`, background:"rgba(255,255,255,.03)", color:"rgba(255,255,255,.55)", cursor:"pointer", whiteSpace:"nowrap", flexShrink:0 }}>{q}</button>
        ))}
      </div>
      <div style={{ padding:"8px 16px 16px", display:"flex", gap:10 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==="Enter"&&handleSend()} placeholder="Uliza swali lolote..."
          style={{ flex:1, height:46, borderRadius:13, border:`1px solid ${BORDER}`, background:"rgba(255,255,255,.04)", color:"#fff", padding:"0 16px", outline:"none", fontSize:13, fontFamily:"inherit" }}
          onFocus={e => e.target.style.borderColor=G} onBlur={e => e.target.style.borderColor=BORDER}/>
        <button onClick={handleSend} style={{ width:46, height:46, borderRadius:13, border:"none", background:`linear-gradient(135deg,${G},${G2})`, color:"#111", cursor:"pointer", display:"grid", placeItems:"center" }}>
          <ArrowRight size={18}/>
        </button>
      </div>
    </div>
  );
}

export default function UniversityGuidePage() {
  const [tab, setTab] = useState("overview");
  const [uniSearch, setUniSearch] = useState("");

  const TABS = [
    { id:"overview",     label:"Mwanzo",       icon:<GraduationCap size={15}/> },
    { id:"apply",        label:"Kuomba Chuo",  icon:<FileText size={15}/> },
    { id:"heslb",        label:"Mkopo HESLB",  icon:<CreditCard size={15}/> },
    { id:"courses",      label:"Mshauri Kozi", icon:<Bot size={15}/> },
    { id:"universities", label:"Vyuo",          icon:<School size={15}/> },
    { id:"dates",        label:"Tarehe",        icon:<Calendar size={15}/> },
    { id:"student-life", label:"Maisha Chuo",  icon:<Star size={15}/> },
  ];

  const filteredUnis = UNIS.filter(u =>
    !uniSearch ||
    u.name.toLowerCase().includes(uniSearch.toLowerCase()) ||
    u.location.toLowerCase().includes(uniSearch.toLowerCase()) ||
    u.programs.some(p => p.toLowerCase().includes(uniSearch.toLowerCase()))
  );

  return (
    <div style={{ minHeight:"100vh", background:DARK, color:"#fff", overflowX:"hidden", fontFamily:"'Instrument Sans',system-ui,sans-serif" }}>

      {/* HERO */}
      <section style={{ padding:"100px 20px 72px", background:"radial-gradient(ellipse at 50% -10%, rgba(59,130,246,.18) 0%, transparent 60%)", textAlign:"center" }}>
        <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ duration:.5 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"8px 18px", background:"rgba(59,130,246,.12)", border:"1px solid rgba(59,130,246,.2)", borderRadius:20, color:"#93c5fd", fontSize:13, fontWeight:700, marginBottom:28 }}>
            <GraduationCap size={15}/> University Guide Tanzania
          </div>
          <h1 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:"clamp(32px,5.5vw,64px)", fontWeight:900, lineHeight:1.08, marginBottom:20, letterSpacing:"-.04em" }}>
            Mwongozo Rahisi wa<br/>
            <span style={{ background:`linear-gradient(135deg,${BLUE},#93c5fd)`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Kujiunga na Chuo Kikuu</span>
          </h1>
          <p style={{ color:"rgba(255,255,255,.55)", maxWidth:580, margin:"0 auto 36px", fontSize:17, lineHeight:1.7 }}>
            Apply chuo, pata mkopo, chagua kozi sahihi — yote sehemu moja.<br/>Tunakuongoza hatua kwa hatua bila msongo.
          </p>
          <div style={{ display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap" }}>
            <button onClick={() => setTab("overview")} style={btnGold}>ANZA HAPA <ArrowRight size={18}/></button>
            <button onClick={() => setTab("courses")} style={{ background:"rgba(255,255,255,.05)", border:`1px solid ${BORDER}`, color:"#fff", padding:"14px 28px", borderRadius:14, fontWeight:700, fontSize:15, cursor:"pointer" }}>🤖 Mshauri wa Kozi</button>
          </div>
          <div style={{ display:"flex", gap:32, justifyContent:"center", flexWrap:"wrap", marginTop:52 }}>
            {[["70+","Vyuo Tanzania"],["HESLB","Mkopo wa Serikali"],["Bure","Mwongozo Huu"],["2025/26","Intake ya Sasa"]].map(([n,l]) => (
              <div key={n} style={{ textAlign:"center" }}>
                <div style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontWeight:900, fontSize:22, color:BLUE }}>{n}</div>
                <div style={{ fontSize:12, color:"rgba(255,255,255,.4)", fontWeight:600 }}>{l}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* TABS */}
      <div style={{ background:"rgba(255,255,255,.02)", borderBottom:`1px solid ${BORDER}`, position:"sticky", top:60, zIndex:100 }}>
        <W><div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:4, paddingTop:8, scrollbarWidth:"none" }}>
          {TABS.map(t => <TabBtn key={t.id} {...t} active={tab===t.id} onClick={() => setTab(t.id)}/>)}
        </div></W>
      </div>

      {/* CONTENT */}
      <W style={{ paddingTop:44, paddingBottom:"clamp(80px,12vw,120px)" }}>
        <AnimatePresence mode="wait">

          {/* ══ OVERVIEW ══ */}
          {tab==="overview" && (
            <motion.div key="overview" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
              <h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:30, fontWeight:900, marginBottom:8 }}>Jinsi <span style={{ color:BLUE }}>Inavyofanya Kazi</span></h2>
              <p style={{ color:"rgba(255,255,255,.5)", marginBottom:36, fontSize:15 }}>Hatua tatu rahisi za kukusaidia kuelewa safari yako ya chuo</p>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:20, marginBottom:52 }}>
                <StepCard num="01" icon={<BookOpen size={24}/>} title="Tafuta Chuo na Kozi" desc="Tumia zana zetu kuchagua chuo na kozi inayokufaa kulingana na combination na malengo yako." color={BLUE}/>
                <StepCard num="02" icon={<FileText size={24}/>} title="Wasilisha Maombi" desc="Tunakuongoza hatua kwa hatua jinsi ya kuomba chuo kupitia TCU na mkopo kupitia HESLB." color={GREEN}/>
                <StepCard num="03" icon={<Trophy size={24}/>} title="Pokea Chaguo Lako" desc="Subiri matokeo, pokea admission letter, na jitayarishe kwa maisha ya chuo kikuu." color={G}/>
              </div>

              {/* Quick access */}
              <h3 style={{ fontWeight:900, fontSize:20, marginBottom:20 }}>Ufikiaji wa Haraka</h3>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))", gap:14, marginBottom:52 }}>
                {[
                  { icon:<FileText size={22}/>,  title:"Mwongozo wa Kuomba",  desc:"Hatua zote za kuomba chuo",           tab:"apply",        color:BLUE },
                  { icon:<CreditCard size={22}/>, title:"Mkopo wa HESLB",      desc:"Jinsi ya kupata mkopo wa masomo",     tab:"heslb",        color:GREEN },
                  { icon:<Bot size={22}/>,         title:"Mshauri wa Kozi",     desc:"Kozi zinazolingana nawe",             tab:"courses",      color:PURPLE },
                  { icon:<School size={22}/>,      title:"Orodha ya Vyuo",      desc:"Vyuo Tanzania na bei zao",            tab:"universities", color:G },
                  { icon:<Calendar size={22}/>,   title:"Tarehe Muhimu",        desc:"Tarehe za mwisho za maombi",         tab:"dates",        color:"#ef4444" },
                  { icon:<Star size={22}/>,        title:"Maisha ya Chuo",       desc:"Tips za kufaulu chuoni",             tab:"student-life", color:"#f472b6" },
                ].map((q,i) => (
                  <button key={i} onClick={() => setTab(q.tab)} style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:18, padding:"22px 18px", textAlign:"left", cursor:"pointer", transition:"all .2s", display:"flex", flexDirection:"column", gap:10 }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor=`${q.color}40`; e.currentTarget.style.transform="translateY(-3px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor=BORDER; e.currentTarget.style.transform=""; }}>
                    <div style={{ width:44, height:44, borderRadius:13, background:`${q.color}15`, color:q.color, display:"grid", placeItems:"center" }}>{q.icon}</div>
                    <div><div style={{ fontWeight:800, fontSize:15, color:"#fff", marginBottom:4 }}>{q.title}</div><div style={{ fontSize:13, color:"rgba(255,255,255,.4)" }}>{q.desc}</div></div>
                    <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:13, color:q.color, fontWeight:700 }}>Soma zaidi <ArrowRight size={13}/></div>
                  </button>
                ))}
              </div>

              {/* AI Chat */}
              <h3 style={{ fontWeight:900, fontSize:20, marginBottom:6 }}>🤖 Msaidizi wa AI — Uliza Swali Lolote</h3>
              <p style={{ color:"rgba(255,255,255,.4)", marginBottom:20, fontSize:14 }}>Uliza maswali kuhusu chuo, HESLB, combination, au kitu kinachokusumbua</p>
              <div style={{ maxWidth:640, marginBottom:48 }}><AIChatPlaceholder/></div>

              {/* Alert */}
              <div style={{ background:`${G}08`, border:`1px solid ${G}25`, borderRadius:20, padding:"24px 28px", display:"flex", gap:18, alignItems:"flex-start", marginBottom:24 }}>
                <AlertCircle size={22} color={G} style={{ flexShrink:0, marginTop:2 }}/>
                <div>
                  <div style={{ fontWeight:800, fontSize:15, color:G, marginBottom:10 }}>⚠️ Mambo Muhimu Kukumbuka</div>
                  {["Maombi ya vyuo mengi yanafanyika online — uhakikishe una email inayofanya kazi","Maombi ya HESLB yanafunguliwa baada ya Form 6 results kutoka — usisubiri","Kuomba mapema kunaongeza nafasi yako ya kupata nafasi","Nyaraka: NIDA, transcript, picha, cheti cha kuzaliwa, barua ya mzazi"].map((t,i) => (
                    <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start", marginBottom:8 }}>
                      <CheckCircle size={15} color={GREEN} style={{ flexShrink:0, marginTop:2 }}/>
                      <span style={{ fontSize:14, color:"rgba(255,255,255,.65)" }}>{t}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                {[{l:"TCU Portal",u:"https://tcu.go.tz/services/students-admissions-and-transfers/undergraduate-admissions",c:BLUE},{l:"HESLB Portal",u:"https://www.heslb.go.tz/",c:GREEN},{l:"OLAMS Maombi",u:"https://olas.heslb.go.tz/",c:PURPLE}].map(x => (
                  <a key={x.l} href={x.u} target="_blank" rel="noreferrer" style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"10px 18px", background:`${x.c}10`, border:`1px solid ${x.c}25`, borderRadius:12, color:x.c, fontWeight:700, fontSize:13, textDecoration:"none" }}><ExternalLink size={13}/>{x.l}</a>
                ))}
              </div>
            </motion.div>
          )}

          {/* ══ APPLY ══ */}
          {tab==="apply" && (
            <motion.div key="apply" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
              <h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:30, fontWeight:900, marginBottom:8 }}>Jinsi ya Kuomba <span style={{ color:BLUE }}>Chuo Kikuu</span></h2>
              <p style={{ color:"rgba(255,255,255,.5)", marginBottom:16, fontSize:15 }}>Hatua 7 rahisi za kukufanya uweze kuomba chuo kikuu Tanzania</p>
              <a href="https://tcu.go.tz/services/students-admissions-and-transfers/undergraduate-admissions" target="_blank" rel="noreferrer" style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"10px 18px", background:"rgba(59,130,246,.1)", border:"1px solid rgba(59,130,246,.2)", borderRadius:12, color:BLUE, fontWeight:700, fontSize:13, textDecoration:"none", marginBottom:36 }}><ExternalLink size={13}/> tcu.go.tz — Portal Rasmi</a>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:20, marginBottom:40 }}>
                <StepCard num="01" icon={<ExternalLink size={22}/>} title="Tembelea Tovuti Rasmi" desc="Nenda tcu.go.tz au tovuti ya chuo unachotaka. Angalia sehemu ya 'Admission' au 'Apply Now'." color={BLUE} link="https://tcu.go.tz"/>
                <StepCard num="02" icon={<School size={22}/>} title="Chagua Chuo Lako" desc="Chunguza vyuo mbalimbali, angalia kozi, ada, na mahali walipo. Tumia tab 'Vyuo' kujifunza zaidi." color={PURPLE} note="Angalia orodha yetu ya vyuo kwenye tab 'Vyuo'"/>
                <StepCard num="03" icon={<Users size={22}/>} title="Fungua Akaunti" desc="Tengeneza akaunti ukitumia email yako halisi. Utapata mawasiliano yote muhimu hapa." color={GREEN} note="Andika email na password mahali salama"/>
                <StepCard num="04" icon={<FileText size={22}/>} title="Jaza Taarifa Zako" desc="Jaza jina, tarehe ya kuzaliwa, mkoa, mawasiliano, na taarifa za elimu yako kwa makini." color={G}/>
                <StepCard num="05" icon={<BookOpen size={22}/>} title="Chagua Kozi" desc="Chagua kozi 2–3 kwa mpangilio wa upendeleo. Kozi ya kwanza ndiyo unayoipa kipaumbele." color={BLUE} note="Weka kozi unayoipenda kwanza, si ile 'rahisi' tu"/>
                <StepCard num="06" icon={<CreditCard size={22}/>} title="Lipa Ada ya Maombi" desc="Lipa ada (TSH 10,000–30,000) kupitia benki au mobile money. Hifadhi risiti yako." color="#ec4899"/>
                <StepCard num="07" icon={<CheckCircle size={22}/>} title="Wasilisha na Subiri" desc="Kagua taarifa zote kabla ya kuwasilisha. Pata namba ya maombi na fuatilia hali yako." color={GREEN}/>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
                <div style={{ background:"rgba(34,197,94,.06)", border:"1px solid rgba(34,197,94,.15)", borderRadius:20, padding:"24px 28px" }}>
                  <h3 style={{ fontWeight:900, fontSize:17, color:GREEN, marginBottom:16 }}>✅ Tips za Kufaulu</h3>
                  {["Omba mapema — nafasi zinapungua haraka","Jaza taarifa kwa usahihi kamili","Chagua kozi unayoipenda kwanza","Angalia minimum qualifications mapema","Hifadhi documents zote mapema"].map((t,i) => (
                    <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start", marginBottom:10 }}><CheckCircle size={15} color={GREEN} style={{ flexShrink:0, marginTop:2 }}/><span style={{ fontSize:14, color:"rgba(255,255,255,.65)" }}>{t}</span></div>
                  ))}
                </div>
                <div style={{ background:"rgba(239,68,68,.06)", border:"1px solid rgba(239,68,68,.15)", borderRadius:20, padding:"24px 28px" }}>
                  <h3 style={{ fontWeight:900, fontSize:17, color:"#f87171", marginBottom:16 }}>⚠️ Makosa ya Kuepuka</h3>
                  {["Kutumia email ya mtu mwingine","Kuchagua kozi bila kuangalia requirements","Kutolipa ada kwa wakati — mfumo unafunga","Kuwasilisha taarifa zisizo sahihi"].map((m,i) => (
                    <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start", marginBottom:10 }}>
                      <div style={{ width:20, height:20, borderRadius:"50%", background:"rgba(239,68,68,.15)", color:"#f87171", display:"grid", placeItems:"center", flexShrink:0, fontSize:11, fontWeight:900 }}>✗</div>
                      <span style={{ fontSize:14, color:"rgba(255,255,255,.65)" }}>{m}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ══ HESLB ══ */}
          {tab==="heslb" && (
            <motion.div key="heslb" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
              <h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:30, fontWeight:900, marginBottom:8 }}>Mkopo wa <span style={{ color:GREEN }}>HESLB</span></h2>
              <p style={{ color:"rgba(255,255,255,.5)", marginBottom:16, fontSize:15 }}>Higher Education Students&apos; Loans Board — mkopo wa masomo wa serikali ya Tanzania</p>
              <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:36 }}>
                <a href="https://www.heslb.go.tz/" target="_blank" rel="noreferrer" style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"10px 18px", background:`${GREEN}10`, border:`1px solid ${GREEN}25`, borderRadius:12, color:GREEN, fontWeight:700, fontSize:13, textDecoration:"none" }}><ExternalLink size={13}/> heslb.go.tz</a>
                <a href="https://olas.heslb.go.tz/" target="_blank" rel="noreferrer" style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"10px 18px", background:`${GREEN}10`, border:`1px solid ${GREEN}25`, borderRadius:12, color:GREEN, fontWeight:700, fontSize:13, textDecoration:"none" }}><ExternalLink size={13}/> OLAMS Portal (Apply Hapa)</a>
              </div>
              <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:20, padding:"24px 28px", marginBottom:32 }}>
                <h3 style={{ fontWeight:800, fontSize:17, marginBottom:16 }}>📋 Nyaraka Zinazohitajika</h3>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))", gap:10 }}>
                  {["NIDA Card au Passport ya mwombaji","Cheti cha kuzaliwa (Birth Certificate)","Matokeo ya CSEE (Form 4)","Matokeo ya ACSEE (Form 6)","Admission Letter ya chuo","Taarifa za mapato ya familia / mzazi","NIDA ya mzazi au mlezi","Picha za pasporti (2) — background nyeupe"].map((r,i) => (
                    <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start" }}><CheckCircle size={15} color={GREEN} style={{ flexShrink:0, marginTop:2 }}/><span style={{ fontSize:14, color:"rgba(255,255,255,.7)" }}>{r}</span></div>
                  ))}
                </div>
              </div>
              <h3 style={{ fontWeight:900, fontSize:18, marginBottom:20 }}>Hatua za Kuomba HESLB</h3>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:18, marginBottom:36 }}>
                <StepCard num="01" icon={<Users size={22}/>} title="Jisajili OLAMS" desc="Nenda olas.heslb.go.tz na uunda akaunti mpya ukitumia email yako halisi na namba ya NIDA." color={BLUE} link="https://olas.heslb.go.tz/" note="Tumia email unayoiweza kupata daima"/>
                <StepCard num="02" icon={<FileText size={22}/>} title="Jaza Taarifa Zako" desc="Jaza jina, tarehe ya kuzaliwa, mkoa, wilaya, na taarifa za familia yako kwa makini kabisa." color={GREEN}/>
                <StepCard num="03" icon={<BookOpen size={22}/>} title="Taarifa za Elimu" desc="Weka matokeo yako ya darasa la 7, form 4, na form 6. Hakikisha kila kitu ni sahihi." color={PURPLE}/>
                <StepCard num="04" icon={<AlertCircle size={22}/>} title="Taarifa za Mapato ya Familia" desc="Hii ni sehemu muhimu sana. Unahitaji nyaraka za mapato ya mzazi/mlezi wako." color="#ef4444" note="Jiandae mapema — hii inachukua muda zaidi"/>
                <StepCard num="05" icon={<School size={22}/>} title="Chagua Chuo na Kozi" desc="Weka chuo ulichopangwa na kozi unayotaka kusomea. Lazima iwe chuo kilichoidhinishwa na TCU." color={G}/>
                <StepCard num="06" icon={<FileText size={22}/>} title="Pakia Nyaraka" desc="Scan au piga picha ya nyaraka zote wazi na zinazosomeka kisha uzipake kwenye mfumo." color={BLUE} note="Picha lazima ziwe wazi — zisizofifia zinakataliwa"/>
                <StepCard num="07" icon={<CheckCircle size={22}/>} title="Wasilisha na Fuatilia" desc="Baada ya kuwasilisha, pata namba ya maombi na fuatilia hali yako kwenye OLAMS." color={GREEN}/>
              </div>
              <div style={{ background:`${G}06`, border:`1px solid ${G}20`, borderRadius:20, padding:"24px 28px" }}>
                <h3 style={{ fontWeight:900, fontSize:17, color:G, marginBottom:16 }}>💡 Vidokezo Muhimu vya HESLB</h3>
                {["Picha za nyaraka lazima ziwe wazi — picha zilizofifia hazikubaliwa na mfumo","Maombi yanafunguliwa kwa wakati mfupi — jiandae mapema kabla ya deadline","Mkopo wa HESLB unashughulikia ada, malazi, na chakula kwa kiwango fulani","Fuatilia hali ya maombi yako mara kwa mara kwenye OLAMS portal","Jibu la mkopo huja Oktoba/Novemba — angalia email yako mara kwa mara"].map((t,i) => (
                  <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start", marginBottom:10 }}><Zap size={15} color={G} style={{ flexShrink:0, marginTop:2 }}/><span style={{ fontSize:14, color:"rgba(255,255,255,.65)" }}>{t}</span></div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ══ COURSES ══ */}
          {tab==="courses" && (
            <motion.div key="courses" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
              <h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:30, fontWeight:900, marginBottom:8 }}>Mshauri wa <span style={{ color:PURPLE }}>Kozi</span></h2>
              <p style={{ color:"rgba(255,255,255,.5)", marginBottom:36, fontSize:15 }}>Weka combination yako upate mapendekezo ya kozi na vyuo vinavyolingana nawe</p>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:32 }}>
                <CourseTool/>
                <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:20, padding:"24px 28px" }}>
                  <div style={{ fontWeight:800, fontSize:15, marginBottom:16 }}>📚 Kozi Maarufu 2025/2026</div>
                  {[{n:"Medicine & Surgery",d:"Juu Sana",c:"PCB",col:"#f87171"},{n:"Computer Science / IT",d:"Juu Sana",c:"PCM",col:GREEN},{n:"Law (LLB)",d:"Juu",c:"HKL/HGE",col:BLUE},{n:"Business Administration",d:"Juu",c:"EGM/CBG",col:G},{n:"Engineering",d:"Juu",c:"PCM",col:PURPLE},{n:"Nursing",d:"Wastani",c:"PCB",col:"#34d399"}].map((c,i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:16, padding:"10px 0", borderBottom: i<5?`1px solid ${BORDER}`:"none" }}>
                      <div style={{ flex:1 }}><div style={{ fontWeight:700, fontSize:14 }}>{c.n}</div><div style={{ fontSize:12, color:"rgba(255,255,255,.35)" }}>Combo: {c.c}</div></div>
                      <span style={{ fontSize:11, fontWeight:900, padding:"3px 10px", borderRadius:6, background:`${c.col}15`, color:c.col }}>{c.d}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ══ UNIVERSITIES ══ */}
          {tab==="universities" && (
            <motion.div key="universities" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:32, flexWrap:"wrap", gap:16 }}>
                <div>
                  <h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:30, fontWeight:900, marginBottom:8 }}>Vyuo Vikuu <span style={{ color:G }}>Tanzania</span></h2>
                  <p style={{ color:"rgba(255,255,255,.5)", fontSize:15 }}>Orodha ya vyuo vikuu vya serikali na binafsi na taarifa muhimu</p>
                </div>
                <div style={{ position:"relative", width:260 }}>
                  <Search size={15} style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", color:"rgba(255,255,255,.3)", pointerEvents:"none" }}/>
                  <input value={uniSearch} onChange={e => setUniSearch(e.target.value)} placeholder="Tafuta chuo au kozi..."
                    style={{ width:"100%", height:44, borderRadius:12, border:`1px solid ${BORDER}`, background:"rgba(255,255,255,.04)", color:"#fff", paddingLeft:38, paddingRight:14, outline:"none", fontSize:13, fontFamily:"inherit", boxSizing:"border-box" }}
                    onFocus={e => e.target.style.borderColor=G} onBlur={e => e.target.style.borderColor=BORDER}/>
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:18, marginBottom:20 }}>
                {filteredUnis.map((u,i) => <UniCard key={i} uni={u}/>)}
              </div>
              {filteredUnis.length===0 && (
                <div style={{ textAlign:"center", padding:"48px 20px", background:"rgba(255,255,255,.02)", borderRadius:20, border:`1px dashed ${BORDER}` }}>
                  <School size={48} color="rgba(255,255,255,.1)" style={{ margin:"0 auto 16px", display:"block" }}/>
                  <h3 style={{ fontWeight:800, marginBottom:8 }}>Hakuna chuo kinacholingana</h3>
                  <button onClick={() => setUniSearch("")} style={{ padding:"8px 20px", borderRadius:10, border:`1px solid ${G}30`, background:`${G}10`, color:G, fontWeight:700, cursor:"pointer" }}>Ona Vyuo Vyote</button>
                </div>
              )}
              <div style={{ padding:"14px 18px", background:"rgba(255,255,255,.02)", borderRadius:12, border:`1px solid ${BORDER}`, fontSize:12, color:"rgba(255,255,255,.3)" }}>* Ada ni makadirio tu. Taarifa halisi zipo kwenye tovuti za vyuo. Zinaeza kubadilika.</div>
            </motion.div>
          )}

          {/* ══ DATES ══ */}
          {tab==="dates" && (
            <motion.div key="dates" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
              <h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:30, fontWeight:900, marginBottom:8 }}>Tarehe <span style={{ color:BLUE }}>Muhimu</span></h2>
              <p style={{ color:"rgba(255,255,255,.5)", marginBottom:16, fontSize:15 }}>Fuatilia tarehe za mwisho za maombi, matokeo, na HESLB</p>
              <div style={{ background:`${G}08`, border:`1px solid ${G}20`, borderRadius:16, padding:"16px 20px", marginBottom:32, display:"flex", gap:14, alignItems:"flex-start" }}>
                <AlertCircle size={18} color={G} style={{ flexShrink:0 }}/>
                <p style={{ fontSize:14, color:"rgba(255,255,255,.6)", lineHeight:1.6, margin:0 }}>Tarehe hizi zinabadilika kila mwaka. Daima angalia tovuti rasmi za <a href="https://tcu.go.tz" target="_blank" rel="noreferrer" style={{ color:G }}>TCU</a> na <a href="https://www.heslb.go.tz" target="_blank" rel="noreferrer" style={{ color:G }}>HESLB</a> kwa taarifa sahihi.</p>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:16 }}>
                {DEADLINES.map((d,i) => (
                  <motion.div key={i} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.06 }}
                    style={{ background:CARD, border:`1px solid ${d.urgent?d.color+"30":BORDER}`, borderRadius:18, padding:"20px 22px", position:"relative", overflow:"hidden" }}>
                    {d.urgent && <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${d.color},${d.color}80)` }}/>}
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                      <div style={{ width:9, height:9, borderRadius:"50%", background:d.color, flexShrink:0 }}/>
                      <span style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,.45)" }}>{d.label}</span>
                      {d.urgent && <span style={{ fontSize:9, fontWeight:900, color:d.color, background:`${d.color}15`, padding:"1px 6px", borderRadius:4, marginLeft:"auto" }}>MUHIMU</span>}
                    </div>
                    <div style={{ fontWeight:900, fontSize:18, marginBottom:6 }}>{d.date}</div>
                    {d.note && <div style={{ fontSize:12, color:"rgba(255,255,255,.4)", lineHeight:1.5 }}>{d.note}</div>}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ══ STUDENT LIFE ══ */}
          {tab==="student-life" && (
            <motion.div key="student-life" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
              <h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:30, fontWeight:900, marginBottom:8 }}>Maisha ya <span style={{ color:G }}>Chuo Kikuu</span></h2>
              <p style={{ color:"rgba(255,255,255,.5)", marginBottom:36, fontSize:15 }}>Vidokezo vya kushinda masomoni, kujibu gharama, na kufurahia safari yako</p>

              {/* Success guides */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:20, marginBottom:52 }}>
                {[
                  { emoji:"📖", title:"Jua Masomo Yako Vizuri",        tag:"Masomo",   desc:"Soma mapema, jiunge na vikundi vya masomo, uliza maswali bila kuogopa. Profesa wako ni msaidizi wako mkubwa.", color:BLUE },
                  { emoji:"💰", title:"Simamia Fedha Zako",             tag:"Fedha",    desc:"Tengeneza bajeti ya kila mwezi. Usikope kwa sababu ndogo. Jaribu kujitafutia kipato kidogo chuoni.",          color:GREEN },
                  { emoji:"🤝", title:"Jenga Mtandao (Network)",        tag:"Marafiki", desc:"Wenzako wa chuo ni rasilimali. Shirikiana, saidia, na ujifunze. Network nzuri inasaidia baada ya kusoma.",   color:PURPLE },
                  { emoji:"💪", title:"Afya ya Mwili na Akili",         tag:"Afya",     desc:"Lala vya kutosha, kula vizuri, fanya mazoezi. Msongo wa mawazo ni tatizo kubwa la wanafunzi — ulishughulikie.",color:"#ec4899" },
                  { emoji:"🚀", title:"Jenga Skills za Nje ya Darasa",  tag:"Skills",   desc:"Jifunze coding, design, biashara, au uandishi. Skills za vitendo zinakupa nguvu zaidi ya shahada yako tu.",  color:G },
                  { emoji:"📱", title:"Tumia Teknolojia Vizuri",        tag:"Tech",     desc:"AI, Google Scholar, YouTube — zana hizi zinaweza kukusaidia sana masomoni. Tumia vizuri, si kupoteza muda.", color:"#f59e0b" },
                ].map((g,i) => (
                  <motion.div key={i} initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:i*0.07 }}
                    style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:20, padding:"24px 22px" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
                      <div style={{ fontSize:36 }}>{g.emoji}</div>
                      <span style={{ fontSize:10, fontWeight:900, padding:"3px 10px", borderRadius:6, background:`${g.color}15`, color:g.color, textTransform:"uppercase" }}>{g.tag}</span>
                    </div>
                    <h3 style={{ fontWeight:900, fontSize:16, marginBottom:8 }}>{g.title}</h3>
                    <p style={{ fontSize:13.5, color:"rgba(255,255,255,.55)", lineHeight:1.65, margin:0 }}>{g.desc}</p>
                  </motion.div>
                ))}
              </div>

              {/* Download Center */}
              <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:24, padding:"32px 28px", marginBottom:48 }}>
                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
                  <div style={{ width:48, height:48, borderRadius:14, background:`${G}15`, display:"grid", placeItems:"center", color:G }}><Download size={24}/></div>
                  <div>
                    <h3 style={{ fontWeight:900, fontSize:18, margin:0 }}>Download Center</h3>
                    <p style={{ fontSize:13, color:"rgba(255,255,255,.4)", margin:"4px 0 0" }}>Viungo vya miongozo na tovuti muhimu — bure kabisa</p>
                  </div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:14 }}>
                  {PDF_GUIDES.map((g,i) => (
                    <a key={i} href={g.url} target="_blank" rel="noreferrer" style={{ display:"flex", gap:14, padding:"16px 18px", background:"rgba(255,255,255,.03)", border:`1px solid ${BORDER}`, borderRadius:14, textDecoration:"none", transition:"all .2s" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor=`${G}30`; e.currentTarget.style.background="rgba(245,166,35,.04)"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor=BORDER; e.currentTarget.style.background="rgba(255,255,255,.03)"; }}>
                      <div style={{ fontSize:28, flexShrink:0 }}>{g.icon}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:800, fontSize:13, color:"#fff", marginBottom:3 }}>{g.title}</div>
                        <div style={{ fontSize:11, color:"rgba(255,255,255,.4)", lineHeight:1.4 }}>{g.desc}</div>
                        <div style={{ fontSize:10, color:G, fontWeight:700, marginTop:6, display:"flex", alignItems:"center", gap:4 }}><ExternalLink size={10}/>{g.size}</div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>

              {/* FAQ */}
              <h3 style={{ fontWeight:900, fontSize:20, marginBottom:20 }}>Maswali ya Kawaida</h3>
              <div style={{ display:"grid", gap:10 }}>
                {[
                  { q:"Ninaweza kuomba vyuo vingi kwa wakati mmoja?", a:"Ndiyo. Kupitia TCU unaweza kuchagua kozi nyingi kwa mpangilio wa upendeleo. Vinginevyo, vyuo binafsi vinakuruhusu kuomba moja kwa moja kwenye tovuti zao." },
                  { q:"Kama sikupata mkopo wa HESLB, ninaweza bado kusomea?", a:"Ndiyo. Unaweza kulipa ada mwenyewe, tafuta scholarship za chuo, za serikali, au za kimataifa. Vyuo vingi vina mpango wa malipo ya awamu pia." },
                  { q:"NIDA ni nini na ninaipata wapi?", a:"NIDA (National Identification Authority) card ni kitambulisho cha kitaifa cha Tanzania. Ipatikane kwenye ofisi za mkoa au wilaya. Ni muhimu sana kwa maombi ya HESLB." },
                  { q:"Je, ninaweza kubadilisha kozi baada ya kukubalika?", a:"Kubadilisha kozi baada ya kukubalika ni ngumu sana. Ndiyo maana ni muhimu kufikiria vizuri kabla ya kuchagua na kuweka priority sahihi." },
                  { q:"Combination yangu si iliyoorodheshwa, nifanye nini?", a:"Nenda tab ya 'Mshauri Kozi' na chagua 'Nyingine'. Pia unaweza kuuliza swali kupitia AI msaidizi wetu kwenye tab ya 'Mwanzo'." },
                ].map((faq,i) => <Faq key={i} {...faq}/>)}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </W>
    </div>
  );
}
