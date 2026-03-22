import { useState, useEffect, useCallback, useRef } from "react";
import Cropper from "react-easy-crop";
import {
  getFirebaseDb, collection, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, query, orderBy, onSnapshot,
} from "../firebase.js";
import { timeAgo, fmtViews } from "../hooks/useFirestore.js";

const G = "#F5A623", G2 = "#FFD17C";

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

const Select = ({ children, ...props }) => (
  <select {...props} style={{ height:46, borderRadius:12, border:"1px solid rgba(255,255,255,.1)",
    background:"#1a1d2e", color:"#fff", padding:"0 14px", outline:"none",
    fontFamily:"inherit", fontSize:14, width:"100%", cursor:"pointer", ...props.style }}>
    {children}
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

// ── Stats Card ────────────────────────────────────────
function StatCard({ icon, label, value, color = G }) {
  return (
    <div style={{ borderRadius:18, border:"1px solid rgba(255,255,255,.08)", background:"#141823",
      padding:"20px 24px", display:"flex", alignItems:"center", gap:16 }}>
      <div style={{ width:52, height:52, borderRadius:14, display:"grid", placeItems:"center",
        background:`${color}18`, fontSize:26 }}>{icon}</div>
      <div>
        <div style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:28, fontWeight:800,
          color, lineHeight:1 }}>{value}</div>
        <div style={{ fontSize:13, color:"rgba(255,255,255,.45)", marginTop:4 }}>{label}</div>
      </div>
    </div>
  );
}

// ── Confirm Delete Dialog ─────────────────────────────
function ConfirmDialog({ msg, onConfirm, onCancel }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:800, background:"rgba(4,5,9,.85)",
      backdropFilter:"blur(10px)", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ width:"min(420px,90%)", borderRadius:22, border:"1px solid rgba(255,255,255,.12)",
        background:"rgba(16,18,28,.98)", padding:28, boxShadow:"0 24px 60px rgba(0,0,0,.5)" }}>
        <div style={{ fontSize:18, fontWeight:800, marginBottom:8 }}>⚠️ Confirm Delete</div>
        <p style={{ color:"rgba(255,255,255,.6)", fontSize:14, lineHeight:1.7, margin:"0 0 24px" }}>{msg}</p>
        <div style={{ display:"flex", gap:10 }}>
          <Btn onClick={onConfirm} color="rgba(239,68,68,.9)" textColor="#fff">🗑️ Futa</Btn>
          <Btn onClick={onCancel} color="rgba(255,255,255,.08)" textColor="#fff">Acha</Btn>
        </div>
      </div>
    </div>
  );
}

// ── Image Cropper Modal ───────────────────────────────
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

const getCroppedImg = async (imageSrc, pixelCrop, maxWidth = 800, maxHeight = 800) => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) return null;

  let targetWidth = pixelCrop.width;
  let targetHeight = pixelCrop.height;

  if (targetWidth > maxWidth) {
    const ratio = maxWidth / targetWidth;
    targetWidth = maxWidth;
    targetHeight = targetHeight * ratio;
  }
  if (targetHeight > maxHeight) {
    const ratio = maxHeight / targetHeight;
    targetHeight = maxHeight;
    targetWidth = targetWidth * ratio;
  }

  canvas.width = targetWidth;
  canvas.height = targetHeight;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    targetWidth,
    targetHeight
  );

  // Return as base64 (compressed to keep it under 1MB)
  return canvas.toDataURL("image/jpeg", 0.7);
};

function CropperModal({ image, onCrop, onCancel, aspect = 16 / 9, maxWidth = 800, maxHeight = 800 }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [loading, setLoading] = useState(false);

  const onCropComplete = useCallback((_, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleDone = async () => {
    setLoading(true);
    try {
      const croppedImage = await getCroppedImg(image, croppedAreaPixels, maxWidth, maxHeight);
      onCrop(croppedImage);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 900, background: "rgba(4,5,9,.95)", display: "flex", flexDirection: "column" }}>
      <div style={{ position: "relative", flex: 1, background: "#000" }}>
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={setCrop}
          onCropComplete={onCropComplete}
          onZoomChange={setZoom}
        />
      </div>
      <div style={{ padding: 20, background: "#141823", display: "flex", gap: 12, justifyContent: "center", alignItems: "center" }}>
        <div style={{ flex: 1, maxWidth: 300 }}>
          <label style={{ fontSize: 12, color: "rgba(255,255,255,.5)", display: "block", marginBottom: 8 }}>Zoom: {zoom.toFixed(1)}x</label>
          <input type="range" min={1} max={3} step={0.1} value={zoom} onChange={e => setZoom(parseFloat(e.target.value))} style={{ width: "100%", accentColor: G }} />
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Btn onClick={onCancel} color="rgba(255,255,255,.1)" textColor="#fff">Ghairi</Btn>
          <Btn onClick={handleDone} disabled={loading}>{loading ? "Inakata..." : "✅ Maliza & Tumia"}</Btn>
        </div>
      </div>
    </div>
  );
}

function ImageUploadField({ label, value, onChange, aspect = 16 / 9, maxWidth = 800, maxHeight = 800 }) {
  const [tempImg, setTempImg] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const onFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setLoading(true);
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setTempImg(reader.result);
        setLoading(false);
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const isDataUrl = value && value.startsWith("data:image/");

  return (
    <Field label={label}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10 }}>
        {isDataUrl ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 12, padding: "0 14px", height: 46 }}>
            <span style={{ color: "#00C48C", fontSize: 14, flex: 1 }}>✅ Image Uploaded</span>
            <button onClick={() => onChange("")} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,.5)", cursor: "pointer", fontSize: 16 }}>✕</button>
          </div>
        ) : (
          <Input value={value || ""} onChange={e => onChange(e.target.value)} placeholder="Weka link ya picha (sio website) au upload ➔" />
        )}
        <Btn onClick={() => fileInputRef.current.click()} color="rgba(255,255,255,.08)" textColor="#fff" style={{ padding: "0 14px" }} disabled={loading}>
          {loading ? "⏳..." : "📸 Crop & Upload"}
        </Btn>
        <input type="file" ref={fileInputRef} onChange={onFileChange} accept="image/*" style={{ display: "none" }} />
      </div>
      {tempImg && (
        <CropperModal
          image={tempImg}
          aspect={aspect}
          maxWidth={maxWidth}
          maxHeight={maxHeight}
          onCancel={() => setTempImg(null)}
          onCrop={(cropped) => {
            onChange(cropped);
            setTempImg(null);
          }}
        />
      )}
    </Field>
  );
}

// ══════════════════════════════════════════════════════
// TIPS MANAGER
// ══════════════════════════════════════════════════════
function TipsManager() {
  const [docs, setDocs] = useState([]);
  const [form, setForm] = useState({ type:"article", badge:"Android", title:"", summary:"", content:"", imageUrl:"", tags:"", readTime:"5 min", platform:"youtube", embedUrl:"", channel:"", channelImg:"🎙️", duration:"" });
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast,   setToast]   = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [tab,     setTab]     = useState("article");

  const db = getFirebaseDb();
  const toast_ = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "tips"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setDocs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.error("Error loading tips:", err);
    });
    return () => unsub();
  }, [db]);

  const save = async () => {
    if (!form.title.trim()) { toast_("Weka title kwanza","error"); return; }
    setLoading(true);
    try {
      const data = { ...form, tags: form.tags.split(",").map(t=>t.trim()).filter(Boolean), views:0, createdAt: serverTimestamp() };
      if (editing) {
        const updateData = { ...data };
        delete updateData.id;
        delete updateData.createdAt;
        await updateDoc(doc(db,"tips",editing), updateData);
        toast_("Imesahihishwa!");
      }
      else          { await addDoc(collection(db,"tips"), data); toast_("Imewekwa live!"); }
      setForm({ type:"article", badge:"Android", title:"", summary:"", content:"", imageUrl:"", tags:"", readTime:"5 min", platform:"youtube", embedUrl:"", channel:"", channelImg:"🎙️", duration:"" });
      setEditing(null);
    } catch(e) { toast_(e.message,"error"); }
    setLoading(false);
  };

  const del = async (id) => {
    setConfirm({ msg:"Una uhakika unataka kufuta post hii? Haiwezi kurejeshwa.", onConfirm: async()=>{ await deleteDoc(doc(db,"tips",id)); setConfirm(null); toast_("Imefutwa"); }, onCancel:()=>setConfirm(null) });
  };

  const edit = (item) => { setEditing(item.id); setForm({...item, tags:(item.tags||[]).join(", ")}); setTab(item.type||"article"); window.scrollTo({top:0,behavior:"smooth"}); };

  return (
    <div>
      {toast   && <Toast msg={toast.msg} type={toast.type}/>}
      {confirm && <ConfirmDialog {...confirm}/>}

      {/* Form */}
      <div style={{ borderRadius:20, border:"1px solid rgba(255,255,255,.08)", background:"#141823", padding:24, marginBottom:28 }}>
        <h3 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:20, margin:"0 0 20px" }}>
          {editing ? "✏️ Hariri Post" : "➕ Ongeza Post Mpya"}
        </h3>

        {/* Type tabs */}
        <div style={{ display:"flex", gap:8, marginBottom:20 }}>
          {["article","video"].map(t=>(
            <button key={t} onClick={()=>{setTab(t);setForm(f=>({...f,type:t}));}}
              style={{ border:"none", borderRadius:10, padding:"9px 18px", cursor:"pointer", fontWeight:800, fontSize:13,
                background:tab===t?`linear-gradient(135deg,${G},${G2})`:"rgba(255,255,255,.06)", color:tab===t?"#111":"rgba(255,255,255,.6)" }}>
              {t==="article"?"📝 Article":"🎬 Video"}
            </button>
          ))}
        </div>

        <div style={{ display:"grid", gap:16 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr", gap:16 }}>
            <Field label="Badge (Android / AI / PC etc)">
              <Input value={form.badge} onChange={e=>setForm(f=>({...f,badge:e.target.value}))} placeholder="Android"/>
            </Field>
          </div>

          <ImageUploadField label="Thumbnail Image URL (Optional)" value={form.imageUrl} onChange={val => setForm(f => ({ ...f, imageUrl: val }))} aspect={16/9} maxWidth={800} maxHeight={450} />

          <Field label="Title *">
            <Input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Andika title ya post hapa..."/>
          </Field>

          <Field label="Summary (maelezo mafupi)">
            <Textarea value={form.summary} onChange={e=>setForm(f=>({...f,summary:e.target.value}))} placeholder="Maelezo mafupi yanayoonekana kwenye card..." style={{minHeight:70}}/>
          </Field>

          {tab==="article" && <>
            <Field label="Content kamili (maudhui yote ya article)">
              <Textarea value={form.content} onChange={e=>setForm(f=>({...f,content:e.target.value}))} placeholder="Andika content yote ya article hapa. Unaweza kutumia line breaks..." style={{minHeight:180}}/>
            </Field>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              <Field label="Read time">
                <Input value={form.readTime} onChange={e=>setForm(f=>({...f,readTime:e.target.value}))} placeholder="5 min"/>
              </Field>
              <Field label="Tags (tenganisha kwa comma)">
                <Input value={form.tags} onChange={e=>setForm(f=>({...f,tags:e.target.value}))} placeholder="#android, #speed, #tips"/>
              </Field>
            </div>
          </>}

          {tab==="video" && <>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              <Field label="Platform">
                <Select value={form.platform} onChange={e=>setForm(f=>({...f,platform:e.target.value}))}>
                  <option value="youtube">YouTube</option>
                  <option value="tiktok">TikTok</option>
                </Select>
              </Field>
              <Field label="Duration (e.g. 12:30)">
                <Input value={form.duration} onChange={e=>setForm(f=>({...f,duration:e.target.value}))} placeholder="12:30"/>
              </Field>
            </div>
            <Field label="YouTube/TikTok Embed URL">
              <Input value={form.embedUrl} onChange={e=>setForm(f=>({...f,embedUrl:e.target.value}))} placeholder="https://www.youtube.com/embed/VIDEO_ID"/>
            </Field>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              <Field label="Channel Name">
                <Input value={form.channel} onChange={e=>setForm(f=>({...f,channel:e.target.value}))} placeholder="TechKe Tanzania"/>
              </Field>
              <Field label="Channel Emoji/Icon">
                <Input value={form.channelImg} onChange={e=>setForm(f=>({...f,channelImg:e.target.value}))} placeholder="🎙️"/>
              </Field>
            </div>
          </>}

          <div style={{ display:"flex", gap:10 }}>
            <Btn onClick={save} disabled={loading}>{loading?"Inahifadhi...":editing?"💾 Hifadhi Mabadiliko":"🚀 Weka Live"}</Btn>
            {editing && <Btn onClick={()=>{setEditing(null);setForm({type:"article",badge:"Android",title:"",summary:"",content:"",imageUrl:"",tags:"",readTime:"5 min",platform:"youtube",embedUrl:"",channel:"",channelImg:"🎙️",duration:""});}} color="rgba(255,255,255,.08)" textColor="#fff">✕ Acha</Btn>}
          </div>
        </div>
      </div>

      {/* Posts list */}
      <div style={{ display:"grid", gap:12 }}>
        {docs.length===0 && <div style={{ textAlign:"center", padding:40, color:"rgba(255,255,255,.35)", fontSize:15 }}>Hakuna posts bado. Ongeza ya kwanza! 👆</div>}
        {docs.map(item=>(
          <div key={item.id} style={{ borderRadius:16, border:"1px solid rgba(255,255,255,.07)", background:"#1a1d2e", padding:"16px 20px", display:"flex", gap:14, alignItems:"center", flexWrap:"wrap" }}>
            <div style={{ width:48, height:48, borderRadius:10, overflow:"hidden", display:"grid", placeItems:"center", background:"rgba(255,255,255,.05)", flexShrink:0 }}>
              {item.imageUrl && <img src={item.imageUrl} style={{ width:"100%", height:"100%", objectFit:"cover" }} referrerPolicy="no-referrer" />}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:4, flexWrap:"wrap" }}>
                <span style={{ fontSize:11, fontWeight:800, padding:"3px 8px", borderRadius:6, background:"rgba(245,166,35,.15)", color:G }}>{item.badge}</span>
                <span style={{ fontSize:11, padding:"3px 8px", borderRadius:6, background:"rgba(255,255,255,.06)", color:"rgba(255,255,255,.5)" }}>{item.type==="video"?"🎬 Video":"📝 Article"}</span>
                <span style={{ fontSize:12, color:"rgba(255,255,255,.35)" }}>{timeAgo(item.createdAt)}</span>
              </div>
              <div style={{ fontWeight:800, fontSize:15, marginBottom:2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{item.title}</div>
              <div style={{ fontSize:13, color:"rgba(255,255,255,.4)" }}>👁 {fmtViews(item.views)} views</div>
            </div>
            <div style={{ display:"flex", gap:8, flexShrink:0 }}>
              <Btn onClick={()=>edit(item)} color="rgba(245,166,35,.12)" textColor={G} style={{padding:"8px 14px"}}>✏️ Hariri</Btn>
              <Btn onClick={()=>del(item.id)} color="rgba(239,68,68,.12)" textColor="#fca5a5" style={{padding:"8px 14px"}}>🗑️</Btn>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// UPDATES MANAGER
// ══════════════════════════════════════════════════════
function UpdatesManager() {
  const [docs, setDocs] = useState([]);
  const [form, setForm] = useState({ type:"article", badge:"AI", category:"Artificial Intelligence", title:"", summary:"", content:"", imageUrl:"", source:"", platform:"youtube", embedUrl:"", channel:"", channelImg:"🔥", duration:"" });
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast,   setToast]   = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [tab,     setTab]     = useState("article");

  const db = getFirebaseDb();
  const toast_ = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "updates"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setDocs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.error("Error loading updates:", err);
    });
    return () => unsub();
  }, [db]);

  const save = async () => {
    if (!form.title.trim()) { toast_("Weka title kwanza","error"); return; }
    setLoading(true);
    try {
      const data = { ...form, views:0, createdAt: serverTimestamp() };
      if (editing) {
        const updateData = { ...data };
        delete updateData.id;
        delete updateData.createdAt;
        await updateDoc(doc(db,"updates",editing), updateData);
        toast_("Imesahihishwa!");
      }
      else          { await addDoc(collection(db,"updates"), data); toast_("Imewekwa live!"); }
      setForm({ type:"article", badge:"AI", category:"Artificial Intelligence", title:"", summary:"", content:"", imageUrl:"", source:"", platform:"youtube", embedUrl:"", channel:"", channelImg:"🔥", duration:"" });
      setEditing(null);
    } catch(e) { toast_(e.message,"error"); }
    setLoading(false);
  };

  const del = async (id) => {
    setConfirm({ msg:"Una uhakika unataka kufuta habari hii?", onConfirm:async()=>{ await deleteDoc(doc(db,"updates",id)); setConfirm(null); toast_("Imefutwa"); }, onCancel:()=>setConfirm(null) });
  };

  const edit = (item) => { setEditing(item.id); setForm({...item}); setTab(item.type||"article"); window.scrollTo({top:0,behavior:"smooth"}); };

  return (
    <div>
      {toast   && <Toast msg={toast.msg} type={toast.type}/>}
      {confirm && <ConfirmDialog {...confirm}/>}

      <div style={{ borderRadius:20, border:"1px solid rgba(255,255,255,.08)", background:"#141823", padding:24, marginBottom:28 }}>
        <h3 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:20, margin:"0 0 20px" }}>
          {editing ? "✏️ Hariri Habari" : "➕ Ongeza Habari Mpya"}
        </h3>
        <div style={{ display:"flex", gap:8, marginBottom:20 }}>
          {["article","video"].map(t=>(
            <button key={t} onClick={()=>{setTab(t);setForm(f=>({...f,type:t}));}}
              style={{ border:"none", borderRadius:10, padding:"9px 18px", cursor:"pointer", fontWeight:800, fontSize:13,
                background:tab===t?`linear-gradient(135deg,${G},${G2})`:"rgba(255,255,255,.06)", color:tab===t?"#111":"rgba(255,255,255,.6)" }}>
              {t==="article"?"📰 Article/Habari":"🎬 Video"}
            </button>
          ))}
        </div>

        <div style={{ display:"grid", gap:16 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            <Field label="Badge (AI / Android / Africa etc)">
              <Input value={form.badge} onChange={e=>setForm(f=>({...f,badge:e.target.value}))} placeholder="AI"/>
            </Field>
            <Field label="Category">
              <Input value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} placeholder="Artificial Intelligence"/>
            </Field>
          </div>

          <ImageUploadField label="Thumbnail Image URL (Optional)" value={form.imageUrl} onChange={val => setForm(f => ({ ...f, imageUrl: val }))} maxWidth={800} maxHeight={450} />

          <Field label="Title *">
            <Input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Habari title..."/>
          </Field>
          <Field label="Summary">
            <Textarea value={form.summary} onChange={e=>setForm(f=>({...f,summary:e.target.value}))} placeholder="Maelezo mafupi ya habari..." style={{minHeight:70}}/>
          </Field>

          {tab==="article" && <>
            <Field label="Content kamili">
              <Textarea value={form.content} onChange={e=>setForm(f=>({...f,content:e.target.value}))} placeholder="Maelezo yote ya habari hii..." style={{minHeight:180}}/>
            </Field>
            <Field label="Source (TechCrunch, GSMArena etc)">
              <Input value={form.source} onChange={e=>setForm(f=>({...f,source:e.target.value}))} placeholder="TechCrunch"/>
            </Field>
          </>}

          {tab==="video" && <>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              <Field label="Platform">
                <Select value={form.platform} onChange={e=>setForm(f=>({...f,platform:e.target.value}))}>
                  <option value="youtube">YouTube</option>
                  <option value="tiktok">TikTok</option>
                </Select>
              </Field>
              <Field label="Duration">
                <Input value={form.duration} onChange={e=>setForm(f=>({...f,duration:e.target.value}))} placeholder="8:42"/>
              </Field>
            </div>
            <Field label="Embed URL">
              <Input value={form.embedUrl} onChange={e=>setForm(f=>({...f,embedUrl:e.target.value}))} placeholder="https://www.youtube.com/embed/VIDEO_ID"/>
            </Field>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              <Field label="Channel Name">
                <Input value={form.channel} onChange={e=>setForm(f=>({...f,channel:e.target.value}))} placeholder="Fireship"/>
              </Field>
              <Field label="Channel Emoji">
                <Input value={form.channelImg} onChange={e=>setForm(f=>({...f,channelImg:e.target.value}))} placeholder="🔥"/>
              </Field>
            </div>
          </>}

          <div style={{ display:"flex", gap:10 }}>
            <Btn onClick={save} disabled={loading}>{loading?"Inahifadhi...":editing?"💾 Hifadhi":"🚀 Weka Live"}</Btn>
            {editing && <Btn onClick={()=>{setEditing(null);setForm({type:"article",badge:"AI",category:"Artificial Intelligence",title:"",summary:"",content:"",imageUrl:"",source:"",platform:"youtube",embedUrl:"",channel:"",channelImg:"🔥",duration:""});}} color="rgba(255,255,255,.08)" textColor="#fff">✕ Acha</Btn>}
          </div>
        </div>
      </div>

      <div style={{ display:"grid", gap:12 }}>
        {docs.length===0 && <div style={{ textAlign:"center", padding:40, color:"rgba(255,255,255,.35)", fontSize:15 }}>Hakuna habari bado. Ongeza ya kwanza! 👆</div>}
        {docs.map(item=>(
          <div key={item.id} style={{ borderRadius:16, border:"1px solid rgba(255,255,255,.07)", background:"#1a1d2e", padding:"16px 20px", display:"flex", gap:14, alignItems:"center", flexWrap:"wrap" }}>
            <div style={{ width:48, height:48, borderRadius:10, overflow:"hidden", display:"grid", placeItems:"center", background:"rgba(255,255,255,.05)", flexShrink:0 }}>
              {item.imageUrl && <img src={item.imageUrl} style={{ width:"100%", height:"100%", objectFit:"cover" }} referrerPolicy="no-referrer" />}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:"flex", gap:8, marginBottom:4, flexWrap:"wrap" }}>
                <span style={{ fontSize:11, fontWeight:800, padding:"3px 8px", borderRadius:6, background:"rgba(245,166,35,.15)", color:G }}>{item.badge}</span>
                <span style={{ fontSize:11, color:"rgba(255,255,255,.35)" }}>{timeAgo(item.createdAt)}</span>
              </div>
              <div style={{ fontWeight:800, fontSize:15, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{item.title}</div>
              <div style={{ fontSize:13, color:"rgba(255,255,255,.4)" }}>👁 {fmtViews(item.views)} views {item.source?`· via ${item.source}`:""}</div>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <Btn onClick={()=>edit(item)} color="rgba(245,166,35,.12)" textColor={G} style={{padding:"8px 14px"}}>✏️</Btn>
              <Btn onClick={()=>del(item.id)} color="rgba(239,68,68,.12)" textColor="#fca5a5" style={{padding:"8px 14px"}}>🗑️</Btn>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// DEALS MANAGER
// ══════════════════════════════════════════════════════
function DealsManager() {
  const [docs, setDocs] = useState([]);
  const [form, setForm] = useState({ imageUrl:"", name:"", domain:"", url:"", bg:"linear-gradient(135deg,#00c4cc,#7d2ae8)", badge:"", bt:"gold", meta:"", desc:"", oldP:"", newP:"", save:"", code:"", ref:false, active:true });
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast,   setToast]   = useState(null);
  const [confirm, setConfirm] = useState(null);

  const db = getFirebaseDb();
  const toast_ = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "deals"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setDocs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.error("Error loading deals:", err);
    });
    return () => unsub();
  }, [db]);

  const save = async () => {
    if (!form.name.trim()||!form.url.trim()) { toast_("Weka jina na URL kwanza","error"); return; }
    setLoading(true);
    try {
      const data = { ...form, createdAt: serverTimestamp() };
      if (editing) {
        const updateData = { ...data };
        delete updateData.id;
        delete updateData.createdAt;
        await updateDoc(doc(db,"deals",editing), updateData);
        toast_("Imesahihishwa!");
      }
      else          { await addDoc(collection(db,"deals"), data); toast_("Deal imewekwa live!"); }
      setForm({ imageUrl:"", name:"", domain:"", url:"", bg:"linear-gradient(135deg,#00c4cc,#7d2ae8)", badge:"", bt:"gold", meta:"", desc:"", oldP:"", newP:"", save:"", code:"", ref:false, active:true });
      setEditing(null);
    } catch(e) { toast_(e.message,"error"); }
    setLoading(false);
  };

  const del = async (id) => {
    setConfirm({
      msg: "Una uhakika unataka kufuta deal hii? Hatua hii haiwezi kurejeshwa.",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "deals", id));
          setConfirm(null);
          toast_("Deal imefutwa");
        } catch (e) {
          toast_(e.message, "error");
        }
      },
      onCancel: () => setConfirm(null)
    });
  };

  const toggle = async (item) => {
    await updateDoc(doc(db,"deals",item.id), { active:!item.active });
  };

  return (
    <div>
      {toast   && <Toast msg={toast.msg} type={toast.type}/>}
      {confirm && <ConfirmDialog {...confirm}/>}

      <div style={{ borderRadius:20, border:"1px solid rgba(255,255,255,.08)", background:"#141823", padding:24, marginBottom:28 }}>
        <h3 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:20, margin:"0 0 20px" }}>
          {editing?"✏️ Hariri Deal":"➕ Ongeza Deal Mpya"}
        </h3>
        <div style={{ display:"grid", gap:16 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            <Field label="Jina la Deal *"><Input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Canva Pro"/></Field>
            <Field label="Domain"><Input value={form.domain} onChange={e=>setForm(f=>({...f,domain:e.target.value}))} placeholder="canva.com"/></Field>
          </div>
          <ImageUploadField label="Real Image URL (Optional)" value={form.imageUrl} onChange={val => setForm(f => ({ ...f, imageUrl: val }))} aspect={16/9} maxWidth={800} maxHeight={450} />
          <Field label="URL ya Affiliate Link *"><Input value={form.url} onChange={e=>setForm(f=>({...f,url:e.target.value}))} placeholder="https://canva.com/affiliates/..."/></Field>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            <Field label="Badge Text"><Input value={form.badge} onChange={e=>setForm(f=>({...f,badge:e.target.value}))} placeholder="-60%"/></Field>
            <Field label="Badge Color">
              <Select value={form.bt} onChange={e=>setForm(f=>({...f,bt:e.target.value}))}>
                <option value="gold">Gold</option><option value="blue">Blue</option>
                <option value="red">Red</option><option value="purple">Purple</option><option value="gray">Gray</option>
              </Select>
            </Field>
          </div>
          <Field label="Meta (Partner deal · Promo code)"><Input value={form.meta} onChange={e=>setForm(f=>({...f,meta:e.target.value}))} placeholder="Partner deal · Promo code"/></Field>
          <Field label="Maelezo"><Textarea value={form.desc} onChange={e=>setForm(f=>({...f,desc:e.target.value}))} placeholder="Maelezo ya deal hii..." style={{minHeight:80}}/></Field>

          {/* Referral toggle */}
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <label style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", fontSize:14, fontWeight:700 }}>
              <input type="checkbox" checked={form.ref} onChange={e=>setForm(f=>({...f,ref:e.target.checked}))} style={{ width:18, height:18, accentColor:G }}/>
              Referral link tu (hakuna promo code)
            </label>
          </div>

          {!form.ref && <>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16 }}>
              <Field label="Bei ya zamani"><Input value={form.oldP} onChange={e=>setForm(f=>({...f,oldP:e.target.value}))} placeholder="$15/mo"/></Field>
              <Field label="Bei mpya"><Input value={form.newP} onChange={e=>setForm(f=>({...f,newP:e.target.value}))} placeholder="$6/mo"/></Field>
              <Field label="Save text"><Input value={form.save} onChange={e=>setForm(f=>({...f,save:e.target.value}))} placeholder="Save 60%"/></Field>
            </div>
            <Field label="Promo Code (optional)"><Input value={form.code} onChange={e=>setForm(f=>({...f,code:e.target.value}))} placeholder="STEA60"/></Field>
          </>}

          <Field label="Background Gradient">
            <Input value={form.bg} onChange={e=>setForm(f=>({...f,bg:e.target.value}))} placeholder="linear-gradient(135deg,#00c4cc,#7d2ae8)"/>
          </Field>

          <Btn onClick={save} disabled={loading}>{loading?"Inahifadhi...":editing?"💾 Hifadhi":"🚀 Weka Live"}</Btn>
        </div>
      </div>

      <div style={{ display:"grid", gap:12 }}>
        {docs.length===0 && <div style={{ textAlign:"center", padding:40, color:"rgba(255,255,255,.35)" }}>Hakuna deals bado. Ongeza ya kwanza! 👆</div>}
        {docs.map(item=>(
          <div key={item.id} style={{ borderRadius:16, border:`1px solid ${item.active?"rgba(255,255,255,.07)":"rgba(239,68,68,.2)"}`, background:item.active?"#1a1d2e":"rgba(239,68,68,.05)", padding:"14px 18px", display:"flex", gap:12, alignItems:"center", flexWrap:"wrap" }}>
            <div style={{ width:48, height:48, borderRadius:10, overflow:"hidden", display:"grid", placeItems:"center", background:"rgba(255,255,255,.05)" }}>
              {item.imageUrl && <img src={item.imageUrl} style={{ width:"100%", height:"100%", objectFit:"cover" }} referrerPolicy="no-referrer" />}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:800, fontSize:15 }}>{item.name}</div>
              <div style={{ fontSize:13, color:"rgba(255,255,255,.4)" }}>{item.domain} · {item.code?"Code: "+item.code:"Referral"}</div>
            </div>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              <button onClick={()=>toggle(item)} style={{ border:`1px solid ${item.active?"rgba(0,196,140,.3)":"rgba(239,68,68,.3)"}`, borderRadius:10, padding:"6px 12px", background:item.active?"rgba(0,196,140,.1)":"rgba(239,68,68,.1)", color:item.active?"#67f0c1":"#fca5a5", cursor:"pointer", fontWeight:700, fontSize:12 }}>
                {item.active?"✅ Live":"⏸ Paused"}
              </button>
              <Btn onClick={()=>{setEditing(item.id);setForm({...item});window.scrollTo({top:0,behavior:"smooth"});}} color="rgba(245,166,35,.12)" textColor={G} style={{padding:"8px 14px"}}>✏️</Btn>
              <Btn onClick={()=>del(item.id)} color="rgba(239,68,68,.12)" textColor="#fca5a5" style={{padding:"8px 14px"}}>🗑️</Btn>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// COURSES MANAGER
// ══════════════════════════════════════════════════════
function CoursesManager() {
  const [docs, setDocs] = useState([]);
  const [form, setForm] = useState({ 
    imageUrl:"", title:"", desc:"", free:true, price:"Bure · Start now", cta:"Anza Sasa →", lessons:"", whatsapp:"https://wa.me/255768260933", accent:"",
    badge: "New", level: "Beginner", instructorName: "STEA Instructor", duration: "4 Weeks", totalLessons: "12", studentsCount: "0", rating: "5.0",
    oldPrice: "", newPrice: "", shortPromise: "Jifunze stadi za kisasa kwa Kiswahili.",
    whatYouWillLearn: "", whatYouWillGet: "", suitableFor: "", requirements: "",
    language: "Kiswahili", certificateIncluded: true, supportType: "WhatsApp Group",
    adminWhatsAppNumber: "255768260933", customWhatsAppMessageTemplate: "",
    priceDisclaimerShort: "Bei elekezi. Thibitisha malipo kupitia STEA.",
    priceDisclaimerFull: "Maelekezo rasmi ya kujiunga na malipo yatathibitishwa kupitia STEA pekee. Usifanye malipo nje ya mawasiliano rasmi ya STEA.",
    testimonial1Name: "", testimonial1Text: "", testimonial1Role: "",
    testimonial2Name: "", testimonial2Text: "", testimonial2Role: "",
    testimonial3Name: "", testimonial3Text: "", testimonial3Role: "",
    faq1Question: "Nitaanzaje baada ya kulipia?", faq1Answer: "Baada ya malipo kuthibitishwa, utatumiwa link ya kujiunga na darasa na kuanza masomo mara moja.",
    faq2Question: "Nitapata support?", faq2Answer: "Ndiyo, utapata msaada wa moja kwa moja kupitia group letu la WhatsApp la wanafunzi.",
    faq3Question: "Je, bei inaweza kubadilika?", faq3Answer: "Bei inaweza kubadilika kulingana na ofa zilizopo. Hakikisha unathibitisha bei ya sasa kabla ya kulipia."
  });
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast,   setToast]   = useState(null);
  const [confirm, setConfirm] = useState(null);

  const db = getFirebaseDb();
  const toast_ = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "courses"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setDocs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.error("Error loading courses:", err);
    });
    return () => unsub();
  }, [db]);

  const save = async () => {
    if (!form.title.trim()) { toast_("Weka title kwanza","error"); return; }
    setLoading(true);
    try {
      const processArray = (val) => {
        if (typeof val === 'string') return val.split("\n").map(l=>l.trim()).filter(Boolean);
        if (Array.isArray(val)) return val;
        return [];
      };

      const data = { 
        ...form, 
        lessons: processArray(form.lessons),
        whatYouWillLearn: processArray(form.whatYouWillLearn),
        whatYouWillGet: processArray(form.whatYouWillGet),
        suitableFor: processArray(form.suitableFor),
        requirements: processArray(form.requirements),
        createdAt: serverTimestamp() 
      };

      // Ensure no undefined values are sent to Firestore
      Object.keys(data).forEach(key => {
        if (data[key] === undefined) data[key] = "";
      });

      if (editing) {
        const updateData = { ...data };
        delete updateData.id;
        delete updateData.createdAt;
        await updateDoc(doc(db,"courses",editing), updateData);
        toast_("Imesahihishwa!");
      }
      else          { await addDoc(collection(db,"courses"), data); toast_("Kozi imewekwa live!"); }
      setForm({ 
        imageUrl:"", title:"", desc:"", free:true, price:"Bure · Start now", cta:"Anza Sasa →", lessons:"", whatsapp:"https://wa.me/255768260933", accent:"",
        badge: "New", level: "Beginner", instructorName: "STEA Instructor", duration: "4 Weeks", totalLessons: "12", studentsCount: "0", rating: "5.0",
        oldPrice: "", newPrice: "", shortPromise: "Jifunze stadi za kisasa kwa Kiswahili.",
        whatYouWillLearn: "", whatYouWillGet: "", suitableFor: "", requirements: "",
        language: "Kiswahili", certificateIncluded: true, supportType: "WhatsApp Group",
        adminWhatsAppNumber: "255768260933", customWhatsAppMessageTemplate: "",
        priceDisclaimerShort: "Bei elekezi. Thibitisha malipo kupitia STEA.",
        priceDisclaimerFull: "Maelekezo rasmi ya kujiunga na malipo yatathibitishwa kupitia STEA pekee. Usifanye malipo nje ya mawasiliano rasmi ya STEA.",
        testimonial1Name: "", testimonial1Text: "", testimonial1Role: "",
        testimonial2Name: "", testimonial2Text: "", testimonial2Role: "",
        testimonial3Name: "", testimonial3Text: "", testimonial3Role: "",
        faq1Question: "Nitaanzaje baada ya kulipia?", faq1Answer: "Baada ya malipo kuthibitishwa, utatumiwa link ya kujiunga na darasa na kuanza masomo mara moja.",
        faq2Question: "Nitapata support?", faq2Answer: "Ndiyo, utapata msaada wa moja kwa moja kupitia group letu la WhatsApp la wanafunzi.",
        faq3Question: "Je, bei inaweza kubadilika?", faq3Answer: "Bei inaweza kubadilika kulingana na ofa zilizopo. Hakikisha unathibitisha bei ya sasa kabla ya kulipia."
      });
      setEditing(null);
    } catch(e) { toast_(e.message,"error"); }
    setLoading(false);
  };

  const del = async (id) => {
    setConfirm({
      msg: "Una uhakika unataka kufuta kozi hii? Wanafunzi waliojiunga wataathirika.",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "courses", id));
          setConfirm(null);
          toast_("Kozi imefutwa");
        } catch (e) {
          toast_(e.message, "error");
        }
      },
      onCancel: () => setConfirm(null)
    });
  };

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type}/>}
      {confirm && <ConfirmDialog {...confirm}/>}
      <div style={{ borderRadius:20, border:"1px solid rgba(255,255,255,.08)", background:"#141823", padding:24, marginBottom:28 }}>
        <h3 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:20, margin:"0 0 20px" }}>
          {editing?"✏️ Hariri Kozi":"➕ Ongeza Kozi Mpya"}
        </h3>
        <div style={{ display:"grid", gap:16 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            <Field label="Title *"><Input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Web Development"/></Field>
            <Field label="Badge"><Input value={form.badge} onChange={e=>setForm(f=>({...f,badge:e.target.value}))} placeholder="Bestseller / New / Hot"/></Field>
          </div>

          <ImageUploadField label="Real Image URL (Vertical 9:16)" value={form.imageUrl} onChange={val => setForm(f => ({ ...f, imageUrl: val }))} aspect={9/16} maxWidth={450} maxHeight={800} />
          
          <Field label="Short Promise / Value Prop"><Input value={form.shortPromise} onChange={e=>setForm(f=>({...f,shortPromise:e.target.value}))} placeholder="Jifunze stadi za kisasa kwa Kiswahili."/></Field>
          <Field label="Maelezo"><Textarea value={form.desc} onChange={e=>setForm(f=>({...f,desc:e.target.value}))} placeholder="Maelezo ya kozi..." style={{minHeight:80}}/></Field>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16 }}>
            <Field label="Level"><Input value={form.level} onChange={e=>setForm(f=>({...f,level:e.target.value}))} placeholder="Beginner"/></Field>
            <Field label="Duration"><Input value={form.duration} onChange={e=>setForm(f=>({...f,duration:e.target.value}))} placeholder="4 Weeks"/></Field>
            <Field label="Total Lessons"><Input value={form.totalLessons} onChange={e=>setForm(f=>({...f,totalLessons:e.target.value}))} placeholder="12"/></Field>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16 }}>
            <Field label="Instructor Name"><Input value={form.instructorName} onChange={e=>setForm(f=>({...f,instructorName:e.target.value}))} placeholder="STEA Instructor"/></Field>
            <Field label="Students Count"><Input value={form.studentsCount} onChange={e=>setForm(f=>({...f,studentsCount:e.target.value}))} placeholder="150"/></Field>
            <Field label="Rating"><Input value={form.rating} onChange={e=>setForm(f=>({...f,rating:e.target.value}))} placeholder="4.9"/></Field>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            <Field label="Language"><Input value={form.language} onChange={e=>setForm(f=>({...f,language:e.target.value}))} placeholder="Kiswahili"/></Field>
            <Field label="Support Type"><Input value={form.supportType} onChange={e=>setForm(f=>({...f,supportType:e.target.value}))} placeholder="WhatsApp Group"/></Field>
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:20 }}>
            <label style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", fontSize:14, fontWeight:700 }}>
              <input type="checkbox" checked={form.free} onChange={e=>setForm(f=>({...f,free:e.target.checked,price:e.target.checked?"Bure · Start now":"TZS 5,000/mwezi · M-Pesa"}))} style={{ width:18, height:18, accentColor:G }}/>
              Kozi ya bure
            </label>
            <label style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", fontSize:14, fontWeight:700 }}>
              <input type="checkbox" checked={form.certificateIncluded} onChange={e=>setForm(f=>({...f,certificateIncluded:e.target.checked}))} style={{ width:18, height:18, accentColor:G }}/>
              Certificate Included
            </label>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            <Field label="Old Price (e.g. TZS 50,000)"><Input value={form.oldPrice} onChange={e=>setForm(f=>({...f,oldPrice:e.target.value}))} placeholder="TZS 50,000"/></Field>
            <Field label="New Price (e.g. TZS 25,000)"><Input value={form.newPrice} onChange={e=>setForm(f=>({...f,newPrice:e.target.value}))} placeholder="TZS 25,000"/></Field>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            <Field label="Price text (Legacy Display)"><Input value={form.price} onChange={e=>setForm(f=>({...f,price:e.target.value}))} placeholder="TZS 5,000/mwezi · M-Pesa"/></Field>
            <Field label="CTA Button text"><Input value={form.cta} onChange={e=>setForm(f=>({...f,cta:e.target.value}))} placeholder="Jiunge Leo"/></Field>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            <Field label="Admin WhatsApp Number"><Input value={form.adminWhatsAppNumber} onChange={e=>setForm(f=>({...f,adminWhatsAppNumber:e.target.value}))} placeholder="255768260933"/></Field>
            <Field label="Custom WhatsApp Message"><Input value={form.customWhatsAppMessageTemplate} onChange={e=>setForm(f=>({...f,customWhatsAppMessageTemplate:e.target.value}))} placeholder="Optional custom message..."/></Field>
          </div>

          <Field label="Price Disclaimer (Short)"><Input value={form.priceDisclaimerShort} onChange={e=>setForm(f=>({...f,priceDisclaimerShort:e.target.value}))} placeholder="Bei elekezi..."/></Field>
          <Field label="Price Disclaimer (Full)"><Textarea value={form.priceDisclaimerFull} onChange={e=>setForm(f=>({...f,priceDisclaimerFull:e.target.value}))} placeholder="Maelezo marefu ya disclaimer..." style={{minHeight:60}}/></Field>

          <Field label="Lessons List (Moja kwa kila mstari)"><Textarea value={Array.isArray(form.lessons)?form.lessons.join("\n"):form.lessons} onChange={e=>setForm(f=>({...f,lessons:e.target.value}))} placeholder="Lesson 1: Introduction\nLesson 2: Basics..." style={{minHeight:100}}/></Field>
          <Field label="What You Will Learn (Moja kwa kila mstari)"><Textarea value={Array.isArray(form.whatYouWillLearn)?form.whatYouWillLearn.join("\n"):form.whatYouWillLearn} onChange={e=>setForm(f=>({...f,whatYouWillLearn:e.target.value}))} placeholder="Skill 1\nSkill 2..." style={{minHeight:100}}/></Field>
          <Field label="What You Will Get (Moja kwa kila mstari)"><Textarea value={Array.isArray(form.whatYouWillGet)?form.whatYouWillGet.join("\n"):form.whatYouWillGet} onChange={e=>setForm(f=>({...f,whatYouWillGet:e.target.value}))} placeholder="Certificate\nSupport..." style={{minHeight:100}}/></Field>
          <Field label="Suitable For (Moja kwa kila mstari)"><Textarea value={Array.isArray(form.suitableFor)?form.suitableFor.join("\n"):form.suitableFor} onChange={e=>setForm(f=>({...f,suitableFor:e.target.value}))} placeholder="Beginners\nCreators..." style={{minHeight:100}}/></Field>
          <Field label="Requirements (Moja kwa kila mstari)"><Textarea value={Array.isArray(form.requirements)?form.requirements.join("\n"):form.requirements} onChange={e=>setForm(f=>({...f,requirements:e.target.value}))} placeholder="Laptop\nInternet..." style={{minHeight:100}}/></Field>

          <div style={{ borderTop:"1px solid rgba(255,255,255,.05)", paddingTop:20, marginTop:10 }}>
            <h4 style={{ fontSize:16, marginBottom:16, color:G }}>Testimonials</h4>
            <div style={{ display:"grid", gap:20 }}>
              {[1,2,3].map(num => (
                <div key={num} style={{ background:"rgba(255,255,255,.02)", padding:16, borderRadius:12, border:"1px solid rgba(255,255,255,.05)" }}>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:10 }}>
                    <Field label={`Student ${num} Name`}><Input value={form[`testimonial${num}Name`]} onChange={e=>setForm(f=>({...f,[`testimonial${num}Name`]:e.target.value}))}/></Field>
                    <Field label={`Student ${num} Role`}><Input value={form[`testimonial${num}Role`]} onChange={e=>setForm(f=>({...f,[`testimonial${num}Role`]:e.target.value}))}/></Field>
                  </div>
                  <Field label={`Student ${num} Feedback`}><Textarea value={form[`testimonial${num}Text`]} onChange={e=>setForm(f=>({...f,[`testimonial${num}Text`]:e.target.value}))} style={{minHeight:60}}/></Field>
                </div>
              ))}
            </div>
          </div>

          <div style={{ borderTop:"1px solid rgba(255,255,255,.05)", paddingTop:20, marginTop:10 }}>
            <h4 style={{ fontSize:16, marginBottom:16, color:G }}>FAQs</h4>
            <div style={{ display:"grid", gap:20 }}>
              {[1,2,3].map(num => (
                <div key={num} style={{ background:"rgba(255,255,255,.02)", padding:16, borderRadius:12, border:"1px solid rgba(255,255,255,.05)" }}>
                  <Field label={`FAQ ${num} Question`}><Input value={form[`faq${num}Question`]} onChange={e=>setForm(f=>({...f,[`faq${num}Question`]:e.target.value}))}/></Field>
                  <Field label={`FAQ ${num} Answer`}><Textarea value={form[`faq${num}Answer`]} onChange={e=>setForm(f=>({...f,[`faq${num}Answer`]:e.target.value}))} style={{minHeight:60}}/></Field>
                </div>
              ))}
            </div>
          </div>

          <Field label="Accent Color (Optional Hex)"><Input value={form.accent} onChange={e=>setForm(f=>({...f,accent:e.target.value}))} placeholder="#f5a623"/></Field>
          <Btn onClick={save} disabled={loading}>{loading?"Inahifadhi...":editing?"💾 Hifadhi":"🚀 Weka Live"}</Btn>
        </div>
      </div>

      <div style={{ display:"grid", gap:12 }}>
        {docs.length===0 && <div style={{ textAlign:"center", padding:40, color:"rgba(255,255,255,.35)" }}>Hakuna kozi bado. Ongeza ya kwanza! 👆</div>}
        {docs.map(item=>(
          <div key={item.id} style={{ borderRadius:16, border:"1px solid rgba(255,255,255,.07)", background:"#1a1d2e", padding:"14px 18px", display:"flex", gap:12, alignItems:"center" }}>
            <div style={{ width:48, height:48, borderRadius:10, overflow:"hidden", display:"grid", placeItems:"center", background:"rgba(255,255,255,.05)", flexShrink:0 }}>
              {item.imageUrl && <img src={item.imageUrl} style={{ width:"100%", height:"100%", objectFit:"cover" }} referrerPolicy="no-referrer" />}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:800, fontSize:15, marginBottom:2 }}>{item.title}</div>
              <div style={{ fontSize:13, color:"rgba(255,255,255,.4)" }}>{item.free?"🆓 Bure":"⭐ Paid"} · {item.price} · {(item.lessons||[]).length} lessons</div>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <Btn onClick={()=>{
                setEditing(item.id);
                setForm({
                  ...form, // Default values from initial state
                  ...item,
                  lessons: Array.isArray(item.lessons) ? item.lessons.join("\n") : (item.lessons || ""),
                  whatYouWillLearn: Array.isArray(item.whatYouWillLearn) ? item.whatYouWillLearn.join("\n") : (item.whatYouWillLearn || ""),
                  whatYouWillGet: Array.isArray(item.whatYouWillGet) ? item.whatYouWillGet.join("\n") : (item.whatYouWillGet || ""),
                  suitableFor: Array.isArray(item.suitableFor) ? item.suitableFor.join("\n") : (item.suitableFor || ""),
                  requirements: Array.isArray(item.requirements) ? item.requirements.join("\n") : (item.requirements || ""),
                });
                window.scrollTo({top:0,behavior:"smooth"});
              }} color="rgba(245,166,35,.12)" textColor={G} style={{padding:"8px 14px"}}>✏️</Btn>
              <Btn onClick={()=>del(item.id)} color="rgba(239,68,68,.12)" textColor="#fca5a5" style={{padding:"8px 14px"}}>🗑️</Btn>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// PRODUCTS MANAGER
// ══════════════════════════════════════════════════════
function ProductsManager() {
  const [docs, setDocs] = useState([]);
  const [form, setForm] = useState({ name: "", description: "", price: "", oldPrice: "", imageUrl: "", badge: "", url: "", category: "Electronics" });
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const db = getFirebaseDb();
  const toast_ = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setDocs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.error("Error loading products:", err);
    });
    return () => unsub();
  }, [db]);

  const save = async () => {
    if (!form.name.trim() || !form.price.trim() || !form.url.trim()) { toast_("Weka jina, bei na URL", "error"); return; }
    setLoading(true);
    try {
      const data = { ...form, createdAt: serverTimestamp() };
      if (editing) {
        const updateData = { ...data };
        delete updateData.id;
        delete updateData.createdAt;
        await updateDoc(doc(db, "products", editing), updateData);
        toast_("Imesahihishwa!");
      }
      else { await addDoc(collection(db, "products"), data); toast_("Bidhaa imewekwa live!"); }
      setForm({ name: "", description: "", price: "", oldPrice: "", imageUrl: "", badge: "", url: "", category: "Electronics" });
      setEditing(null);
    } catch (e) { toast_(e.message, "error"); }
    setLoading(false);
  };

  const del = async (id) => {
    setConfirm({
      msg: "Una uhakika unataka kufuta bidhaa hii?",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "products", id));
          setConfirm(null);
          toast_("Bidhaa imefutwa");
        } catch (e) {
          toast_(e.message, "error");
        }
      },
      onCancel: () => setConfirm(null)
    });
  };

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      {confirm && <ConfirmDialog {...confirm} />}
      <div style={{ borderRadius: 20, border: "1px solid rgba(255,255,255,.08)", background: "#141823", padding: 24, marginBottom: 28 }}>
        <h3 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 20, margin: "0 0 20px" }}>
          {editing ? "✏️ Hariri Bidhaa" : "➕ Ongeza Bidhaa Mpya"}
        </h3>
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Jina la Bidhaa *"><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Sony WH-1000XM4" /></Field>
            <Field label="Category"><Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Electronics" /></Field>
          </div>
          <ImageUploadField label="Real Image URL (Optional)" value={form.imageUrl} onChange={val => setForm(f => ({ ...f, imageUrl: val }))} aspect={1/1} maxWidth={600} maxHeight={600} />
          <Field label="Maelezo"><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Maelezo ya bidhaa..." style={{ minHeight: 80 }} /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <Field label="Bei ya Sasa *"><Input value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="TZS 850,000" /></Field>
            <Field label="Bei ya Zamani"><Input value={form.oldPrice} onChange={e => setForm(f => ({ ...f, oldPrice: e.target.value }))} placeholder="TZS 950,000" /></Field>
            <Field label="Badge (e.g. New)"><Input value={form.badge} onChange={e => setForm(f => ({ ...f, badge: e.target.value }))} placeholder="HOT" /></Field>
          </div>
          <Field label="Affiliate URL *"><Input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://amazon.com/..." /></Field>
          <Btn onClick={save} disabled={loading}>{loading ? "Inahifadhi..." : editing ? "💾 Hifadhi" : "🚀 Weka Live"}</Btn>
        </div>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {docs.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,.35)" }}>Hakuna bidhaa bado. Ongeza ya kwanza! 👆</div>}
        {docs.map(item => (
          <div key={item.id} style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,.07)", background: "#1a1d2e", padding: "14px 18px", display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ width:48, height:48, borderRadius:10, overflow:"hidden", display:"grid", placeItems:"center", background:"rgba(255,255,255,.05)" }}>
              {item.imageUrl && <img src={item.imageUrl} style={{ width:"100%", height:"100%", objectFit:"cover" }} referrerPolicy="no-referrer" />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 15 }}>{item.name}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,.4)" }}>{item.category} · {item.price}</div>
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

// ══════════════════════════════════════════════════════
// WEBSITES MANAGER
// ══════════════════════════════════════════════════════
function WebsitesManager() {
  const [docs, setDocs] = useState([]);
  const [form, setForm] = useState({ name: "", url: "", description: "", iconUrl: "", imageUrl: "", bg: "linear-gradient(135deg,#667eea,#764ba2)", meta: "Free Tool", tags: "" });
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const db = getFirebaseDb();
  const toast_ = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "websites"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setDocs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.error("Error loading websites:", err);
    });
    return () => unsub();
  }, [db]);

  const save = async () => {
    if (!form.name.trim() || !form.url.trim()) { toast_("Weka jina na URL", "error"); return; }
    setLoading(true);
    try {
      const data = { ...form, tags: form.tags.split(",").map(t => t.trim()).filter(Boolean), createdAt: serverTimestamp() };
      if (editing) {
        const updateData = { ...data };
        delete updateData.id;
        delete updateData.createdAt;
        await updateDoc(doc(db, "websites", editing), updateData);
        toast_("Imesahihishwa!");
      }
      else { await addDoc(collection(db, "websites"), data); toast_("Website imewekwa live!"); }
      setForm({ name: "", url: "", description: "", iconUrl: "", imageUrl: "", bg: "linear-gradient(135deg,#667eea,#764ba2)", meta: "Free Tool", tags: "" });
      setEditing(null);
    } catch (e) { toast_(e.message, "error"); }
    setLoading(false);
  };

  const del = async (id) => {
    setConfirm({
      msg: "Una uhakika unataka kufuta website hii?",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "websites", id));
          setConfirm(null);
          toast_("Website imefutwa");
        } catch (e) {
          toast_(e.message, "error");
        }
      },
      onCancel: () => setConfirm(null)
    });
  };

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      {confirm && <ConfirmDialog {...confirm} />}
      <div style={{ borderRadius: 20, border: "1px solid rgba(255,255,255,.08)", background: "#141823", padding: 24, marginBottom: 28 }}>
        <h3 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 20, margin: "0 0 20px" }}>
          {editing ? "✏️ Hariri Website" : "➕ Ongeza Website Mpya"}
        </h3>
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
            <Field label="Jina la Website *"><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Remove.bg" /></Field>
          </div>
          <ImageUploadField label="Website Icon URL (Optional)" value={form.iconUrl} onChange={val => setForm(f => ({ ...f, iconUrl: val }))} aspect={1} maxWidth={256} maxHeight={256} />
          <ImageUploadField label="Thumbnail Image URL (16:9)" value={form.imageUrl} onChange={val => setForm(f => ({ ...f, imageUrl: val }))} aspect={16/9} maxWidth={800} maxHeight={450} />
          <Field label="URL *"><Input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://remove.bg" /></Field>
          <Field label="Maelezo"><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Maelezo mafupi..." style={{ minHeight: 80 }} /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Meta Info"><Input value={form.meta} onChange={e => setForm(f => ({ ...f, meta: e.target.value }))} placeholder="Free AI Tool" /></Field>
            <Field label="Tags (comma separated)"><Input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="AI, Design, Tools" /></Field>
          </div>
          <Btn onClick={save} disabled={loading}>{loading ? "Inahifadhi..." : editing ? "💾 Hifadhi" : "🚀 Weka Live"}</Btn>
        </div>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {docs.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,.35)" }}>Hakuna websites bado. Ongeza ya kwanza! 👆</div>}
        {docs.map(item => (
          <div key={item.id} style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,.07)", background: "#1a1d2e", padding: "14px 18px", display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ width:48, height:48, borderRadius:10, overflow:"hidden", display:"grid", placeItems:"center", background:"rgba(255,255,255,.05)" }}>
              {item.iconUrl ? <img src={item.iconUrl} style={{ width:"100%", height:"100%", objectFit:"cover" }} referrerPolicy="no-referrer" /> : item.imageUrl && <img src={item.imageUrl} style={{ width:"100%", height:"100%", objectFit:"cover" }} referrerPolicy="no-referrer" />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 15 }}>{item.name}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,.4)" }}>{item.url}</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn onClick={() => { setEditing(item.id); setForm({ iconUrl: "", imageUrl: "", ...item, tags: (item.tags || []).join(", ") }); window.scrollTo({ top: 0, behavior: "smooth" }); }} color="rgba(245,166,35,.12)" textColor={G} style={{ padding: "8px 14px" }}>✏️</Btn>
              <Btn onClick={() => del(item.id)} color="rgba(239,68,68,.12)" textColor="#fca5a5" style={{ padding: "8px 14px" }}>🗑️</Btn>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PromptsManager() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ 
    category: "", 
    title: "", 
    prompt: "", 
    imageUrl: "", 
    howToUse: "", 
    tools: [] 
  });
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const db = getFirebaseDb();

  const toast_ = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "prompts"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setDocs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => {
      console.error("Error loading prompts:", err);
      setLoading(false);
    });
    return () => unsub();
  }, [db]);

  const save = async () => {
    if (!form.title || !form.prompt) return toast_("Jaza kila kitu!", "error");
    setLoading(true);
    try {
      const payload = {
        ...form,
        tools: form.tools.filter(t => t.toolUrl) // Filter out empty tools
      };
      if (editing) {
        const updateData = { ...payload };
        delete updateData.id;
        delete updateData.createdAt;
        await updateDoc(doc(db, "prompts", editing), { ...updateData, updatedAt: serverTimestamp() });
        toast_("Prompt imebadilishwa");
      } else {
        await addDoc(collection(db, "prompts"), { ...payload, createdAt: serverTimestamp() });
        toast_("Prompt mpya imeongezwa");
      }
      setForm({ category: "", title: "", prompt: "", imageUrl: "", howToUse: "", tools: [] });
      setEditing(null);
    } catch (e) {
      toast_(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const addTool = () => {
    if (form.tools.length >= 5) return toast_("Mwisho ni tools 5 tu!", "error");
    setForm(f => ({ ...f, tools: [...f.tools, { iconUrl: "", toolUrl: "" }] }));
  };

  const updateTool = (index, field, value) => {
    const newTools = [...form.tools];
    newTools[index] = { ...newTools[index], [field]: value };
    setForm(f => ({ ...f, tools: newTools }));
  };

  const removeTool = (index) => {
    setForm(f => ({ ...f, tools: f.tools.filter((_, i) => i !== index) }));
  };

  const del = (id) => {
    setConfirm({
      msg: "Una uhakika unataka kufuta prompt hii?",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "prompts", id));
          setConfirm(null);
          toast_("Prompt imefutwa");
        } catch (e) {
          toast_(e.message, "error");
        }
      },
      onCancel: () => setConfirm(null)
    });
  };

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      {confirm && <ConfirmDialog {...confirm} />}
      <div style={{ borderRadius: 20, border: "1px solid rgba(255,255,255,.08)", background: "#141823", padding: 24, marginBottom: 28 }}>
        <h3 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 20, margin: "0 0 20px" }}>
          {editing ? "✏️ Hariri Prompt" : "➕ Ongeza Prompt Mpya"}
        </h3>
        <div style={{ display: "grid", gap: 16 }}>
          <Field label="Title *"><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Business Plan Generator" /></Field>
          <ImageUploadField label="Real Image URL (Vertical 9:16)" value={form.imageUrl} onChange={val => setForm(f => ({ ...f, imageUrl: val }))} aspect={9/16} maxWidth={450} maxHeight={800} />
          <Field label="Category"><Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Biashara" /></Field>
          <Field label="Prompt *"><Textarea value={form.prompt} onChange={e => setForm(f => ({ ...f, prompt: e.target.value }))} placeholder="Andika prompt yako hapa..." style={{ minHeight: 120 }} /></Field>
          
          <Field label="How to Use (Step by Step)"><Textarea value={form.howToUse} onChange={e => setForm(f => ({ ...f, howToUse: e.target.value }))} placeholder="1. Copy prompt\n2. Open ChatGPT\n3. Paste and run..." style={{ minHeight: 80 }} /></Field>

          <div style={{ marginTop: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,.6)", textTransform: "uppercase", letterSpacing: 1 }}>Tools to Use (Max 5)</div>
              <Btn onClick={addTool} style={{ padding: "4px 12px", fontSize: 12 }} color="rgba(255,255,255,.05)">+ Ongeza Tool</Btn>
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              {form.tools.map((tool, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 40px", gap: 10, alignItems: "end" }}>
                  <Field label={`Tool ${i+1} Icon URL`}><Input value={tool.iconUrl} onChange={e => updateTool(i, "iconUrl", e.target.value)} placeholder="https://... (ChatGPT icon)" /></Field>
                  <Field label={`Tool ${i+1} Website URL`}><Input value={tool.toolUrl} onChange={e => updateTool(i, "toolUrl", e.target.value)} placeholder="https://chat.openai.com" /></Field>
                  <Btn onClick={() => removeTool(i)} color="rgba(239,68,68,.1)" textColor="#fca5a5" style={{ padding: 10, marginBottom: 4 }}>✕</Btn>
                </div>
              ))}
            </div>
          </div>

          <Btn onClick={save} disabled={loading}>{loading ? "Inahifadhi..." : editing ? "💾 Hifadhi" : "🚀 Weka Live"}</Btn>
        </div>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {docs.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,.35)" }}>Hakuna prompts bado. Ongeza ya kwanza! 👆</div>}
        {docs.map(item => (
          <div key={item.id} style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,.07)", background: "#1a1d2e", padding: "14px 18px", display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ width:48, height:48, borderRadius:10, overflow:"hidden", display:"grid", placeItems:"center", background:"rgba(255,255,255,.05)" }}>
              {item.imageUrl && <img src={item.imageUrl} style={{ width:"100%", height:"100%", objectFit:"cover" }} referrerPolicy="no-referrer" />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 15 }}>{item.title}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,.4)" }}>{item.category} • {item.tools?.length || 0} Tools</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn onClick={() => { setEditing(item.id); setForm({ ...item, tools: item.tools || [] }); window.scrollTo({ top: 0, behavior: "smooth" }); }} color="rgba(245,166,35,.12)" textColor={G} style={{ padding: "8px 14px" }}>✏️</Btn>
              <Btn onClick={() => del(item.id)} color="rgba(239,68,68,.12)" textColor="#fca5a5" style={{ padding: "8px 14px" }}>🗑️</Btn>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// USERS MANAGER
// ══════════════════════════════════════════════════════
function UsersManager() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const db = getFirebaseDb();

  const toast_ = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => {
      console.error("Error loading users:", err);
      setLoading(false);
    });
    return () => unsub();
  }, [db]);

  const setRole = async (uid, role) => {
    try {
      await updateDoc(doc(db, "users", uid), { role });
      toast_(`Role imebadilishwa kuwa ${role}`);
    } catch (e) {
      toast_(e.message, "error");
    }
  };

  const delUser = async (uid) => {
    setConfirm({
      msg: "Una uhakika unataka kufuta user huyu? Data zake zote zitafutwa Firestore (lakini account yake ya Auth itabaki mpaka uifute manual).",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "users", uid));
          setConfirm(null);
          toast_("User amefutwa Firestore");
        } catch (e) {
          toast_(e.message, "error");
        }
      },
      onCancel: () => setConfirm(null)
    });
  };

  const filtered = users.filter(u =>
    (u.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      {confirm && <ConfirmDialog {...confirm} />}

      <div style={{ marginBottom: 24, display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tafuta user kwa jina au email..."
            style={{ paddingLeft: 44 }}
          />
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", opacity: .4 }}>🔍</span>
        </div>
        <div style={{ padding: "0 16px", height: 46, borderRadius: 12, background: "rgba(255,255,255,.05)", display: "grid", placeItems: "center", fontSize: 13, fontWeight: 700, border: "1px solid rgba(255,255,255,.1)" }}>
          {users.length} Users
        </div>
      </div>

      {loading ? <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,.4)" }}>Inapakia users...</div> :
        filtered.length === 0 ? <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,.35)" }}>Hakuna users waliopatikana.</div> :
          <div style={{ display: "grid", gap: 10 }}>
            {filtered.map(u => (
              <div key={u.id} style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,.07)", background: "#1a1d2e", padding: "14px 18px", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: u.role === "admin" ? `linear-gradient(135deg,${G},${G2})` : "rgba(255,255,255,.05)", display: "grid", placeItems: "center", color: u.role === "admin" ? "#111" : "rgba(255,255,255,.4)", fontWeight: 900, fontSize: 18, flexShrink: 0 }}>
                  {(u.name || u.email || "U")[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 2 }}>{u.name || "No name"}</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,.4)", wordBreak: "break-all" }}>{u.email}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,.3)", marginTop: 2 }}>via {u.provider || "email"} · {timeAgo(u.createdAt)}</div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {u.role === "admin" ? <span style={{ fontSize: 12, fontWeight: 800, padding: "4px 10px", borderRadius: 8, background: "rgba(245,166,35,.15)", color: G }}>⚡ Admin</span>
                    : <Btn onClick={() => setRole(u.id, "admin")} color="rgba(245,166,35,.1)" textColor={G} style={{ padding: "6px 12px", fontSize: 12 }}>Make Admin</Btn>}
                  {u.role === "admin" && u.email !== "isayamasika100@gmail.com" &&
                    <Btn onClick={() => setRole(u.id, "user")} color="rgba(255,255,255,.06)" textColor="rgba(255,255,255,.6)" style={{ padding: "6px 12px", fontSize: 12 }}>Remove Admin</Btn>}
                  {u.email !== "isayamasika100@gmail.com" &&
                    <Btn onClick={() => delUser(u.id)} color="rgba(239,68,68,.1)" textColor="#fca5a5" style={{ padding: "10px", borderRadius: 10 }}>🗑️</Btn>
                  }
                </div>
              </div>
            ))}
          </div>
      }
    </div>
  );
}

// ══════════════════════════════════════════════════════
// MAIN ADMIN PANEL
// ══════════════════════════════════════════════════════
export default function AdminPanel({ user, onBack }) {
  const [section, setSection] = useState("overview");
  const [counts,  setCounts]  = useState({ tips:0, updates:0, deals:0, courses:0, users:0, products:0, websites:0, prompts:0 });

  const db = getFirebaseDb();

  useEffect(() => {
    if (!db) return;
    const cols = ["tips","updates","deals","courses","users","products","websites","prompts"];
    const unsubs = cols.map(c => 
      onSnapshot(collection(db, c), (snap) => {
        setCounts(prev => ({ ...prev, [c]: snap.size }));
      }, (err) => {
        console.error(`Error loading count for ${c}:`, err);
      })
    );
    return () => unsubs.forEach(unsub => unsub());
  }, [db]);

  const SECTIONS = [
    { id:"overview", icon:"📊", label:"Overview" },
    { id:"tips",     icon:"💡", label:"Tech Tips" },
    { id:"updates",  icon:"📰", label:"Tech Updates" },
    { id:"prompts",  icon:"🤖", label:"Prompt Lab" },
    { id:"deals",    icon:"🏷️", label:"Deals" },
    { id:"courses",  icon:"🎓", label:"Courses" },
    { id:"products", icon:"🛒", label:"Duka" },
    { id:"websites", icon:"🌐", label:"Websites" },
    { id:"users",    icon:"👥", label:"Users" },
  ];

  return (
    <div style={{ minHeight:"100vh", display:"grid", gridTemplateColumns:"240px 1fr", background:"#0a0b0f" }}>

      {/* Sidebar */}
      <div style={{ borderRight:"1px solid rgba(255,255,255,.06)", padding:"24px 16px", position:"sticky", top:0, height:"100vh", overflowY:"auto" }}>
        <div style={{ marginBottom:28 }}>
          <div style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:20, fontWeight:800, marginBottom:4 }}>⚡ Admin Panel</div>
          <div style={{ fontSize:12, color:"rgba(255,255,255,.35)" }}>SwahiliTech Elite Academy</div>
        </div>

        <div style={{ display:"grid", gap:4 }}>
          {SECTIONS.map(s=>(
            <button key={s.id} onClick={()=>setSection(s.id)}
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
      <div style={{ padding:"28px 32px", overflowY:"auto" }}>

        {section==="overview" && (
          <div>
            <div style={{ marginBottom:28 }}>
              <h1 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:32, margin:"0 0 6px" }}>
                Karibu, <span style={{ color:G }}>{user?.displayName||"Admin"}</span> 👋
              </h1>
              <p style={{ color:"rgba(255,255,255,.45)", fontSize:15, margin:0 }}>
                Hapa unaweza kumanage content yote ya STEA — posts, deals, courses na users.
              </p>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:16, marginBottom:32 }}>
              <StatCard icon="💡" label="Tech Tips Posts" value={counts.tips}/>
              <StatCard icon="📰" label="Tech Updates" value={counts.updates} color="#56b7ff"/>
              <StatCard icon="🤖" label="Prompts" value={counts.prompts} color="#ff85cf"/>
              <StatCard icon="🏷️" label="Active Deals" value={counts.deals} color="#a5b4fc"/>
              <StatCard icon="🎓" label="Courses" value={counts.courses} color="#67f0c1"/>
              <StatCard icon="🛒" label="Duka Products" value={counts.products} color="#fbbf24"/>
              <StatCard icon="🌐" label="Websites" value={counts.websites} color="#818cf8"/>
              <StatCard icon="👥" label="Users" value={counts.users} color="#ff85cf"/>
            </div>

            {/* Quick guide */}
            <div style={{ borderRadius:20, border:"1px solid rgba(245,166,35,.2)", background:"rgba(245,166,35,.06)", padding:24 }}>
              <h3 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:20, margin:"0 0 16px", color:G }}>📋 Mwongozo wa Haraka</h3>
              <div style={{ display:"grid", gap:12 }}>
                {[
                  { step:"1", title:"Ongeza Tech Tips", desc:"Nenda Tech Tips → ongeza articles za kweli kwa Kiswahili + videos za YouTube/TikTok" },
                  { step:"2", title:"Weka Habari za Tech Updates", desc:"Nenda Tech Updates → weka habari mpya za ulimwengu wa tech kila siku" },
                  { step:"3", title:"Update Deals na links za kweli", desc:"Nenda Deals → badilisha URL za dummy na affiliate links zako za kweli" },
                  { step:"4", title:"Weka WhatsApp links kwa Courses", desc:"Nenda Courses → kila kozi iweke WhatsApp link ili watu wakuwasiliane nawe" },
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
          </div>
        )}

        {section==="tips"    && <><h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:28, margin:"0 0 24px" }}>💡 Manage <span style={{color:G}}>Tech Tips</span></h2><TipsManager/></>}
        {section==="updates" && <><h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:28, margin:"0 0 24px" }}>📰 Manage <span style={{color:G}}>Tech Updates</span></h2><UpdatesManager/></>}
        {section==="prompts" && <><h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:28, margin:"0 0 24px" }}>🤖 Manage <span style={{color:G}}>Prompt Lab</span></h2><PromptsManager/></>}
        {section==="deals"   && <><h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:28, margin:"0 0 24px" }}>🏷️ Manage <span style={{color:G}}>Deals</span></h2><DealsManager/></>}
        {section==="courses" && <><h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:28, margin:"0 0 24px" }}>🎓 Manage <span style={{color:G}}>Courses</span></h2><CoursesManager/></>}
        {section==="products" && <><h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:28, margin:"0 0 24px" }}>🛒 Manage <span style={{color:G}}>Duka Products</span></h2><ProductsManager/></>}
        {section==="websites" && <><h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:28, margin:"0 0 24px" }}>🌐 Manage <span style={{color:G}}>Websites</span></h2><WebsitesManager/></>}
        {section==="users"   && <><h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:28, margin:"0 0 24px" }}>👥 Manage <span style={{color:G}}>Users</span></h2><UsersManager/></>}
      </div>

      <style>{`@keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
    </div>
  );
}
