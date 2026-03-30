
import { useState, useEffect, useRef, useCallback } from "react";
import {
  getFirebaseDb, collection, addDoc, updateDoc, deleteDoc, setDoc,
  doc, serverTimestamp, query, limit, onSnapshot, orderBy
} from "../firebase.js";
import { timeAgo, handleFirestoreError, OperationType } from "../hooks/useFirestore.js";
import ImageEditor from './ImageEditor.jsx';

const G = "#F5A623", G2 = "#FFD17C";
const MAX_TEXT_LENGTH = 9500; // Safe limit for Firestore rules (10000)

const WEBSITE_CATEGORIES = ["Free Movie", "Streaming", "AI Tools", "Learning", "Jobs", "Design", "Business", "Download", "Gaming", "Live TV", "Sports", "Music"];

// ── Shared UI ─────────────────────────────────────────
const Btn = ({ children, onClick, color = G, textColor = "#111", disabled, style = {} }) => (
  <button onClick={onClick} disabled={disabled}
    style={{ border:"none", cursor:disabled?"not-allowed":"pointer", borderRadius:12,
      padding:"10px 18px", fontWeight:800, fontSize:13, color:textColor,
      background:color, opacity:disabled?.6:1, transition:"all .2s",
      display:"inline-flex", alignItems:"center", gap:8, ...style }}
    onMouseEnter={e=>{ if(!disabled) e.currentTarget.style.opacity=".85"; }}
    onMouseLeave={e=>{ e.currentTarget.style.opacity="1"; }}>
    {children}
  </button>
);

const Field = ({ label, children }) => (
  <div style={{ display:"grid", gap:6 }}>
    <label style={{ fontSize:12, fontWeight:800, color:"rgba(255,255,255,.5)", textTransform:"uppercase", letterSpacing:".06em" }}>{label}</label>
    {children}
  </div>
);

const Input = (props) => (
  <input {...props} value={props.value || ""} style={{ height:46, borderRadius:12, border:"1px solid rgba(255,255,255,.1)",
    background:"rgba(255,255,255,.05)", color:"#fff", padding:"0 14px", outline:"none",
    fontFamily:"inherit", fontSize:14, width:"100%", ...props.style }}
    onFocus={e=>e.target.style.borderColor=G}
    onBlur={e=>e.target.style.borderColor="rgba(255,255,255,.1)"}/>
);

const Textarea = (props) => (
  <textarea {...props} value={props.value || ""} style={{ borderRadius:12, border:"1px solid rgba(255,255,255,.1)",
    background:"rgba(255,255,255,.05)", color:"#fff", padding:"12px 14px", outline:"none",
    fontFamily:"inherit", fontSize:14, width:"100%", resize:"vertical", minHeight:100,
    ...props.style }}
    onFocus={e=>e.target.style.borderColor=G}
    onBlur={e=>e.target.style.borderColor="rgba(255,255,255,.1)"}/>
);

const Select = (props) => (
  <select {...props} style={{ height:46, borderRadius:12, border:"1px solid rgba(255,255,255,.1)",
    background:"rgba(255,255,255,.05)", color:"#fff", padding:"0 14px", outline:"none",
    fontFamily:"inherit", fontSize:14, width:"100%", cursor:"pointer", ...props.style }}
    onFocus={e=>e.target.style.borderColor=G}
    onBlur={e=>e.target.style.borderColor="rgba(255,255,255,.1)"}>
    {props.children}
  </select>
);

function Toast({ msg, type }) {
  if (!msg) return null;
  return (
    <div style={{ position:"fixed", bottom:24, right:24, zIndex:9999, padding:"14px 20px",
      borderRadius:14, fontWeight:700, fontSize:14,
      background:type==="error"?"rgba(239,68,68,.95)":"rgba(0,196,140,.95)",
      color:"#fff", boxShadow:"0 12px 32px rgba(0,0,0,.4)",
      animation:"slideUp .3s ease" }}>
      {type==="error"?"❌":"✅"} {msg}
    </div>
  );
}

// ... other shared components

// ── Validation Helper ──────────────────────────────────
const validateLongTextFields = (form, fields, toast_) => {
  for (const field of fields) {
    if ((form[field] || "").length > MAX_TEXT_LENGTH) {
      toast_(`Error: The '${field}' field is too long. Please shorten it.`, "error");
      return false;
    }
  }
  return true;
};


// ══════════════════════════════════════════════════════
// WEBSITES MANAGER
// ══════════════════════════════════════════════════════
function WebsitesManager() {
  // ... (state, useEffect, etc.)

  const save = async () => {
    // ...
    if (!validateLongTextFields(form, ['description'], toast_)) {
      return;
    }
    // ... (rest of save logic)
  };
  
  // ... (rest of WebsitesManager)
}


// ══════════════════════════════════════════════════════
// TECH CONTENT MANAGER
// ══════════════════════════════════════════════════════
function TechContentManager({ collectionName }) {
  const [docs, setDocs] = useState([]);
  const getInitialFormState = useCallback(() => ({ 
    type: "article", badge: "Tech", title: "", summary: "", content: "", 
    imageUrl: "", carouselImages: [], ctaText: "", ctaUrl: "", source: "",
    platform: "youtube", embedUrl: "", channel: "", channelImg: "🎙️", duration: "",
    category: collectionName === "tips" ? "tech-tips" : "tech-updates",
    sectionType: collectionName === "tips" ? "techTips" : "techUpdates",
    status: 'published',
    views: 0
  }), [collectionName]);
  
  const [form, setForm] = useState(getInitialFormState());
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast,   setToast]   = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [tab,     setTab]     = useState("article");

  const db = getFirebaseDb();
  const toast_ = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  // ... (useEffect remains the same)

  const save = async () => {
    if (!(form.title || "").toString().trim()) {
      return toast_("Weka title kwanza", "error");
    }
    
    // Bug Fix: Validate long text fields before saving
    if (!validateLongTextFields(form, ['summary', 'content'], toast_)) {
      return;
    }

    // ... (rest of the save logic remains the same)
  };

  // ... (del, edit, resetForm, and return logic remains the same)
}

// Apply similar validation logic to other managers...

export default function AdminPanel({ user, onBack }) {
  // ...
}
