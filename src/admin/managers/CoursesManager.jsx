import React, { useState, useEffect } from "react";
import { 
  getFirebaseDb, collection, query, limit, onSnapshot, where, 
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp, 
  handleFirestoreError, OperationType 
} from "../../firebase.js";
import { Btn, Field, Input, Textarea, Toast, ConfirmDialog, ImageUploadField, AdminThumb } from "../AdminUI.jsx";
import SocialPoster from "../SocialPoster.jsx";

const G = "#F5A623", G2 = "#FFD17C";

export default function CoursesManager({ user }) {
  const [docs, setDocs] = useState([]);
  const [form, setForm] = useState({ 
    imageUrl:"", carouselImages: [], title:"", desc:"", free:true, price:"Bure · Start now", cta:"Anza Sasa →", lessons:"", adminWhatsAppNumber:"255757053354", accent:"",
    badge: "New", level: "Beginner", instructorName: "STEA Instructor", duration: "4 Weeks", totalLessons: "12", studentsCount: "0", rating: "5.0",
    oldPrice: "", newPrice: "", shortPromise: "Jifunze stadi za kisasa kwa Kiswahili.",
    whatYouWillLearn: "", whatYouWillGet: "", suitableFor: "", requirements: "",
    language: "Kiswahili", certificateIncluded: true, supportType: "WhatsApp Group",
    customWhatsAppMessageTemplate: "", category: "web",
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
    let q = query(collection(db, "courses"), limit(1000));
    if (user?.role === "creator") {
      q = query(collection(db, "courses"), where("ownerId", "==", user.uid), limit(1000));
    }
    const unsub = onSnapshot(q, (snap) => {
      const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      fetched.sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));
      setDocs(fetched);
    }, (err) => {
      console.error("Error loading courses:", err);
    });
    return () => unsub();
  }, [db, user?.role, user?.uid]);

  const addCarouselImage = () => setForm(f => ({ ...f, carouselImages: [...(f.carouselImages||[]), ""] }));
  const updateCarouselImage = (i, val) => {
    const arr = [...(form.carouselImages||[])];
    arr[i] = val;
    setForm(f => ({ ...f, carouselImages: arr }));
  };
  const removeCarouselImage = (i) => {
    const arr = [...(form.carouselImages||[])];
    arr.splice(i, 1);
    setForm(f => ({ ...f, carouselImages: arr }));
  };

  const save = async () => {
    const title = (form.title || "").toString();
    if (!title.trim()) { toast_("Weka title kwanza", "error"); return; }
    setLoading(true);
    try {
      const processArray = (val) => {
        if (typeof val === 'string') return val.split("\n").map(l=>l.trim()).filter(Boolean);
        if (Array.isArray(val)) return val;
        return [];
      };

      const canDirect = !!user?.canPublishDirect;
      const data = { 
        ...form, 
        title: form.title || "",
        description: form.desc || form.description || "",
        image: form.imageUrl || form.image || "",
        category: form.category || "courses",
        active: form.active ?? true,
        published: form.published ?? (editing ? form.published : canDirect),
        status: form.status ?? (editing ? form.status : (canDirect ? "published" : "pending_review")),
        lessons: processArray(form.lessons),
        whatYouWillLearn: processArray(form.whatYouWillLearn),
        whatYouWillGet: processArray(form.whatYouWillGet),
        suitableFor: processArray(form.suitableFor),
        requirements: processArray(form.requirements),
        updatedAt: serverTimestamp()
      };

      if (!editing) {
        data.createdAt = serverTimestamp();
        data.ownerId = user?.uid || "admin";
        data.ownerName = user?.displayName || "Admin";
        data.ownerRole = user?.role || "admin";
        data.sector = "courses";
        if (canDirect) {
          data.approvedBy = user?.uid || "admin";
          data.approvedAt = serverTimestamp();
        }
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
        await updateDoc(doc(db,"courses",editing), data);
        toast_("Imesahihishwa!");
      } else { 
        await addDoc(collection(db,"courses"), data); 
        toast_("Kozi imewekwa live!"); 
      }
      setForm({ 
        imageUrl:"", carouselImages: [], title:"", desc:"", free:true, price:"Bure · Start now", cta:"Anza Sasa →", lessons:"", adminWhatsAppNumber:"255757053354", accent:"",
        badge: "New", level: "Beginner", instructorName: "STEA Instructor", duration: "4 Weeks", totalLessons: "12", studentsCount: "0", rating: "5.0",
        oldPrice: "", newPrice: "", shortPromise: "Jifunze stadi za kisasa kwa Kiswahili.",
        whatYouWillLearn: "", whatYouWillGet: "", suitableFor: "", requirements: "",
        language: "Kiswahili", certificateIncluded: true, supportType: "WhatsApp Group",
        customWhatsAppMessageTemplate: "", category: "web",
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
    } catch (e) {
      console.error(e);
      if (e.message.includes("insufficient permissions")) {
        handleFirestoreError(e, editing ? OperationType.UPDATE : OperationType.CREATE, "courses");
      }
      toast_(e.message, "error");
    }
    setLoading(false);
  };

  const del = async (id) => {
    setConfirm({ msg: "Una uhakika unataka kufuta kozi hii?", onConfirm: async () => { await deleteDoc(doc(db, "courses", id)); setConfirm(null); toast_("Kozi imefutwa"); }, onCancel: () => setConfirm(null) });
  };

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type}/>}
      {confirm && <ConfirmDialog {...confirm}/>}
      <div style={{ borderRadius:20, border:"1px solid rgba(255,255,255,.08)", background:"#141823", padding:24, marginBottom:28 }}>
        <h3 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:20, margin:"0 0 20px" }}>{editing?"✏️ Hariri Kozi":"➕ Ongeza Kozi Mpya"}</h3>
        <div style={{ display:"grid", gap:16 }}>
          <div style={{ display:"grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap:16 }}>
            <Field label="Title *"><Input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Web Development"/></Field>
            <Field label="Badge"><Input value={form.badge} onChange={e=>setForm(f=>({...f,badge:e.target.value}))} placeholder="Bestseller / New / Hot"/></Field>
          </div>
          <ImageUploadField label="Course Thumbnail URL" value={form.imageUrl} onChange={val => setForm(f => ({ ...f, imageUrl: val }))} />
          <Field label="Maelezo"><Textarea value={form.desc} onChange={e=>setForm(f=>({...f,desc:e.target.value}))} placeholder="Maelezo ya kozi..." style={{minHeight:80}}/></Field>
          
          <div style={{ display:"grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap:16 }}>
            <Field label="Level"><Input value={form.level} onChange={e=>setForm(f=>({...f,level:e.target.value}))} placeholder="Beginner"/></Field>
            <Field label="Duration"><Input value={form.duration} onChange={e=>setForm(f=>({...f,duration:e.target.value}))} placeholder="4 Weeks"/></Field>
          </div>

          <div style={{ display:"flex", gap:10 }}>
            <Btn onClick={save} disabled={loading}>{loading?"Inahifadhi...":editing?"💾 Hifadhi":"🚀 Weka Live"}</Btn>
            {editing && <Btn onClick={()=>{setEditing(null);setForm({imageUrl:"",carouselImages:[],title:"",desc:"",free:true,price:"Bure · Start now",cta:"Anza Sasa →",lessons:"",adminWhatsAppNumber:"255757053354",accent:"",badge:"New",level:"Beginner",instructorName:"STEA Instructor",duration:"4 Weeks",totalLessons:"12",studentsCount:"0",rating:"5.0",oldPrice:"",newPrice:"",shortPromise:"Jifunze stadi za kisasa kwa Kiswahili.",whatYouWillLearn:"",whatYouWillGet:"",suitableFor:"",requirements:"",language:"Kiswahili",certificateIncluded:true,supportType:"WhatsApp Group",customWhatsAppMessageTemplate:"",category:"web",priceDisclaimerShort:"Bei elekezi. Thibitisha malipo kupitia STEA.",priceDisclaimerFull:"Maelekezo rasmi ya kujiunga na malipo yatathibitishwa kupitia STEA pekee. Usifanye malipo nje ya mawasiliano rasmi ya STEA.",testimonial1Name:"",testimonial1Text:"",testimonial1Role:"",testimonial2Name:"",testimonial2Text:"",testimonial2Role:"",testimonial3Name:"",testimonial3Text:"",testimonial3Role:"",faq1Question:"Nitaanzaje baada ya kulipia?",faq1Answer:"Baada ya malipo kuthibitishwa, utatumiwa link ya kujiunga na darasa na kuanza masomo mara moja.",faq2Question:"Nitapata support?",faq2Answer:"Ndiyo, utapata msaada wa moja kwa moja kupitia group letu la WhatsApp la wanafunzi.",faq3Question:"Je, bei inaweza kubadilika?",faq3Answer:"Bei inaweza kubadilika kulingana na ofa zilizopo. Hakikisha unathibitisha bei ya sasa kabla ya kulipia."});}} color="rgba(255,255,255,.08)" textColor="#fff">✕ Acha</Btn>}
          </div>
        </div>
      </div>

      <div style={{ display:"grid", gap:12 }}>
        {docs.map(item=>(
          <div key={item.id} style={{ borderRadius:16, border:"1px solid rgba(255,255,255,.07)", background:"#1a1d2e", padding:"14px 18px", display:"flex", gap:12, alignItems:"center" }}>
            <AdminThumb src={item.imageUrl} fallback="🎓" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 15 }}>{item.title}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.4)' }}>{item.free?"🆓 Bure":"⭐ Paid"} · {item.price}</div>
              <div style={{ fontSize: 11, color: item.status === 'published' ? '#00C48C' : '#F5A623', fontWeight: 700, textTransform: 'uppercase', marginTop: 4 }}>{item.status}</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn onClick={()=>{
                setEditing(item.id);
                setForm({
                  ...form,
                  ...item,
                  carouselImages: item.carouselImages || [],
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
