import React, { useState, useEffect } from "react";
import { 
  collection, 
  onSnapshot,
  addDoc,
  serverTimestamp
} from "firebase/firestore";
import { getFirebaseDb } from "../../firebase";
import { Btn, Toast, G } from "../AdminUI";

export default function SubscriptionManager() {
  const [subs, setSubs] = useState([]);
  const [toast, setToast] = useState(null);
  const db = getFirebaseDb();
  const toast_ = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, "subscriptions"), (snap) => setSubs(snap.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => console.error("Error loading subscriptions:", err));
    return () => unsub();
  }, [db]);

  const sendReminder = async (sub) => {
    try {
      await addDoc(collection(db, "reminders"), {
        subscriptionId: sub.id,
        customerEmail: sub.customerEmail || "",
        type: "renewal_reminder",
        createdAt: serverTimestamp(),
        status: "pending"
      });
      toast_("Reminder imetumwa!");
    } catch (e) {
      console.error(e);
      toast_("Imeshindwa kutuma reminder", "error");
    }
  };

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type}/>}
      <h3 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:20, margin:"0 0 20px" }}>Subscriptions</h3>
      <div style={{ display: "grid", gap: 12 }}>
        {subs.map(s => (
          <div key={s.id} style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,.07)", background: "#1a1d2e", padding: "14px 18px", display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.customerName} - {s.status}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Ends: {s.endDate?.toDate ? s.endDate.toDate().toLocaleDateString() : s.endDate}</div>
            </div>
            <Btn onClick={() => sendReminder(s)} color={G} textColor="#111" style={{ padding: "8px 14px" }}>Send Reminder</Btn>
          </div>
        ))}
      </div>
    </div>
  );
}
