/**
 * NectaResultsPage.jsx — STEA Africa
 * UPDATED v2: Instant Fuse.js local search — no more slow API calls per keystroke.
 * School index loads ONCE from /public/data/{exam}.json → cached in localStorage.
 * Search runs fully in browser in <10ms. All original UI/features preserved.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Download, Printer, ChevronRight, School,
  User, AlertCircle, Loader2, X, Image as ImageIcon,
  ExternalLink, ArrowLeft,
} from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const G  = "#F5A623";
const G2 = "#FFD17C";
const CACHE_PREFIX = "stea_necta_idx_";
const DATA_VERSION = "2025.2";
const CURRENT_YEAR = new Date().getFullYear();
// Default to previous year — NECTA publishes results 6-12 months after exam
// so current year results are usually not yet available
const DEFAULT_YEAR = (CURRENT_YEAR - 1).toString();
const YEARS = Array.from({ length: 12 }, (_, i) => CURRENT_YEAR - i);

// ── Built-in fallback (used until real JSON files are in /public/data/) ───────
const DEMO = {
  CSEE:[
    {n:"Agakhan",c:"S0023"},{n:"Azania",c:"S0005"},{n:"Bunge",c:"S0892"},
    {n:"Feza Boys",c:"S1234"},{n:"Feza Girls",c:"S1235"},{n:"Holy Ghost",c:"S0102"},
    {n:"Jitegemee",c:"S0539"},{n:"Kilakala Girls",c:"S0193"},{n:"Klerruu",c:"S0311"},
    {n:"Loyola",c:"S0088"},{n:"Makongo",c:"S0451"},{n:"Marian",c:"S0244"},
    {n:"Minaki",c:"S0132"},{n:"Mzumbe",c:"S5678"},{n:"Mwalimu Nyerere",c:"S0155"},
    {n:"Olympio",c:"S0376"},{n:"Pugu",c:"S0049"},{n:"Rugambwa",c:"S0158"},
    {n:"Songea Boys",c:"S0071"},{n:"Tabora Boys",c:"S0021"},{n:"Tabora Girls",c:"S0022"},
    {n:"Tambaza",c:"S0061"},{n:"Tanzania",c:"S0014"},{n:"Zanaki",c:"S0003"},
  ],
  ACSEE:[
    {n:"Agakhan",c:"S0023"},{n:"Azania",c:"S0005"},{n:"Feza Boys",c:"S1234"},
    {n:"Kilakala Girls",c:"S0193"},{n:"Klerruu",c:"S0311"},{n:"Loyola",c:"S0088"},
    {n:"Minaki",c:"S0132"},{n:"Mzumbe",c:"S5678"},{n:"Tabora Boys",c:"S0021"},
    {n:"Tambaza",c:"S0061"},{n:"Tanzania",c:"S0014"},{n:"Zanaki",c:"S0003"},
  ],
  FTNA:[
    {n:"Azania",c:"S0005"},{n:"Makongo",c:"S0451"},{n:"Pugu",c:"S0049"},
    {n:"Tanzania",c:"S0014"},{n:"Zanaki",c:"S0003"},
  ],
  PSLE:[
    {n:"Agakhan Primary",c:"PS001"},{n:"Jitegemee Primary",c:"PS039"},
    {n:"Makongo Primary",c:"PS108"},{n:"Msimbazi Primary",c:"PS022"},
    {n:"Uhuru Primary",c:"PS009"},{n:"Upanga Primary",c:"PS031"},
  ],
};

// ── LocalStorage + memory cache ───────────────────────────────────────────────
const _mem = {};

function cacheGet(key) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const p = JSON.parse(raw);
    return p.v === DATA_VERSION ? p.data : null;
  } catch { return null; }
}

function cacheSet(key, data, version) {
  try {
    localStorage.setItem(CACHE_PREFIX + key,
      JSON.stringify({ v: version || DATA_VERSION, data, ts: Date.now() }));
  } catch {}
}

async function loadSchoolIndex(examType) {
  const key = examType.toUpperCase();
  if (_mem[key]) return _mem[key];
  const cached = cacheGet(key);
  if (cached) { _mem[key] = cached; return cached; }
  try {
    const res = await fetch(`/data/${examType.toLowerCase()}.json`, { cache: "force-cache" });
    if (res.ok) {
      const json = await res.json();
      const data = json.data || json;
      cacheSet(key, data, json.v);
      _mem[key] = data;
      return data;
    }
  } catch {}
  const data = DEMO[key] || [];
  _mem[key] = data;
  return data;
}

function useDebounce(val, ms) {
  const [d, setD] = useState(val);
  useEffect(() => { const t = setTimeout(() => setD(val), ms); return () => clearTimeout(t); }, [val, ms]);
  return d;
}

// ════════════════════════════════════════════════════════════════════════
export default function NectaResultsPage() {
  const [examType,        setExamType]        = useState("CSEE");
  const [year,            setYear]            = useState(DEFAULT_YEAR);
  const [yearError,       setYearError]       = useState("");
  const [schoolQuery,     setSchoolQuery]     = useState("");
  const [schoolIndex,     setSchoolIndex]     = useState([]);
  const [indexLoading,    setIndexLoading]    = useState(false);
  const [fuseInst,        setFuseInst]        = useState(null);
  const [suggestions,     setSuggestions]     = useState([]);
  const [showSugg,        setShowSugg]        = useState(false);
  const [activeIdx,       setActiveIdx]       = useState(-1);
  const [results,         setResults]         = useState(null);
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState("");
  const [studentFilter,   setStudentFilter]   = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showNectaPopup,  setShowNectaPopup]  = useState(false);
  const [nectaUrl,        setNectaUrl]        = useState("");

  const resultsRef = useRef(null);
  const studentRef = useRef(null);
  const searchRef  = useRef(null);
  const listRef    = useRef(null);
  const dq = useDebounce(schoolQuery, 220);

  // Load index when exam type changes
  useEffect(() => {
    let cancelled = false;
    setIndexLoading(true); setSchoolIndex([]); setFuseInst(null); setSuggestions([]);
    loadSchoolIndex(examType).then(async data => {
      if (cancelled) return;
      setSchoolIndex(data); setIndexLoading(false);
      try {
        const Fuse = (await import("fuse.js")).default;
        if (!cancelled) setFuseInst(new Fuse(data, {
          keys: [{ name:"n", weight:0.7 }, { name:"c", weight:0.3 }],
          threshold: 0.35, includeScore: true, minMatchCharLength: 2,
          shouldSort: true, distance: 100, ignoreLocation: true,
        }));
      } catch {}
    }).catch(() => { if (!cancelled) setIndexLoading(false); });
    return () => { cancelled = true; };
  }, [examType]);

  // Run search on debounced query
  useEffect(() => {
    const q = dq.trim();
    if (q.length < 2) { setSuggestions([]); setActiveIdx(-1); return; }
    let found;
    if (fuseInst) {
      found = fuseInst.search(q).slice(0, 10).map(r => r.item);
    } else {
      const ql = q.toLowerCase();
      found = schoolIndex.filter(s => s.n.toLowerCase().includes(ql) || s.c.toLowerCase().includes(ql)).slice(0, 10);
    }
    setSuggestions(found); setActiveIdx(-1);
    if (found.length > 0) setShowSugg(true);
  }, [dq, fuseInst, schoolIndex]);

  // Keyboard navigation
  const handleKeyDown = useCallback(e => {
    if (!showSugg || suggestions.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, suggestions.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && activeIdx >= 0) { e.preventDefault(); doSearch(suggestions[activeIdx].c, suggestions[activeIdx].n); }
    else if (e.key === "Escape") setShowSugg(false);
  }, [showSugg, suggestions, activeIdx]);

  useEffect(() => {
    if (activeIdx < 0 || !listRef.current) return;
    listRef.current.children[activeIdx]?.scrollIntoView({ block:"nearest", behavior:"smooth" });
  }, [activeIdx]);

  useEffect(() => {
    const fn = e => { if (searchRef.current && !searchRef.current.contains(e.target)) setShowSugg(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  // Fetch results from Cloudflare Function
  const doSearch = async (schoolCode, schoolName) => {
    setYearError("");
    const py = parseInt(year);
    if (isNaN(py) || py < 1988) { setYearError("Tafadhali weka mwaka sahihi (mfano: 2024)."); return; }
    if (py > CURRENT_YEAR + 1) { setYearError("Mwaka huo haujafika bado."); return; }
    setLoading(true); setError(""); setResults(null); setSelectedStudent(null); setShowSugg(false);
    if (schoolName) setSchoolQuery(schoolName);
    try {
      const nameParam = schoolName ? `?name=${encodeURIComponent(schoolName)}` : "";
      const res = await fetch(`/api/necta/results/${examType}/${year}/${schoolCode}${nameParam}`);
      let data;
      try { data = await res.json(); } catch { data = {}; }
      if (!res.ok) {
        const code = data.errorCode || "";
        let msg = data.error || "Matokeo hayajapatikana.";
        // Enrich message based on error code if server gave generic message
        if (code === "YEAR_NOT_PUBLISHED") msg = data.error || `Matokeo ya ${examType} ${year} bado hayajachapishwa kwenye NECTA. Jaribu mwaka kama ${parseInt(year)-1}.`;
        if (code === "NOT_IN_INDEX") msg = data.error || `Shule ${schoolCode} haijaonekana kwenye orodha ya NECTA ya ${examType} ${year}.`;
        if (code === "TIMEOUT" || code === "NETWORK_ERROR") msg = data.error || "NECTA source haipatikani kwa muda huu. Jaribu tena baadaye.";
        throw new Error(msg);
      }
      if (!data.students || data.students.length === 0) throw new Error("Matokeo yamepatikana lakini yana tatizo la muundo. Wasiliana na STEA.");
      setResults(data);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  // handleSearch kept for backwards compat
  const handleSearch = doSearch;

  const getCaptureCanvas = async ref => {
    if (!ref.current) return null;
    return await html2canvas(ref.current, {
      scale: 2, useCORS: true, backgroundColor: "#0e101a",
      onclone: doc => {
        const s = doc.getElementById("student-result-card");
        if (s) { s.style.width="600px"; s.style.maxWidth="none"; s.style.height="auto"; s.style.transform="none"; s.style.position="relative"; s.style.margin="0"; s.style.overflow="visible"; }
        const sc = doc.getElementById("school-result-card");
        if (sc) { sc.style.width="1000px"; sc.style.maxWidth="none"; }
      },
    });
  };

  const downloadPDF = async (ref, filename) => {
    const canvas = await getCaptureCanvas(ref);
    if (!canvas) return;
    const pdf = new jsPDF({ orientation: canvas.width > canvas.height ? "l" : "p", unit:"px", format:[canvas.width, canvas.height] });
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, canvas.width, canvas.height);
    pdf.save(`${filename}.pdf`);
  };

  const downloadImage = async (ref, filename) => {
    const canvas = await getCaptureCanvas(ref);
    if (!canvas) return;
    const a = document.createElement("a");
    a.download = `${filename}.png`; a.href = canvas.toDataURL("image/png"); a.click();
  };

  const formatSubjects = str => {
    if (!str) return null;
    const parts = str.replace(/' /g, "'|").split("|");
    const gc = { A:{color:"#4ade80",bg:"rgba(34,197,94,0.1)"}, B:{color:"#60a5fa",bg:"rgba(56,130,246,0.1)"}, C:{color:"#facc15",bg:"rgba(250,204,21,0.1)"}, D:{color:"#f97316",bg:"rgba(249,115,22,0.1)"}, F:{color:"#f87171",bg:"rgba(248,113,113,0.1)"} };
    return (
      <div style={{display:"flex",flexWrap:"wrap",gap:"8px"}}>
        {parts.map((part, i) => {
          const m = part.match(/(.+?)\s*-\s*'([A-Z0-9])'/);
          if (m) {
            const {color="#fff",bg="rgba(255,255,255,0.05)"} = gc[m[2]] || {};
            return <div key={i} style={{display:"flex",alignItems:"center",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:8,overflow:"hidden"}}><span style={{padding:"6px 10px",fontSize:12,fontWeight:600}}>{m[1].trim()}</span><span style={{padding:"6px 12px",fontSize:13,fontWeight:800,color,background:bg}}>{m[2]}</span></div>;
          }
          return <span key={i} style={{padding:"4px 8px",background:"rgba(255,255,255,0.05)",borderRadius:6,fontSize:12}}>{part}</span>;
        })}
      </div>
    );
  };

  const filteredStudents = useMemo(() =>
    results?.students?.filter(s =>
      s.indexNumber.toLowerCase().includes(studentFilter.toLowerCase()) ||
      (s.name && s.name.toLowerCase().includes(studentFilter.toLowerCase()))
    ) || [],
    [results, studentFilter]
  );

  const indexStats = indexLoading
    ? "Inapakia orodha ya shule..."
    : `Shule ${schoolIndex.length.toLocaleString()} · ${fuseInst ? "instant search ⚡" : "tayari"}`;

  return (
    <div style={{minHeight:"100vh",background:"#05060a",color:"#fff",paddingBottom:"calc(80px + env(safe-area-inset-bottom,0px))"}}>

      {/* ── Hero / Search ──────────────────────────────────────────── */}
      <section style={{padding:"100px 20px 60px",background:"radial-gradient(circle at top right, rgba(245,166,35,0.1), transparent 40%)",textAlign:"center"}}>
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>
          <h1 style={{fontFamily:"'Bricolage Grotesque', sans-serif",fontSize:"clamp(32px, 5vw, 56px)",fontWeight:900,marginBottom:16,letterSpacing:"-0.04em"}}>
            NECTA <span style={{color:G}}>Results</span> Center
          </h1>
          <p style={{color:"rgba(255,255,255,0.6)",maxWidth:600,margin:"0 auto 40px",fontSize:16,lineHeight:1.6}}>
            Tafuta matokeo ya mitihani ya taifa kwa urahisi. Chagua shule, mwaka na aina ya mtihani kupata matokeo yako papo hapo.
          </p>
        </motion.div>

        <div style={{maxWidth:900,margin:"0 auto",background:"rgba(255,255,255,0.03)",padding:24,borderRadius:24,border:"1px solid rgba(255,255,255,0.08)",backdropFilter:"blur(10px)"}}>
          <div className="mobile-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(150px, 1fr))",gap:16,marginBottom:20}}>

            {/* Exam type */}
            <div style={{textAlign:"left"}}>
              <label style={labelStyle}>AINA YA MTIHANI</label>
              <select value={examType} onChange={e => { setExamType(e.target.value); setSchoolQuery(""); setSuggestions([]); setResults(null); }} style={selStyle}>
                <option value="PSLE">PSLE (Darasa la 7)</option>
                <option value="FTNA">FTNA (Kidato 2)</option>
                <option value="CSEE">CSEE (Kidato 4)</option>
                <option value="ACSEE">ACSEE (Kidato 6)</option>
              </select>
            </div>

            {/* Year */}
            <div style={{textAlign:"left"}}>
              <label style={labelStyle}>MWAKA</label>
              <select value={year} onChange={e => setYear(e.target.value)} style={selStyle}>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            {/* School search — INSTANT */}
            <div className="search-span" style={{textAlign:"left"}}>
              <label style={labelStyle}>
                TAFUTA SHULE · <span style={{color:G,fontWeight:700}}>{indexStats}</span>
              </label>
              <div style={{position:"relative"}} ref={searchRef}>
                <div style={{
                  display:"flex",alignItems:"center",
                  background:"rgba(255,255,255,0.05)",
                  border:`1px solid ${showSugg && suggestions.length > 0 ? "rgba(245,166,35,0.45)" : "rgba(255,255,255,0.1)"}`,
                  borderRadius:14,overflow:"hidden",
                  transition:"border-color 0.2s, box-shadow 0.2s",
                  boxShadow: showSugg && suggestions.length > 0 ? "0 0 0 3px rgba(245,166,35,0.1)" : "none",
                }}>
                  <span style={{padding:"0 12px 0 14px",display:"flex",alignItems:"center",flexShrink:0,color:schoolQuery ? G : "rgba(255,255,255,0.3)",transition:"color 0.2s"}}>
                    {indexLoading
                      ? <motion.div animate={{rotate:360}} transition={{duration:0.9,repeat:Infinity,ease:"linear"}}><Loader2 size={17}/></motion.div>
                      : <Search size={17}/>}
                  </span>
                  <input
                    type="search" autoComplete="off" spellCheck="false"
                    placeholder={`Tafuta shule ya ${examType}... (mf. Tabora Boys, S0021)`}
                    value={schoolQuery}
                    onChange={e => { setSchoolQuery(e.target.value); if (e.target.value.trim().length > 1) setShowSugg(true); }}
                    onFocus={() => { if (suggestions.length > 0) setShowSugg(true); }}
                    onKeyDown={handleKeyDown}
                    disabled={indexLoading}
                    style={{flex:1,background:"transparent",border:"none",outline:"none",color:"#fff",padding:"14px 0",fontSize:14,fontFamily:"inherit",caretColor:G,minWidth:0}}
                  />
                  {schoolQuery && (
                    <button onClick={() => { setSchoolQuery(""); setSuggestions([]); setShowSugg(false); }}
                      style={{background:"none",border:"none",color:"rgba(255,255,255,0.35)",padding:"0 14px",cursor:"pointer",display:"flex",alignItems:"center"}}>
                      <X size={15}/>
                    </button>
                  )}
                </div>

                {/* Suggestions dropdown */}
                <AnimatePresence>
                  {showSugg && suggestions.length > 0 && (
                    <motion.div ref={listRef}
                      initial={{opacity:0,y:-8,scale:0.97}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-8,scale:0.97}}
                      transition={{duration:0.13}}
                      style={{position:"absolute",top:"calc(100% + 8px)",left:0,right:0,zIndex:300,background:"#0e101a",borderRadius:16,border:"1px solid rgba(245,166,35,0.2)",maxHeight:300,overflowY:"auto",boxShadow:"0 20px 50px rgba(0,0,0,0.5)",padding:8}}>
                      {suggestions.map((s, idx) => (
                        <div key={s.c}
                          onMouseDown={() => doSearch(s.c, s.n)}
                          onMouseEnter={() => setActiveIdx(idx)}
                          style={{padding:"12px 14px",cursor:"pointer",borderRadius:10,marginBottom:4,display:"flex",justifyContent:"space-between",alignItems:"center",background:idx===activeIdx?"rgba(245,166,35,0.08)":"transparent",transition:"background 0.1s"}}>
                          <div>
                            <div style={{fontWeight:700,fontSize:14,color:idx===activeIdx?"#fff":"rgba(255,255,255,0.85)"}}>{s.n}</div>
                            <div style={{fontSize:12,color:"rgba(255,255,255,0.4)",marginTop:1}}>Namba: {s.c}</div>
                          </div>
                          <ChevronRight size={16} color={idx===activeIdx ? G : "rgba(255,255,255,0.2)"}/>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* No results */}
                <AnimatePresence>
                  {showSugg && dq.trim().length >= 2 && suggestions.length === 0 && !indexLoading && (
                    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                      style={{position:"absolute",top:"calc(100% + 8px)",left:0,right:0,zIndex:300,background:"#0e101a",borderRadius:14,border:"1px solid rgba(255,255,255,0.08)",padding:"20px",textAlign:"center",color:"rgba(255,255,255,0.4)",fontSize:14}}>
                      Hakuna shule iliyopatikana kwa &quot;{dq}&quot; katika mwaka {year}.
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {yearError && <div style={{color:"#fca5a5",fontSize:14,textAlign:"left",marginTop:8,padding:"0 4px"}}>{yearError}</div>}
          <p style={{fontSize:11,color:"rgba(255,255,255,0.2)",marginTop:12,textAlign:"center",letterSpacing:"0.04em"}}>
            ⚡ Instant search · Cached locally · Data from NECTA Tanzania · <span style={{color:G}}>STEA Africa</span>
          </p>
        </div>
      </section>

      {/* ── Results Section ─────────────────────────────────────────── */}
      <section style={{maxWidth:1000,margin:"0 auto",padding:"0 20px"}}>
        {results && (
          <button onClick={() => { setResults(null); setError(""); }}
            style={{display:"flex",alignItems:"center",gap:8,color:"rgba(255,255,255,0.6)",background:"none",border:"none",cursor:"pointer",marginBottom:24,fontSize:14,fontWeight:600}}
            className="hover:text-white transition-colors">
            <ArrowLeft size={16}/> Rudi kwenye utafutaji
          </button>
        )}

        {loading && (
          <div style={{textAlign:"center",padding:60}}>
            <motion.div animate={{rotate:360}} transition={{duration:1,repeat:Infinity,ease:"linear"}} style={{display:"inline-block",marginBottom:20}}>
              <Loader2 size={48} color={G}/>
            </motion.div>
            <p style={{color:"rgba(255,255,255,0.6)"}}>Tunapakua matokeo kutoka NECTA...</p>
          </div>
        )}

        {error && !loading && (
          <div style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",padding:20,borderRadius:16,display:"flex",gap:16,color:"#fca5a5"}}>
            <AlertCircle size={24}/><p>{error}</p>
          </div>
        )}

        {results && !loading && (
          <motion.div id="school-result-card" initial={{opacity:0}} animate={{opacity:1}} ref={resultsRef}>

            {/* School header */}
            <div style={{background:"rgba(255,255,255,0.03)",padding:32,borderRadius:24,border:"1px solid rgba(255,255,255,0.08)",marginBottom:32}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:20}}>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:10,color:G,marginBottom:8}}>
                    <School size={20}/><span style={{fontWeight:800,fontSize:14,letterSpacing:"0.1em"}}>UFAULU WA SHULE</span>
                  </div>
                  <h2 style={{fontFamily:"'Bricolage Grotesque', sans-serif",fontSize:28,fontWeight:900}}>{results.schoolName}</h2>
                  <p style={{color:"rgba(255,255,255,0.5)",marginTop:4}}>{results.examTitle}</p>
                </div>
                <div data-html2canvas-ignore="true" style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                  <button onClick={() => { setNectaUrl(`https://onlinesys.necta.go.tz/results/${year}/${examType.toLowerCase()}/results/${results.schoolCode.toLowerCase()}.htm`); setShowNectaPopup(true); }}
                    style={{...actionBtn,background:"rgba(245,166,35,0.1)",color:G,borderColor:"rgba(245,166,35,0.2)"}}>
                    <ExternalLink size={18}/> NECTA Rasmi
                  </button>
                  <button onClick={() => downloadPDF(resultsRef, `NECTA_${results.schoolCode}_${year}`)} style={actionBtn}><Download size={18}/> PDF</button>
                  <button onClick={() => window.print()} style={actionBtn}><Printer size={18}/> Print</button>
                </div>
              </div>

              {results.summary && results.summary.length > 0 && (
                <div style={{marginTop:32}}>
                  <h3 style={{fontSize:14,fontWeight:800,color:"rgba(255,255,255,0.4)",marginBottom:16,letterSpacing:"0.1em"}}>MUHTASARI WA DARAJA (DIVISION)</h3>
                  <div style={{overflowX:"auto"}}>
                    <table style={{width:"100%",borderCollapse:"collapse"}}>
                      <thead><tr>{results.summary[0].map((h,i) => <th key={i} style={th}>{h}</th>)}</tr></thead>
                      <tbody>{results.summary.slice(1).map((row,i) => <tr key={i}>{row.map((c,j) => <td key={j} style={td}>{c}</td>)}</tr>)}</tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Students table */}
            <div style={{background:"rgba(255,255,255,0.03)",padding:32,borderRadius:24,border:"1px solid rgba(255,255,255,0.08)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:8,flexWrap:"wrap",gap:16}}>
                <div>
                  <h3 style={{fontSize:18,fontWeight:800,marginBottom:4}}>Matokeo ya Wanafunzi</h3>
                  <p style={{color:"rgba(255,255,255,0.5)",fontSize:13}}>Bofya mstari wa mwanafunzi kuona matokeo yake kwa kina.</p>
                </div>
                <div data-html2canvas-ignore="true" style={{width:"100%",maxWidth:400}}>
                  <label style={labelStyle}>ANGALIA MATOKEO YAKO</label>
                  <div style={{display:"flex",gap:8,marginTop:6}}>
                    <div style={{position:"relative",flex:1}}>
                      <Search size={18} style={{position:"absolute",left:12,top:12,color:"rgba(255,255,255,0.3)"}}/>
                      <input type="text" placeholder="Mfano: S0155/0001" value={studentFilter}
                        onChange={e => setStudentFilter(e.target.value)}
                        style={{...inputStyle,paddingLeft:40,height:42}}/>
                    </div>
                    <button onClick={() => { const f = filteredStudents.find(s => s.indexNumber.toLowerCase() === studentFilter.toLowerCase()); if (f) setSelectedStudent(f); }}
                      style={{...actionBtn,height:42,background:G,color:"#000",border:"none"}}>
                      Angalia Matokeo
                    </button>
                  </div>
                </div>
              </div>

              <div style={{overflowX:"auto",marginTop:24}}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead>
                    <tr>
                      <th style={th}>NAMBA YA USAJILI</th><th style={th}>JINSIA</th>
                      <th style={th}>ALAMA</th><th style={th}>DARAJA</th>
                      <th style={th} className="desktop-only">MASOMO NA MADARAJA</th>
                      <th style={th}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((s, i) => (
                      <tr key={i} onClick={() => setSelectedStudent(s)} style={{cursor:"pointer"}} className="hover:bg-white/5 transition-colors">
                        <td style={{...td,fontWeight:700,color:G}}>{s.indexNumber}</td>
                        <td style={td}>{s.sex}</td>
                        <td style={td}>{s.points}</td>
                        <td style={td}>
                          <span style={{padding:"4px 10px",borderRadius:6,background:s.division==="I"?"rgba(34,197,94,0.1)":"rgba(255,255,255,0.05)",color:s.division==="I"?"#4ade80":"#fff",fontWeight:800,whiteSpace:"nowrap"}}>
                            {s.division}
                          </span>
                        </td>
                        <td style={{...td,fontSize:12,color:"rgba(255,255,255,0.5)"}} className="desktop-only">{s.subjects}</td>
                        <td style={{...td,textAlign:"right"}}>
                          <span style={{fontSize:12,color:G,fontWeight:700,background:"rgba(245,166,35,0.1)",padding:"4px 10px",borderRadius:12}}>Angalia</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mobile-hint" style={{textAlign:"center",padding:"12px",fontSize:12,color:"rgba(255,255,255,0.4)",display:"none"}}>Bofya mwanafunzi kuona masomo yake</div>
              </div>
            </div>
          </motion.div>
        )}
      </section>

      {/* ── Student Detail Modal ─────────────────────────────────── */}
      <AnimatePresence>
        {selectedStudent && (
          <div style={{position:"fixed",inset:0,zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setSelectedStudent(null)}
              style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.8)",backdropFilter:"blur(10px)"}}/>
            <motion.div id="student-result-card" initial={{opacity:0,scale:0.9,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.9,y:20}} ref={studentRef}
              style={{position:"relative",width:"100%",maxWidth:500,background:"#0e101a",borderRadius:32,border:"1px solid rgba(255,255,255,0.12)",padding:40,boxShadow:"0 40px 100px rgba(0,0,0,0.8)"}}>
              <button data-html2canvas-ignore="true" onClick={() => setSelectedStudent(null)}
                style={{position:"absolute",top:24,right:24,background:"none",border:"none",color:"rgba(255,255,255,0.4)",cursor:"pointer"}}>
                <X size={24}/>
              </button>
              <div style={{textAlign:"center",marginBottom:32}}>
                <div style={{width:80,height:80,borderRadius:24,background:`linear-gradient(135deg,${G},${G2})`,display:"grid",placeItems:"center",margin:"0 auto 20px",color:"#111"}}>
                  <User size={40}/>
                </div>
                <h2 style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:24,fontWeight:900}}>{selectedStudent.indexNumber}</h2>
                <p style={{color:"rgba(255,255,255,0.5)"}}>{results.schoolName}</p>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:32}}>
                {[["JINSIA",selectedStudent.sex,false],["DARAJA (DIV)",selectedStudent.division,true],["ALAMA (POINTS)",selectedStudent.points,false],["MWAKA",year,false]].map(([l,v,gold]) => (
                  <div key={l} style={{background:"rgba(255,255,255,0.03)",padding:16,borderRadius:16,border:"1px solid rgba(255,255,255,0.06)",display:"flex",flexDirection:"column",gap:4}}>
                    <span style={{fontSize:10,fontWeight:800,color:"rgba(255,255,255,0.4)",letterSpacing:"0.05em"}}>{l}</span>
                    <span style={{fontSize:18,fontWeight:900,color:gold?G:"#fff"}}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{marginBottom:32}}>
                <h4 style={{fontSize:12,fontWeight:800,color:"rgba(255,255,255,0.4)",marginBottom:12,letterSpacing:"0.1em"}}>MASOMO NA MADARAJA</h4>
                <div style={{background:"rgba(255,255,255,0.03)",borderRadius:16,padding:16}}>{formatSubjects(selectedStudent.subjects)}</div>
              </div>
              <div data-html2canvas-ignore="true" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <button onClick={() => downloadPDF(studentRef, `Result_${selectedStudent.indexNumber}`)} style={actionBtn}><Download size={18}/> PDF</button>
                <button onClick={() => downloadImage(studentRef, `Result_${selectedStudent.indexNumber}`)} style={actionBtn}><ImageIcon size={18}/> Image</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── NECTA Redirect Popup ─────────────────────────────────── */}
      <AnimatePresence>
        {showNectaPopup && (
          <div style={{position:"fixed",inset:0,zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setShowNectaPopup(false)}
              style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.8)",backdropFilter:"blur(10px)"}}/>
            <motion.div initial={{opacity:0,scale:0.9,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.9,y:20}}
              style={{position:"relative",width:"100%",maxWidth:400,background:"#0e101a",borderRadius:24,border:"1px solid rgba(255,255,255,0.12)",padding:32,boxShadow:"0 40px 100px rgba(0,0,0,0.8)",textAlign:"center"}}>
              <div style={{marginBottom:24}}>
                <ExternalLink size={48} color={G} style={{margin:"0 auto 16px"}}/>
                <h3 style={{fontSize:20,fontWeight:800,marginBottom:8}}>Unaelekea NECTA</h3>
                <p style={{color:"rgba(255,255,255,0.6)",fontSize:14,lineHeight:1.6}}>Utafungua ukurasa rasmi wa matokeo kutoka Baraza la Mitihani la Taifa (NECTA).</p>
                <div style={{background:"rgba(255,255,255,0.05)",padding:"12px",borderRadius:8,marginTop:16,fontSize:12,color:"rgba(255,255,255,0.4)",wordBreak:"break-all"}}>{nectaUrl}</div>
              </div>
              <div style={{display:"grid",gap:12}}>
                <a href={nectaUrl} target="_blank" rel="noreferrer" onClick={() => setShowNectaPopup(false)}
                  style={{...actionBtn,background:G,color:"#000",justifyContent:"center",textDecoration:"none"}}>
                  Endelea kwenda NECTA
                </a>
                <button onClick={() => setShowNectaPopup(false)} style={{...actionBtn,justifyContent:"center",background:"transparent"}}>Baki STEA</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        @media(max-width:768px){.desktop-only{display:none!important}.mobile-grid{grid-template-columns:1fr!important}.search-span{grid-column:1/-1!important}.mobile-hint{display:block!important}}
        @media(min-width:769px){.search-span{grid-column:span 2}}
        input[type="search"]::-webkit-search-cancel-button{display:none}
      `}</style>
    </div>
  );
}

const labelStyle={fontSize:12,color:"rgba(255,255,255,0.4)",marginBottom:8,display:"block",fontWeight:700};
const selStyle={width:"100%",height:52,borderRadius:14,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.05)",color:"#fff",padding:"0 16px",outline:"none",fontSize:14,fontFamily:"inherit",appearance:"none",cursor:"pointer"};
const inputStyle={width:"100%",height:52,borderRadius:14,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.05)",color:"#fff",padding:"0 16px",outline:"none",fontSize:14,fontFamily:"inherit"};
const actionBtn={padding:"10px 20px",borderRadius:12,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.05)",color:"#fff",fontSize:14,fontWeight:700,display:"flex",alignItems:"center",gap:8,cursor:"pointer",transition:"all 0.2s"};
const th={textAlign:"left",padding:"12px 16px",fontSize:12,color:"rgba(255,255,255,0.4)",fontWeight:800,borderBottom:"1px solid rgba(255,255,255,0.08)"};
const td={padding:"16px",fontSize:14,borderBottom:"1px solid rgba(255,255,255,0.05)"};
