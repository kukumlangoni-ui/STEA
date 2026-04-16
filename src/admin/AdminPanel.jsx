import { useState, useEffect, useRef } from "react";
import {
  getFirebaseDb, collection, addDoc, updateDoc, deleteDoc, setDoc,
  doc, serverTimestamp, query, limit, onSnapshot, orderBy, where,
  handleFirestoreError, OperationType, storage, ref, uploadBytes, getDownloadURL
} from "../firebase.js";
import { timeAgo } from "../hooks/useFirestore.js";
import VpnManager from "./VpnManager.jsx";
import MarketplaceManager from "./MarketplaceManager.jsx";
import ExamsHubManager from "./ExamsHubManager.jsx";

import { 
  Btn, Field, Input, Textarea, Select, Toast, ConfirmDialog, ImageUploadField, AdminThumb, StatCard, G, G2 
} from "./AdminUI.jsx";
import TechContentManager from "./managers/TechContentManager.jsx";
import DigitalToolsManager from "./managers/DigitalToolsManager.jsx";
import CoursesManager from "./managers/CoursesManager.jsx";
import WebsitesManager from "./managers/WebsitesManager.jsx";
import PromptsManager from "./managers/PromptsManager.jsx";
import SponsoredAdsManager from "./managers/SponsoredAdsManager.jsx";
import MessageTemplateManager from "./managers/MessageTemplateManager.jsx";
import UsersManager from "./managers/UsersManager.jsx";
import SiteContentManager from "./managers/SiteContentManager.jsx";
import CommerceManager from "./managers/CommerceManager.jsx";
import PaymentReviewManager from "./managers/PaymentReviewManager.jsx";
import SubscriptionManager from "./managers/SubscriptionManager.jsx";
import DeliveryManager from "./managers/DeliveryManager.jsx";
import FAQManager from "./managers/FAQManager.jsx";


// ── Admin Thumb ──────────────────────────────────────










// ══════════════════════════════════════════════════════
// SITE CONTENT MANAGER (About, Creator, Contact, Stats, FAQ)
// ══════════════════════════════════════════════════════




const SECTORS = [
  "courses", "marketplace", "tech_tips", "exams", "websites", 
  "sponsored_ads", "site_updates", "necta", "ai_lab", "gigs"
];

const ROLES = ["user", "creator", "seller", "manager", "reviewer", "super_admin"];

// ══════════════════════════════════════════════════════
// USERS MANAGER
// ══════════════════════════════════════════════════════




// ══════════════════════════════════════════════════════
// MAIN ADMIN PANEL
// ══════════════════════════════════════════════════════
export default function AdminPanel({ user, onBack }) {
  const [section, setSection] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [counts,  setCounts]  = useState({ tips:0, posts:0, updates:0, deals:0, courses:0, users:0, marketplace:0, websites:0, prompts:0, sponsored_ads:0, orders:0, subscriptions:0, payments:0, deliveries:0, message_templates:0, necta:0, exams:0, news:0, ai:0, gigs:0 });
  const [countErrors, setCountErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  const db = getFirebaseDb();

  const toast_ = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const seedSampleData = async () => {
    if (!window.confirm("Hii itaongeza data za mfano kwenye database yako. Unaendelea?")) return;
    setLoading(true);
    try {
      // Add a tip
      await addDoc(collection(db, "tips"), {
        title: "Jinsi ya Kutumia AI Kukuza Biashara Yako",
        content: "AI inaweza kukusaidia katika mambo mengi kama vile customer service, marketing, na data analysis. Kwa mfano, unaweza kutumia ChatGPT kuandika emails za mauzo au Midjourney kutengeneza picha za bidhaa zako.",
        category: "AI & Business",
        author: "STEA Team",
        views: 0,
        createdAt: serverTimestamp(),
        imageUrl: "https://picsum.photos/seed/ai/800/600"
      });
      // Add a NECTA result
      await addDoc(collection(db, "necta"), {
        title: "Matokeo ya Kidato cha Nne 2025",
        content: "NECTA imetangaza matokeo ya kidato cha nne. Unaweza kuyaangalia hapa kwa urahisi.",
        category: "Results",
        author: "STEA Team",
        views: 0,
        createdAt: serverTimestamp(),
        imageUrl: "https://picsum.photos/seed/necta/800/600"
      });
      // Add an Exam
      await addDoc(collection(db, "exams"), {
        title: "Mathematics Past Paper - Form 4",
        content: "Pakua past paper ya Mathematics kwa ajili ya maandalizi ya mtihani wa taifa.",
        category: "Mathematics",
        author: "STEA Team",
        views: 0,
        createdAt: serverTimestamp(),
        imageUrl: "https://picsum.photos/seed/math/800/600"
      });
      // Add a News item
      await addDoc(collection(db, "news"), {
        title: "Apple yazindua iPhone 17 nchini Tanzania",
        content: "Kampuni ya Apple imezindua rasmi iPhone 17 huku kukiwa na maboresho makubwa ya kamera na betri.",
        category: "Tech News",
        author: "STEA Team",
        views: 0,
        createdAt: serverTimestamp(),
        imageUrl: "https://picsum.photos/seed/iphone17/800/600"
      });
      // Add a Gig
      await addDoc(collection(db, "gigs"), {
        title: "Natafuta Web Developer wa React",
        content: "Natafuta developer mwenye uzoefu wa React kutengeneza website ya biashara. Bajeti ni 500k.",
        category: "Web Development",
        author: "STEA Team",
        views: 0,
        createdAt: serverTimestamp(),
        imageUrl: "https://picsum.photos/seed/gig/800/600"
      });
      // Add a prompt
      await addDoc(collection(db, "prompts"), {
        title: "Msaidizi wa Kuandika Barua za Kazi",
        prompt: "Nisaidie kuandika barua ya maombi ya kazi kwa nafasi ya Software Developer. Mimi nina uzoefu wa miaka miwili katika React na Node.js. Barua iwe ya kitaalamu na ya kuvutia.",
        category: "Career",
        views: 0,
        createdAt: serverTimestamp(),
        isFeatured: true
      });
      // Add a deal
      await addDoc(collection(db, "deals"), {
        title: "Samsung Galaxy S23 Ultra - 20% OFF",
        description: "Pata simu bora zaidi ya Samsung kwa bei nafuu leo! Ofa hii ni ya muda mfupi tu.",
        price: "2,500,000",
        originalPrice: "3,100,000",
        link: "https://example.com",
        createdAt: serverTimestamp(),
        isFeatured: true,
        imageUrl: "https://picsum.photos/seed/phone/800/600"
      });
      // Add a website
      await addDoc(collection(db, "websites"), {
        name: "Canva",
        url: "https://canva.com",
        description: "Chombo bora cha design kwa kila mtu. Unaweza kutengeneza posters, logos, na presentations kwa urahisi.",
        category: "Design",
        createdAt: serverTimestamp(),
        imageUrl: "https://picsum.photos/seed/design/800/600"
      });
      toast_("Data za mfano zimeongezwa!");
    } catch (err) {
      console.error(err);
      toast_("Imeshindwa kuongeza data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!db) return;
    const cols = ["tips", "posts", "updates", "deals", "courses", "users", "marketplace", "websites", "prompts", "sponsored_ads", "orders", "subscriptions", "payments", "deliveries", "message_templates", "necta", "exams", "news", "ai", "gigs"];
    const unsubs = cols.map(c => 
      onSnapshot(collection(db, c), (snap) => {
        setCounts(prev => ({ ...prev, [c]: snap.size }));
        setCountErrors(prev => ({ ...prev, [c]: null }));
      }, (err) => {
        console.error(`Error loading count for ${c}:`, err);
        setCountErrors(prev => ({ ...prev, [c]: err.message }));
      })
    );
    return () => unsubs.forEach(unsub => unsub());
  }, [db]);

  const SECTIONS = [
    { id:"overview", icon:"📊", label:"Overview" },
    { id:"posts",    icon:"📝", label:"All Posts" },
    { id:"updates",  icon:"🔔", label:"Site Updates" },
    { id:"marketplace", icon:"🛒", label:"Marketplace" },
    { id:"vpn",      icon:"🛡️", label:"VPN & Payments" },
    { id:"necta",    icon:"🎓", label:"NECTA" },
    { id:"examshub", icon:"📚", label:"Exams Hub" },
    { id:"exams",    icon:"📝", label:"Old Exams" },
    { id:"ai",       icon:"🤖", label:"AI Lab" },
    { id:"gigs",     icon:"💼", label:"Gigs" },
    { id:"ads",      icon:"📢", label:"Sponsored Ads" },
    { id:"commerce", icon:"💳", label:"Commerce" },
    { id:"payments", icon:"💰", label:"Payment Review" },
    { id:"subs",     icon:"🔄", label:"Subscriptions" },
    { id:"delivery", icon:"📦", label:"Delivery" },
    { id:"templates", icon:"✉️", label:"Templates" },
    { id:"tips",     icon:"💡", label:"Tech Tips" },
    { id:"prompts",  icon:"🤖", label:"Prompt Lab" },
    { id:"deals",    icon:"🏷️", label:"Digital Tools" },
    { id:"courses",  icon:"🎓", label:"Courses" },
    { id:"websites", icon:"🌐", label:"Websites" },
    { id:"content",  icon:"📝", label:"Site Content" },
    { id:"users",    icon:"👥", label:"Users / Team Management" },
  ];

  const sAllowed = (user, sectionId) => {
    if (user?.role === "super_admin" || user?.role === "admin") return true;
    if (sectionId === "overview") return true;
    if (user?.role === "manager") {
      return sectionId === user.sector || sectionId === "commerce" || sectionId === "delivery";
    }
    if (user?.role === "creator") {
      const contentSections = ["posts", "updates", "tips", "prompts", "deals", "courses", "websites", "necta", "exams", "ai", "gigs", "examshub", "news"];
      return contentSections.includes(sectionId);
    }
    if (user?.role === "seller") {
      return sectionId === "marketplace" || sectionId === "orders";
    }
    if (user?.role === "reviewer") {
      const reviewSections = ["posts", "updates", "necta", "exams", "examshub", "ai"];
      return reviewSections.includes(sectionId);
    }
    return false;
  };

  const filteredSections = SECTIONS.filter(s => sAllowed(user, s.id));

  return (
    <div className="admin-panel-container" style={{ minHeight:"100vh", display:"grid", gridTemplateColumns: "240px 1fr", background:"#0a0b0f" }}>
      <style>{`
        @media (max-width: 768px) {
          .admin-panel-container { grid-template-columns: 1fr !important; }
          .admin-sidebar { display: ${sidebarOpen ? 'flex' : 'none'} !important; position: fixed !important; z-index: 1000 !important; background: #0a0b0f !important; width: 100% !important; }
          .admin-main-content { padding: 16px !important; }
          .mobile-menu-btn { display: block !important; }
        }
        @media (min-width: 769px) {
          .mobile-menu-btn { display: none !important; }
        }
        @keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
      `}</style>

      {/* Sidebar */}
      <div className="admin-sidebar" style={{ borderRight:"1px solid rgba(255,255,255,.06)", padding:"24px 16px", position:"sticky", top:0, height:"100vh", overflowY:"auto" }}>
        <div style={{ marginBottom:28, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:20, fontWeight:800, marginBottom:4 }}>⚡ Admin Panel</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,.35)" }}>SwahiliTech Elite Academy</div>
          </div>
          <button className="mobile-menu-btn" onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 24, cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ display:"grid", gap:4 }}>
          {filteredSections.map(s=>(
            <button key={s.id} onClick={()=>{setSection(s.id); setSidebarOpen(false);}}
              style={{ border:"none", borderRadius:12, padding:"11px 14px", textAlign:"left", cursor:"pointer", fontWeight:700, fontSize:14,
                background:section===s.id?`linear-gradient(135deg,${G},${G2})`:"transparent",
                color:section===s.id?"#111":"rgba(255,255,255,.65)",
                display:"flex", alignItems:"center", gap:10, transition:"all .2s" }}>
              <span style={{ fontSize:18 }}>{s.icon}</span> {s.label}
            </button>
          ))}
        </div>

        <div style={{ marginTop:"auto", paddingTop:24 }}>
          <button onClick={onBack} style={{ border:"1px solid rgba(255,255,255,.08)", borderRadius:12, padding:"10px 14px", background:"transparent", color:"rgba(255,255,255,.5)", cursor:"pointer", fontWeight:700, fontSize:13, width:"100%", display:"flex", alignItems:"center", gap:8 }}>
            ← Rudi Website
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="admin-main-content" style={{ padding:"28px 32px", overflowY:"auto", minWidth: 0 }}>
        <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)} style={{ marginBottom: 20, padding: '10px 15px', background: G, border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>☰ Menu</button>

        {section==="overview" && <div>
            {toast && <Toast msg={toast.msg} type={toast.type}/>}
            <div style={{ marginBottom:28, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20 }}>
              <div>
                <h1 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:32, margin:"0 0 6px" }}>
                  Karibu, <span style={{ color:G }}>{user?.displayName||"Admin"}</span> 👋
                </h1>
                <p style={{ color:"rgba(255,255,255,.45)", fontSize:15, margin:0 }}>
                  Hapa unaweza kumanage content yote ya STEA — posts, updates, tools, courses na users.
                </p>
              </div>
              <Btn onClick={seedSampleData} disabled={loading} color="rgba(255,255,255,.05)" textColor="#fff" style={{ border: "1px solid rgba(255,255,255,.1)" }}>
                {loading ? "Inaongeza..." : "🌱 Ongeza Data za Mfano"}
              </Btn>
            </div>
            
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:16, marginBottom:32 }}>
              <StatCard icon="📝" label="Total Posts" value={counts.posts} error={countErrors.posts} color="#818cf8"/>
              <StatCard icon="🔔" label="Site Updates" value={counts.updates} error={countErrors.updates} color="#fbbf24"/>
              <StatCard icon="💡" label="Tech Tips" value={counts.tips} error={countErrors.tips}/>
              <StatCard icon="🤖" label="Prompts" value={counts.prompts} error={countErrors.prompts} color="#ff85cf"/>
              <StatCard icon="🏷️" label="Digital Tools" value={counts.deals} error={countErrors.deals} color="#a5b4fc"/>
              <StatCard icon="🎓" label="Courses" value={counts.courses} error={countErrors.courses} color="#67f0c1"/>
              <StatCard icon="🛒" label="Duka Products" value={counts.marketplace} error={countErrors.marketplace} color="#fbbf24"/>
              <StatCard icon="🌐" label="Websites" value={counts.websites} error={countErrors.websites} color="#818cf8"/>
              <StatCard icon="👥" label="Users" value={counts.users} error={countErrors.users} color="#ff85cf"/>
              <StatCard icon="🎓" label="NECTA" value={counts.necta} error={countErrors.necta} color="#67f0c1"/>
              <StatCard icon="📝" label="Exams" value={counts.exams} error={countErrors.exams} color="#a5b4fc"/>
              <StatCard icon="💼" label="Gigs" value={counts.gigs} error={countErrors.gigs} color="#818cf8"/>
              <StatCard icon="🤖" label="AI Lab" value={counts.ai} error={countErrors.ai} color="#ff85cf"/>
              <StatCard icon="📢" label="Sponsored Ads" value={counts.sponsored_ads} error={countErrors.sponsored_ads} color="#f5a623"/>
              <StatCard icon="💳" label="Orders" value={counts.orders} error={countErrors.orders} color="#67f0c1"/>
              <StatCard icon="🔄" label="Subscriptions" value={counts.subscriptions} error={countErrors.subscriptions} color="#a5b4fc"/>
              <StatCard icon="💰" label="Payments" value={counts.payments} error={countErrors.payments} color="#f5a623"/>
              <StatCard icon="📦" label="Deliveries" value={counts.deliveries} error={countErrors.deliveries} color="#67f0c1"/>
              <StatCard icon="✉️" label="Templates" value={counts.message_templates} error={countErrors.message_templates} color="#fbbf24"/>
            </div>
            
            {/* Quick guide */}
            <div style={{ borderRadius:20, border:"1px solid rgba(245,166,35,.2)", background:"rgba(245,166,35,.06)", padding:24 }}>
              <h3 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:20, margin:"0 0 16px", color:G }}>📋 Mwongozo wa Haraka</h3>
              <div style={{ display:"grid", gap:12 }}>
                {[
                  { step:"1", title:"Ongeza Tech Tips", desc:"Nenda Tech Tips → ongeza articles za kweli kwa Kiswahili + videos za YouTube/TikTok" },
                  { step:"2", title:"Update Tools na links za kweli", desc:"Nenda Digital Tools → badilisha URL za dummy na affiliate links zako za kweli" },
                  { step:"3", title:"Weka WhatsApp links kwa Courses", desc:"Nenda Courses → kila kozi iweke WhatsApp link ili watu wakuwasiliane nawe" },
                ].map(g=>(
                  <div key={g.step} style={{ display:"flex", gap:14, alignItems:"flex-start" }}>
                    <div style={{ width:28, height:28, borderRadius:8, background:`linear-gradient(135deg,${G},${G2})`, display:"grid", placeItems:"center", color:"#111", fontWeight:900, fontSize:13, flexShrink:0 }}>{g.step}</div>
                    <div>
                      <div style={{ fontWeight:800, fontSize:14, marginBottom:3 }}>{g.title}</div>
                      <div style={{ fontSize:13, color:"rgba(255,255,255,.5)", lineHeight:1.6 }}>{g.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
        </div>}

        {(sAllowed(user, "marketplace")) && section==="marketplace" && <><h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:28, margin:"0 0 24px" }}>🛒 <span style={{color:G}}>STEA Duka (Marketplace)</span></h2><MarketplaceManager user={user}/></>}
        {(sAllowed(user, "posts")) && section==="posts" && <><h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:28, margin:"0 0 24px" }}>📝 Manage <span style={{color:G}}>All Posts</span></h2><TechContentManager collectionName="posts" user={user} /></>}
        {(sAllowed(user, "updates")) && section==="updates" && <><h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:28, margin:"0 0 24px" }}>🔔 Manage <span style={{color:G}}>Site Updates</span></h2><TechContentManager collectionName="updates" user={user} /></>}
        {(sAllowed(user, "vpn")) && section==="vpn" && <><h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:28, margin:"0 0 24px" }}>🛡️ Manage <span style={{color:G}}>VPN & Payments</span></h2><VpnManager user={user}/></>}
        {(sAllowed(user, "examshub")) && section==="examshub" && <><h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:28, margin:"0 0 24px" }}>📚 Manage <span style={{color:G}}>Exams Hub</span></h2><ExamsHubManager user={user}/></>}
        {(sAllowed(user, "necta")) && section==="necta" && <><h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:28, margin:"0 0 24px" }}>🎓 Manage <span style={{color:G}}>NECTA Results</span></h2><TechContentManager collectionName="necta" user={user} /></>}
        {(sAllowed(user, "exams")) && section==="exams" && <><h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:28, margin:"0 0 24px" }}>📝 Manage <span style={{color:G}}>Old Exams</span></h2><TechContentManager collectionName="exams" user={user} /></>}
        {(sAllowed(user, "ai")) && section==="ai" && <><h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:28, margin:"0 0 24px" }}>🤖 Manage <span style={{color:G}}>AI Lab</span></h2><TechContentManager collectionName="ai" user={user} /></>}
        {(sAllowed(user, "gigs")) && section==="gigs" && <><h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:28, margin:"0 0 24px" }}>💼 Manage <span style={{color:G}}>Gigs & Jobs</span></h2><TechContentManager collectionName="gigs" user={user} /></>}
        {(sAllowed(user, "ads")) && section==="ads" && <><h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:28, margin:"0 0 24px" }}>📢 Manage <span style={{color:G}}>Sponsored Ads</span></h2><SponsoredAdsManager user={user}/></>}
        {(sAllowed(user, "commerce")) && section==="commerce" && <><h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:28, margin:"0 0 24px" }}>💳 Manage <span style={{color:G}}>Commerce</span></h2><CommerceManager user={user}/></>}
        {(sAllowed(user, "payments")) && section==="payments" && <><h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:28, margin:"0 0 24px" }}>💰 Manage <span style={{color:G}}>Payment Review</span></h2><PaymentReviewManager user={user}/></>}
        {(sAllowed(user, "subs")) && section==="subs" && <><h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:28, margin:"0 0 24px" }}>🔄 Manage <span style={{color:G}}>Subscriptions</span></h2><SubscriptionManager user={user}/></>}
        {(sAllowed(user, "delivery")) && section==="delivery" && <><h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:28, margin:"0 0 24px" }}>📦 Manage <span style={{color:G}}>Delivery</span></h2><DeliveryManager user={user}/></>}
        {(sAllowed(user, "templates")) && section==="templates" && <><h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:28, margin:"0 0 24px" }}>✉️ Manage <span style={{color:G}}>Templates</span></h2><MessageTemplateManager user={user}/></>}
        {(sAllowed(user, "tips")) && section==="tips" && <><h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:28, margin:"0 0 24px" }}>💡 Manage <span style={{color:G}}>Tech Tips</span></h2><TechContentManager collectionName="tips" user={user} /></>}
        {(sAllowed(user, "prompts")) && section==="prompts" && <><h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:28, margin:"0 0 24px" }}>🤖 Manage <span style={{color:G}}>Prompt Lab</span></h2><PromptsManager user={user}/></>}
        {(sAllowed(user, "deals")) && section==="deals" && <><h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:28, margin:"0 0 24px" }}>🏷️ Manage <span style={{color:G}}>Digital Tools</span></h2><DigitalToolsManager user={user}/></>}
        {(sAllowed(user, "courses")) && section==="courses" && <><h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:28, margin:"0 0 24px" }}>🎓 Manage <span style={{color:G}}>Courses</span></h2><CoursesManager user={user}/></>}
        {(sAllowed(user, "websites")) && section==="websites" && <><h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:28, margin:"0 0 24px" }}>🌐 Manage <span style={{color:G}}>Websites</span></h2><WebsitesManager user={user}/></>}
        {(sAllowed(user, "content")) && section==="content" && <><h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:28, margin:"0 0 24px" }}>📝 Manage <span style={{color:G}}>Site Content</span></h2><SiteContentManager user={user}/></>}
        {(sAllowed(user, "users")) && section==="users" && <><h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:28, margin:"0 0 24px" }}>👥 Manage <span style={{color:G}}>Users</span></h2><UsersManager user={user}/></>}

        {/* Access denied fallback */}
        {section !== "overview" && !sAllowed(user, section) && (
          <div style={{ padding: 40, textAlign: 'center', color: '#ff4444' }}>
            <h2>Access Denied</h2>
            <p>You do not have permission to view this section.</p>
          </div>
        )}

      </div>

      <style>{`@keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
    </div>
  );
}
