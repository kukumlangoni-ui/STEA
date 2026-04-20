import React, { useState, useEffect } from "react";
import { 
  getFirebaseDb, collection, query, limit, onSnapshot, where, 
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp, 
  handleFirestoreError, OperationType 
} from "../../firebase.js";
import { Btn, Field, Input, Textarea, Toast, ConfirmDialog, ImageUploadField, AdminThumb } from "../AdminUI.jsx";

const G = "#F5A623";

export default function ProductsManager({ user }) {
  const [docs, setDocs] = useState([]);
  const [form, setForm] = useState({ 
    name: "", description: "", price: "", oldPrice: "", imageUrl: "", badge: "", url: "", category: "Electronics",
    monetizationType: "affiliate", affiliateLink: "", whatsappLink: "", sellerName: "", sellerNotes: "", featured: false
  });
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast,   setToast]   = useState(null);
  const [confirm, setConfirm] = useState(null);

  const db = getFirebaseDb();
  const toast_ = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  useEffect(() => {
    if (!db) return;
    let q = query(collection(db, "products"), limit(1000));
    if (user?.role === "creator" || user?.role === "seller") {
      q = query(collection(db, "products"), where("ownerId", "==", user.uid), limit(1000));
    }
    const unsub = onSnapshot(q, (snap) => {
      const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      fetched.sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));
      setDocs(fetched);
    }, (err) => {
      console.error("Error loading products:", err);
    });
    return () => unsub();
  }, [db, user?.role, user?.uid]);

  const save = async () => {
    const name = (form.name || "").toString();
    if (!name.trim()) { toast_("Weka jina la bidhaa kwanza", "error"); return; }
    setLoading(true);
    try {
      const canDirect = !!user?.canPublishDirect;
      const data = { 
        ...form,
        title: form.name || form.title || "",
        description: form.description || "",
        image: form.imageUrl || form.image || "",
        category: form.category || "Electronics",
        active: form.active ?? true,
        published: form.published ?? (editing ? form.published : canDirect),
        status: form.status ?? (editing ? form.status : (canDirect ? "published" : "pending_review")),
        updatedAt: serverTimestamp()
      };

      if (!editing) {
        data.createdAt = serverTimestamp();
        data.ownerId = user?.uid || "admin";
        data.ownerName = user?.displayName || "Admin";
        data.ownerRole = user?.role || "admin";
        data.sector = "products";
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
        await updateDoc(doc(db, "products", editing), data);
        toast_("Imesahihishwa!");
      } else { 
        await addDoc(collection(db, "products"), data); 
        toast_("Bidhaa imewekwa live!"); 
      }
      setForm({ name: "", description: "", price: "", oldPrice: "", imageUrl: "", badge: "", url: "", category: "Electronics", monetizationType: "affiliate", affiliateLink: "", whatsappLink: "", sellerName: "", sellerNotes: "", featured: false });
      setEditing(null);
    } catch (e) {
      console.error(e);
      if (e.message.includes("insufficient permissions")) {
        handleFirestoreError(e, editing ? OperationType.UPDATE : OperationType.CREATE, "products");
      }
      toast_(e.message, "error");
    }
    setLoading(false);
  };

  const del = async (id) => {
    setConfirm({ msg: "Una uhakika unataka kufuta bidhaa hii?", onConfirm: async () => { await deleteDoc(doc(db, "products", id)); setConfirm(null); toast_("Bidhaa imefutwa"); }, onCancel: () => setConfirm(null) });
  };

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      {confirm && <ConfirmDialog {...confirm} />}
      <div style={{ borderRadius: 20, border: "1px solid rgba(255,255,255,.08)", background: "#141823", padding: 24, marginBottom: 28 }}>
        <h3 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 20, margin: "0 0 20px" }}>{editing ? "✏️ Hariri Bidhaa" : "➕ Ongeza Bidhaa Mpya"}</h3>
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            <Field label="Jina la Bidhaa *"><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Sony WH-1000XM4" /></Field>
            <Field label="Monetization Type">
              <select value={form.monetizationType} onChange={e => setForm(f => ({ ...f, monetizationType: e.target.value }))} style={{ width: "100%", padding: 10, borderRadius: 8, background: "#1a1d2e", border: "1px solid rgba(255,255,255,.1)", color: "white" }}>
                <option value="affiliate">Affiliate</option>
                <option value="manual_lead">Manual Lead</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </Field>
          </div>
          <ImageUploadField label="Product Image URL" value={form.imageUrl} onChange={val => setForm(f => ({ ...f, imageUrl: val }))} />
          <Field label="Maelezo"><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Maelezo ya bidhaa..." style={{ minHeight: 80 }} /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16 }}>
            <Field label="Bei ya Sasa"><Input value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="TZS 850,000" /></Field>
            <Field label="Bei ya Zamani"><Input value={form.oldPrice} onChange={e => setForm(f => ({ ...f, oldPrice: e.target.value }))} placeholder="TZS 950,000" /></Field>
            <Field label="Badge (e.g. New)"><Input value={form.badge} onChange={e => setForm(f => ({ ...f, badge: e.target.value }))} placeholder="HOT" /></Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            <Field label="Affiliate URL"><Input value={form.affiliateLink} onChange={e => setForm(f => ({ ...f, affiliateLink: e.target.value }))} placeholder="https://amazon.com/..." /></Field>
            <Field label="WhatsApp URL"><Input value={form.whatsappLink} onChange={e => setForm(f => ({ ...f, whatsappLink: e.target.value }))} placeholder="https://wa.me/..." /></Field>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input type="checkbox" checked={form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} id="featured-product" />
            <label htmlFor="featured-product" style={{ fontSize: 14, cursor: "pointer" }}>Mark as Featured (Homepage)</label>
          </div>
          <Btn onClick={save} disabled={loading}>{loading ? "Inahifadhi..." : editing ? "💾 Hifadhi" : "🚀 Weka Live"}</Btn>
        </div>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {docs.map(item => (
          <div key={item.id} style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,.07)", background: "#1a1d2e", padding: "14px 18px", display: "flex", gap: 12, alignItems: "center" }}>
            <AdminThumb src={item.imageUrl} fallback="🏷️" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 15 }}>{item.name}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.4)' }}>{item.category} · {item.price}</div>
              <div style={{ fontSize: 11, color: item.status === 'published' ? '#00C48C' : '#F5A623', fontWeight: 700, textTransform: 'uppercase', marginTop: 4 }}>{item.status} {item.featured ? '• FEATURED' : ''}</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn onClick={() => { setEditing(item.id); setForm({ ...item }); window.scrollTo({ top: 0, behavior: "smooth" }); }} color="rgba(245,166,35,.12)" textColor={G} style={{ padding: "8px 14px" }}>✏️</Btn>
              <Btn onClick={() => del(item.id)} color="rgba(239,68,68,.12)" textColor="#fca5a5" style={{ padding: "8px 14px" }}>🗑️</Btn>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
