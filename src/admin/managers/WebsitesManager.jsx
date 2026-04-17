import React, { useState, useEffect } from "react";
import { 
  getFirebaseDb, collection, query, limit, onSnapshot, where, 
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp, 
  handleFirestoreError, OperationType 
} from "../../firebase.js";
import { Btn, Field, Input, Textarea, Select, Toast, ConfirmDialog, ImageUploadField, AdminThumb } from "../AdminUI.jsx";

const G = "#F5A623";
const WEBSITE_CATEGORIES = ["Free Movie", "Streaming", "AI Tools", "Learning", "Jobs", "Design", "Business", "Download", "Gaming", "Live TV", "Sports", "Music"];

export default function WebsitesManager({ user }) {
  const [docs, setDocs] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", url: "", description: "", imageUrl: "", bg: "linear-gradient(135deg,#667eea,#764ba2)", meta: "Free Tool", tags: "", category: "Free Movie" });
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast,   setToast]   = useState(null);
  const [confirm, setConfirm] = useState(null);

  const db = getFirebaseDb();
  const toast_ = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    if (!db) return;
    let q = query(collection(db, "websites"), limit(1000));
    if (user?.role === "creator") {
      q = query(collection(db, "websites"), where("ownerId", "==", user.uid), limit(1000));
    }
    const unsub = onSnapshot(q, (snap) => {
      const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      fetched.sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));
      setDocs(fetched);
    }, (err) => {
      console.error("Error loading websites:", err);
    });
    return () => unsub();
  }, [db, user?.role, user?.uid]);

  const save = async () => {
    const name = (form.name || "").toString();
    const url = (form.url || "").toString();
    if (!name.trim() || !url.trim()) { toast_("Weka jina na URL", "error"); return; }
    setLoading(true);
    try {
      const canDirect = !!user?.canPublishDirect;
      const data = { 
        ...form, 
        title: form.name || form.title || "",
        description: form.description || "",
        image: form.imageUrl || "",
        category: form.category || "General",
        active: form.active ?? true,
        published: form.published ?? (editing ? form.published : canDirect),
        status: form.status ?? (editing ? form.status : (canDirect ? "published" : "pending_review")),
        tags: (form.tags || "").split(",").map(t => t.trim()).filter(Boolean), 
        updatedAt: serverTimestamp()
      };

      if (!editing) {
        data.createdAt = serverTimestamp();
        data.ownerId = user?.uid || "admin";
        data.ownerName = user?.displayName || "Admin";
        data.ownerRole = user?.role || "admin";
        data.sector = "websites";
      } else {
        delete data.createdAt;
        delete data.ownerId;
        delete data.ownerName;
        delete data.ownerRole;
        delete data.sector;
        delete data.id;
      }

      Object.keys(data).forEach(key => {
        if (data[key] === undefined || data[key] === null) data[key] = "";
      });

      if (editing) {
        await updateDoc(doc(db, "websites", editing), data);
        toast_("Imesahihishwa!");
      } else { 
        await addDoc(collection(db, "websites"), data); 
        toast_("Website imewekwa live!"); 
      }
      setForm({ name: "", url: "", description: "", imageUrl: "", bg: "linear-gradient(135deg,#667eea,#764ba2)", meta: "Free Tool", tags: "", category: "Free Movie" });
      setEditing(null);
    } catch (e) {
      console.error(e);
      if (e.message.includes("insufficient permissions")) {
        handleFirestoreError(e, editing ? OperationType.UPDATE : OperationType.CREATE, "websites");
      }
      toast_(e.message, "error");
    }
    setLoading(false);
  };

  const del = async (id) => {
    setConfirm({ msg: "Una uhakika unataka kufuta website hii?", onConfirm: async () => { await deleteDoc(doc(db, "websites", id)); setConfirm(null); toast_("Website imefutwa"); }, onCancel: () => setConfirm(null) });
  };

  const edit = (item) => { setEditing(item.id); setForm({ ...item, tags: (item.tags || []).join(", ") }); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const filtered = docs.filter(item =>
    (item.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (item.url || "").toLowerCase().includes(search.toLowerCase()) ||
    (item.category || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      {confirm && <ConfirmDialog {...confirm} />}
      <div style={{ borderRadius: 20, border: "1px solid rgba(255,255,255,.08)", background: "#141823", padding: 24, marginBottom: 28 }}>
        <h3 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 20, margin: "0 0 20px" }}>{editing ? "✏️ Hariri Website" : "➕ Ongeza Website Mpya"}</h3>
        <div style={{ display: "grid", gap: 16 }}>
          <Field label="Jina la Website *"><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Remove.bg" /></Field>
          <ImageUploadField label="Website Thumbnail URL" value={form.imageUrl} onChange={val => setForm(f => ({ ...f, imageUrl: val }))} />
          <Field label="URL *"><Input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://remove.bg" /></Field>
          <Field label="Maelezo"><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Maelezo mafupi..." style={{ minHeight: 80 }} /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            <Field label="Category *">
              <Select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {WEBSITE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
            </Field>
            <Field label="Tags (comma separated)"><Input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="AI, Design, Tools" /></Field>
          </div>
          <Btn onClick={save} disabled={loading}>{loading ? "Inahifadhi..." : editing ? "💾 Hifadhi" : "🚀 Weka Live"}</Btn>
        </div>
      </div>

      <div style={{ marginBottom: 24, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tafuta website..." style={{ paddingLeft: 44 }} />
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", opacity: .4 }}>🔍</span>
        </div>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {filtered.map(item => (
          <div key={item.id} style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,.07)", background: "#1a1d2e", padding: "14px 18px", display: "flex", gap: 12, alignItems: "center" }}>
            <AdminThumb src={item.imageUrl} fallback="🌐" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 15 }}>{item.name}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.4)' }}>{item.category} • {item.url}</div>
              <div style={{ fontSize: 11, color: item.status === 'published' ? '#00C48C' : '#F5A623', fontWeight: 700, textTransform: 'uppercase', marginTop: 4 }}>{item.status}</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn onClick={() => edit(item)} color="rgba(245,166,35,.12)" textColor={G} style={{ padding: "8px 14px" }}>✏️</Btn>
              <Btn onClick={() => del(item.id)} color="rgba(239,68,68,.12)" textColor="#fca5a5" style={{ padding: "8px 14px" }}>🗑️</Btn>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
