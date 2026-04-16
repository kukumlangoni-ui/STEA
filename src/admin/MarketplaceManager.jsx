import { useState, useEffect } from "react";
import {
  getFirebaseDb, collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, serverTimestamp, where
} from "../firebase.js";
import { MARKET_CATEGORIES } from "../constants/marketplace.js";

const G = "#F5A623";
const STEA_WA = "8619715852043";

// ── Sub-condition options ─────────────────────────────
const CONDITIONS = ["New", "Used", "Refurbished"];

// ── Shared input styles ───────────────────────────────
const inputStyle = {
  height: 44, borderRadius: 10, border: "1px solid rgba(255,255,255,.1)",
  background: "rgba(255,255,255,.04)", color: "#fff", padding: "0 14px",
  outline: "none", fontFamily: "inherit", fontSize: 14, width: "100%", boxSizing: "border-box",
};
const labelStyle = {
  fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,.45)",
  textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 5, display: "block",
};
const cardStyle = {
  background: "#0e1018", borderRadius: 14, border: "1px solid rgba(255,255,255,.06)",
  padding: 16,
};

// ── Image URL list input ──────────────────────────────
function ImagesField({ value, onChange }) {
  const [txt, setTxt] = useState((value || []).join("\n"));
  return (
    <div>
      <label style={labelStyle}>Image URLs (Mstari mmoja kila URL)</label>
      <textarea
        value={txt}
        onChange={e => {
          setTxt(e.target.value);
          onChange(e.target.value.split("\n").map(s => s.trim()).filter(Boolean));
        }}
        placeholder="https://example.com/img1.jpg&#10;https://example.com/img2.jpg"
        style={{ ...inputStyle, height: 90, resize: "vertical", padding: "10px 14px" }}
        onFocus={e => e.target.style.borderColor = G}
        onBlur={e => e.target.style.borderColor = "rgba(255,255,255,.1)"}
      />
      {value?.length > 0 && (
        <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
          {value.slice(0, 4).map((url, i) => (
            <img key={i} src={url} alt="" referrerPolicy="no-referrer"
              style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover", border: "1px solid rgba(255,255,255,.1)" }}
              onError={e => { e.target.style.opacity = ".2"; }} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Product Form ──────────────────────────────────────
function ProductForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState({
    name: "", category: "", subcategory: "", subItem: "", brand: "",
    condition: "New", price: "", discountPrice: "", location: "",
    description: "", whatsappNumber: STEA_WA, sellerType: "stea",
    sellerName: "STEA Official", isFeatured: false, isActive: true, images: [],
    ...initial,
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const cat = MARKET_CATEGORIES[form.category];
  const hasBrands = cat?.brands?.length > 0;
  const hasSubItems = cat?.subItems && form.subcategory && cat.subItems[form.subcategory]?.length > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.category || !form.price) return;
    onSave({
      ...form,
      price: Number(form.price) || 0,
      discountPrice: form.discountPrice ? Number(form.discountPrice) : null,
    });
  };

  const field = (label, key, type = "text", placeholder = "") => (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        type={type} value={form[key] || ""} placeholder={placeholder}
        onChange={e => set(key, e.target.value)}
        style={inputStyle}
        onFocus={e => e.target.style.borderColor = G}
        onBlur={e => e.target.style.borderColor = "rgba(255,255,255,.1)"}
      />
    </div>
  );

  // const sel = (label, key, options, placeholder = "Chagua...") => (
  //   <div>
  //     <label style={labelStyle}>{label}</label>
  //     <select value={form[key] || ""} onChange={e => set(key, e.target.value)}
  //       style={{ ...inputStyle, cursor: "pointer" }}
  //       onFocus={e => e.target.style.borderColor = G}
  //       onBlur={e => e.target.style.borderColor = "rgba(255,255,255,.1)"}>
  //       <option value="">{placeholder}</option>
  //       {options.map(o => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
  //     </select>
  //   </div>
  // );

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
      {/* Row 1: Name */}
      {field("Jina la Bidhaa *", "name", "text", "Mfano: Samsung Galaxy A54")}

      {/* Row 2: Category + Subcategory */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <label style={labelStyle}>Kategoria *</label>
          <select value={form.category} onChange={e => set("category", e.target.value) || set("subcategory", "") || set("brand", "") || set("subItem", "")}
            style={{ ...inputStyle, cursor: "pointer" }}
            onFocus={e => e.target.style.borderColor = G}
            onBlur={e => e.target.style.borderColor = "rgba(255,255,255,.1)"}>
            <option value="">Chagua Kategoria...</option>
            {Object.values(MARKET_CATEGORIES).map(c => (
              <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
            ))}
          </select>
        </div>
        {cat?.subcategories?.length > 0 && (
          <div>
            <label style={labelStyle}>Subcategory</label>
            <select value={form.subcategory || ""} onChange={e => { set("subcategory", e.target.value); set("subItem", ""); }}
              style={{ ...inputStyle, cursor: "pointer" }}
              onFocus={e => e.target.style.borderColor = G}
              onBlur={e => e.target.style.borderColor = "rgba(255,255,255,.1)"}>
              <option value="">Yote</option>
              {cat.subcategories.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Sub-items for accessories */}
      {hasSubItems && (
        <div>
          <label style={labelStyle}>Item Type</label>
          <select value={form.subItem || ""} onChange={e => set("subItem", e.target.value)}
            style={{ ...inputStyle, cursor: "pointer" }}
            onFocus={e => e.target.style.borderColor = G}
            onBlur={e => e.target.style.borderColor = "rgba(255,255,255,.1)"}>
            <option value="">Yote</option>
            {cat.subItems[form.subcategory].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      )}

      {/* Brand (phones & laptops) */}
      {hasBrands && (
        <div>
          <label style={labelStyle}>Brand / Mtengenezaji</label>
          <select value={form.brand || ""} onChange={e => set("brand", e.target.value)}
            style={{ ...inputStyle, cursor: "pointer" }}
            onFocus={e => e.target.style.borderColor = G}
            onBlur={e => e.target.style.borderColor = "rgba(255,255,255,.1)"}>
            <option value="">Chagua Brand...</option>
            {cat.brands.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      )}

      {/* Row 3: Condition + Location */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <label style={labelStyle}>Hali ya Bidhaa</label>
          <select value={form.condition} onChange={e => set("condition", e.target.value)}
            style={{ ...inputStyle, cursor: "pointer" }}
            onFocus={e => e.target.style.borderColor = G}
            onBlur={e => e.target.style.borderColor = "rgba(255,255,255,.1)"}>
            {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        {field("Eneo (Location)", "location", "text", "Mfano: Dar es Salaam")}
      </div>

      {/* Row 4: Price + Discount */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {field("Bei (Tsh) *", "price", "number", "Mfano: 250000")}
        {field("Bei ya Punguzo (Tsh)", "discountPrice", "number", "Optional")}
      </div>

      {/* Description */}
      <div>
        <label style={labelStyle}>Maelezo</label>
        <textarea value={form.description || ""} onChange={e => set("description", e.target.value)}
          placeholder="Elezea bidhaa yako kwa undani..."
          style={{ ...inputStyle, height: 80, resize: "vertical", padding: "10px 14px" }}
          onFocus={e => e.target.style.borderColor = G}
          onBlur={e => e.target.style.borderColor = "rgba(255,255,255,.1)"} />
      </div>

      {/* Images */}
      <ImagesField value={form.images} onChange={v => set("images", v)} />

      {/* Seller section */}
      <div style={{ background: "rgba(255,255,255,.02)", borderRadius: 10, padding: 14, border: "1px solid rgba(255,255,255,.05)", display: "grid", gap: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,.5)", textTransform: "uppercase", letterSpacing: ".07em" }}>Seller Info</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label style={labelStyle}>Aina ya Seller</label>
            <select value={form.sellerType} onChange={e => {
              set("sellerType", e.target.value);
              if (e.target.value === "stea") { set("sellerName", "STEA Official"); set("whatsappNumber", STEA_WA); }
              else { set("sellerName", ""); }
            }}
              style={{ ...inputStyle, cursor: "pointer" }}
              onFocus={e => e.target.style.borderColor = G}
              onBlur={e => e.target.style.borderColor = "rgba(255,255,255,.1)"}>
              <option value="stea">STEA Official</option>
              <option value="seller">Seller wa Nje</option>
            </select>
          </div>
          {field("Jina la Seller", "sellerName", "text", "Jina la mtu au duka")}
        </div>
        {field("WhatsApp Number", "whatsappNumber", "tel", "255700000000")}
      </div>

      {/* Flags */}
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        {[
          { k: "isActive", label: "✅ Bidhaa Inaonekana" },
          { k: "isFeatured", label: "⭐ Featured" },
        ].map(({ k, label }) => (
          <label key={k} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,.75)" }}>
            <div onClick={() => set(k, !form[k])}
              style={{ width: 40, height: 22, borderRadius: 11, background: form[k] ? G : "rgba(255,255,255,.1)", position: "relative", transition: ".2s", cursor: "pointer", border: `1px solid ${form[k] ? G : "rgba(255,255,255,.1)"}` }}>
              <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: form[k] ? 20 : 2, transition: ".2s", boxShadow: "0 1px 4px rgba(0,0,0,.3)" }} />
            </div>
            {label}
          </label>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        <button type="submit" disabled={saving || !form.name || !form.category || !form.price}
          style={{ flex: 1, height: 46, borderRadius: 12, border: "none", background: G, color: "#111", fontWeight: 900, cursor: "pointer", fontSize: 14, opacity: (saving || !form.name || !form.category || !form.price) ? .5 : 1 }}>
          {saving ? "Inahifadhi..." : initial?.id ? "Hifadhi Mabadiliko" : "Ongeza Bidhaa"}
        </button>
        <button type="button" onClick={onCancel}
          style={{ height: 46, padding: "0 20px", borderRadius: 12, border: "1px solid rgba(255,255,255,.1)", background: "transparent", color: "rgba(255,255,255,.6)", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>
          Acha
        </button>
      </div>
    </form>
  );
}

// ── Product Row ──────────────────────────────────────
function ProductRow({ product, onEdit, onDelete, onToggle, onStatusChange }) {
  const cat = MARKET_CATEGORIES[product.category];
  const imgs = Array.isArray(product.images) ? product.images : [product.images].filter(Boolean);

  const statusColors = {
    draft: { bg: "rgba(255,255,255,.05)", text: "rgba(255,255,255,.4)" },
    pending_review: { bg: "rgba(251,191,36,.15)", text: "#fbbf24" },
    approved: { bg: "rgba(34,197,94,.15)", text: "#22c55e" },
    published: { bg: "rgba(59,130,246,.15)", text: "#3b82f6" },
    rejected: { bg: "rgba(239,68,68,.15)", text: "#ef4444" },
  };
  const s = statusColors[product.status] || statusColors.draft;

  return (
    <div style={{ ...cardStyle, display: "flex", gap: 12, alignItems: "center" }}>
      {/* Thumbnail */}
      <div style={{ width: 52, height: 52, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: "#0a0c14" }}>
        {imgs[0] ? (
          <img src={imgs[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} referrerPolicy="no-referrer" onError={e => { e.target.style.display = "none"; }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", fontSize: 20 }}>{cat?.emoji || "📦"}</div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 800, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>{product.name}</span>
          <span style={{ fontSize: 9, background: s.bg, color: s.text, padding: "2px 6px", borderRadius: 4, fontWeight: 800, textTransform: "uppercase" }}>
            {product.status?.replace("_", " ") || "DRAFT"}
          </span>
          {product.isFeatured && <span style={{ fontSize: 9, background: `${G}20`, color: G, padding: "2px 6px", borderRadius: 4, fontWeight: 800 }}>FEATURED</span>}
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginTop: 2 }}>
          {cat?.emoji} {cat?.label} {product.subcategory ? `· ${product.subcategory}` : ""} {product.brand ? `· ${product.brand}` : ""}
          {product.ownerName && <span style={{ color: G, marginLeft: 6 }}>· By {product.ownerName}</span>}
        </div>
        <div style={{ fontSize: 13, fontWeight: 800, color: G, marginTop: 2 }}>
          Tsh {Number(product.discountPrice || product.price || 0).toLocaleString()}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        {product.status === "pending_review" && (
          <>
            <button onClick={() => onStatusChange(product, "approved")}
              style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(34,197,94,.3)", background: "rgba(34,197,94,.08)", color: "#22c55e", cursor: "pointer", fontSize: 11, fontWeight: 800 }}>
              Approve
            </button>
            <button onClick={() => onStatusChange(product, "rejected")}
              style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(239,68,68,.3)", background: "rgba(239,68,68,.08)", color: "#ef4444", cursor: "pointer", fontSize: 11, fontWeight: 800 }}>
              Reject
            </button>
          </>
        )}
        {product.status === "approved" && (
          <button onClick={() => onStatusChange(product, "published")}
            style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(59,130,246,.3)", background: "rgba(59,130,246,.08)", color: "#3b82f6", cursor: "pointer", fontSize: 11, fontWeight: 800 }}>
            Publish
          </button>
        )}
        <button onClick={() => onToggle(product)}
          style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${product.published ? "rgba(239,68,68,.3)" : "rgba(34,197,94,.3)"}`, background: product.published ? "rgba(239,68,68,.08)" : "rgba(34,197,94,.08)", color: product.published ? "#ef4444" : "#22c55e", cursor: "pointer", fontSize: 11, fontWeight: 800 }}>
          {product.published ? "Hide" : "Show"}
        </button>
        <button onClick={() => onEdit(product)}
          style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.04)", color: "#fff", cursor: "pointer", fontSize: 11, fontWeight: 800 }}>
          Edit
        </button>
        <button onClick={() => onDelete(product)}
          style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(239,68,68,.25)", background: "rgba(239,68,68,.06)", color: "#ef4444", cursor: "pointer", fontSize: 11, fontWeight: 800 }}>
          Del
        </button>
      </div>
    </div>
  );
}

// ── Main MarketplaceManager ──────────────────────────
export default function MarketplaceManager({ user }) {
  const db = getFirebaseDb();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [filterCat, setFilterCat] = useState("all");
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (!db) return;
    // Managers and Admins can see all products in marketplace sector
    // Sellers can only see their own products
    let q = query(collection(db, "products"), where("sector", "==", "marketplace"));
    
    if (user?.role === "seller") {
      q = query(collection(db, "products"), where("sector", "==", "marketplace"), where("ownerId", "==", user.uid));
    }

    const unsub = onSnapshot(q, snap => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, err => {
      console.error("MarketplaceManager fetch error:", err);
      setLoading(false);
    });
    return () => unsub();
  }, [db, user?.role, user?.uid]);

  const handleSave = async (formData) => {
    if (!db) return;
    setSaving(true);
    try {
      const dataToSave = { 
        ...formData, 
        updatedAt: serverTimestamp() 
      };

      if (editing?.id) {
        // Preserve original metadata
        delete dataToSave.id;
        delete dataToSave.createdAt;
        delete dataToSave.ownerId;
        delete dataToSave.ownerName;
        delete dataToSave.ownerRole;
        delete dataToSave.sector;
        
        await updateDoc(doc(db, "products", editing.id), dataToSave);
        showToast("Bidhaa imesasishwa!");
      } else {
        const canDirect = !!user?.canPublishDirect;
        dataToSave.ownerId = user?.uid || "admin";
        dataToSave.ownerName = user?.displayName || "Admin";
        dataToSave.ownerRole = user?.role || "admin";
        dataToSave.sector = "marketplace";
        dataToSave.status = canDirect ? "published" : "pending_review";
        dataToSave.published = canDirect;
        dataToSave.featured = formData.featured || false;
        dataToSave.createdAt = serverTimestamp();
        
        if (canDirect) {
          dataToSave.approvedBy = user?.uid || "admin";
          dataToSave.approvedAt = serverTimestamp();
        }
        
        await addDoc(collection(db, "products"), dataToSave);
        showToast("Bidhaa mpya imeongezwa!");
      }
      setShowForm(false);
      setEditing(null);
    } catch (e) {
      console.error(e);
      showToast("Imeshindwa: " + e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db, "products", product.id));
      showToast("Bidhaa imefutwa.");
      setConfirmDelete(null);
    } catch (err) {
      console.error(err);
      showToast("Imeshindwa kufuta.", "error");
    }
  };

  const handleStatusChange = async (product, newStatus) => {
    if (!db) return;
    try {
      const updateData = { 
        status: newStatus, 
        published: newStatus === "published",
        updatedAt: serverTimestamp() 
      };
      
      if (newStatus === "approved" || newStatus === "published") {
        updateData.approvedBy = user?.uid || "admin";
        updateData.approvedAt = serverTimestamp();
      }
      
      await updateDoc(doc(db, "products", product.id), updateData);
      showToast(`Hali ya bidhaa imebadilishwa kuwa ${newStatus}.`);
    } catch (err) {
      console.error(err);
      showToast("Imeshindwa.", "error");
    }
  };

  const handleToggle = async (product) => {
    if (!db) return;
    try {
      const newPublished = !product.published;
      await updateDoc(doc(db, "products", product.id), { 
        published: newPublished,
        status: newPublished ? "published" : "approved",
        updatedAt: serverTimestamp() 
      });
      showToast(newPublished ? "Bidhaa inaonekana sasa." : "Bidhaa imefichwa.");
    } catch (err) {
      console.error(err);
      showToast("Imeshindwa.", "error");
    }
  };

  const displayed = products.filter(p => {
    if (filterCat !== "all" && p.category !== filterCat) return false;
    if (search) {
      const q = search.toLowerCase();
      return (p.name||"").toLowerCase().includes(q) || (p.brand||"").toLowerCase().includes(q) || (p.location||"").toLowerCase().includes(q);
    }
    return true;
  });

  // Stats
  const total = products.length;
  const active = products.filter(p => p.isActive !== false).length;
  const featured = products.filter(p => p.isFeatured).length;
  const catCounts = Object.keys(MARKET_CATEGORIES).reduce((acc, k) => {
    acc[k] = products.filter(p => p.category === k).length;
    return acc;
  }, {});

  return (
    <div style={{ color: "#fff", fontFamily: "'Instrument Sans',system-ui,sans-serif" }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, padding: "13px 20px", borderRadius: 12, fontWeight: 700, fontSize: 13, background: toast.type === "error" ? "rgba(239,68,68,.95)" : "rgba(0,196,140,.95)", color: "#fff", boxShadow: "0 12px 32px rgba(0,0,0,.4)", animation: "slideUp .3s ease" }}>
          {toast.type === "error" ? "❌" : "✅"} {toast.msg}
        </div>
      )}
      <style>{`@keyframes slideUp{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>

      {/* Confirm delete */}
      {confirmDelete && (
        <div style={{ position: "fixed", inset: 0, zIndex: 800, background: "rgba(4,5,9,.85)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: "min(420px,90%)", borderRadius: 20, background: "#0e1018", border: "1px solid rgba(255,255,255,.1)", padding: 28 }}>
            <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 8 }}>⚠️ Futa Bidhaa</div>
            <p style={{ color: "rgba(255,255,255,.6)", fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
              Una uhakika wa kufuta &quot;{confirmDelete.name}&quot;? Kitendo hiki hakiwezi kurudishwa.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => handleDelete(confirmDelete)}
                style={{ flex: 1, height: 42, borderRadius: 10, border: "none", background: "rgba(239,68,68,.9)", color: "#fff", fontWeight: 800, cursor: "pointer" }}>
                Futa
              </button>
              <button onClick={() => setConfirmDelete(null)}
                style={{ flex: 1, height: 42, borderRadius: 10, border: "1px solid rgba(255,255,255,.1)", background: "transparent", color: "rgba(255,255,255,.6)", fontWeight: 700, cursor: "pointer" }}>
                Acha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 24, fontWeight: 900, margin: 0, letterSpacing: "-.03em" }}>
              🛒 STEA Marketplace
            </h2>
            <p style={{ color: "rgba(255,255,255,.45)", fontSize: 13, margin: "4px 0 0" }}>Simamia bidhaa za STEA Duka</p>
          </div>
          {!showForm && (
            <button onClick={() => { setEditing(null); setShowForm(true); }}
              style={{ padding: "10px 20px", borderRadius: 12, border: "none", background: G, color: "#111", fontWeight: 900, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
              + Ongeza Bidhaa
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(120px,1fr))", gap: 10, marginBottom: 20 }}>
        {[
          { label: "Bidhaa Zote", value: total, color: G },
          { label: "Zinaonekana", value: active, color: "#22c55e" },
          { label: "Featured", value: featured, color: "#8b5cf6" },
          ...Object.values(MARKET_CATEGORIES).map(c => ({ label: c.label, value: catCounts[c.id] || 0, color: c.color, emoji: c.emoji })),
        ].map((s, i) => (
          <div key={i} style={{ ...cardStyle, padding: "14px 16px" }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: s.color }}>{s.emoji && `${s.emoji} `}{s.value}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div style={{ ...cardStyle, marginBottom: 20, border: `1px solid ${G}30` }}>
          <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 16, color: G }}>
            {editing ? "✏️ Hariri Bidhaa" : "➕ Bidhaa Mpya"}
          </div>
          <ProductForm
            initial={editing}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditing(null); }}
            saving={saving}
          />
        </div>
      )}

      {/* Filter + Search */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Tafuta bidhaa..."
          style={{ ...inputStyle, height: 40, flex: 1, minWidth: 160 }}
          onFocus={e => e.target.style.borderColor = G}
          onBlur={e => e.target.style.borderColor = "rgba(255,255,255,.1)"}
        />
        <div style={{ display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none" }}>
          {[{ id: "all", label: "Zote", emoji: "📦" }, ...Object.values(MARKET_CATEGORIES)].map(c => (
            <button key={c.id} onClick={() => setFilterCat(c.id)}
              style={{ padding: "6px 12px", borderRadius: 999, fontSize: 11, fontWeight: 800, border: `1px solid ${filterCat === c.id ? G : "rgba(255,255,255,.1)"}`, background: filterCat === c.id ? `${G}15` : "transparent", color: filterCat === c.id ? G : "rgba(255,255,255,.5)", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Products list */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "rgba(255,255,255,.4)" }}>Inapakia bidhaa...</div>
      ) : displayed.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 24px", background: "rgba(255,255,255,.02)", borderRadius: 16, border: "1px solid rgba(255,255,255,.05)" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🛒</div>
          <p style={{ color: "rgba(255,255,255,.4)", fontSize: 14 }}>Hakuna bidhaa. Bonyeza &quot;Ongeza Bidhaa&quot; kuanza.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.35)", fontWeight: 700, marginBottom: 4 }}>
            {displayed.length} bidhaa {filterCat !== "all" ? `za ${MARKET_CATEGORIES[filterCat]?.label}` : "zote"}
          </div>
          {displayed.map(p => (
            <ProductRow
              key={p.id}
              product={p}
              onEdit={p => { setEditing(p); setShowForm(true); window.scrollTo(0, 0); }}
              onDelete={p => setConfirmDelete(p)}
              onToggle={handleToggle}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
