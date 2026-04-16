import React, { useState, useEffect } from "react";
import { 
  getFirebaseDb, collection, onSnapshot, 
  updateDoc, deleteDoc, doc 
} from "../../firebase.js";
import { Btn, Input, Select, Toast, ConfirmDialog } from "../AdminUI.jsx";

const G = "#F5A623", G2 = "#FFD17C";
const SECTORS = [
  "courses", "marketplace", "tech_tips", "exams", "websites", 
  "sponsored_ads", "site_updates", "necta", "ai_lab", "gigs"
];
const ROLES = ["user", "creator", "seller", "manager", "reviewer", "super_admin"];

function timeAgo(date) {
  if (!date) return "N/A";
  const seconds = Math.floor((new Date() - (date.toDate ? date.toDate() : new Date(date))) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return Math.floor(seconds) + " seconds ago";
}

export default function UsersManager() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sectorFilter, setSectorFilter] = useState("all");
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

  const updateUserField = async (uid, field, value) => {
    try {
      await updateDoc(doc(db, "users", uid), { [field]: value });
      toast_(`User ${field} updated to ${value}`);
    } catch (e) {
      console.error(e);
      toast_(e.message, "error");
    }
  };

  const updateUserRole = async (uid, role, sector = null) => {
    setConfirm({
      msg: `Una uhakika unataka kubadilisha role ya user huyu kuwa ${role}?`,
      onConfirm: async () => {
        try {
          const data = { role };
          if (sector) data.sector = sector;
          else data.sector = null;
          
          if (role === "super_admin" || role === "admin") {
            data.canApprove = true;
            data.canPublishDirect = true;
            data.isTrusted = true;
          } else if (role === "manager") {
            data.canApprove = true;
            data.canPublishDirect = true;
            data.isTrusted = true;
          } else if (role === "reviewer") {
            data.canApprove = true;
            data.canPublishDirect = false;
            data.isTrusted = true;
          } else if (role === "creator" || role === "seller") {
            data.canApprove = false;
            data.canPublishDirect = false;
            data.isTrusted = false;
          }
          
          await updateDoc(doc(db, "users", uid), data);
          setConfirm(null);
          toast_(`User updated to ${role}${sector ? ` (${sector})` : ""}`);
        } catch (e) {
          console.error(e);
          toast_(e.message, "error");
        }
      },
      onCancel: () => setConfirm(null)
    });
  };

  const delUser = async (uid) => {
    setConfirm({
      msg: "Una uhakika unataka kufuta user huyu? Data zake zote zitafutwa Firestore.",
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

  const filtered = users.filter(u => {
    const matchesSearch = (u.name || "").toLowerCase().includes(search.toLowerCase()) ||
                          (u.email || "").toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const matchesSector = sectorFilter === "all" || u.sector === sectorFilter;
    return matchesSearch && matchesRole && matchesSector;
  });

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      {confirm && <ConfirmDialog {...confirm} />}

      <div style={{ marginBottom: 24, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
        <div style={{ flex: "1 1 300px", minWidth: 0, position: "relative" }}>
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tafuta user kwa jina au email..." style={{ paddingLeft: 44 }} />
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", opacity: .4 }}>🔍</span>
        </div>
        <Select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ width: 150 }}>
          <option value="all">All Roles</option>
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </Select>
        <Select value={sectorFilter} onChange={e => setSectorFilter(e.target.value)} style={{ width: 150 }}>
          <option value="all">All Sectors</option>
          {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
        </Select>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {filtered.map(u => (
          <div key={u.id} style={{ borderRadius: 20, border: "1px solid rgba(255,255,255,.07)", background: "#1a1d2e", padding: "20px", display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: (u.role === "super_admin" || u.role === "admin") ? `linear-gradient(135deg,${G},${G2})` : "rgba(255,255,255,.05)", display: "grid", placeItems: "center", color: (u.role === "super_admin" || u.role === "admin") ? "#111" : "rgba(255,255,255,.4)", fontWeight: 900, fontSize: 20, flexShrink: 0 }}>
              {(u.name || u.email || "U")[0].toUpperCase()}
            </div>
            <div style={{ flex: "1 1 250px", minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 17 }}>{u.name || "No name"} {u.isTrusted && "✅"}</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,.4)', marginBottom: 12 }}>{u.email}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                <Select value={u.role || "user"} onChange={(e) => updateUserRole(u.id, e.target.value, u.sector)} style={{ width: 130, height: 34, fontSize: 12 }}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </Select>
                <Select value={u.sector || ""} onChange={(e) => updateUserField(u.id, "sector", e.target.value)} style={{ width: 130, height: 34, fontSize: 12 }}>
                  <option value="">None</option>
                  {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                </Select>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)" }}>Joined {timeAgo(u.createdAt)}</div>
              {u.email !== "isayamasika100@gmail.com" && <Btn onClick={() => delUser(u.id)} color="rgba(239,68,68,.1)" textColor="#fca5a5" style={{ padding: "8px 12px", fontSize: 12 }}>🗑️ Remove</Btn>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
