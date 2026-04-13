import React, { useState, useEffect } from "react";
import { CreditCard, CheckCircle, Zap, Clock, AlertCircle } from "lucide-react";
import { getFirebaseDb, collection, doc, updateDoc, setDoc, onSnapshot, query, orderBy, addDoc, deleteDoc, serverTimestamp } from "../firebase.js";
import { assignConfigToUser, expireUserVpnAccess, rotateExpiredConfigs, startVpnTrial } from "./vpnHelpers.js";
import { useMobile } from "../hooks/useMobile";

const G = "#F5A623";

export default function VpnManager() {
  const isMobile = useMobile();
  const [tab, setTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [payments, setPayments] = useState([]);
  const [instructions, setInstructions] = useState({});
  const [settings, setSettings] = useState({ trialEnabled: true, trialDays: 2, plans: [], servers: [] });
  const [paymentSettings, setPaymentSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");
  const [userFilter, setUserFilter] = useState("all"); // all, vpn, pending, trial, active, expired, issues, stea
  const [expandedUser, setExpandedUser] = useState(null);

  const db = getFirebaseDb();

  useEffect(() => {
    if (!db) return;
    
    // Fetch users
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const unsubUsers = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setUsers(data);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching users:", err);
      setLoading(false);
    });

    // Fetch instructions
    const unsubInst = onSnapshot(collection(db, "vpnInstructions"), (snap) => {
      const instData = {};
      snap.docs.forEach(d => { instData[d.id] = d.data(); });
      setInstructions(instData);
    });

    // Fetch sources
    const unsubSources = onSnapshot(collection(db, "vpnSources"), (snap) => {
      const sourceData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setConfigs(sourceData);
    });

    // Fetch payments
    const qPayments = query(collection(db, "payments"), orderBy("submittedAt", "desc"));
    const unsubPayments = onSnapshot(qPayments, (snap) => {
      const paymentData = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(p => p.service === 'vpn');
      setPayments(paymentData);
    });

    // Fetch settings
    const unsubSettings = onSnapshot(doc(db, "adminSettings", "vpn"), (snap) => {
      if (snap.exists()) {
        setSettings(snap.data());
      }
    });

    // Fetch payment settings
    const unsubPaymentSettings = onSnapshot(collection(db, "paymentSettings"), (snap) => {
      const methods = [];
      snap.forEach(doc => {
        methods.push({ id: doc.id, ...doc.data() });
      });
      setPaymentSettings(methods);
    });

    return () => {
      unsubUsers();
      unsubInst();
      unsubSettings();
      unsubSources();
      unsubPayments();
      unsubPaymentSettings();
    };
  }, [db]);

  // Derived Data
  const vpnUsers = users.filter(u => {
    const vpn = u.vpn || {};
    const hasPayment = payments.some(p => p.userId === u.id);
    return vpn.status && vpn.status !== 'inactive' || vpn.trialEligible === false || vpn.assignedConfigId || hasPayment;
  });

  const stats = {
    pendingPayments: payments.filter(p => p.status === 'pending').length,
    activeUsers: vpnUsers.filter(u => u.vpn?.status === 'active').length,
    trialUsers: vpnUsers.filter(u => u.vpn?.status === 'trial').length,
    expiredUsers: vpnUsers.filter(u => {
      const status = u.vpn?.status;
      if (status === 'expired') return true;
      const now = new Date();
      if (status === 'active' && u.vpn?.endDate) {
        const d = u.vpn.endDate.toDate ? u.vpn.endDate.toDate() : new Date(u.vpn.endDate);
        return d < now;
      }
      if (status === 'trial' && u.vpn?.trialEndsAt) {
        const d = u.vpn.trialEndsAt.toDate ? u.vpn.trialEndsAt.toDate() : new Date(u.vpn.trialEndsAt);
        return d < now;
      }
      return false;
    }).length,
    subscriptionIssues: vpnUsers.filter(u => {
      const vpn = u.vpn || {};
      const hasPending = payments.some(p => p.userId === u.id && p.status === 'pending');
      const now = new Date();
      const isExpired = (vpn.status === 'active' && vpn.endDate && (vpn.endDate.toDate ? vpn.endDate.toDate() : new Date(vpn.endDate)) < now) ||
                        (vpn.status === 'trial' && vpn.trialEndsAt && (vpn.trialEndsAt.toDate ? vpn.trialEndsAt.toDate() : new Date(vpn.trialEndsAt)) < now);
      const missingConfig = (vpn.status === 'active' || vpn.status === 'trial') && !vpn.assignedConfigId;
      return hasPending || isExpired || missingConfig || vpn.status === 'expired';
    }).length
  };

  const filteredUsers = (userFilter === 'stea' ? users : vpnUsers).filter(u => {
    // Status Filter
    if (userFilter !== 'all' && userFilter !== 'vpn' && userFilter !== 'stea') {
      const vpn = u.vpn || {};
      const status = vpn.status;
      const now = new Date();
      
      if (userFilter === 'pending') {
        const hasPending = payments.some(p => p.userId === u.id && p.status === 'pending');
        if (!hasPending && status !== 'pending_approval') return false;
      }
      if (userFilter === 'trial' && status !== 'trial') return false;
      if (userFilter === 'active' && status !== 'active') return false;
      if (userFilter === 'expired') {
        let isExpired = status === 'expired';
        if (status === 'active' && vpn.endDate) {
          const d = vpn.endDate.toDate ? vpn.endDate.toDate() : new Date(vpn.endDate);
          if (d < now) isExpired = true;
        }
        if (status === 'trial' && vpn.trialEndsAt) {
          const d = vpn.trialEndsAt.toDate ? vpn.trialEndsAt.toDate() : new Date(vpn.trialEndsAt);
          if (d < now) isExpired = true;
        }
        if (!isExpired) return false;
      }
      if (userFilter === 'issues') {
        const hasPending = payments.some(p => p.userId === u.id && p.status === 'pending');
        const isExpired = (status === 'active' && vpn.endDate && (vpn.endDate.toDate ? vpn.endDate.toDate() : new Date(vpn.endDate)) < now) ||
                          (status === 'trial' && vpn.trialEndsAt && (vpn.trialEndsAt.toDate ? vpn.trialEndsAt.toDate() : new Date(vpn.trialEndsAt)) < now);
        const missingConfig = (status === 'active' || status === 'trial') && !vpn.assignedConfigId;
        const hasIssue = hasPending || isExpired || missingConfig || status === 'expired';
        if (!hasIssue) return false;
      }
    }

    // Search
    const s = search.toLowerCase();
    const userPayments = payments.filter(p => p.userId === u.id);
    const hasMatchingTx = userPayments.some(p => p.transactionId?.toLowerCase().includes(s));
    
    return u.name?.toLowerCase().includes(s) || 
           u.email?.toLowerCase().includes(s) || 
           u.phone?.toLowerCase().includes(s) ||
           u.id.toLowerCase().includes(s) ||
           hasMatchingTx;
  });

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleUpdateVpn = async (userId, vpnData) => {
    try {
      await updateDoc(doc(db, "users", userId), { vpn: vpnData });
      showToast("VPN status updated successfully!");
    } catch (error) {
      console.error("Error updating VPN:", error);
      showToast("Failed to update VPN status", "error");
    }
  };

  const grantTrial = async (user) => {
    try {
      setLoading(true);
      const trialHours = (settings.trialDays || 2) * 24;
      await startVpnTrial(db, user.id, trialHours);
      showToast("Trial granted and config assigned!");
    } catch (error) {
      console.error(error);
      showToast(error.message || "Failed to grant trial", "error");
    } finally {
      setLoading(false);
    }
  };

  const extendTrial = (user) => {
    const currentEndsAt = user.vpn?.trialEndsAt?.toDate ? user.vpn.trialEndsAt.toDate() : new Date();
    const newEndsAt = new Date(currentEndsAt.getTime() + 7 * 24 * 60 * 60 * 1000);
    handleUpdateVpn(user.id, {
      ...(user.vpn || {}),
      status: 'trial',
      trialEndsAt: newEndsAt
    });
  };

  const resetTrial = (user) => {
    handleUpdateVpn(user.id, {
      ...(user.vpn || {}),
      trialEligible: true,
      status: user.vpn?.status === 'trial' ? 'inactive' : user.vpn?.status
    });
  };

  const handleRunRotation = async () => {
    try {
      setLoading(true);
      const res = await rotateExpiredConfigs(db);
      showToast(`Rotation complete: ${res.expiredCount} expired, ${res.releasedCount} released.`);
    } catch (error) {
      console.error(error);
      showToast("Failed to run rotation", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePayment = async (payment) => {
    try {
      setLoading(true);
      const plan = settings.plans?.find(p => p.id === payment.planType) || { durationDays: 30 };
      await assignConfigToUser(db, payment.userId, plan.durationDays, payment.planType);
      await updateDoc(doc(db, "payments", payment.id), { status: 'approved' });
      showToast("Payment approved and config assigned!");
    } catch (error) {
      console.error(error);
      showToast(error.message || "Failed to approve payment", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSource = async (e) => {
    e.preventDefault();
    const label = e.target.label.value;
    const link = e.target.link.value;
    if (!label || !link) return;
    try {
      await addDoc(collection(db, "vpnSources"), {
        label,
        configUrl: link,
        type: e.target.type.value,
        status: "available",
        assignedTo: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      e.target.reset();
      showToast("Subscription Source added!");
    } catch (error) {
      console.error(error);
      showToast("Failed to add source", "error");
    }
  };

  const handleDeleteConfig = async (id) => {
    if (window.confirm("Are you sure you want to delete this config?")) {
      try {
        await deleteDoc(doc(db, "vpnSources", id));
        showToast("Config deleted");
      } catch (error) {
        console.error(error);
        showToast("Failed to delete config", "error");
      }
    }
  };

  const suspendUserVpn = (user) => {
    handleUpdateVpn(user.id, {
      ...(user.vpn || {}),
      status: 'suspended'
    });
  };

  const handleRejectPayment = async (paymentId) => {
    try {
      setLoading(true);
      await updateDoc(doc(db, "payments", paymentId), { status: 'rejected' });
      showToast("Payment rejected.");
    } catch (error) {
      console.error(error);
      showToast("Failed to reject payment", "error");
    } finally {
      setLoading(false);
    }
  };

  const activatePaid = (user) => {
    const now = new Date();
    const endsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days default
    handleUpdateVpn(user.id, {
      ...(user.vpn || {}),
      status: 'active',
      startDate: now,
      endDate: endsAt,
      approvedByAdmin: true
    });
  };

  const saveSettings = async (newSettings) => {
    try {
      await setDoc(doc(db, "adminSettings", "vpn"), newSettings, { merge: true });
      showToast("Settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      showToast("Failed to save settings", "error");
    }
  };

  const saveInstruction = async (device, data) => {
    try {
      await setDoc(doc(db, "vpnInstructions", device), data, { merge: true });
      showToast(`${device} instructions saved!`);
    } catch (error) {
      console.error("Error saving instructions:", error);
      showToast("Failed to save instructions", "error");
    }
  };

  return (
    <div>
      {toast && (
        <div style={{ position:"fixed", bottom:24, right:24, zIndex:9999, padding:"14px 20px", borderRadius:14, fontWeight:700, fontSize:14, background:toast.type==="error"?"rgba(239,68,68,.95)":"rgba(0,196,140,.95)", color:"#fff", boxShadow:"0 12px 32px rgba(0,0,0,.4)", animation:"slideUp .3s ease" }}>
          {toast.type==="error"?"❌":"✅"} {toast.msg}
        </div>
      )}

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <h2 style={{ fontSize:24, fontWeight:800 }}>STEA VPN Management</h2>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 16, overflowX: "auto" }}>
        {["users", "payments", "configs", "instructions", "settings", "payment_settings"].map(t => (
          <button 
            key={t}
            onClick={() => setTab(t)}
            style={{ 
              padding: "8px 16px", 
              background: tab === t ? "rgba(245,166,35,0.1)" : "transparent", 
              color: tab === t ? G : "rgba(255,255,255,0.6)", 
              border: `1px solid ${tab === t ? G : "transparent"}`, 
              borderRadius: 8, 
              fontWeight: 700, 
              cursor: "pointer",
              textTransform: "capitalize",
              position: "relative"
            }}
          >
            {t}
            {t === 'payments' && stats.pendingPayments > 0 && (
              <span style={{ position: "absolute", top: -5, right: -5, background: "#ef4444", color: "#fff", fontSize: 10, padding: "2px 6px", borderRadius: 10, fontWeight: 800 }}>
                {stats.pendingPayments}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
        {[
          { label: "Pending Payments", value: stats.pendingPayments, color: G, icon: <CreditCard size={20} /> },
          { label: "Active VPN Users", value: stats.activeUsers, color: "#2ed573", icon: <CheckCircle size={20} /> },
          { label: "Trial Users", value: stats.trialUsers, color: "#56B7FF", icon: <Zap size={20} /> },
          { label: "Expired Users", value: stats.expiredUsers, color: "#ff4757", icon: <Clock size={20} /> },
          { label: "Subscription Issues", value: stats.subscriptionIssues, color: "#ff4757", icon: <AlertCircle size={20} /> },
        ].map((card, i) => (
          <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600 }}>{card.label}</div>
              <div style={{ color: card.color }}>{card.icon}</div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: card.color }}>{card.value}</div>
          </div>
        ))}
      </div>

      {tab === "users" && (
        <>
          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 16, marginBottom: 24, alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1, width: "100%" }}>
              <input 
                type="text" 
                placeholder="Search by name, email, phone, UID, or Tx ID..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#fff", outline: "none" }}
              />
            </div>
            <div style={{ display: "flex", gap: 8, width: isMobile ? "100%" : "auto" }}>
              <select 
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                style={{ padding: "12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.2)", color: "#fff", fontWeight: 600 }}
              >
                <option value="all">All VPN Users</option>
                <option value="stea">All STEA Users</option>
                <option value="pending">Pending Payments</option>
                <option value="trial">Trial Users</option>
                <option value="active">Active Users</option>
                <option value="expired">Expired Users</option>
                <option value="issues">Subscription Issues</option>
              </select>
              <button 
                onClick={handleRunRotation}
                style={{ padding: "12px 20px", background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
              >
                🔄 Rotate Expiry
              </button>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.5)" }}>Loading VPN users...</div>
          ) : (
            <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.05)", textAlign: "left" }}>
                <th style={{ padding: "16px", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>User Details</th>
                <th style={{ padding: "16px", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>VPN Status</th>
                <th style={{ padding: "16px", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Plan & Expiry</th>
                <th style={{ padding: "16px", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Config</th>
                <th style={{ padding: "16px", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => {
                const vpn = u.vpn || { status: 'inactive' };
                const userPayments = payments.filter(p => p.userId === u.id);
                const hasPending = userPayments.some(p => p.status === 'pending');
                
                return (
                  <React.Fragment key={u.id}>
                  <tr style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "16px" }}>
                      <div style={{ fontWeight: 700, color: "#fff" }}>{u.name || "No Name"}</div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{u.email}</div>
                      {u.phone && <div style={{ fontSize: 11, color: G }}>{u.phone}</div>}
                    </td>
                    <td style={{ padding: "16px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <span style={{ 
                          padding: "4px 8px", 
                          borderRadius: 8, 
                          fontSize: 11, 
                          fontWeight: 800,
                          textAlign: "center",
                          width: "fit-content",
                          background: vpn.status === 'active' ? 'rgba(46,213,115,0.1)' : vpn.status === 'trial' ? 'rgba(86,183,255,0.1)' : vpn.status === 'pending_approval' ? 'rgba(245,166,35,0.1)' : vpn.status === 'expired' ? 'rgba(255,71,87,0.1)' : 'rgba(255,255,255,0.05)',
                          color: vpn.status === 'active' ? '#2ed573' : vpn.status === 'trial' ? '#56B7FF' : vpn.status === 'pending_approval' ? G : vpn.status === 'expired' ? '#ff4757' : '#fff'
                        }}>
                          {vpn.status.toUpperCase()}
                        </span>
                        {hasPending && (
                          <span style={{ fontSize: 10, color: G, fontWeight: 700 }}>⚠️ PENDING PAYMENT</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: "16px" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, textTransform: "capitalize" }}>{vpn.planType || "No Plan"}</div>
                      {vpn.endDate && (
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
                          Ends: {vpn.endDate.toDate ? vpn.endDate.toDate().toLocaleDateString() : new Date(vpn.endDate).toLocaleDateString()}
                        </div>
                      )}
                      {vpn.status === 'trial' && vpn.trialEndsAt && (
                        <div style={{ fontSize: 11, color: "#56B7FF" }}>
                          Ends: {vpn.trialEndsAt.toDate ? vpn.trialEndsAt.toDate().toLocaleString() : new Date(vpn.trialEndsAt).toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "16px" }}>
                      {vpn.assignedConfigId ? (
                        <div style={{ fontSize: 12, color: G, background: "rgba(245,166,35,0.1)", padding: "4px 8px", borderRadius: 4, width: "fit-content" }}>{vpn.assignedConfigId}</div>
                      ) : (
                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>None</span>
                      )}
                    </td>
                    <td style={{ padding: "16px" }}>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button 
                          onClick={() => setExpandedUser(expandedUser === u.id ? null : u.id)}
                          style={{ padding: "6px 12px", background: expandedUser === u.id ? G : "rgba(255,255,255,0.05)", color: expandedUser === u.id ? "#000" : "#fff", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                        >
                          {expandedUser === u.id ? "Close" : "Actions"}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedUser === u.id && (
                    <tr>
                      <td colSpan="5" style={{ padding: "24px", background: "rgba(255,255,255,0.01)" }}>
                        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 24 }}>
                          <div>
                            <h4 style={{ fontSize: 14, fontWeight: 800, marginBottom: 12, color: G }}>VPN Profile Details</h4>
                            <div style={{ display: "grid", gap: 8, fontSize: 13 }}>
                              <div style={{ color: "rgba(255,255,255,0.5)" }}>UID: <span style={{ color: "#fff" }}>{u.id}</span></div>
                              <div style={{ color: "rgba(255,255,255,0.5)" }}>Trial Eligible: <span style={{ color: vpn.trialEligible ? "#2ed573" : "#ff4757" }}>{vpn.trialEligible ? "Yes" : "No"}</span></div>
                              <div style={{ color: "rgba(255,255,255,0.5)" }}>Assigned Config: <span style={{ color: G }}>{vpn.assignedConfigId || "None"}</span></div>
                              <div style={{ color: "rgba(255,255,255,0.5)" }}>Config Link: <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", wordBreak: "break-all" }}>{vpn.configLink || "N/A"}</div></div>
                            </div>
                          </div>
                          <div>
                            <h4 style={{ fontSize: 14, fontWeight: 800, marginBottom: 12, color: G }}>Admin Operations</h4>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                              {vpn.status !== 'active' && (
                                <button onClick={() => activatePaid(u)} style={{ padding: "8px 16px", background: "rgba(46,213,115,0.1)", color: "#2ed573", border: "1px solid rgba(46,213,115,0.3)", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                                  Activate Paid
                                </button>
                              )}
                              {vpn.status !== 'trial' && vpn.status !== 'active' && (
                                <button onClick={() => grantTrial(u)} style={{ padding: "8px 16px", background: "rgba(86,183,255,0.1)", color: "#56B7FF", border: "1px solid rgba(86,183,255,0.3)", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                                  Grant Trial
                                </button>
                              )}
                              {vpn.status === 'trial' && (
                                <button onClick={() => extendTrial(u)} style={{ padding: "8px 16px", background: "rgba(245,166,35,0.1)", color: G, border: `1px solid rgba(245,166,35,0.3)`, borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                                  Extend 7 Days
                                </button>
                              )}
                              {(vpn.status === 'active' || vpn.status === 'trial') && (
                                <button onClick={() => expireUserVpnAccess(db, u.id, vpn.assignedConfigId)} style={{ padding: "8px 16px", background: "rgba(255,71,87,0.1)", color: "#ff4757", border: "1px solid rgba(255,71,87,0.3)", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                                  Force Expire
                                </button>
                              )}
                              {!vpn.trialEligible && (
                                <button onClick={() => resetTrial(u)} style={{ padding: "8px 16px", background: "rgba(86,183,255,0.1)", color: "#56B7FF", border: "1px solid rgba(86,183,255,0.3)", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                                  Reset Trial Eligibility
                                </button>
                              )}
                              <button onClick={() => suspendUserVpn(u)} style={{ padding: "8px 16px", background: "rgba(255,255,255,0.05)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                                Suspend Account
                              </button>
                            </div>
                          </div>
                        </div>
                        {userPayments.length > 0 && (
                          <div style={{ marginTop: 24 }}>
                            <h4 style={{ fontSize: 12, fontWeight: 800, marginBottom: 8, color: "rgba(255,255,255,0.4)" }}>Payment History</h4>
                            <div style={{ display: "grid", gap: 8 }}>
                              {userPayments.map(p => (
                                <div key={p.id} style={{ display: "flex", justifyContent: "space-between", background: "rgba(0,0,0,0.2)", padding: "8px 12px", borderRadius: 8, fontSize: 11 }}>
                                  <span>{p.planType.toUpperCase()} - {p.transactionId}</span>
                                  <span style={{ color: p.status === 'approved' ? '#2ed573' : p.status === 'pending' ? G : '#ff4757', fontWeight: 800 }}>{p.status.toUpperCase()}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                  </React.Fragment>
                );
              })}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
                    No users found matching your search/filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
        </>
      )}

      {tab === "configs" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
            <div style={{ background: "rgba(255,255,255,0.02)", padding: 20, borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>Available Paid Configs</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: G }}>{configs.filter(c => c.status === 'available' && (c.type === 'paid' || !c.type)).length}</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.02)", padding: 20, borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>Available Trial Configs</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#56B7FF" }}>{configs.filter(c => c.status === 'available' && c.type === 'trial').length}</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.02)", padding: 20, borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>Total Assigned</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#fff" }}>{configs.filter(c => c.status === 'assigned').length}</div>
            </div>
          </div>

          <div style={{ background: "rgba(245,166,35,0.05)", borderRadius: 16, border: "1px solid rgba(245,166,35,0.2)", padding: 20, marginBottom: 24 }}>
            <h4 style={{ fontSize: 14, fontWeight: 800, color: G, marginBottom: 8 }}>💡 Trial Config Requirement</h4>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>
              For the <strong>Free Trial</strong> to work, you must have at least one config in the <code>vpnConfigs</code> collection with:
              <br/>• <code>status: &quot;available&quot;</code>
              <br/>• <code>type: &quot;trial&quot;</code>
            </p>
          </div>

          <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)", padding: 24, marginBottom: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>Add Subscription Source</h3>
            <form onSubmit={handleAddSource} style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <input name="label" placeholder="Label (e.g. Trial Source 1)" required style={{ flex: 1, minWidth: 150, padding: "12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.2)", color: "#fff" }} />
              <input name="link" placeholder="Paste Hiddify-compatible subscription URL here" required style={{ flex: 2, minWidth: 250, padding: "12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.2)", color: "#fff" }} />
              <select name="type" required style={{ padding: "12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.2)", color: "#fff" }}>
                <option value="paid">Paid Subscription</option>
                <option value="trial">Trial Subscription</option>
              </select>
              <button type="submit" style={{ padding: "12px 24px", background: G, color: "#000", borderRadius: 8, fontWeight: 800, border: "none", cursor: "pointer" }}>Add Source</button>
            </form>
          </div>

          <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.05)", textAlign: "left" }}>
                  <th style={{ padding: "16px", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Label</th>
                  <th style={{ padding: "16px", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Type</th>
                  <th style={{ padding: "16px", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Status</th>
                  <th style={{ padding: "16px", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {configs.map(c => (
                  <tr key={c.id} style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "16px", fontWeight: 600 }}>{c.label}</td>
                    <td style={{ padding: "16px" }}>
                      <span style={{ padding: "4px 8px", borderRadius: 8, fontSize: 11, fontWeight: 700, background: c.type === 'trial' ? 'rgba(86,183,255,0.1)' : 'rgba(245,166,35,0.1)', color: c.type === 'trial' ? '#56B7FF' : G }}>
                        {c.type?.toUpperCase() || 'PAID'}
                      </span>
                    </td>
                    <td style={{ padding: "16px" }}>
                      <span style={{ padding: "4px 8px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: c.status === 'available' ? 'rgba(46,213,115,0.1)' : 'rgba(255,71,87,0.1)', color: c.status === 'available' ? '#2ed573' : '#ff4757' }}>
                        {c.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: "16px" }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => handleDeleteConfig(c.id)} style={{ padding: "6px 12px", background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {configs.length === 0 && <tr><td colSpan="4" style={{ padding: 24, textAlign: "center", color: "rgba(255,255,255,0.5)" }}>No subscription sources found.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "payments" && (
        <div style={{ display: "grid", gap: 24 }}>
          <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)", padding: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16, color: G }}>Pending VPN Payment Approvals</h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.05)", textAlign: "left" }}>
                    <th style={{ padding: "16px", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>User</th>
                    <th style={{ padding: "16px", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Plan & Amount</th>
                    <th style={{ padding: "16px", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Payment Details</th>
                    <th style={{ padding: "16px", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Submitted</th>
                    <th style={{ padding: "16px", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.filter(p => p.status === 'pending').map(p => {
                    return (
                      <tr key={p.id} style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                        <td style={{ padding: "16px" }}>
                          <div style={{ fontWeight: 700 }}>{p.usernameEmail || p.userEmail}</div>
                          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>UID: {p.userId}</div>
                        </td>
                        <td style={{ padding: "16px" }}>
                          <div style={{ fontWeight: 800, textTransform: "capitalize", color: "#fff" }}>{p.planType}</div>
                          <div style={{ fontSize: 12, color: G }}>Tsh {p.amountPaid || "N/A"}</div>
                        </td>
                        <td style={{ padding: "16px" }}>
                          <div style={{ fontWeight: 700, color: "#fff" }}>{p.paymentMethod}</div>
                          {p.transactionId && <div style={{ fontFamily: "monospace", color: G, fontSize: 12 }}>ID: {p.transactionId}</div>}
                          {p.screenshotUrl && (
                            <a href={p.screenshotUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#56B7FF", textDecoration: "underline", display: "inline-block", marginTop: 4 }}>
                              View Screenshot
                            </a>
                          )}
                        </td>
                        <td style={{ padding: "16px", fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                          {p.submittedAt?.toDate ? p.submittedAt.toDate().toLocaleString() : new Date(p.submittedAt).toLocaleString()}
                        </td>
                        <td style={{ padding: "16px" }}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => handleApprovePayment(p)} disabled={loading} style={{ padding: "8px 16px", background: "#2ed573", color: "#000", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 800 }}>
                              Approve
                            </button>
                            <button onClick={() => handleRejectPayment(p.id)} disabled={loading} style={{ padding: "8px 16px", background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {payments.filter(p => p.status === 'pending').length === 0 && (
                    <tr><td colSpan="5" style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.4)" }}>No pending payments to review.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)", padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16, color: "rgba(255,255,255,0.5)" }}>Recent Payment History</h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.05)", textAlign: "left" }}>
                    <th style={{ padding: "12px 16px", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>User</th>
                    <th style={{ padding: "12px 16px", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Plan</th>
                    <th style={{ padding: "12px 16px", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Status</th>
                    <th style={{ padding: "12px 16px", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.filter(p => p.status !== 'pending').slice(0, 10).map(p => (
                    <tr key={p.id} style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                      <td style={{ padding: "12px 16px", fontSize: 12 }}>{p.userEmail}</td>
                      <td style={{ padding: "12px 16px", fontSize: 12, textTransform: "capitalize" }}>{p.planType}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: p.status === 'approved' ? '#2ed573' : '#ef4444' }}>{p.status.toUpperCase()}</span>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                        {p.submittedAt?.toDate ? p.submittedAt.toDate().toLocaleDateString() : new Date(p.submittedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === "instructions" && (
        <div style={{ display: "grid", gap: 24 }}>
          {["iphone", "android", "mac", "windows"].map(device => {
            const inst = instructions[device] || { appName: "", appLink: "", steps: ["", "", ""], troubleshooting: "", videoLink: "" };
            return (
              <div key={device} style={{ background: "rgba(255,255,255,0.02)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)", padding: 24 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16, textTransform: "capitalize", color: G }}>{device} Instructions</h3>
                <div style={{ display: "grid", gap: 16 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>App Name</label>
                      <input 
                        type="text" 
                        defaultValue={inst.appName}
                        onBlur={(e) => saveInstruction(device, { ...inst, appName: e.target.value })}
                        style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.2)", color: "#fff" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>App Download Link</label>
                      <input 
                        type="text" 
                        defaultValue={inst.appLink}
                        onBlur={(e) => saveInstruction(device, { ...inst, appLink: e.target.value })}
                        style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.2)", color: "#fff" }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>Step 1</label>
                    <input 
                      type="text" 
                      defaultValue={inst.steps?.[0] || ""}
                      onBlur={(e) => {
                        const newSteps = [...(inst.steps || ["", "", ""])];
                        newSteps[0] = e.target.value;
                        saveInstruction(device, { ...inst, steps: newSteps });
                      }}
                      style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.2)", color: "#fff" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>Step 2</label>
                    <input 
                      type="text" 
                      defaultValue={inst.steps?.[1] || ""}
                      onBlur={(e) => {
                        const newSteps = [...(inst.steps || ["", "", ""])];
                        newSteps[1] = e.target.value;
                        saveInstruction(device, { ...inst, steps: newSteps });
                      }}
                      style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.2)", color: "#fff" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>Step 3</label>
                    <input 
                      type="text" 
                      defaultValue={inst.steps?.[2] || ""}
                      onBlur={(e) => {
                        const newSteps = [...(inst.steps || ["", "", ""])];
                        newSteps[2] = e.target.value;
                        saveInstruction(device, { ...inst, steps: newSteps });
                      }}
                      style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.2)", color: "#fff" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>Troubleshooting Note</label>
                    <input 
                      type="text" 
                      defaultValue={inst.troubleshooting}
                      onBlur={(e) => saveInstruction(device, { ...inst, troubleshooting: e.target.value })}
                      style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.2)", color: "#fff" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>Video Tutorial Link (Optional)</label>
                    <input 
                      type="text" 
                      defaultValue={inst.videoLink}
                      onBlur={(e) => saveInstruction(device, { ...inst, videoLink: e.target.value })}
                      style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.2)", color: "#fff" }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "settings" && (
        <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)", padding: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 24, color: G }}>Global Settings</h3>
          
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
              <input 
                type="checkbox" 
                checked={settings.trialEnabled || false}
                onChange={(e) => saveSettings({ ...settings, trialEnabled: e.target.checked })}
                style={{ width: 20, height: 20 }}
              />
              <span style={{ fontWeight: 600 }}>Enable Free Trial for New Users</span>
            </label>
          </div>

          <div style={{ marginBottom: 32 }}>
            <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>Trial Duration (Days) - Use 0.04 for ~1hr testing</label>
            <input 
              type="number" 
              step="0.01"
              value={settings.trialDays || 1}
              onChange={(e) => saveSettings({ ...settings, trialDays: parseFloat(e.target.value) || 1 })}
              style={{ width: 100, padding: "10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.2)", color: "#fff" }}
            />
          </div>

          <h4 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Pricing Plans</h4>
          <div style={{ display: "grid", gap: 16, marginBottom: 32 }}>
            {["weekly", "monthly", "yearly"].map(planId => {
              const plan = (settings.plans || []).find(p => p.id === planId) || { id: planId, name: "", price: "", durationDays: 7, active: true, highlight: "" };
              return (
                <div key={planId} style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", background: "rgba(0,0,0,0.2)", padding: 16, borderRadius: 12 }}>
                  <div style={{ width: 80, fontWeight: 600, textTransform: "capitalize" }}>{planId}</div>
                  <input 
                    type="text" 
                    placeholder="Plan Name"
                    defaultValue={plan.name}
                    onBlur={(e) => {
                      const newPlans = [...(settings.plans || [])];
                      const idx = newPlans.findIndex(p => p.id === planId);
                      if (idx >= 0) newPlans[idx].name = e.target.value;
                      else newPlans.push({ ...plan, name: e.target.value });
                      saveSettings({ ...settings, plans: newPlans });
                    }}
                    style={{ flex: 1, minWidth: 120, padding: "10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.2)", color: "#fff" }}
                  />
                  <input 
                    type="text" 
                    placeholder="Price"
                    defaultValue={plan.price}
                    onBlur={(e) => {
                      const newPlans = [...(settings.plans || [])];
                      const idx = newPlans.findIndex(p => p.id === planId);
                      if (idx >= 0) newPlans[idx].price = e.target.value;
                      else newPlans.push({ ...plan, price: e.target.value });
                      saveSettings({ ...settings, plans: newPlans });
                    }}
                    style={{ flex: 1, minWidth: 100, padding: "10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.2)", color: "#fff" }}
                  />
                  <input 
                    type="number" 
                    placeholder="Days"
                    defaultValue={plan.durationDays}
                    onBlur={(e) => {
                      const newPlans = [...(settings.plans || [])];
                      const idx = newPlans.findIndex(p => p.id === planId);
                      if (idx >= 0) newPlans[idx].durationDays = parseInt(e.target.value);
                      else newPlans.push({ ...plan, durationDays: parseInt(e.target.value) });
                      saveSettings({ ...settings, plans: newPlans });
                    }}
                    style={{ width: 80, padding: "10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.2)", color: "#fff" }}
                  />
                  <input 
                    type="text" 
                    placeholder="Highlight (e.g. Popular)"
                    defaultValue={plan.highlight}
                    onBlur={(e) => {
                      const newPlans = [...(settings.plans || [])];
                      const idx = newPlans.findIndex(p => p.id === planId);
                      if (idx >= 0) newPlans[idx].highlight = e.target.value;
                      else newPlans.push({ ...plan, highlight: e.target.value });
                      saveSettings({ ...settings, plans: newPlans });
                    }}
                    style={{ flex: 1, minWidth: 120, padding: "10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.2)", color: "#fff" }}
                  />
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                    <input 
                      type="checkbox" 
                      checked={plan.active !== false}
                      onChange={(e) => {
                        const newPlans = [...(settings.plans || [])];
                        const idx = newPlans.findIndex(p => p.id === planId);
                        if (idx >= 0) newPlans[idx].active = e.target.checked;
                        else newPlans.push({ ...plan, active: e.target.checked });
                        saveSettings({ ...settings, plans: newPlans });
                      }}
                    /> Active
                  </label>
                </div>
              );
            })}
          </div>

          <h4 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Servers</h4>
          <div style={{ display: "grid", gap: 16 }}>
            {(settings.servers || []).map((server, idx) => (
              <div key={idx} style={{ display: "flex", gap: 12, alignItems: "center", background: "rgba(0,0,0,0.2)", padding: 16, borderRadius: 12 }}>
                <input 
                  type="text" 
                  placeholder="Flag (e.g. 🇺🇸)"
                  defaultValue={server.flag}
                  onBlur={(e) => {
                    const newServers = [...(settings.servers || [])];
                    newServers[idx].flag = e.target.value;
                    saveSettings({ ...settings, servers: newServers });
                  }}
                  style={{ width: 60, padding: "10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.2)", color: "#fff" }}
                />
                <input 
                  type="text" 
                  placeholder="Server Name (e.g. USA Premium)"
                  defaultValue={server.name}
                  onBlur={(e) => {
                    const newServers = [...(settings.servers || [])];
                    newServers[idx].name = e.target.value;
                    saveSettings({ ...settings, servers: newServers });
                  }}
                  style={{ flex: 1, padding: "10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.2)", color: "#fff" }}
                />
                <button 
                  onClick={() => {
                    const newServers = settings.servers.filter((_, i) => i !== idx);
                    saveSettings({ ...settings, servers: newServers });
                  }}
                  style={{ padding: "10px", background: "rgba(239,68,68,0.2)", color: "#ef4444", border: "none", borderRadius: 8, cursor: "pointer" }}
                >
                  Remove
                </button>
              </div>
            ))}
            <button 
              onClick={() => {
                const newServers = [...(settings.servers || []), { name: "", flag: "🌐" }];
                saveSettings({ ...settings, servers: newServers });
              }}
              style={{ padding: "12px", background: "rgba(255,255,255,0.05)", color: "#fff", border: "1px dashed rgba(255,255,255,0.2)", borderRadius: 12, cursor: "pointer", fontWeight: 600 }}
            >
              + Add Server
            </button>
          </div>
        </div>
      )}

      {tab === "payment_settings" && (
        <div style={{ display: "grid", gap: 24 }}>
          <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)", padding: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16, color: G }}>Payment Methods Configuration</h3>
            <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: 24 }}>Configure the payment methods available to users.</p>
            
            <div style={{ display: "grid", gap: 24 }}>
              {['M-Pesa', 'CRDB Bank', 'WeChat Pay', 'Alipay'].map(methodName => {
                const method = paymentSettings.find(m => m.name === methodName) || { name: methodName, enabled: false };
                return (
                  <div key={methodName} style={{ background: "rgba(0,0,0,0.2)", padding: 20, borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <h4 style={{ fontSize: 16, fontWeight: 700 }}>{methodName}</h4>
                      <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                        <input 
                          type="checkbox" 
                          checked={method.enabled}
                          onChange={(e) => {
                            const newMethod = { ...method, enabled: e.target.checked };
                            if (method.id) {
                              setDoc(doc(db, "paymentSettings", method.id), newMethod, { merge: true });
                            } else {
                              addDoc(collection(db, "paymentSettings"), newMethod);
                            }
                          }}
                        /> Enabled
                      </label>
                    </div>
                    
                    <div style={{ display: "grid", gap: 16 }}>
                      {['M-Pesa'].includes(methodName) && (
                        <div>
                          <label style={{ display: "block", marginBottom: 8, fontSize: 12, color: "rgba(255,255,255,0.6)" }}>Phone Number</label>
                          <input 
                            type="text" 
                            defaultValue={method.phoneNumber || ""}
                            onBlur={(e) => {
                              const newMethod = { ...method, phoneNumber: e.target.value };
                              if (method.id) {
                                setDoc(doc(db, "paymentSettings", method.id), newMethod, { merge: true });
                              } else {
                                addDoc(collection(db, "paymentSettings"), newMethod);
                              }
                            }}
                            style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.2)", color: "#fff" }}
                          />
                        </div>
                      )}
                      {['CRDB Bank'].includes(methodName) && (
                        <div>
                          <label style={{ display: "block", marginBottom: 8, fontSize: 12, color: "rgba(255,255,255,0.6)" }}>Account Number</label>
                          <input 
                            type="text" 
                            defaultValue={method.accountNumber || ""}
                            onBlur={(e) => {
                              const newMethod = { ...method, accountNumber: e.target.value };
                              if (method.id) {
                                setDoc(doc(db, "paymentSettings", method.id), newMethod, { merge: true });
                              } else {
                                addDoc(collection(db, "paymentSettings"), newMethod);
                              }
                            }}
                            style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.2)", color: "#fff" }}
                          />
                        </div>
                      )}
                      {['WeChat Pay', 'Alipay'].includes(methodName) && (
                        <div>
                          <label style={{ display: "block", marginBottom: 8, fontSize: 12, color: "rgba(255,255,255,0.6)" }}>QR Image URL</label>
                          <input 
                            type="text" 
                            defaultValue={method.qrImage || ""}
                            onBlur={(e) => {
                              const newMethod = { ...method, qrImage: e.target.value };
                              if (method.id) {
                                setDoc(doc(db, "paymentSettings", method.id), newMethod, { merge: true });
                              } else {
                                addDoc(collection(db, "paymentSettings"), newMethod);
                              }
                            }}
                            placeholder="https://..."
                            style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.2)", color: "#fff" }}
                          />
                          {method.qrImage && (
                            <img src={method.qrImage} alt="QR Code" style={{ marginTop: 12, maxWidth: 100, borderRadius: 8 }} />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
