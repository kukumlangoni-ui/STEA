import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, LayoutGrid, Star, Search, FileText, ChevronRight, ArrowRight } from 'lucide-react';
import { getFirebaseDb } from '../firebase';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';

const G = "#f5a623";

export default function ExamsHubPage() {
  const navigate = useNavigate();
  const [featured, setFeatured] = useState([]);
  const [searchQ, setSearchQ] = useState("");
  const db = getFirebaseDb();

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const q = query(collection(db, 'study_resources'), where('featured', '==', true), limit(4));
        const snap = await getDocs(q);
        setFeatured(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error(err);
      }
    };
    fetchFeatured();
  }, [db]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQ.trim()) {
      navigate(`/exams/past-papers?q=${encodeURIComponent(searchQ)}`);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0b0f", color: "#fff", paddingBottom: 80 }}>
      {/* Hero Section */}
      <section style={{ 
        padding: "80px 20px 60px", 
        textAlign: "center",
        background: "radial-gradient(circle at top, rgba(245,166,35,0.1) 0%, transparent 50%)"
      }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", background: "rgba(245,166,35,0.1)", borderRadius: 20, color: G, fontSize: 14, fontWeight: 700, marginBottom: 24 }}>
            <BookOpen size={16} /> STEA Exam Hub
          </div>
          <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: "clamp(32px, 5vw, 56px)", fontWeight: 900, lineHeight: 1.1, marginBottom: 24 }}>
            Kila Kitu Unachohitaji <br/>
            <span style={{ color: G }}>Kufaulu Mitihani Yako</span>
          </h1>
          <p style={{ fontSize: "clamp(16px, 2vw, 20px)", color: "rgba(255,255,255,0.6)", lineHeight: 1.6, marginBottom: 40, maxWidth: 600, margin: "0 auto 40px" }}>
            Matokeo, past papers, notes na practice tests — vyote sehemu moja ndani ya STEA.
          </p>
          
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/exams/results" style={{ 
              background: G, color: "#000", padding: "16px 32px", borderRadius: 16, fontWeight: 800, fontSize: 16, textDecoration: "none", display: "flex", alignItems: "center", gap: 8 
            }}>
              Angalia Matokeo <ArrowRight size={18} />
            </Link>
            <Link to="/exams/past-papers" style={{ 
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "16px 32px", borderRadius: 16, fontWeight: 800, fontSize: 16, textDecoration: "none", display: "flex", alignItems: "center", gap: 8 
            }}>
              Fungua Past Papers
            </Link>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section style={{ maxWidth: 800, margin: "0 auto -30px", padding: "0 20px", position: "relative", zIndex: 10 }}>
        <form onSubmit={handleSearch} style={{ 
          background: "#11131a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24, padding: "8px 8px 8px 24px", display: "flex", alignItems: "center", boxShadow: "0 20px 40px rgba(0,0,0,0.5)" 
        }}>
          <Search size={24} color="rgba(255,255,255,0.4)" />
          <input 
            type="text" 
            placeholder="Tafuta mfano: biology form 4 2022, notes za chemistry..." 
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            style={{ flex: 1, background: "transparent", border: "none", color: "#fff", fontSize: 16, padding: "16px", outline: "none" }}
          />
          <button type="submit" style={{ background: G, color: "#000", border: "none", padding: "16px 24px", borderRadius: 16, fontWeight: 800, cursor: "pointer" }}>
            Tafuta
          </button>
        </form>
      </section>

      {/* Main Categories */}
      <section style={{ maxWidth: 1200, margin: "80px auto 0", padding: "0 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 20 }}>
          <CategoryCard 
            to="/exams/results"
            icon={<LayoutGrid size={32} />}
            title="NECTA Results"
            desc="Matokeo yote ya taifa"
            color="#4ade80"
          />
          <CategoryCard 
            to="/exams/past-papers"
            icon={<FileText size={32} />}
            title="Past Papers"
            desc="Mitihani iliyopita na majibu"
            color="#60a5fa"
          />
          <CategoryCard 
            to="/exams/notes"
            icon={<BookOpen size={32} />}
            title="Study Notes"
            desc="Notes za masomo yote"
            color="#facc15"
          />
          <CategoryCard 
            to="/exams/practice"
            icon={<Star size={32} />}
            title="Practice & Quiz"
            desc="Jipime uwezo wako"
            color="#f472b6"
          />
          <CategoryCard 
            to="/courses"
            icon={<BookOpen size={32} />}
            title="Online Courses"
            desc="Kozi za skills za kisasa"
            color="#3b82f6"
          />
          <CategoryCard 
            to="/university-guide"
            icon={<BookOpen size={32} />}
            title="University Guide"
            desc="Mwongozo wa kujiunga chuo"
            color="#a855f7"
          />
        </div>
      </section>

      {/* Featured Resources */}
      {featured.length > 0 && (
        <section style={{ maxWidth: 1200, margin: "80px auto 0", padding: "0 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
            <div>
              <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Featured Resources</h2>
              <p style={{ color: "rgba(255,255,255,0.5)" }}>Nyenzo muhimu zilizopendekezwa</p>
            </div>
            <Link to="/exams/past-papers" style={{ color: G, textDecoration: "none", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
              Ona Zote <ChevronRight size={16} />
            </Link>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
            {featured.map(item => (
              <ResourceCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}
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
        <h3 style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 4 }}>{title}</h3>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>{desc}</p>
      </div>
    </Link>
  );
}

export function ResourceCard({ item }) {
  return (
    <div style={{ 
      background: "rgba(255,255,255,0.02)", 
      border: "1px solid rgba(255,255,255,0.05)", 
      borderRadius: 20, 
      overflow: "hidden",
      display: "flex",
      flexDirection: "column"
    }}>
      {item.imageUrl || item.imageExternalUrl ? (
        <div style={{ width: "100%", height: 160, background: "rgba(255,255,255,0.05)", backgroundImage: `url(${item.imageUrl || item.imageExternalUrl})`, backgroundSize: "cover", backgroundPosition: "center" }} />
      ) : (
        <div style={{ width: "100%", height: 160, background: "linear-gradient(135deg, rgba(245,166,35,0.1), rgba(245,212,130,0.1))", display: "flex", alignItems: "center", justifyContent: "center", color: G }}>
          {item.type === 'past_paper' ? <FileText size={48} opacity={0.5} /> : <BookOpen size={48} opacity={0.5} />}
        </div>
      )}
      <div style={{ padding: 20, flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          <span style={{ padding: "4px 8px", background: "rgba(255,255,255,0.1)", borderRadius: 6, fontSize: 11, fontWeight: 700, color: "#fff" }}>{item.level}</span>
          <span style={{ padding: "4px 8px", background: "rgba(245,166,35,0.1)", borderRadius: 6, fontSize: 11, fontWeight: 700, color: G }}>{item.subject}</span>
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 8, lineHeight: 1.4 }}>{item.title}</h3>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 20, flex: 1 }}>{item.description?.substring(0, 80)}...</p>
        
        <div style={{ display: "flex", gap: 12 }}>
          {(item.fileUrl || item.externalLink) && (
            <a href={item.fileUrl || item.externalLink} target="_blank" rel="noreferrer" style={{ 
              flex: 1, textAlign: "center", background: "rgba(255,255,255,0.1)", color: "#fff", padding: "10px", borderRadius: 12, fontSize: 13, fontWeight: 700, textDecoration: "none" 
            }}>
              Fungua
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
