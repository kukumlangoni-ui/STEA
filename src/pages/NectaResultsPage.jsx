import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Download, 
  Printer, 
  ChevronRight, 
  School, 
  User, 
  AlertCircle, 
  Loader2,
  X,
  ExternalLink,
  ArrowLeft
} from "lucide-react";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import Fuse from "fuse.js";

const G = "#F5A623";
const G2 = "#FFD17C";
const DARK = "#0B0F1A";
const CARD = "#1E2236";

export default function NectaResultsPage() {
  const currentYear = new Date().getFullYear();

  const [examType, setExamType] = useState("CSEE");
  const [year, setYear] = useState(currentYear.toString());
  const [yearError, setYearError] = useState("");
  const [schoolQuery, setSchoolQuery] = useState("");
  const [schools, setSchools] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchingSchools, setSearchingSchools] = useState(false);
  const [error, setError] = useState("");
  const [studentFilter, setStudentFilter] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showNectaPopup, setShowNectaPopup] = useState(false);
  const [nectaUrl, setNectaUrl] = useState("");
  const [localSchools, setLocalSchools] = useState([]);

  const resultsRef = useRef(null);
  const studentRef = useRef(null);
  const searchRef = useRef(null);

  // Load local schools for Fuse.js fallback
  useEffect(() => {
    // In a real app, this would be a large JSON file
    // For now, we'll use a small sample or fetch from API once
    const fetchInitialSchools = async () => {
      try {
        const res = await fetch(`/api/necta/schools?query=a&examType=${examType}&year=${year}`);
        const data = await res.json();
        if (Array.isArray(data)) setLocalSchools(data);
      } catch {
        console.log("Could not load initial schools for Fuse.js");
      }
    };
    fetchInitialSchools();
  }, [examType, year]);

  const fuse = useMemo(() => new Fuse(localSchools, {
    keys: ["name", "code"],
    threshold: 0.3
  }), [localSchools]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch schools as user types
  useEffect(() => {
    const trimmedQuery = schoolQuery.trim();
    if (trimmedQuery.length < 2) {
      setSchools([]);
      return;
    }

    // Use Fuse.js for instant local search if we have data
    if (localSchools.length > 0) {
      const results = fuse.search(trimmedQuery).map(r => r.item);
      setSchools(results);
      setShowSuggestions(results.length > 0);
    }

    const delayDebounceFn = setTimeout(async () => {
      setSearchingSchools(true);
      try {
        const res = await fetch(`/api/necta/schools?query=${encodeURIComponent(trimmedQuery)}&examType=${examType}&year=${year}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          // Merge with local results and deduplicate
          setSchools(prev => {
            const combined = [...data, ...prev];
            return combined.filter((v, i, a) => a.findIndex(t => t.code === v.code) === i);
          });
          setShowSuggestions(true);
        }
      } catch (err) {
        console.error("Error searching schools:", err);
      } finally {
        setSearchingSchools(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [schoolQuery, examType, year, fuse, localSchools.length]);

  const handleSearch = async (schoolCode, schoolName) => {
    setYearError("");
    const parsedYear = parseInt(year);
    if (isNaN(parsedYear) || parsedYear < 1990) {
      setYearError("Tafadhali weka mwaka sahihi (mfano: 2024).");
      return;
    }
    if (parsedYear > currentYear) {
      setYearError("Matokeo ya mwaka huu bado hayajatoka. Tafadhali jaribu tena baadaye.");
      return;
    }

    setLoading(true);
    setError("");
    setResults(null);
    setSelectedStudent(null);
    setShowSuggestions(false);
    if (schoolName) setSchoolQuery(schoolName);
    
    try {
      const res = await fetch(`/api/necta/results/${examType}/${year}/${schoolCode}`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Matokeo hayajapatikana. Hakikisha mwaka na aina ya mtihani ni sahihi.");
      }
      const data = await res.json();
      if (!data.students || data.students.length === 0) {
        throw new Error("Hakuna matokeo yaliyopatikana kwa shule hii katika mwaka huu.");
      }
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = (type = "school") => {
    const doc = new jsPDF();
    const primaryColor = [245, 166, 35]; // #F5A623

    if (type === "school" && results) {
      doc.setFontSize(20);
      doc.setTextColor(40);
      doc.text("NECTA Results - STEA Africa", 14, 22);
      
      doc.setFontSize(14);
      doc.text(`School: ${results.schoolName} (${results.schoolCode})`, 14, 32);
      doc.text(`Exam: ${results.examTitle}`, 14, 40);
      doc.text(`Year: ${year}`, 14, 48);

      const tableData = results.students.map(s => [
        s.indexNumber,
        s.sex,
        s.points,
        s.division,
        s.subjects
      ]);

      doc.autoTable({
        startY: 55,
        head: [["Index No", "Sex", "Points", "Div", "Subjects"]],
        body: tableData,
        headStyles: { fillStyle: primaryColor },
        theme: "grid"
      });

      doc.save(`NECTA_${results.schoolCode}_${year}.pdf`);
    } else if (type === "student" && selectedStudent) {
      doc.setFontSize(22);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("STEA Africa - Result Slip", 105, 30, { align: "center" });

      doc.setDrawColor(200);
      doc.line(20, 40, 190, 40);

      doc.setFontSize(14);
      doc.setTextColor(40);
      doc.text(`Index Number: ${selectedStudent.indexNumber}`, 20, 55);
      doc.text(`School: ${results.schoolName}`, 20, 65);
      doc.text(`Exam: ${results.examTitle}`, 20, 75);
      doc.text(`Year: ${year}`, 20, 85);

      doc.autoTable({
        startY: 95,
        head: [["Category", "Value"]],
        body: [
          ["Sex", selectedStudent.sex],
          ["Division", selectedStudent.division],
          ["Points", selectedStudent.points]
        ],
        theme: "striped"
      });

      doc.setFontSize(12);
      doc.text("Subjects & Grades:", 20, doc.lastAutoTable.finalY + 15);

      const subjects = selectedStudent.subjects.split(",").map(s => s.trim());
      const subData = subjects.map(s => {
        const parts = s.split("-");
        return [parts[0]?.trim() || "", parts[1]?.trim()?.replace(/'/g, "") || ""];
      });

      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 20,
        head: [["Subject", "Grade"]],
        body: subData,
        theme: "grid"
      });

      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text("Generated by STEA Africa", 105, 285, { align: "center" });

      doc.save(`Result_${selectedStudent.indexNumber}.pdf`);
    }
  };

  const formatSubjects = (subjectsStr) => {
    if (!subjectsStr) return null;
    const safeStr = subjectsStr.replace(/'\s/g, "'|");
    const parts = safeStr.split('|');
    
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {parts.map((part, i) => {
          const match = part.match(/(.+?)\s*-\s*'([A-Z0-9])'/);
          if (match) {
            const subj = match[1].trim();
            const grade = match[2];
            let color = "#fff";
            let bg = "rgba(255,255,255,0.05)";
            if (grade === 'A') { color = "#4ade80"; bg = "rgba(34,197,94,0.1)"; }
            else if (grade === 'B') { color = "#60a5fa"; bg = "rgba(56,130,246,0.1)"; }
            else if (grade === 'C') { color = "#facc15"; bg = "rgba(250,204,21,0.1)"; }
            else if (grade === 'D') { color = "#f97316"; bg = "rgba(249,115,22,0.1)"; }
            else if (grade === 'F') { color = "#f87171"; bg = "rgba(248,113,113,0.1)"; }
            
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8, overflow: "hidden" }}>
                <span style={{ padding: "6px 10px", fontSize: 12, fontWeight: 600 }}>{subj}</span>
                <span style={{ padding: "6px 12px", fontSize: 13, fontWeight: 800, color, background: bg }}>{grade}</span>
              </div>
            );
          }
          return <span key={i} style={{ padding: "4px 8px", background: "rgba(255,255,255,0.05)", borderRadius: 6, fontSize: 12 }}>{part}</span>;
        })}
      </div>
    );
  };

  const filteredStudents = results?.students?.filter(s => 
    s.indexNumber.toLowerCase().includes(studentFilter.toLowerCase()) ||
    (s.name && s.name.toLowerCase().includes(studentFilter.toLowerCase()))
  ) || [];

  return (
    <div style={{ minHeight: "100vh", background: DARK, color: "#fff", paddingBottom: 100 }}>
      {/* Hero Section */}
      <section style={{ 
        padding: "100px 20px 60px", 
        background: `radial-gradient(circle at top right, ${G}15, transparent 40%)`,
        textAlign: "center"
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 24 }}>
            <button onClick={() => window.history.back()} style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", padding: "8px 16px", borderRadius: 12, color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              <ArrowLeft size={16} /> Back
            </button>
            <button onClick={() => { setResults(null); setSchoolQuery(""); }} style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", padding: "8px 16px", borderRadius: 12, color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              <X size={16} /> Cancel
            </button>
          </div>
          <h1 style={{ 
            fontFamily: "'Bricolage Grotesque', sans-serif", 
            fontSize: "clamp(32px, 5vw, 56px)", 
            fontWeight: 900,
            marginBottom: 16,
            letterSpacing: "-0.04em"
          }}>
            NECTA <span style={{ color: G }}>Results</span> Center
          </h1>
          <p style={{ color: "rgba(255,255,255,0.6)", maxWidth: 600, margin: "0 auto 40px", fontSize: 16 }}>
            Tafuta matokeo ya mitihani ya taifa kwa urahisi. Chagua shule, mwaka na aina ya mtihani kupata matokeo yako papo hapo.
          </p>
        </motion.div>

        {/* Search Form */}
        <div style={{ 
          maxWidth: 900, 
          margin: "0 auto", 
          background: CARD, 
          padding: 24, 
          borderRadius: 24,
          border: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(10px)",
          boxShadow: "0 20px 50px rgba(0,0,0,0.3)"
        }}>
          <div className="mobile-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16, marginBottom: 20 }}>
            <div style={{ textAlign: "left" }}>
              <label style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 8, display: "block", fontWeight: 700 }}>AINA YA MTIHANI</label>
              <select 
                value={examType} 
                onChange={(e) => setExamType(e.target.value)}
                style={selectStyle}
              >
                <option value="PSLE">PSLE (Primary)</option>
                <option value="FTNA">FTNA (Form 2)</option>
                <option value="CSEE">CSEE (Form 4)</option>
                <option value="ACSEE">ACSEE (Form 6)</option>
              </select>
            </div>
            <div style={{ textAlign: "left" }}>
              <label style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 8, display: "block", fontWeight: 700 }}>MWAKA</label>
              <select 
                value={year} 
                onChange={(e) => setYear(e.target.value)}
                style={selectStyle}
              >
                {Array.from({ length: 2025 - 2005 + 1 }, (_, i) => 2025 - i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div className="search-span" style={{ textAlign: "left" }}>
              <label style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 8, display: "block", fontWeight: 700 }}>JINA LA SHULE AU NAMBA YA SHULE</label>
              <div style={{ position: "relative" }} ref={searchRef}>
                <input 
                  type="text" 
                  placeholder="Andika jina la shule (mf. Tabora Boys)..." 
                  value={schoolQuery}
                  onChange={(e) => {
                    setSchoolQuery(e.target.value);
                    if (e.target.value.trim().length > 1) setShowSuggestions(true);
                  }}
                  onFocus={() => {
                    if (schools.length > 0) setShowSuggestions(true);
                  }}
                  style={inputStyle}
                />
                {searchingSchools && (
                  <Loader2 size={18} style={{ position: "absolute", right: 12, top: 14, color: G }} className="animate-spin" />
                )}
                
                {/* Autocomplete Dropdown */}
                <AnimatePresence>
                  {showSuggestions && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        background: "#0e101a",
                        borderRadius: 16,
                        border: "1px solid rgba(245,166,35,0.2)",
                        marginTop: 8,
                        zIndex: 100,
                        maxHeight: 300,
                        overflowY: "auto",
                        boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
                        padding: 8
                      }}
                    >
                      {schools.length > 0 ? (
                        schools.map(s => (
                          <div 
                            key={s.code}
                            onClick={() => handleSearch(s.code, s.name)}
                            style={{
                              padding: "12px 16px",
                              cursor: "pointer",
                              borderRadius: 10,
                              marginBottom: 4,
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center"
                            }}
                            className="hover:bg-white/5"
                          >
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 14 }}>{s.name}</div>
                              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Namba: {s.code}</div>
                            </div>
                            <ChevronRight size={16} color={G} />
                          </div>
                        ))
                      ) : (
                        !searchingSchools && schoolQuery.trim().length > 1 && (
                          <div style={{ padding: "20px", textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: 14 }}>
                            Hakuna shule iliyopatikana kwa &quot;{schoolQuery}&quot; katika mwaka {year}.
                          </div>
                        )
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
          {yearError && (
            <div style={{ color: "#fca5a5", fontSize: 14, textAlign: "left", marginTop: 8, padding: "0 4px" }}>
              {yearError}
            </div>
          )}
        </div>
      </section>

      {/* Results Section */}
      <section style={{ maxWidth: 1000, margin: "0 auto", padding: "0 20px" }}>
        {results && (
          <button 
            onClick={() => setResults(null)}
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: 8, 
              color: "rgba(255,255,255,0.6)", 
              background: "none", 
              border: "none", 
              cursor: "pointer",
              marginBottom: 24,
              fontSize: 14,
              fontWeight: 600
            }}
            className="hover:text-white transition-colors"
          >
            <ArrowLeft size={16} /> Rudi kwenye utafutaji
          </button>
        )}
        {loading && (
          <div style={{ textAlign: "center", padding: 60 }}>
            <Loader2 size={48} color={G} className="animate-spin" style={{ margin: "0 auto 20px" }} />
            <p style={{ color: "rgba(255,255,255,0.6)" }}>Tunapakua matokeo kutoka NECTA...</p>
          </div>
        )}

        {error && (
          <div style={{ 
            background: "rgba(239,68,68,0.1)", 
            border: "1px solid rgba(239,68,68,0.2)", 
            padding: 20, 
            borderRadius: 16, 
            display: "flex", 
            gap: 16,
            color: "#fca5a5"
          }}>
            <AlertCircle size={24} />
            <p>{error}</p>
          </div>
        )}

        {results && (
          <motion.div
            id="school-result-card"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            ref={resultsRef}
          >
            {/* School Header */}
            <div style={{ 
              background: "rgba(255,255,255,0.03)", 
              padding: 32, 
              borderRadius: 24, 
              border: "1px solid rgba(255,255,255,0.08)",
              marginBottom: 32
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, color: G, marginBottom: 8 }}>
                    <School size={20} />
                    <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: "0.1em" }}>UFAULU WA SHULE</span>
                  </div>
                  <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 28, fontWeight: 900 }}>
                    {results.schoolName}
                  </h2>
                  <p style={{ color: "rgba(255,255,255,0.5)", marginTop: 4 }}>{results.examTitle}</p>
                </div>
                <div data-html2canvas-ignore="true" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <button 
                    onClick={() => {
                      setNectaUrl(`https://onlinesys.necta.go.tz/results/${year}/${examType.toLowerCase()}/results/${results.schoolCode.toLowerCase()}.htm`);
                      setShowNectaPopup(true);
                    }}
                    style={{ ...actionButtonStyle, background: "rgba(245,166,35,0.1)", color: G, borderColor: "rgba(245,166,35,0.2)" }}
                  >
                    <ExternalLink size={18} /> NECTA Rasmi
                  </button>
                  <button 
                    onClick={() => exportToPDF("school")}
                    style={actionButtonStyle}
                  >
                    <Download size={18} /> PDF
                  </button>
                  <button 
                    onClick={() => window.print()}
                    style={actionButtonStyle}
                  >
                    <Printer size={18} /> Print
                  </button>
                </div>
              </div>

              {/* Summary Tables */}
              {results.summary && results.summary.length > 0 && (
                <div style={{ marginTop: 32 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 800, color: "rgba(255,255,255,0.4)", marginBottom: 16, letterSpacing: "0.1em" }}>MUHTASARI WA DARAJA (DIVISION)</h3>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr>
                          {results.summary[0].map((h, i) => (
                            <th key={i} style={thStyle}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {results.summary.slice(1).map((row, i) => (
                          <tr key={i}>
                            {row.map((cell, j) => (
                              <td key={j} style={tdStyle}>{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Students Table */}
            <div style={{ 
              background: "rgba(255,255,255,0.03)", 
              padding: 32, 
              borderRadius: 24, 
              border: "1px solid rgba(255,255,255,0.08)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 8, flexWrap: "wrap", gap: 16 }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Matokeo ya Wanafunzi</h3>
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
                    Bofya mstari wa mwanafunzi kuona matokeo yake kwa kina.
                  </p>
                </div>
                <div data-html2canvas-ignore="true" style={{ width: "100%", maxWidth: 400 }}>
                  <label style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 8, display: "block", fontWeight: 700 }}>ANGALIA MATOKEO YAKO</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <div style={{ position: "relative", flex: 1 }}>
                      <Search size={18} style={{ position: "absolute", left: 12, top: 12, color: "rgba(255,255,255,0.3)" }} />
                      <input 
                        type="text" 
                        placeholder="Mfano: S0155/0001" 
                        value={studentFilter}
                        onChange={(e) => setStudentFilter(e.target.value)}
                        style={{ ...inputStyle, paddingLeft: 40, height: 42 }}
                      />
                    </div>
                    <button 
                      onClick={() => {
                        const found = filteredStudents.find(s => s.indexNumber.toLowerCase() === studentFilter.toLowerCase());
                        if (found) setSelectedStudent(found);
                      }}
                      style={{ ...actionButtonStyle, height: 42, background: G, color: "#000", border: "none" }}
                    >
                      Angalia Matokeo
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ overflowX: "auto", marginTop: 24 }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>NAMBA YA USAJILI</th>
                      <th style={thStyle}>JINSIA</th>
                      <th style={thStyle}>ALAMA</th>
                      <th style={thStyle}>DARAJA</th>
                      <th style={thStyle} className="desktop-only">MASOMO NA MADARAJA</th>
                      <th style={thStyle}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((s, i) => (
                      <tr 
                        key={i} 
                        onClick={() => setSelectedStudent(s)}
                        style={{ cursor: "pointer" }}
                        className="hover:bg-white/5 transition-colors"
                      >
                        <td style={{ ...tdStyle, fontWeight: 700, color: G }}>{s.indexNumber}</td>
                        <td style={tdStyle}>{s.sex}</td>
                        <td style={tdStyle}>{s.points}</td>
                        <td style={tdStyle}>
                          <span style={{ 
                            padding: "4px 10px", 
                            borderRadius: 6, 
                            background: s.division === "I" ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.05)",
                            color: s.division === "I" ? "#4ade80" : "#fff",
                            fontWeight: 800,
                            whiteSpace: "nowrap"
                          }}>
                            {s.division}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, fontSize: 12, color: "rgba(255,255,255,0.5)" }} className="desktop-only">{s.subjects}</td>
                        <td style={{ ...tdStyle, textAlign: "right" }}>
                          <span style={{ fontSize: 12, color: G, fontWeight: 700, background: "rgba(245,166,35,0.1)", padding: "4px 10px", borderRadius: 12 }}>
                            Angalia
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mobile-hint" style={{ textAlign: "center", padding: "12px", fontSize: 12, color: "rgba(255,255,255,0.4)", display: "none" }}>
                  Bofya mwanafunzi kuona masomo yake
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </section>

      {/* Student Detail Modal */}
      <AnimatePresence>
        {selectedStudent && (
          <div style={{ 
            position: "fixed", 
            inset: 0, 
            zIndex: 1000, 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            padding: 20
          }}>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedStudent(null)}
              style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(10px)" }}
            />
              <motion.div
              id="student-result-card"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              ref={studentRef}
              style={{
                position: "relative",
                width: "100%",
                maxWidth: 500,
                background: "#0e101a",
                borderRadius: 32,
                border: "1px solid rgba(255,255,255,0.12)",
                padding: 40,
                boxShadow: "0 40px 100px rgba(0,0,0,0.8)"
              }}
            >
              <button 
                data-html2canvas-ignore="true"
                onClick={() => setSelectedStudent(null)}
                style={{ position: "absolute", top: 24, right: 24, background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}
              >
                <X size={24} />
              </button>

              <div style={{ textAlign: "center", marginBottom: 32 }}>
                <div style={{ 
                  width: 80, 
                  height: 80, 
                  borderRadius: 24, 
                  background: `linear-gradient(135deg, ${G}, ${G2})`,
                  display: "grid",
                  placeItems: "center",
                  margin: "0 auto 20px",
                  color: "#111"
                }}>
                  <User size={40} />
                </div>
                <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 24, fontWeight: 900 }}>
                  {selectedStudent.indexNumber}
                </h2>
                <p style={{ color: "rgba(255,255,255,0.5)" }}>{results.schoolName}</p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
                <div style={statCardStyle}>
                  <span style={statLabelStyle}>JINSIA</span>
                  <span style={statValueStyle}>{selectedStudent.sex}</span>
                </div>
                <div style={statCardStyle}>
                  <span style={statLabelStyle}>DARAJA (DIV)</span>
                  <span style={{ ...statValueStyle, color: G }}>{selectedStudent.division}</span>
                </div>
                <div style={statCardStyle}>
                  <span style={statLabelStyle}>ALAMA (POINTS)</span>
                  <span style={statValueStyle}>{selectedStudent.points}</span>
                </div>
                <div style={statCardStyle}>
                  <span style={statLabelStyle}>MWAKA</span>
                  <span style={statValueStyle}>{year}</span>
                </div>
              </div>

              <div style={{ marginBottom: 32 }}>
                <h4 style={{ fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.4)", marginBottom: 12, letterSpacing: "0.1em" }}>MASOMO NA MADARAJA</h4>
                <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 16, padding: 16 }}>
                  {formatSubjects(selectedStudent.subjects)}
                </div>
              </div>

              <div data-html2canvas-ignore="true" style={{ display: "flex", gap: 12 }}>
                <button 
                  onClick={() => exportToPDF("student")}
                  style={{ ...actionButtonStyle, flex: 1 }}
                >
                  <Download size={18} /> Download PDF Result
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* NECTA Redirect Popup */}
      <AnimatePresence>
        {showNectaPopup && (
          <div style={{ 
            position: "fixed", 
            inset: 0, 
            zIndex: 1000, 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            padding: 20
          }}>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNectaPopup(false)}
              style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(10px)" }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              style={{
                position: "relative",
                width: "100%",
                maxWidth: 400,
                background: "#0e101a",
                borderRadius: 24,
                border: "1px solid rgba(255,255,255,0.12)",
                padding: 32,
                boxShadow: "0 40px 100px rgba(0,0,0,0.8)",
                textAlign: "center"
              }}
            >
              <div style={{ marginBottom: 24 }}>
                <ExternalLink size={48} color={G} style={{ margin: "0 auto 16px" }} />
                <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Unaelekea NECTA</h3>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, lineHeight: 1.6 }}>
                  Utafungua ukurasa rasmi wa matokeo kutoka Baraza la Mitihani la Taifa (NECTA).
                </p>
                <div style={{ 
                  background: "rgba(255,255,255,0.05)", 
                  padding: "12px", 
                  borderRadius: 8, 
                  marginTop: 16, 
                  fontSize: 12, 
                  color: "rgba(255,255,255,0.4)",
                  wordBreak: "break-all"
                }}>
                  {nectaUrl}
                </div>
              </div>
              <div style={{ display: "grid", gap: 12 }}>
                <a 
                  href={nectaUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setShowNectaPopup(false)}
                  style={{ 
                    ...actionButtonStyle, 
                    background: G, 
                    color: "#000", 
                    justifyContent: "center",
                    textDecoration: "none"
                  }}
                >
                  Endelea kwenda NECTA
                </a>
                <button 
                  onClick={() => setShowNectaPopup(false)}
                  style={{ 
                    ...actionButtonStyle, 
                    justifyContent: "center",
                    background: "transparent"
                  }}
                >
                  Baki STEA
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 768px) {
          .desktop-only { display: none !important; }
          .mobile-grid { grid-template-columns: 1fr !important; }
          .search-span { grid-column: 1 / -1 !important; }
          .mobile-hint { display: block !important; }
        }
        @media (min-width: 769px) {
          .search-span { grid-column: span 2; }
        }
      `}</style>
    </div>
  );
}

const selectStyle = {
  width: "100%",
  height: 52,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.05)",
  color: "#fff",
  padding: "0 16px",
  outline: "none",
  fontSize: 14,
  fontFamily: "inherit",
  appearance: "none",
  cursor: "pointer"
};

const inputStyle = {
  width: "100%",
  height: 52,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.05)",
  color: "#fff",
  padding: "0 16px",
  outline: "none",
  fontSize: 14,
  fontFamily: "inherit"
};

const actionButtonStyle = {
  padding: "10px 20px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.05)",
  color: "#fff",
  fontSize: 14,
  fontWeight: 700,
  display: "flex",
  alignItems: "center",
  gap: 8,
  cursor: "pointer",
  transition: "all 0.2s"
};

const thStyle = {
  textAlign: "left",
  padding: "12px 16px",
  fontSize: 12,
  color: "rgba(255,255,255,0.4)",
  fontWeight: 800,
  borderBottom: "1px solid rgba(255,255,255,0.08)"
};

const tdStyle = {
  padding: "16px",
  fontSize: 14,
  borderBottom: "1px solid rgba(255,255,255,0.05)"
};

const statCardStyle = {
  background: "rgba(255,255,255,0.03)",
  padding: 16,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.06)",
  display: "flex",
  flexDirection: "column",
  gap: 4
};

const statLabelStyle = {
  fontSize: 10,
  fontWeight: 800,
  color: "rgba(255,255,255,0.4)",
  letterSpacing: "0.05em"
};

const statValueStyle = {
  fontSize: 18,
  fontWeight: 900
};
