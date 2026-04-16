import React, { useState, useEffect } from "react";
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc,
  query,
  orderBy
} from "firebase/firestore";
import { getFirebaseDb } from "../../firebase";
import { Btn, Toast, G } from "../AdminUI";

export default function CommerceManager() {
  const [orders, setOrders] = useState([]);
  const [subs, setSubs] = useState([]);
  const [toast, setToast] = useState(null);
  const db = getFirebaseDb();
  const toast_ = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  useEffect(() => {
    if (!db) return;
    const unsubOrders = onSnapshot(collection(db, "orders"), (snap) => setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => console.error("Error loading orders:", err));
    const unsubSubs = onSnapshot(collection(db, "subscriptions"), (snap) => setSubs(snap.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => console.error("Error loading subs:", err));
    return () => { unsubOrders(); unsubSubs(); };
  }, [db]);

  const approveOrder = async (id) => {
    try {
      await updateDoc(doc(db, "orders", id), { status: "approved" });
      toast_("Order imeidhinishwa!");
    } catch (e) {
      console.error(e);
      toast_("Imeshindwa kuidhinisha!", "error");
    }
  };

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type}/>}
      <div style={{ borderRadius:20, border:"1px solid rgba(255,255,255,.08)", background:"#141823", padding:24, marginBottom:28 }}>
        <h3 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:20, margin:"0 0 20px" }}>Orders</h3>
        <div style={{ display: "grid", gap: 12 }}>
          {orders.map(o => (
            <div key={o.id} style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,.07)", background: "#1a1d2e", padding: "14px 18px", display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Order: {o.dealId}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Amount: {o.amount} | Status: {o.status}</div>
              </div>
              {o.status === "pending" && <Btn onClick={() => approveOrder(o.id)} color={G} textColor="#111" style={{ padding: "8px 14px" }}>Approve</Btn>}
            </div>
          ))}
        </div>
      </div>
      <div style={{ borderRadius:20, border:"1px solid rgba(255,255,255,.08)", background:"#141823", padding:24 }}>
        <h3 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:20, margin:"0 0 20px" }}>Subscriptions</h3>
        <div style={{ display: "grid", gap: 12 }}>
          {subs.map(s => (
            <div key={s.id} style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,.07)", background: "#1a1d2e", padding: "14px 18px", display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Sub: {s.dealId}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Status: {s.status} | End: {s.endDate}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
