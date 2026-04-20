import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart2, FileText, BookOpen, Zap, GraduationCap, CreditCard,
  Globe, Bell, Bot, ChevronRight, ArrowRight, Search
} from 'lucide-react';

const G = '#F5A623';
const G2 = '#FFD17C';

const W = ({ children }) => (
  <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 clamp(16px,4vw,40px)' }}>
    {children}
  </div>
);

// ── 9 Main Sections ─────────────────────────────────
const SECTIONS = [
  {
    id: 'necta-results',
    path: '/exams/results',
    icon: <BarChart2 size={28} />,
    color: '#4ade80',
    title: 'NECTA Results',
    desc: 'Tafuta matokeo ya Form 2, Form 4 na Form 6. Chuja kwa shule, mwaka na aina ya mtihani.',
    badge: 'Official',
    subItems: ['Form 2 Results', 'Form 4 Results', 'Form 6 Results', 'Chuja kwa Shule / Mwaka'],
  },
  {
    id: 'past-papers',
    path: '/exams/past-papers',
    icon: <FileText size={28} />,
    color: '#60a5fa',
    title: 'Past Papers',
    desc: 'Karatasi za mitihani ya miaka iliyopita, marking schemes na maswali ya kujisomea.',
    badge: 'Exam Prep',
    subItems: ['Papers by Class', 'Papers by Subject', 'Marking Schemes', 'Filter by Year'],
  },
  {
    id: 'study-notes',
    path: '/exams/notes',
    icon: <BookOpen size={28} />,
    color: '#facc15',
    title: 'Study Notes',
    desc: 'Notes za masomo yote, muhtasari wa mada na maelezo ya kina kwa ajili ya revision.',
    badge: 'Study',
    subItems: ['Notes by Subject', 'Notes by Class', 'Revision Notes', 'Topic Summaries'],
  },
  {
    id: 'practice',
    path: '/exams/practice',
    icon: <Zap size={28} />,
    color: '#f472b6',
    title: 'Practice & Quizzes',
    desc: 'Quiz library, quiz ya leo, challenge ya wiki, leaderboard na historia ya majaribio yako.',
    badge: 'Interactive',
    subItems: ['Quiz Library', 'Quiz ya Leo', 'Challenge ya Wiki', 'Leaderboard', 'Recent Attempts'],
  },
  {
    id: 'university-guide',
    path: '/exams/university-guide',
    icon: <GraduationCap size={28} />,
    color: '#a855f7',
    title: 'University Guide Tanzania',
    desc: 'Mwongozo kamili wa chuo Tanzania — calculator ya pointi, kuchagua kozi, namna ya kuomba na maisha chuoni.',
    badge: 'Local Uni',
    subItems: ['Form 6 Points Calculator', 'Find Best Courses', 'University Info Hub', 'How to Apply', 'Admission Requirements', 'Diploma to Degree'],
  },
  {
    id: 'scholarships-tz',
    path: '/exams/scholarships',
    icon: <CreditCard size={28} />,
    color: '#10b981',
    title: 'Scholarships Tanzania',
    desc: 'HESLB, TCU scholarships na ufadhili wa ndani Tanzania. Hati zinazohitajika na tarehe za maombi.',
    badge: 'Funding TZ',
    subItems: ['HESLB Guide', 'TCU Scholarships', 'Local/Private Scholarships', 'Required Documents', 'Deadlines & Eligibility'],
  },
  {
    id: 'study-abroad',
    path: '/exams/abroad',
    icon: <Globe size={28} />,
    color: '#38bdf8',
    title: 'Study Abroad Global',
    desc: 'Scholarship za kimataifa, masharti ya kuomba, mataifa maarufu, IELTS/TOEFL na wawakilishi wa kuaminika.',
    badge: 'Global',
    subItems: ['Global Scholarships', 'Government Scholarships', 'Requirements', 'Application Steps', 'Countries Guide', 'IELTS / TOEFL / Passport Basics', 'Trusted Agents & Organizations'],
  },
  {
    id: 'student-updates',
    path: '/exams/updates',
    icon: <Bell size={28} />,
    color: '#fb923c',
    title: 'Student Updates',
    desc: 'Habari za HESLB, TCU, maombi ya chuo, tarehe za mwisho na matangazo muhimu ya wanafunzi.',
    badge: 'News',
    subItems: ['HESLB Updates', 'TCU Updates', 'Admission Updates', 'Deadlines', 'Important Student Notices'],
  },
  {
    id: 'stea-assistant',
    path: '/exams/assistant',
    icon: <Bot size={28} />,
    color: G,
    title: 'STEA Assistant',
    desc: 'Uliza AI yoyote swali kuhusu elimu, kozi, vyuo au scholarship. Msaada wa haraka na mwongozo stadi.',
    badge: 'AI Help',
    subItems: ['Ask AI', 'Suggested Student Questions', 'Smart Guidance to Other Sections'],
  },
];

// ── Workflow quick-find ──────────────────────────────
const WORKFLOW = [
  { q: 'Nataka matokeo', a: 'NECTA Results', path: '/exams/results', color: '#4ade80' },
  { q: 'Nataka past papers', a: 'Past Papers', path: '/exams/past-papers', color: '#60a5fa' },
  { q: 'Nataka notes za kusoma', a: 'Study Notes', path: '/exams/notes', color: '#facc15' },
  { q: 'Nataka kujifanya mazoezi', a: 'Practice & Quizzes', path: '/exams/practice', color: '#f472b6' },
  { q: 'Nataka chuo Tanzania', a: 'University Guide TZ', path: '/exams/university-guide', color: '#a855f7' },
  { q: 'Nataka mkopo au ufadhili wa ndani', a: 'Scholarships Tanzania', path: '/exams/scholarships', color: '#10b981' },
  { q: 'Nataka kusoma nje ya nchi', a: 'Study Abroad Global', path: '/exams/abroad', color: '#38bdf8' },
  { q: 'Nataka habari za wanafunzi', a: 'Student Updates', path: '/exams/updates', color: '#fb923c' },
  { q: 'Ninachanganyikiwa / nahitaji msaada', a: 'STEA Assistant', path: '/exams/assistant', color: G },
];

// ── SectionCard ─────────────────────────────────────
function SectionCard({ section, index }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.04, duration: 0.45 }}
      onClick={() => navigate(section.path)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
        border: hovered ? `1px solid ${section.color}45` : '1px solid rgba(255,255,255,0.08)',
        borderRadius: 24,
        padding: '24px 22px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 210,
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.26s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: hovered
          ? `0 20px 50px rgba(0,0,0,0.4), 0 0 0 1px ${section.color}20`
          : '0 4px 20px rgba(0,0,0,0.2)',
      }}
    >
      {/* Glow orb */}
      <div style={{
        position: 'absolute', top: -20, right: -20, width: 130, height: 130,
        borderRadius: '50%',
        background: `radial-gradient(circle,${section.color}15,transparent 70%)`,
        filter: 'blur(24px)', pointerEvents: 'none',
        opacity: hovered ? 1 : 0.4, transition: 'opacity 0.3s',
      }} />

      {/* Badge */}
      <div style={{
        position: 'absolute', top: 16, right: 16,
        padding: '3px 10px', borderRadius: 999,
        background: `${section.color}16`, color: section.color,
        fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.07em',
        border: `1px solid ${section.color}28`,
      }}>
        {section.badge}
      </div>

      {/* Icon */}
      <div style={{
        width: 58, height: 58, borderRadius: 18,
        background: `${section.color}14`,
        border: `1px solid ${section.color}22`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: section.color, marginBottom: 18, flexShrink: 0,
        transition: 'all 0.22s',
        transform: hovered ? 'scale(1.1)' : 'scale(1)',
        boxShadow: hovered ? `0 8px 20px ${section.color}25` : 'none',
      }}>
        {section.icon}
      </div>

      {/* Title */}
      <h3 style={{
        fontFamily: "'Bricolage Grotesque', sans-serif",
        fontSize: 19, fontWeight: 900, letterSpacing: '-.025em',
        color: '#fff', marginBottom: 8, lineHeight: 1.2,
      }}>
        {section.title}
      </h3>

      {/* Description */}
      <p style={{
        color: 'rgba(255,255,255,0.5)', fontSize: 13.5, lineHeight: 1.62,
        marginBottom: 18, flex: 1,
      }}>
        {section.desc}
      </p>

      {/* Sub-item chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 18 }}>
        {section.subItems.slice(0, 3).map((sub, i) => (
          <span key={i} style={{
            fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
            background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.45)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>{sub}</span>
        ))}
        {section.subItems.length > 3 && (
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
            background: `${section.color}12`, color: section.color,
            border: `1px solid ${section.color}20`,
          }}>+{section.subItems.length - 3} zaidi</span>
        )}
      </div>

      {/* CTA arrow */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        color: section.color, fontWeight: 800, fontSize: 13,
      }}>
        Ingia <ChevronRight size={15} style={{ transition: 'transform 0.2s', transform: hovered ? 'translateX(5px)' : '' }} />
      </div>
    </motion.div>
  );
}

// ── WorkflowRow ─────────────────────────────────────
function WorkflowRow({ item, index }) {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, x: -14 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.045 }}
      onClick={() => navigate(item.path)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 16, padding: '13px 20px', borderRadius: 14,
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
        cursor: 'pointer', transition: 'all 0.18s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = `${item.color}30`; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.45)', fontWeight: 600, minWidth: 190 }}>{item.q}</span>
        <ArrowRight size={13} color='rgba(255,255,255,0.2)' style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 14, fontWeight: 900, color: item.color }}>{item.a}</span>
      </div>
      <ChevronRight size={14} color='rgba(255,255,255,0.2)' style={{ flexShrink: 0 }} />
    </motion.div>
  );
}

// ── Main Component ───────────────────────────────────
export default function ExamsHubPage() {
  const navigate = useNavigate();
  const [searchQ, setSearchQ] = useState('');

  const filtered = searchQ.trim()
    ? SECTIONS.filter(s =>
        s.title.toLowerCase().includes(searchQ.toLowerCase()) ||
        s.desc.toLowerCase().includes(searchQ.toLowerCase()) ||
        s.subItems.some(sub => sub.toLowerCase().includes(searchQ.toLowerCase()))
      )
    : SECTIONS;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0b0f', color: '#fff', paddingBottom: 100, overflowX: 'hidden' }}>

      {/* ── HERO ─────────────────────────────────── */}
      <section style={{
        padding: 'clamp(72px,10vw,120px) 20px 56px',
        textAlign: 'center',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(245,166,35,0.09) 0%, transparent 55%)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <W>
          <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
            {/* Tag */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '7px 18px', background: 'rgba(245,166,35,0.1)',
              border: '1px solid rgba(245,166,35,0.22)',
              borderRadius: 999, color: G, fontSize: 12, fontWeight: 900,
              marginBottom: 22, textTransform: 'uppercase', letterSpacing: '0.1em',
            }}>
              🎓 STEA Student Center
            </div>

            <h1 style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontSize: 'clamp(30px, 6vw, 58px)',
              fontWeight: 900, lineHeight: 1.08, letterSpacing: '-.04em',
              marginBottom: 18,
            }}>
              Kila kitu unachohitaji{' '}
              <span style={{ color: G }}>kufanikiwa kimasomo</span>
            </h1>

            <p style={{
              fontSize: 'clamp(14px, 2vw, 18px)',
              color: 'rgba(255,255,255,0.52)', lineHeight: 1.7,
              maxWidth: 560, margin: '0 auto 36px',
            }}>
              Matokeo ya NECTA, past papers, notes, mazoezi, mwongozo wa vyuo, scholarship, habari na msaada wa AI — yote sehemu moja.
            </p>

            {/* Search bar */}
            <div style={{
              maxWidth: 540, margin: '0 auto',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 18, padding: '8px 8px 8px 20px',
              display: 'flex', alignItems: 'center', gap: 12,
              boxShadow: '0 16px 50px rgba(0,0,0,0.35)',
            }}>
              <Search size={18} color='rgba(255,255,255,0.35)' style={{ flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Tafuta sehemu... (necta, notes, scholarship, abroad...)"
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                style={{
                  flex: 1, background: 'transparent', border: 'none',
                  color: '#fff', fontSize: 14, outline: 'none', padding: '10px 0',
                }}
              />
              {searchQ && (
                <button onClick={() => setSearchQ('')} style={{
                  background: 'rgba(255,255,255,0.08)', border: 'none',
                  color: 'rgba(255,255,255,0.5)', borderRadius: 10,
                  padding: '6px 12px', cursor: 'pointer', fontSize: 11, fontWeight: 800, flexShrink: 0,
                }}>
                  ✕
                </button>
              )}
            </div>
          </motion.div>
        </W>
      </section>

      {/* ── 9-SECTION GRID ──────────────────────── */}
      <section style={{ padding: 'clamp(40px,6vw,72px) 0 0' }}>
        <W>
          {/* Header row */}
          <div style={{
            display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
            marginBottom: 28, flexWrap: 'wrap', gap: 12,
          }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>
                {searchQ ? `Matokeo ${filtered.length} ya "${searchQ}"` : `${SECTIONS.length} Sehemu za Student Center`}
              </div>
              <h2 style={{
                fontFamily: "'Bricolage Grotesque', sans-serif",
                fontSize: 'clamp(20px, 2.8vw, 28px)', fontWeight: 900, letterSpacing: '-.03em', margin: 0,
              }}>
                {searchQ
                  ? 'Matokeo ya Utafutaji'
                  : <>Chagua <span style={{ color: G }}>Sehemu Yako</span></>}
              </h2>
            </div>
            {!searchQ && (
              <span style={{
                fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: 700,
                background: 'rgba(255,255,255,0.04)', padding: '7px 14px',
                borderRadius: 999, border: '1px solid rgba(255,255,255,0.07)',
              }}>
                Bonyeza kadi kuingia
              </span>
            )}
          </div>

          {/* Cards grid */}
          {filtered.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
              gap: 18,
              marginBottom: 80,
            }}>
              {filtered.map((section, i) => (
                <SectionCard key={section.id} section={section} index={i} />
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center', padding: '60px 20px',
              background: 'rgba(255,255,255,0.02)', borderRadius: 20,
              border: '1px solid rgba(255,255,255,0.05)', marginBottom: 80,
            }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
              <h3 style={{ fontWeight: 800, marginBottom: 8 }}>Hakuna sehemu inayolingana</h3>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14 }}>
                Jaribu maneno mengine au{' '}
                <button onClick={() => setSearchQ('')} style={{ background: 'none', border: 'none', color: G, fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                  angalia zote
                </button>
              </p>
            </div>
          )}
        </W>
      </section>

      {/* ── WORKFLOW GUIDE ───────────────────────── */}
      <section style={{
        padding: 'clamp(48px,6vw,72px) 0',
        background: 'rgba(245,166,35,0.025)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <W>
          <div style={{ marginBottom: 32, textAlign: 'center' }}>
            <div style={{
              display: 'inline-block', fontSize: 10, fontWeight: 900,
              textTransform: 'uppercase', letterSpacing: '0.12em',
              color: G, marginBottom: 10,
              padding: '5px 14px', borderRadius: 999,
              background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.2)',
            }}>
              Mwongozo wa Haraka
            </div>
            <h2 style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontSize: 'clamp(20px, 2.8vw, 28px)', fontWeight: 900, letterSpacing: '-.03em',
              margin: '0 0 8px',
            }}>
              Unataka nini? <span style={{ color: G }}>Nenda moja kwa moja.</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13.5 }}>
              Jibu swali la kwanza kuona sehemu inayokufaa.
            </p>
          </div>

          <div style={{ maxWidth: 740, margin: '0 auto', display: 'grid', gap: 9 }}>
            {WORKFLOW.map((item, i) => (
              <WorkflowRow key={i} item={item} index={i} />
            ))}
          </div>
        </W>
      </section>

      {/* ── ASSISTANT CTA ────────────────────────── */}
      <section style={{ padding: 'clamp(48px,6vw,72px) 0' }}>
        <W>
          <div style={{
            textAlign: 'center',
            padding: 'clamp(36px,5vw,60px) clamp(24px,4vw,60px)',
            borderRadius: 32,
            background: `linear-gradient(135deg, ${G}10, rgba(255,255,255,0.02))`,
            border: `1px solid ${G}25`,
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Bg glow */}
            <div style={{ position: 'absolute', top: -80, right: -80, width: 280, height: 280, background: G, filter: 'blur(120px)', opacity: 0.07, pointerEvents: 'none', borderRadius: '50%' }} />

            <div style={{
              width: 64, height: 64, borderRadius: 20,
              background: `${G}15`, border: `1px solid ${G}25`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: G, margin: '0 auto 20px', fontSize: 28,
            }}>
              <Bot size={28} />
            </div>

            <h2 style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontSize: 'clamp(20px, 2.8vw, 28px)', fontWeight: 900, letterSpacing: '-.02em',
              margin: '0 0 10px',
            }}>
              Unachanganyikiwa? <span style={{ color: G }}>STEA Assistant yuko hapa.</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, maxWidth: 480, margin: '0 auto 28px', lineHeight: 1.65 }}>
              Uliza swali lolote kuhusu matokeo, scholarship, au jinsi ya kuomba chuo — AI itakujibu haraka.
            </p>
            <button
              onClick={() => navigate('/exams/assistant')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                background: `linear-gradient(135deg, ${G}, ${G2})`,
                color: '#111', padding: '14px 32px', borderRadius: 16,
                fontWeight: 900, fontSize: 15, border: 'none', cursor: 'pointer',
                boxShadow: `0 8px 24px ${G}35`, transition: 'all 0.22s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 14px 32px ${G}45`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `0 8px 24px ${G}35`; }}
            >
              <Bot size={18} /> Uliza STEA Assistant
            </button>
          </div>
        </W>
      </section>
    </div>
  );
}

// ── ResourceCard (used by sub-pages) ────────────────
export function ResourceCard({ item, t }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: 20, overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>
      {item.imageUrl || item.imageExternalUrl ? (
        <div style={{ width: '100%', height: 160, background: 'rgba(255,255,255,0.05)', backgroundImage: `url(${item.imageUrl || item.imageExternalUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
      ) : (
        <div style={{ width: '100%', height: 160, background: 'linear-gradient(135deg, rgba(245,166,35,0.1), rgba(245,212,130,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F5A623' }}>
          <FileText size={48} opacity={0.5} />
        </div>
      )}
      <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          {item.level && <span style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.1)', borderRadius: 6, fontSize: 11, fontWeight: 700, color: '#fff' }}>{item.level}</span>}
          {item.subject && <span style={{ padding: '4px 8px', background: 'rgba(245,166,35,0.1)', borderRadius: 6, fontSize: 11, fontWeight: 700, color: '#F5A623' }}>{item.subject}</span>}
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 8, lineHeight: 1.4 }}>{item.title}</h3>
        {item.description && <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 20, flex: 1 }}>{item.description.substring(0, 80)}...</p>}
        <div style={{ display: 'flex', gap: 12 }}>
          {(item.fileUrl || item.externalLink) && (
            <a href={item.fileUrl || item.externalLink} target="_blank" rel="noreferrer" style={{
              flex: 1, textAlign: 'center', background: 'rgba(255,255,255,0.1)',
              color: '#fff', padding: '10px', borderRadius: 12,
              fontSize: 13, fontWeight: 700, textDecoration: 'none',
            }}>
              {t ? t('exams_action_open') : 'Fungua'}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
