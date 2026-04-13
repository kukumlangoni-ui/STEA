import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Clock, Target, CheckCircle, XCircle, ArrowLeft, ArrowRight, RotateCcw, Zap, BookOpen } from "lucide-react";

const G = "#F5A623";
const G2 = "#FFD17C";
const DARK = "#05060a";
const CARD = "#0d0f1a";
const BORDER = "rgba(255,255,255,0.07)";

const QUIZZES = [
  { id:"csee-bio", title:"Biology — Form 4 (CSEE)", emoji:"🧬", color:"#10b981", questions:5, level:"Form 4", subject:"Biology", duration:"8 min",
    qs:[
      { q:"Seli ya damu nyekundu ina jina gani la kisayansi?", opts:["Leukocyte","Erythrocyte","Platelet","Lymphocyte"], ans:1 },
      { q:"Mimea inabadilisha nishati ya jua kuwa chakula kupitia mchakato gani?", opts:["Kupumua","Usagaji","Usanisinuru (Photosynthesis)","Kugawanyika"], ans:2 },
      { q:"Sehemu ya seli inayodhibiti shughuli zote za seli ni:", opts:["Cytoplasm","Cell membrane","Nucleus","Mitochondria"], ans:2 },
      { q:"Moyo wa binadamu una vyumba vingapi?", opts:["2","3","4","5"], ans:2 },
      { q:"Jina la kisayansi la binadamu ni:", opts:["Homo erectus","Homo habilis","Homo sapiens","Homo neanderthalensis"], ans:2 },
    ]
  },
  { id:"csee-math", title:"Mathematics — Form 4", emoji:"📐", color:"#3b82f6", questions:5, level:"Form 4", subject:"Mathematics", duration:"10 min",
    qs:[
      { q:"Suluhisha: 3x + 7 = 22. x = ?", opts:["3","4","5","6"], ans:2 },
      { q:"Mraba wa 144 ni:", opts:["10","11","12","13"], ans:2 },
      { q:"Pi (π) = ?", opts:["3.14159","2.71828","1.61803","1.41421"], ans:0 },
      { q:"Jibu la 2⁵ = ?", opts:["10","16","32","64"], ans:2 },
      { q:"Eneo la mduara wenye radius r = 5 cm ni:", opts:["25π cm²","10π cm²","5π cm²","50π cm²"], ans:0 },
    ]
  },
  { id:"psle-english", title:"English — Standard 7 (PSLE)", emoji:"📚", color:"#8b5cf6", questions:5, level:"Standard 7", subject:"English", duration:"8 min",
    qs:[
      { q:"Choose the correct sentence:", opts:["She don't know the answer.","She doesn't know the answer.","She not know the answer.","She not knowing the answer."], ans:1 },
      { q:"The opposite of 'ancient' is:", opts:["Old","Modern","Huge","Tiny"], ans:1 },
      { q:"What is the plural of 'child'?", opts:["Childs","Childes","Children","Child"], ans:2 },
      { q:"The past tense of 'go' is:", opts:["Goed","Going","Gone","Went"], ans:3 },
      { q:"A word that describes a noun is called:", opts:["Verb","Adjective","Adverb","Conjunction"], ans:1 },
    ]
  },
  { id:"acsee-history", title:"History — Form 6 (ACSEE)", emoji:"🏛️", color:"#f59e0b", questions:5, level:"Form 6", subject:"History", duration:"10 min",
    qs:[
      { q:"Tanganyika ilipata uhuru wake mwaka gani?", opts:["1959","1960","1961","1963"], ans:2 },
      { q:"Julius Nyerere alikuwa Rais wa kwanza wa nchi gani?", opts:["Kenya","Uganda","Tanzania","Zambia"], ans:2 },
      { q:"Vita vya Kwanza vya Ulimwengu vilifanyika kati ya miaka gani?", opts:["1910-1914","1914-1918","1918-1922","1920-1924"], ans:1 },
      { q:"TANU ilianzishwa mwaka gani?", opts:["1952","1953","1954","1955"], ans:2 },
      { q:"UN (United Nations) ilianzishwa mwaka gani?", opts:["1943","1944","1945","1946"], ans:2 },
    ]
  },
];

function QuizCard({ quiz, onStart }) {
  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} whileHover={{ y:-4 }}
      style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:20, padding:"24px", cursor:"pointer", transition:"all .25s" }}
      onClick={() => onStart(quiz)}
      onMouseEnter={e => { e.currentTarget.style.borderColor=`${quiz.color}30`; e.currentTarget.style.boxShadow=`0 12px 36px rgba(0,0,0,.4)`; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor=BORDER; e.currentTarget.style.boxShadow="none"; }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
        <div style={{ fontSize:40 }}>{quiz.emoji}</div>
        <span style={{ padding:"3px 10px", borderRadius:8, fontSize:10, fontWeight:900, background:`${quiz.color}15`, color:quiz.color, textTransform:"uppercase" }}>{quiz.level}</span>
      </div>
      <h3 style={{ fontWeight:900, fontSize:17, marginBottom:10, lineHeight:1.3 }}>{quiz.title}</h3>
      <div style={{ display:"flex", gap:16, flexWrap:"wrap", marginBottom:18 }}>
        <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, color:"rgba(255,255,255,.45)" }}><Target size={12}/> {quiz.questions} maswali</div>
        <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, color:"rgba(255,255,255,.45)" }}><Clock size={12}/> ~{quiz.duration}</div>
        <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, color:"rgba(255,255,255,.45)" }}><BookOpen size={12}/> {quiz.subject}</div>
      </div>
      <button style={{ width:"100%", height:44, borderRadius:12, border:"none", background:`linear-gradient(135deg,${quiz.color},${quiz.color}99)`, color:"#fff", fontWeight:800, fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
        <Zap size={15}/> Anza Quiz
      </button>
    </motion.div>
  );
}

function ActiveQuiz({ quiz, onFinish }) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const q = quiz.qs[current];

  const handleNext = () => {
    if (selected === null) return;
    const newAnswers = [...answers, selected];
    if (current + 1 < quiz.qs.length) {
      setAnswers(newAnswers);
      setCurrent(c => c + 1);
      setSelected(null);
    } else {
      setAnswers(newAnswers);
      setShowResult(true);
    }
  };

  if (showResult) {
    const score = answers.filter((a, i) => a === quiz.qs[i].ans).length;
    const pct = Math.round((score / quiz.qs.length) * 100);
    const grade = pct >= 80 ? "A" : pct >= 65 ? "B" : pct >= 50 ? "C" : pct >= 40 ? "D" : "F";
    const gColor = pct >= 80 ? "#4ade80" : pct >= 65 ? "#60a5fa" : pct >= 50 ? G : pct >= 40 ? "#f97316" : "#f87171";
    return (
      <motion.div initial={{ opacity:0, scale:.95 }} animate={{ opacity:1, scale:1 }} style={{ maxWidth:520, margin:"0 auto", textAlign:"center" }}>
        <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:28, padding:"44px 36px" }}>
          <div style={{ fontSize:56, marginBottom:16 }}>{pct >= 80 ? "🏆" : pct >= 65 ? "🎉" : pct >= 50 ? "👍" : "📚"}</div>
          <h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:26, fontWeight:900, marginBottom:6 }}>
            {pct >= 80 ? "Hongera!" : pct >= 65 ? "Vizuri Sana!" : pct >= 50 ? "Unaendelea Vizuri" : "Jaribu Tena!"}
          </h2>
          <p style={{ color:"rgba(255,255,255,.5)", marginBottom:28, fontSize:14 }}>{quiz.title}</p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14, marginBottom:28 }}>
            {[["Alama",`${score}/${quiz.qs.length}`],["Asilimia",`${pct}%`],["Daraja",grade]].map(([l,v]) => (
              <div key={l} style={{ background:"rgba(255,255,255,.03)", borderRadius:12, padding:"14px 10px", border:`1px solid rgba(255,255,255,.06)` }}>
                <div style={{ fontSize:10, color:"rgba(255,255,255,.35)", fontWeight:800, marginBottom:4, textTransform:"uppercase" }}>{l}</div>
                <div style={{ fontSize:22, fontWeight:900, color:gColor }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ textAlign:"left", marginBottom:24, maxHeight:240, overflowY:"auto" }}>
            {quiz.qs.map((q, i) => {
              const ok = answers[i] === q.ans;
              return (
                <div key={i} style={{ display:"flex", gap:10, padding:"8px 12px", borderRadius:10, marginBottom:6, background:ok?"rgba(74,222,128,.06)":"rgba(248,113,113,.06)", border:`1px solid ${ok?"rgba(74,222,128,.15)":"rgba(248,113,113,.15)"}` }}>
                  {ok ? <CheckCircle size={14} color="#4ade80" style={{ flexShrink:0, marginTop:2 }}/> : <XCircle size={14} color="#f87171" style={{ flexShrink:0, marginTop:2 }}/>}
                  <div>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,.55)", marginBottom:2 }}>{q.q}</div>
                    <div style={{ fontSize:12, fontWeight:700, color:ok?"#4ade80":"#f87171" }}>{ok?"✓ Sahihi":"✗ Jibu sahihi: "+q.opts[q.ans]}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={() => { setCurrent(0); setSelected(null); setAnswers([]); setShowResult(false); }}
              style={{ flex:1, height:46, borderRadius:12, border:`1px solid ${BORDER}`, background:"rgba(255,255,255,.04)", color:"rgba(255,255,255,.7)", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
              <RotateCcw size={14}/> Jaribu Tena
            </button>
            <button onClick={onFinish} style={{ flex:1, height:46, borderRadius:12, border:"none", background:`linear-gradient(135deg,${G},${G2})`, color:"#111", fontWeight:900, cursor:"pointer" }}>Quiz Nyingine</button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div style={{ maxWidth:580, margin:"0 auto" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <button onClick={onFinish} style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(255,255,255,.05)", border:`1px solid ${BORDER}`, color:"rgba(255,255,255,.6)", padding:"8px 14px", borderRadius:10, cursor:"pointer", fontSize:13, fontWeight:700 }}>
          <ArrowLeft size={14}/> Rudi
        </button>
        <div style={{ fontSize:13, color:"rgba(255,255,255,.4)", fontWeight:700 }}>{current+1} / {quiz.qs.length}</div>
      </div>
      <div style={{ height:4, borderRadius:99, background:"rgba(255,255,255,.08)", marginBottom:24, overflow:"hidden" }}>
        <motion.div animate={{ width:`${((current+1)/quiz.qs.length)*100}%` }} style={{ height:"100%", borderRadius:99, background:`linear-gradient(90deg,${quiz.color},${quiz.color}99)` }}/>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={current} initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }} transition={{ duration:.2 }}>
          <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:22, padding:"28px 24px", marginBottom:18 }}>
            <div style={{ fontSize:11, fontWeight:800, color:quiz.color, textTransform:"uppercase", letterSpacing:".08em", marginBottom:12 }}>Swali {current+1}</div>
            <h3 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:"clamp(16px,2.5vw,21px)", fontWeight:900, lineHeight:1.4, margin:0 }}>{q.q}</h3>
          </div>
          <div style={{ display:"grid", gap:10, marginBottom:20 }}>
            {q.opts.map((opt, i) => {
              const isSel = selected === i;
              const isOk = selected !== null && i === q.ans;
              const isWrong = isSel && i !== q.ans;
              let bc = BORDER, bg = "rgba(255,255,255,.03)", tc = "rgba(255,255,255,.8)";
              if (selected !== null) {
                if (isOk) { bc="rgba(74,222,128,.4)"; bg="rgba(74,222,128,.08)"; tc="#4ade80"; }
                else if (isWrong) { bc="rgba(248,113,113,.4)"; bg="rgba(248,113,113,.08)"; tc="#f87171"; }
              }
              return (
                <button key={i} onClick={() => selected===null && setSelected(i)}
                  style={{ width:"100%", padding:"14px 18px", borderRadius:13, border:`1.5px solid ${bc}`, background:bg, color:tc, fontWeight:600, fontSize:14, textAlign:"left", cursor:selected!==null?"default":"pointer", transition:"all .2s", display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ width:26, height:26, borderRadius:"50%", background:isOk?"rgba(74,222,128,.2)":isWrong?"rgba(248,113,113,.2)":"rgba(255,255,255,.06)", display:"grid", placeItems:"center", flexShrink:0, fontWeight:900, fontSize:12, color:isOk?"#4ade80":isWrong?"#f87171":"rgba(255,255,255,.4)" }}>
                    {selected!==null ? (isOk?"✓":isWrong?"✗":["A","B","C","D"][i]) : ["A","B","C","D"][i]}
                  </div>
                  {opt}
                </button>
              );
            })}
          </div>
          <button onClick={handleNext} disabled={selected===null}
            style={{ width:"100%", height:50, borderRadius:13, border:"none", background:selected!==null?`linear-gradient(135deg,${G},${G2})`:"rgba(255,255,255,.05)", color:selected!==null?"#111":"rgba(255,255,255,.2)", fontWeight:900, fontSize:15, cursor:selected!==null?"pointer":"default", transition:"all .2s", display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
            {current+1===quiz.qs.length?"Maliza Quiz":"Swali Lifuatalo"} <ArrowRight size={18}/>
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function PracticePage() {
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [filterLevel, setFilterLevel] = useState("All");
  const [filterSubject, setFilterSubject] = useState("All");
  const levels = ["All","Standard 7","Form 4","Form 6"];
  const subjects = ["All",...new Set(QUIZZES.map(q => q.subject))];
  const filtered = QUIZZES.filter(q => (filterLevel==="All"||q.level===filterLevel) && (filterSubject==="All"||q.subject===filterSubject));

  if (activeQuiz) return (
    <div style={{ paddingTop:100, paddingBottom:"calc(80px + env(safe-area-inset-bottom,0px))", minHeight:"100vh", background:DARK, color:"#fff" }}>
      <div style={{ maxWidth:660, margin:"0 auto", padding:"0 20px" }}>
        <ActiveQuiz quiz={activeQuiz} onFinish={() => setActiveQuiz(null)}/>
      </div>
    </div>
  );

  return (
    <div style={{ paddingTop:80, paddingBottom:"calc(80px + env(safe-area-inset-bottom,0px))", minHeight:"100vh", background:DARK, color:"#fff", fontFamily:"'Instrument Sans',system-ui,sans-serif" }}>
      <section style={{ padding:"48px 20px 36px", textAlign:"center", background:`radial-gradient(ellipse at 50% 0%, rgba(245,166,35,.12) 0%, transparent 55%)` }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"7px 18px", background:`${G}12`, border:`1px solid ${G}25`, borderRadius:999, color:G, fontSize:11, fontWeight:900, textTransform:"uppercase", letterSpacing:".1em", marginBottom:20 }}>
          <Star size={13}/> Practice & Quiz
        </div>
        <h1 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:"clamp(30px,5vw,52px)", fontWeight:900, lineHeight:1.1, marginBottom:14, letterSpacing:"-.04em" }}>
          Jipime Uwezo Wako<br/>
          <span style={{ background:`linear-gradient(135deg,${G},${G2})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Kabla ya Mtihani</span>
        </h1>
        <p style={{ color:"rgba(255,255,255,.5)", maxWidth:460, margin:"0 auto 28px", fontSize:15, lineHeight:1.7 }}>
          Maswali halisi ya PSLE, CSEE, na ACSEE. Jibu, jua alama yako, na ujue unakokosea.
        </p>
        <div style={{ display:"flex", gap:20, justifyContent:"center", flexWrap:"wrap" }}>
          {[[QUIZZES.length+"","Quiz"],["Bure","100%"],["PSLE•CSEE•ACSEE","Viwango"],["Haraka","Matokeo"]].map(([n,l]) => (
            <div key={n} style={{ textAlign:"center" }}>
              <div style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontWeight:900, fontSize:20, color:G }}>{n}</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,.35)", fontWeight:600 }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      <div style={{ maxWidth:1100, margin:"0 auto", padding:"0 20px" }}>
        <div style={{ display:"flex", gap:16, marginBottom:28, flexWrap:"wrap" }}>
          <div>
            <div style={{ fontSize:11, fontWeight:800, color:"rgba(255,255,255,.35)", marginBottom:8, textTransform:"uppercase", letterSpacing:".05em" }}>Kiwango</div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {levels.map(l => <button key={l} onClick={() => setFilterLevel(l)} style={{ padding:"7px 14px", borderRadius:999, fontSize:12, fontWeight:700, border:`1px solid ${filterLevel===l?G:BORDER}`, background:filterLevel===l?`${G}15`:"transparent", color:filterLevel===l?G:"rgba(255,255,255,.5)", cursor:"pointer", transition:"all .15s" }}>{l}</button>)}
            </div>
          </div>
          <div>
            <div style={{ fontSize:11, fontWeight:800, color:"rgba(255,255,255,.35)", marginBottom:8, textTransform:"uppercase", letterSpacing:".05em" }}>Somo</div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {subjects.map(s => <button key={s} onClick={() => setFilterSubject(s)} style={{ padding:"7px 14px", borderRadius:999, fontSize:12, fontWeight:700, border:`1px solid ${filterSubject===s?G:BORDER}`, background:filterSubject===s?`${G}15`:"transparent", color:filterSubject===s?G:"rgba(255,255,255,.5)", cursor:"pointer", transition:"all .15s" }}>{s}</button>)}
            </div>
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px,1fr))", gap:18, marginBottom:36 }}>
          {filtered.map((quiz, i) => <motion.div key={quiz.id} transition={{ delay:i*.06 }}><QuizCard quiz={quiz} onStart={setActiveQuiz}/></motion.div>)}
        </div>
        {filtered.length === 0 && (
          <div style={{ textAlign:"center", padding:"60px 20px", background:"rgba(255,255,255,.02)", borderRadius:20, border:`1px dashed ${BORDER}` }}>
            <h3 style={{ fontSize:18, fontWeight:800, marginBottom:8 }}>Hakuna quiz kwa kichujio hiki</h3>
            <button onClick={() => { setFilterLevel("All"); setFilterSubject("All"); }} style={{ padding:"10px 24px", borderRadius:12, border:`1px solid ${G}30`, background:`${G}10`, color:G, fontWeight:700, cursor:"pointer" }}>Ona Zote</button>
          </div>
        )}
        <div style={{ textAlign:"center", marginTop:12 }}>
          <Link to="/exams" style={{ display:"inline-flex", alignItems:"center", gap:8, color:"rgba(255,255,255,.4)", textDecoration:"none", fontSize:13, fontWeight:600 }}>
            <ArrowLeft size={14}/> Rudi Exams Hub
          </Link>
        </div>
      </div>
    </div>
  );
}
