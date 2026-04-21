/**
 * WebsitesManager — Admin panel for Website Solutions
 * Supports: title · URL · category · subcategory · Cloudinary thumbnail · status · featured
 */
import React, { useState, useEffect, useRef } from "react";
import {
  getFirebaseDb, collection, query, limit, onSnapshot, where,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from "../../firebase.js";
import { Btn, Field, Input, Textarea, Select, Toast, ConfirmDialog, AdminThumb } from "../AdminUI.jsx";

const G = "#F5A623";
const G2 = "#FFD17C";

// ── Category / subcategory map ─────────────────────────
const CAT_MAP = {
  "Movies":       ["Free Movie", "Streaming", "Live TV", "Download"],
  "Education":    ["Learning", "Language", "Skills", "Courses"],
  "Tools":        ["AI Tools", "Design", "Productivity", "Writing"],
  "Business":     ["Business", "Jobs", "Finance", "E-Commerce"],
  "Entertainment":["Gaming", "Music", "Sports", "Lifestyle"],
  "General":      [],
};
const MAIN_CATS = Object.keys(CAT_MAP);

const EMPTY_FORM = {
  name: "", url: "", description: "", imageUrl: "",
  category: "Movies", subcategory: "", tags: "",
  featured: false, active: true, status: "published",
};

// ── Cloudinary upload field (drag-drop, progress, preview) ──
function CloudinaryField({ label, value, onChange }) {
  const [loading, setLoading]   = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError]       = useState(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef();

  const upload = async (file) => {
    if (!file) return;
    const allowed = ["image/jpeg","image/png","image/webp","image/gif","image/svg+xml"];
    if (!allowed.includes(file.type)) { setError("Only JPG, PNG, WebP, GIF or SVG allowed"); return; }
    if (file.size > 10 * 1024 * 1024) { setError("File must be under 10 MB"); return; }

    setError(null); setLoading(true); setProgress(0);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "stea_unsigned");

    try {
      // Use XMLHttpRequest for upload progress
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "https://api.cloudinary.com/v1_1/do87mivyq/image/upload");
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status === 200 && data.secure_url) {
            onChange(data.secure_url);
            setProgress(100);
            resolve();
          } else {
            reject(new Error(data.error?.message || "Upload failed"));
          }
        };
        xhr.onerror = () => reject(new Error("Network error"));
        xhr.send(formData);
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 1200);
    }
  };

  const onDrop = (e) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) upload(file);
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,.4)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {label}
      </label>

      {/* Drop zone */}
      <div
        onDragEnter={e => { e.preventDefault(); setDragging(true); }}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !value && fileRef.current?.click()}
        style={{
          borderRadius: 16, border: `2px dashed ${dragging ? G : value ? "rgba(255,255,255,.12)" : "rgba(255,255,255,.14)"}`,
          background: dragging ? `${G}0a` : value ? "rgba(255,255,255,.03)" : "rgba(255,255,255,.02)",
          padding: value ? 12 : 28,
          textAlign: "center", cursor: value ? "default" : "pointer",
          transition: "all .2s ease", position: "relative",
        }}
      >
        {/* Image preview */}
        {value && (
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ width: 90, height: 58, borderRadius: 10, overflow: "hidden", flexShrink: 0, border: "1px solid rgba(255,255,255,.1)", background: "#1a1d2e" }}>
              <img src={value} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} referrerPolicy="no-referrer" onError={e => e.target.style.display="none"} />
            </div>
            <div style={{ flex: 1, textAlign: "left" }}>
              <div style={{ fontSize: 12, color: "#4ade80", fontWeight: 700, marginBottom: 4 }}>✓ Uploaded to Cloudinary</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.35)", wordBreak: "break-all", lineHeight: 1.5 }}>{value.length > 60 ? value.slice(0,60)+"…" : value}</div>
            </div>
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              <button type="button" onClick={() => fileRef.current?.click()} style={{ padding: "6px 12px", background: `${G}14`, border: `1px solid ${G}30`, borderRadius: 8, color: G, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                Replace
              </button>
              <button type="button" onClick={() => onChange("")} style={{ padding: "6px 12px", background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.25)", borderRadius: 8, color: "#fca5a5", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                Remove
              </button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!value && !loading && (
          <div>
            <div style={{ fontSize: 32, marginBottom: 10, opacity: .4 }}>📸</div>
            <div style={{ fontWeight: 800, fontSize: 14, color: "rgba(255,255,255,.7)", marginBottom: 4 }}>
              Drop image here or click to browse
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.3)" }}>
              JPG, PNG, WebP, GIF · Max 10 MB · Uploaded to Cloudinary
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ padding: 8 }}>
            <div style={{ fontSize: 13, color: G, fontWeight: 700, marginBottom: 10 }}>
              Uploading to Cloudinary... {progress}%
            </div>
            <div style={{ height: 4, borderRadius: 999, background: "rgba(255,255,255,.08)" }}>
              <div style={{ height: "100%", borderRadius: 999, background: `linear-gradient(90deg,${G},${G2})`, width: `${progress}%`, transition: "width .2s ease" }} />
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && <div style={{ marginTop: 6, fontSize: 12, color: "#fca5a5", fontWeight: 700 }}>⚠️ {error}</div>}

      {/* URL fallback input */}
      <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
        <input
          type="text"
          placeholder="Or paste image URL directly..."
          value={value || ""}
          onChange={e => onChange(e.target.value)}
          style={{
            flex: 1, height: 38, borderRadius: 10, background: "rgba(255,255,255,.04)",
            border: "1px solid rgba(255,255,255,.1)", color: "#fff",
            padding: "0 12px", outline: "none", fontSize: 12,
          }}
        />
        <button type="button" onClick={() => fileRef.current?.click()} disabled={loading} style={{
          height: 38, padding: "0 16px", borderRadius: 10,
          background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.12)",
          color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", flexShrink: 0,
        }}>
          {loading ? "..." : "📁 Browse"}
        </button>
      </div>

      <input type="file" ref={fileRef} hidden accept="image/*" onChange={e => upload(e.target.files[0])} />
    </div>
  );
}

// ── Main component ─────────────────────────────────────
export default function WebsitesManager({ user }) {
  const [docs,    setDocs]    = useState([]);
  const [search,  setSearch]  = useState("");
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast,   setToast]   = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [filterCat, setFilterCat] = useState("All");

  const db = getFirebaseDb();
  const toast_ = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3200); };
  const setF = (patch) => setForm(f => ({ ...f, ...patch }));

  // Subcategories for selected main category
  const subCats = CAT_MAP[form.category] || [];

  useEffect(() => {
    if (!db) return;
    let q = query(collection(db, "websites"), limit(1000));
    if (user?.role === "creator") {
      q = query(collection(db, "websites"), where("ownerId", "==", user.uid), limit(1000));
    }
    return onSnapshot(q, (snap) => {
      const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      fetched.sort((a, b) => ((b.updatedAt?.seconds||0) - (a.updatedAt?.seconds||0)));
      setDocs(fetched);
    }, err => console.error("WebsitesManager:", err));
  }, [db, user?.role, user?.uid]);

  const save = async () => {
    const name = (form.name || "").trim();
    const url  = (form.url  || "").trim();
    if (!name) { toast_("Website name is required", "error"); return; }
    if (!url)  { toast_("URL is required", "error"); return; }

    setLoading(true);
    try {
      const data = {
        name,
        title: name,   // keep both fields consistent
        url,
        description: (form.description || "").trim(),
        imageUrl: form.imageUrl || "",
        image:    form.imageUrl || "",   // alias used by frontend
        category:    form.category    || "General",
        subcategory: form.subcategory || "",
        tags: (form.tags || "").split(",").map(t => t.trim()).filter(Boolean),
        featured: !!form.featured,
        active:   form.active ?? true,
        status:   form.status || "published",
        published: form.status === "published",
        updatedAt: serverTimestamp(),
      };

      if (!editing) {
        data.createdAt = serverTimestamp();
        data.ownerId   = user?.uid || "admin";
        data.ownerName = user?.displayName || "Admin";
        data.sector    = "websites";
        await addDoc(collection(db, "websites"), data);
        toast_("🚀 Website added!");
      } else {
        await updateDoc(doc(db, "websites", editing), data);
        toast_("✅ Updated!");
      }
      setForm(EMPTY_FORM);
      setEditing(null);
    } catch (e) {
      toast_(e.message, "error");
    }
    setLoading(false);
  };

  const del = (id) => {
    setConfirm({
      msg: "Delete this website?",
      onConfirm: async () => { await deleteDoc(doc(db, "websites", id)); setConfirm(null); toast_("Deleted"); },
      onCancel: () => setConfirm(null),
    });
  };

  const edit = (item) => {
    setEditing(item.id);
    setForm({ ...EMPTY_FORM, ...item, tags: (item.tags || []).join(", ") });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancel = () => { setEditing(null); setForm(EMPTY_FORM); };

  const filtered = docs.filter(item => {
    const q = search.toLowerCase();
    const matchSearch = !q || [(item.name||""),(item.url||""),(item.category||""),(item.subcategory||"")].some(v => v.toLowerCase().includes(q));
    const matchCat = filterCat === "All" || item.category === filterCat || item.subcategory === filterCat;
    return matchSearch && matchCat;
  });

  const inputSt = {
    width: "100%", height: 44, borderRadius: 12,
    background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)",
    color: "#fff", padding: "0 14px", outline: "none", fontSize: 14,
    fontFamily: "inherit",
  };
  const labelSt = { display: "block", fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,.4)", marginBottom: 7, textTransform: "uppercase", letterSpacing: "0.08em" };
  const selSt   = { ...inputSt, appearance: "none", cursor: "pointer" };

  return (
    <div>
      {toast   && <Toast msg={toast.msg} type={toast.type} />}
      {confirm && <ConfirmDialog {...confirm} />}

      {/* ── Form ── */}
      <div style={{ borderRadius: 20, border: "1px solid rgba(255,255,255,.09)", background: "#141823", padding: 24, marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <h3 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 20, fontWeight: 900, margin: 0 }}>
            {editing ? "✏️ Edit Website" : "➕ Add Website"}
          </h3>
          {editing && (
            <button onClick={cancel} style={{ padding: "6px 14px", borderRadius: 10, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "rgba(255,255,255,.55)", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
              Cancel
            </button>
          )}
        </div>

        <div style={{ display: "grid", gap: 16 }}>
          {/* Name */}
          <div>
            <label style={labelSt}>Website Name *</label>
            <input style={inputSt} value={form.name} onChange={e => setF({ name: e.target.value })} placeholder="e.g. FMovies, ChatGPT, Canva" />
          </div>

          {/* URL */}
          <div>
            <label style={labelSt}>Website URL *</label>
            <input style={inputSt} value={form.url} onChange={e => setF({ url: e.target.value })} placeholder="https://example.com" />
          </div>

          {/* Thumbnail — Cloudinary */}
          <CloudinaryField
            label="Thumbnail Image"
            value={form.imageUrl}
            onChange={val => setF({ imageUrl: val })}
          />

          {/* Category + Subcategory */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={labelSt}>Main Category *</label>
              <select style={selSt} value={form.category} onChange={e => setF({ category: e.target.value, subcategory: "" })}>
                {MAIN_CATS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={labelSt}>Subcategory</label>
              <select style={selSt} value={form.subcategory} onChange={e => setF({ subcategory: e.target.value })} disabled={!subCats.length}>
                <option value="">— None —</option>
                {subCats.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Status + Featured */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={labelSt}>Status</label>
              <select style={selSt} value={form.status} onChange={e => setF({ status: e.target.value })}>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="pending_review">Pending Review</option>
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 22 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input type="checkbox" checked={!!form.featured} onChange={e => setF({ featured: e.target.checked })} style={{ width: 16, height: 16, accentColor: G }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,.7)" }}>Featured / Pinned</span>
              </label>
            </div>
          </div>

          {/* Description (optional, admin-only) */}
          <div>
            <label style={labelSt}>Description (optional — not shown on cards)</label>
            <textarea style={{ ...inputSt, height: 70, resize: "vertical", padding: "10px 14px", lineHeight: 1.5 }} value={form.description} onChange={e => setF({ description: e.target.value })} placeholder="Internal notes or short description..." />
          </div>

          {/* Tags */}
          <div>
            <label style={labelSt}>Tags (comma separated)</label>
            <input style={inputSt} value={form.tags} onChange={e => setF({ tags: e.target.value })} placeholder="free, movies, streaming" />
          </div>

          {/* Card preview */}
          {form.imageUrl && (
            <div>
              <label style={labelSt}>Card Preview</label>
              <div style={{ borderRadius: 16, overflow: "hidden", maxWidth: 300, aspectRatio: "16/10", position: "relative", background: "#0d0f1a", border: "1px solid rgba(255,255,255,.1)" }}>
                <img src={form.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} referrerPolicy="no-referrer" />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(0,0,0,.55) 0%,rgba(0,0,0,.1) 40%,rgba(0,0,0,.1) 55%,rgba(0,0,0,.75) 100%)" }} />
                {(form.subcategory || form.category) && (
                  <div style={{ position: "absolute", top: 10, left: 10, padding: "3px 10px", borderRadius: 999, background: "rgba(0,0,0,.6)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,.18)", fontSize: 9, fontWeight: 900, color: "#fff", textTransform: "uppercase", letterSpacing: "0.09em" }}>
                    {form.subcategory || form.category}
                  </div>
                )}
                <div style={{ position: "absolute", bottom: 42, left: 14, right: 14 }}>
                  <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 13, fontWeight: 900, color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,.7)" }}>{form.name || "Website Name"}</div>
                </div>
                <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)" }}>
                  <div style={{ padding: "5px 16px", borderRadius: 8, background: "rgba(255,255,255,.18)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,.28)", fontSize: 11, fontWeight: 800, color: "#fff", whiteSpace: "nowrap" }}>Visit Website →</div>
                </div>
              </div>
            </div>
          )}

          {/* Save button */}
          <button onClick={save} disabled={loading} style={{
            height: 50, borderRadius: 14, border: "none",
            background: loading ? "rgba(245,166,35,.5)" : `linear-gradient(135deg,${G},${G2})`,
            color: "#111", fontWeight: 900, fontSize: 15, cursor: loading ? "default" : "pointer",
            boxShadow: loading ? "none" : `0 6px 22px ${G}35`,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            {loading ? "Saving..." : editing ? "💾 Save Changes" : "🚀 Publish Website"}
          </button>
        </div>
      </div>

      {/* ── List filters + search ── */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search websites..." style={{ ...inputSt, paddingLeft: 38, width: "100%", boxSizing: "border-box" }} />
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", opacity: .4, pointerEvents: "none" }}>🔍</span>
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ ...selSt, width: "auto", flex: "0 0 auto" }}>
          <option value="All">All Categories</option>
          {MAIN_CATS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* ── Document list ── */}
      <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
        {filtered.length} website{filtered.length !== 1 ? "s" : ""}
      </div>
      <div style={{ display: "grid", gap: 10 }}>
        {filtered.map(item => (
          <div key={item.id} style={{ borderRadius: 14, border: `1px solid ${item.status === "published" ? "rgba(255,255,255,.07)" : "rgba(245,166,35,.15)"}`, background: "#1a1d2e", padding: "12px 16px", display: "flex", gap: 12, alignItems: "center" }}>
            {/* Thumb */}
            <div style={{ width: 72, height: 46, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: "#0d0f1a", border: "1px solid rgba(255,255,255,.08)" }}>
              {(item.imageUrl || item.image)
                ? <img src={item.imageUrl || item.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} referrerPolicy="no-referrer" onError={e => e.target.style.display="none"} />
                : <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", fontSize: 18, opacity: .2 }}>🌐</div>
              }
            </div>
            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name || item.title}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.38)", display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span style={{ padding: "1px 7px", borderRadius: 4, background: "rgba(255,255,255,.06)", fontWeight: 700 }}>{item.category}</span>
                {item.subcategory && <span style={{ padding: "1px 7px", borderRadius: 4, background: "rgba(245,166,35,.1)", color: G, fontWeight: 700 }}>{item.subcategory}</span>}
                <span style={{ color: item.status === "published" ? "#4ade80" : G, fontWeight: 700, textTransform: "uppercase" }}>{item.status}</span>
                {item.featured && <span style={{ color: G, fontWeight: 800 }}>★ Featured</span>}
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.2)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.url}</div>
            </div>
            {/* Actions */}
            <div style={{ display: "flex", gap: 7, flexShrink: 0 }}>
              <button onClick={() => edit(item)} style={{ padding: "7px 12px", borderRadius: 10, background: `${G}12`, border: `1px solid ${G}25`, color: G, fontWeight: 800, fontSize: 12, cursor: "pointer" }}>Edit</button>
              <button onClick={() => del(item.id)} style={{ padding: "7px 12px", borderRadius: 10, background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.25)", color: "#fca5a5", fontWeight: 800, fontSize: 12, cursor: "pointer" }}>Delete</button>
            </div>
          </div>
        ))}
        {!filtered.length && (
          <div style={{ textAlign: "center", padding: "48px 20px", borderRadius: 16, border: "1px dashed rgba(255,255,255,.08)", color: "rgba(255,255,255,.3)", fontSize: 14 }}>
            {search ? `No websites matching "${search}"` : "No websites yet. Add your first one above."}
          </div>
        )}
      </div>
    </div>
  );
}
