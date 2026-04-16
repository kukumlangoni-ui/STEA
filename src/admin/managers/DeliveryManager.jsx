import React, { useState, useEffect } from "react";
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc,
  serverTimestamp
} from "firebase/firestore";
import { getFirebaseDb } from "../../firebase";
import { Btn, Toast, G } from "../AdminUI";

export default function DeliveryManager() {
  const [deliveries, setDeliveries] = useState([]);
  const [toast, setToast] = useState(null);
  const db = getFirebaseDb();
  const toast_ = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(collection(db, "deliveries"), (snap) => setDeliveries(snap.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => console.error("Error loading deliveries:", err));
    return () => unsub();
  }, [db]);

  const markDelivered = async (id) => {
    try {
      await updateDoc(doc(db, "deliveries", id), { deliveryStatus: "delivered", deliveredAt: serverTimestamp() });
      toast_("Imewekwa kama Delivered!");
    } catch (e) {
      console.error(e);
      toast_("Imeshindwa kusasisha", "error");
    }
  };

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type}/>}
      <h3 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:20, margin:"0 0 20px" }}>Delivery Manager</h3>
      <div style={{ display: "grid", gap: 12 }}>
        {deliveries.map(d => (
          <div key={d.id} style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,.07)", background: "#1a1d2e", padding: "14px 18px", display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Order: {d.orderId}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Status: {d.deliveryStatus}</div>
            </div>
            {d.deliveryStatus !== "delivered" && (
              <Btn onClick={() => markDelivered(d.id)} color={G} textColor="#111" style={{ padding: "8px 14px" }}>Mark Delivered</Btn>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
