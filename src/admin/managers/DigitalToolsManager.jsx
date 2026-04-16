import React, { useState, useEffect } from "react";
import { 
  getFirebaseDb, collection, query, limit, onSnapshot, where, 
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp, 
  storage, ref, uploadBytes, getDownloadURL, handleFirestoreError, OperationType 
} from "../../firebase.js";
import { Btn, Field, Input, Textarea, Select, Toast, ConfirmDialog, ImageUploadField, AdminThumb } from "../AdminUI.jsx";

const G = "#F5A623", G2 = "#FFD17C";

export default function DigitalToolsManager({ user }) {
  const [docs, setDocs] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ 
    imageUrl: "", name: "", description: "", dealType: "direct_offer", directLink: "", affiliateLink: "", whatsappLink: "", promoCode: "", 
    oldPrice: "", newPrice: "", expiryDate: "", badge: "", featured: false, category: "hosting",
    fullDescription: "", whyThisDeal: "", includedFeatures: "", savingsText: "", ctaText: "Pata Tool", provider: "", terms: "",
    joinedCount: "", liveJoinedText: "", todayJoinedCount: "", rating: "5.0", reviewText: "", urgencyText: ""
  });
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast,   setToast]   = useState(null);
  const [confirm, setConfirm] = useState(null);

  const db = getFirebaseDb();
  const toast_ = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  useEffect(() => {
    if (!db) return;
    let q = query(collection(db, "deals"), limit(1000));
    if (user?.role === "creator") {
      q = query(collection(db, "deals"), where("ownerId", "==", user.uid), limit(1000));
    }
    const unsub = onSnapshot(q, (snap) => {
      const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      fetched.sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));
      setDocs(fetched);
    }, (err) => {
      console.error("Error loading deals:", err);
    });
    return () => unsub();
  }, [db, user?.role, user?.uid]);

  const save = async () => {
    const name = (form.name || "").toString();
    if (!name.trim()) { toast_("Weka jina la tool kwanza", "error"); return; }
    setLoading(true);
    try {
      let contentUrl = form.contentFileUrl || "";
      let contentToStore = form.fullDescription || "";

      if (contentToStore.length > 500000) {
        const contentBlob = new Blob([contentToStore], { type: 'application/json' });
        const contentRef = ref(storage, `deals/${Date.now()}_${form.name.replace(/\s+/g, '_')}.json`);
        await uploadBytes(contentRef, contentBlob);
        contentUrl = await getDownloadURL(contentRef);
        contentToStore = ""; 
      }

      const canDirect = !!user?.canPublishDirect;
      const data = { 
        ...form,
        title: form.name || form.title || "",
        description: form.description || "",
        image: form.imageUrl || form.image || "",
        category: form.category || "General",
        active: form.active ?? true,
        published: form.published ?? (editing ? form.published : canDirect),
        status: form.status ?? (editing ? form.status : (canDirect ? "published" : "pending_review")),
        fullDescription: contentToStore,
        contentFileUrl: contentUrl,
        updatedAt: serverTimestamp()
      };

      if (!editing) {
        data.createdAt = serverTimestamp();
        data.ownerId = user?.uid || "admin";
        data.ownerName = user?.displayName || "Admin";
        data.ownerRole = user?.role || "admin";
        data.sector = "deals";
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
        await updateDoc(doc(db, "deals", editing), data);
        toast_("Imesahihishwa!");
      } else {
        await addDoc(collection(db, "deals"), data);
        toast_("Tool imewekwa live!");
      }
      setForm({ 
        imageUrl: "", name: "", description: "", dealType: "direct_offer", directLink: "", affiliateLink: "", whatsappLink: "", promoCode: "", 
        oldPrice: "", newPrice: "", expiryDate: "", badge: "", featured: false, category: "hosting",
        fullDescription: "", whyThisDeal: "", includedFeatures: "", savingsText: "", ctaText: "Pata Tool", provider: "", terms: "",
        joinedCount: "", liveJoinedText: "", todayJoinedCount: "", rating: "5.0", reviewText: "", urgencyText: ""
      });
      setEditing(null);
    } catch (e) {
      console.error(e);
      if (e.message.includes("insufficient permissions")) {
        handleFirestoreError(e, editing ? OperationType.UPDATE : OperationType.CREATE, "deals");
      }
      toast_(e.message, "error");
    }
    setLoading(false);
  };

  const del = async (id) => {
    setConfirm({ msg: "Una uhakika unataka kufuta tool hii?", onConfirm: async () => { await deleteDoc(doc(db, "deals", id)); setConfirm(null); toast_("Imefutwa"); }, onCancel: () => setConfirm(null) });
  };

  const edit = (item) => { setEditing(item.id); setForm(item); window.scrollTo({ top: 0, behavior: "smooth" }); };

  return (
    <div>
      {toast   && <Toast msg={toast.msg} type={toast.type}/>}
      {confirm && <ConfirmDialog {...confirm}/>}

      <div style={{ borderRadius:20, border:"1px solid rgba(255,255,255,.08)", background:"#141823", padding:24, marginBottom:28 }}>
        <h3 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:20, margin:"0 0 20px" }}>{editing ? "✏️ Hariri Tool" : "➕ Ongeza Tool Mpya"}</h3>
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            <Field label="Tool Name *"><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Hostinger" /></Field>
            <Field label="Category"><Select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              <option value="hosting">Hosting</option>
              <option value="ai">AI Tools</option>
              <option value="vpn">VPN</option>
              <option value="design">Design</option>
              <option value="marketing">Marketing</option>
              <option value="other">Other</option>
            </Select></Field>
          </div>
          <ImageUploadField label="Tool Logo / Image URL" value={form.imageUrl} onChange={val => setForm(f => ({ ...f, imageUrl: val }))} />
          <Field label="Short Description (Intro)"><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Short summary..." style={{ minHeight: 60 }} /></Field>
          <Field label="Full Description (Detailed)"><Textarea value={form.fullDescription} onChange={e => setForm(f => ({ ...f, fullDescription: e.target.value }))} placeholder="Full details..." style={{ minHeight: 120 }} /></Field>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            <Field label="Old Price (Optional)"><Input value={form.oldPrice} onChange={e => setForm(f => ({ ...f, oldPrice: e.target.value }))} placeholder="e.g. $10" /></Field>
            <Field label="New Price / Deal Price"><Input value={form.newPrice} onChange={e => setForm(f => ({ ...f, newPrice: e.target.value }))} placeholder="e.g. $2.99" /></Field>
          </div>
          
          <Field label="Affiliate / Direct Link"><Input value={form.affiliateLink} onChange={e => setForm(f => ({ ...f, affiliateLink: e.target.value }))} placeholder="https://..." /></Field>
          
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input type="checkbox" checked={form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} id="featured-tool" />
            <label htmlFor="featured-tool" style={{ fontSize: 14, cursor: "pointer" }}>Mark as Featured (Homepage)</label>
          </div>

          <div style={{ display:"flex", gap:10 }}>
            <Btn onClick={save} disabled={loading}>{loading?"Inahifadhi...":editing?"💾 Hifadhi":"🚀 Weka Live"}</Btn>
            {editing && <Btn onClick={()=>{setEditing(null);setForm({imageUrl:"",name:"",description:"",dealType:"direct_offer",directLink:"",affiliateLink:"",whatsappLink:"",promoCode:"",oldPrice:"",newPrice:"",expiryDate:"",badge:"",featured:false,category:"hosting",fullDescription:"",whyThisDeal:"",includedFeatures:"",savingsText:"",ctaText:"Pata Tool",provider:"",terms:"",joinedCount:"",liveJoinedText:"",todayJoinedCount:"",rating:"5.0",reviewText:"",urgencyText:""});}} color="rgba(255,255,255,.08)" textColor="#fff">✕ Acha</Btn>}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <Input placeholder="🔍 Search by name..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 400, background: "rgba(255,255,255,.05)" }} />
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {docs.filter(d => (d.name||"").toLowerCase().includes(search.toLowerCase())).map(item => (
          <div key={item.id} style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,.07)", background: "#1a1d2e", padding: "14px 18px", display: "flex", gap: 12, alignItems: "center", maxWidth: 800 }}>
            <AdminThumb src={item.imageUrl || item.image} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 15 }}>{item.name}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.4)' }}>{item.category} • {item.newPrice}</div>
              <div style={{ fontSize: 11, color: item.status === 'published' ? '#00C48C' : '#F5A623', fontWeight: 700, textTransform: 'uppercase', marginTop: 4 }}>{item.status} {item.featured ? '• FEATURED' : ''}</div>
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
