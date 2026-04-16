import React, { useState, useRef } from "react";
import { storage, ref, uploadBytes, getDownloadURL } from "../firebase.js";
import ImageEditor from "./ImageEditor.jsx";

export const G = "#F5A623", G2 = "#FFD17C";

export const Btn = ({ children, onClick, color = G, textColor = "#111", disabled, style = {} }) => (
  <button onClick={onClick} disabled={disabled}
    style={{ border:"none", cursor:disabled?"not-allowed":"pointer", borderRadius:12,
      padding:"10px 18px", fontWeight:800, fontSize:13, color:textColor,
      background:color, opacity:disabled?.6:1, transition:"all .2s",
      display:"inline-flex", alignItems:"center", gap:8, flexShrink: 0, ...style }}
    onMouseEnter={e=>{ if(!disabled) e.currentTarget.style.opacity=".85"; }}
    onMouseLeave={e=>{ e.currentTarget.style.opacity="1"; }}>
    {children}
  </button>
);

export const Field = ({ label, children }) => (
  <div style={{ display:"grid", gap:6 }}>
    <label style={{ fontSize:12, fontWeight:800, color:"rgba(255,255,255,.5)", textTransform:"uppercase", letterSpacing:".06em" }}>{label}</label>
    {children}
  </div>
);

export const Input = (props) => (
  <input {...props} value={props.value || ""} style={{ height:46, borderRadius:12, border:"1px solid rgba(255,255,255,.1)",
    background:"rgba(255,255,255,.05)", color:"#fff", padding:"0 14px", outline:"none",
    fontFamily:"inherit", fontSize:14, width:"100%", ...props.style }}
    onFocus={e=>e.target.style.borderColor=G}
    onBlur={e=>e.target.style.borderColor="rgba(255,255,255,.1)"}/>
);

export const Textarea = (props) => (
  <textarea {...props} value={props.value || ""} style={{ borderRadius:12, border:"1px solid rgba(255,255,255,.1)",
    background:"rgba(255,255,255,.05)", color:"#fff", padding:"12px 14px", outline:"none",
    fontFamily:"inherit", fontSize:14, width:"100%", resize:"vertical", minHeight:100,
    ...props.style }}
    onFocus={e=>e.target.style.borderColor=G}
    onBlur={e=>e.target.style.borderColor="rgba(255,255,255,.1)"}/>
);

export const Select = (props) => (
  <select {...props} style={{ height:46, borderRadius:12, border:"1px solid rgba(255,255,255,.1)",
    background:"rgba(255,255,255,.05)", color:"#fff", padding:"0 14px", outline:"none",
    fontFamily:"inherit", fontSize:14, width:"100%", cursor:"pointer", ...props.style }}
    onFocus={e=>e.target.style.borderColor=G}
    onBlur={e=>e.target.style.borderColor="rgba(255,255,255,.1)"}>
    {props.children}
  </select>
);

export const Toast = ({ msg, type }) => {
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
};

export const ConfirmDialog = ({ msg, onConfirm, onCancel }) => (
  <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.8)", backdropFilter:"blur(8px)", zIndex:10000, display:"grid", placeItems:"center", padding:20 }}>
    <div style={{ background:"#141823", borderRadius:24, border:"1px solid rgba(255,255,255,.1)", padding:32, maxWidth:400, textAlign:"center" }}>
      <div style={{ fontSize:40, marginBottom:16 }}>⚠️</div>
      <h3 style={{ fontSize:20, marginBottom:12 }}>{msg}</h3>
      <div style={{ display:"flex", gap:12, justifyContent:"center", marginTop:24 }}>
        <Btn onClick={onConfirm} color="#ef4444" textColor="#fff">Ndiyo, Futa</Btn>
        <Btn onClick={onCancel} color="rgba(255,255,255,.1)" textColor="#fff">Hapana</Btn>
      </div>
    </div>
  </div>
);

export const ImageUploadField = ({ label, value, onChange }) => {
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [toast, setToast] = useState(null);
  const fileRef = useRef();

  const toast_ = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return toast_("Picha isizidi 2MB", "error");

    setLoading(true);
    try {
      const storageRef = ref(storage, `uploads/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      onChange(url);
      toast_("Picha imepakiwa!");
    } catch (err) {
      console.error(err);
      toast_("Imeshindwa kupakia", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEditedImage = async (cropped) => {
    setLoading(true);
    try {
      await onChange(cropped);
      toast_("Picha imehifadhiwa vizuri", "success");
      setEditing(false);
    } catch (error) {
      console.error("ImageUploadField: save error:", error);
      toast_("Imeshindikana kuhifadhi picha. Jaribu tena.", "error");
    } finally {
      setLoading(false);
    }
  };

  const isDataUrl = value && value.startsWith("data:image/");

  return (
    <Field label={label}>
      {editing && value && (
        <ImageEditor
          image={value}
          onSave={handleSaveEditedImage}
          onCancel={() => setEditing(false)}
        />
      )}
      
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10 }}>
        {isDataUrl ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 12, padding: "0 10px", height: 46 }}>
            <img src={value} style={{ width: 32, height: 32, borderRadius: 6, objectFit: "cover" }} referrerPolicy="no-referrer" onError={(e) => { e.target.style.display = 'none'; }} />
            <span style={{ color: "#00C48C", fontSize: 13, flex: 1, minWidth: 0, fontWeight: 700 }}>Uploaded</span>
            <button onClick={() => setEditing(true)} style={{ background: "rgba(245,166,35,.1)", border: "none", color: G, cursor: "pointer", fontSize: 12, padding: "4px 8px", borderRadius: 6, fontWeight: 700 }}>Edit</button>
            <button onClick={() => onChange("")} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,.5)", cursor: "pointer", fontSize: 16 }}>✕</button>
          </div>
        ) : (
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Input 
              value={value || ""} 
              onChange={e => onChange(e.target.value)} 
              placeholder="Paste image URL here or upload ➔" 
              style={{ paddingLeft: value ? 46 : 14, paddingRight: value ? 70 : 14 }}
            />
            {value && (
              <img 
                src={value} 
                style={{ position: 'absolute', left: 8, width: 30, height: 30, borderRadius: 6, objectFit: 'cover', border: '1px solid rgba(255,255,255,.1)' }} 
                referrerPolicy="no-referrer"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}
            {value && (
              <div style={{ position: 'absolute', right: 8, display: 'flex', gap: 4 }}>
                <button onClick={() => setEditing(true)} style={{ background: "rgba(245,166,35,.1)", border: "none", color: G, cursor: "pointer", fontSize: 10, padding: "4px 6px", borderRadius: 4, fontWeight: 700 }}>Edit</button>
                <button onClick={() => onChange("")} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,.5)", cursor: "pointer", fontSize: 14 }}>✕</button>
              </div>
            )}
          </div>
        )}
        <input type="file" hidden ref={fileRef} accept="image/*" onChange={handleUpload} />
        <Btn onClick={() => fileRef.current.click()} disabled={loading} color="rgba(255,255,255,.05)" textColor="#fff" style={{ height: 46 }}>
          {loading ? "..." : "📁"}
        </Btn>
      </div>
    </Field>
  );
};

export const AdminThumb = ({ src, size = 40 }) => (
  <div style={{ width: size, height: size, borderRadius: 10, overflow: "hidden", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", display: "grid", placeItems: "center" }}>
    {src ? (
      <img src={src} style={{ width: "100%", height: "100%", objectFit: "cover" }} referrerPolicy="no-referrer" onError={(e) => { e.target.src = "https://via.placeholder.com/150?text=Error"; }} />
    ) : (
      <span style={{ fontSize: size * 0.4 }}>🖼️</span>
    )}
  </div>
);

export const StatCard = ({ icon, label, value, color = G, error }) => (
  <div style={{ borderRadius:18, border:"1px solid rgba(255,255,255,.08)", background:"#141823", padding:"20px 24px", display:"flex", alignItems:"center", gap:16 }}>
    <div style={{ width:52, height:52, borderRadius:14, display:"grid", placeItems:"center", background:`${color}18`, fontSize:26 }}>{icon}</div>
    <div>
      <div style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize: 28, fontWeight:800, color, lineHeight:1 }}>
        {error ? "!" : value}
      </div>
      <div style={{ fontSize:13, color:"rgba(255,255,255,.45)", marginTop:4 }}>{label}</div>
    </div>
  </div>
);
