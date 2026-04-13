import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Zap, Lock, Globe, CheckCircle, AlertCircle, Clock, Download, Copy, CreditCard, Smartphone, Monitor, Laptop, Play, Server, HelpCircle } from "lucide-react";
import { useMobile } from "../hooks/useMobile";
import { db, doc, getDoc, setDoc, serverTimestamp, collection, onSnapshot, storage, ref, uploadBytes, getDownloadURL } from "../firebase";
import { startVpnTrial } from "../admin/vpnHelpers";

const G = "#F5A623";
const G2 = "#FFD17C";

export default function VpnDashboard({ user, onAuth }) {
  console.log("VpnDashboard Render - User:", user?.uid || "Not Logged In");
  const isMobile = useMobile();
  const [vpnData, setVpnData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentPlan, setPaymentPlan] = useState(null);
  const [transactionId, setTransactionId] = useState("");
  const [usernameEmail, setUsernameEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState("android");
  const [instructions, setInstructions] = useState(null);
  const [settings, setSettings] = useState({ trialEnabled: true, trialDays: 2, plans: [] });
  const [paymentSettings, setPaymentSettings] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [amountPaid, setAmountPaid] = useState("");
  const [screenshotFile, setScreenshotFile] = useState(null);

  useEffect(() => {
    // Fetch global settings
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
      unsubSettings();
      unsubPaymentSettings();
    };
  }, []);

  useEffect(() => {
    // Fetch instructions for selected device
    const fetchInstructions = async () => {
      try {
        const snap = await getDoc(doc(db, "vpnInstructions", selectedDevice));
        if (snap.exists()) {
          setInstructions(snap.data());
        } else {
          setInstructions(null);
        }
      } catch (err) {
        console.error("Error fetching instructions:", err);
      }
    };
    fetchInstructions();
  }, [selectedDevice]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const userRef = doc(db, "users", user.uid);
    const unsubUser = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setVpnData(data.vpn || { status: 'inactive', trialEligible: settings.trialEnabled !== false });
      } else {
        setVpnData({ status: 'inactive', trialEligible: settings.trialEnabled !== false });
      }
      setLoading(false);
    }, (err) => {
      console.error("Error fetching VPN data:", err);
      setLoading(false);
    });

    return () => unsubUser();
  }, [user, settings.trialEnabled]);

  useEffect(() => {
    if (user) {
      setUsernameEmail(user.email || user.displayName || "");
    }
  }, [user]);

  const handleStartTrial = async () => {
    if (!user) return onAuth();
    setSubmitting(true);
    try {
      const trialHours = (settings.trialDays || 1) * 24;
      console.log(`Attempting to start trial for ${user.uid} with ${trialHours} hours.`);
      await startVpnTrial(db, user.uid, trialHours);
      
      // Refresh local state
      const userSnap = await getDoc(doc(db, "users", user.uid));
      if (userSnap.exists()) {
        setVpnData(userSnap.data().vpn);
      }
      
      setMessage({ type: 'success', text: `Free trial started successfully! Enjoy your trial of STEA VPN.` });
    } catch (err) {
      console.error("Trial Start Error:", err);
      // Check if it's a permission error or data error
      const errorMsg = err.message || 'Failed to start trial. Please try again.';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (!user) return onAuth();
    if (!paymentPlan || !usernameEmail || !amountPaid || !selectedPaymentMethod || !screenshotFile) {
      setMessage({ type: 'error', text: 'Tafadhali jaza taarifa zote muhimu na uweke screenshot.' });
      return;
    }

    setSubmitting(true);
    try {
      let screenshotUrl = "";
      if (screenshotFile) {
        const storageRef = ref(storage, `payment_screenshots/${user.uid}_${Date.now()}_${screenshotFile.name}`);
        await uploadBytes(storageRef, screenshotFile);
        screenshotUrl = await getDownloadURL(storageRef);
      }

      const userRef = doc(db, "users", user.uid);
      
      // Add to payments collection
      const paymentRef = doc(collection(db, "payments"));
      await setDoc(paymentRef, {
        userId: user.uid,
        userEmail: user.email,
        usernameEmail,
        transactionId: transactionId || "",
        service: 'vpn',
        planType: paymentPlan,
        amountPaid: Number(amountPaid),
        paymentMethod: selectedPaymentMethod.name,
        screenshotUrl,
        status: 'pending',
        submittedAt: serverTimestamp(),
      });

      // Update user VPN status to pending
      const newVpnData = {
        ...vpnData,
        status: vpnData.status === 'active' || vpnData.status === 'trial' ? vpnData.status : 'pending_approval',
      };

      await setDoc(userRef, { vpn: newVpnData }, { merge: true });
      setVpnData(newVpnData);
      setMessage({ type: 'success', text: 'Malipo yako yametumwa! Admin atathibitisha hivi punde.' });
      setTransactionId("");
      setAmountPaid("");
      setScreenshotFile(null);
      setSelectedPaymentMethod(null);
      setPaymentPlan(null);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Imeshindwa kutuma taarifa za malipo. Jaribu tena.' });
    } finally {
      setSubmitting(false);
    }
  };

  const getEffectiveStatus = () => {
    if (!vpnData) return 'inactive';
    const now = new Date();
    if (vpnData.status === 'active' && vpnData.endDate) {
      const endDate = vpnData.endDate.toDate ? vpnData.endDate.toDate() : new Date(vpnData.endDate);
      if (endDate < now) return 'expired';
    }
    if (vpnData.status === 'trial' && vpnData.trialEndsAt) {
      const endsAt = vpnData.trialEndsAt.toDate ? vpnData.trialEndsAt.toDate() : new Date(vpnData.trialEndsAt);
      if (endsAt < now) return 'expired';
    }
    return vpnData.status;
  };

  const getStatusDisplay = () => {
    if (loading) return <div style={{ color: 'rgba(255,255,255,0.5)' }}>Loading status...</div>;

    const status = getEffectiveStatus();
    
    if (status === 'inactive') {
      return (
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Akaunti Yako Haijaunganishwa</h3>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 20 }}>Anza kutumia STEA VPN leo kwa ulinzi na kasi zaidi.</p>
          {settings.trialEnabled !== false && (vpnData?.trialEligible !== false) ? (
            <button 
              onClick={handleStartTrial}
              disabled={submitting}
              style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #F5A623, #FFD17C)', color: '#000', borderRadius: 12, fontWeight: 800, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <Zap size={18} /> {!user ? 'Ingia & Anza Free Trial' : `Anza Free Trial (Siku ${settings.trialDays || 1})`}
            </button>
          ) : (
            <a 
              href={user ? "#pricing" : "#"} 
              onClick={(e) => { if(!user) { e.preventDefault(); onAuth(); } }}
              style={{ padding: '12px 24px', background: 'rgba(245,166,35,0.1)', color: G, border: `1px solid ${G}`, borderRadius: 12, fontWeight: 800, textDecoration: 'none', display: 'inline-block' }}
            >
              Chagua Plan ya Kuanza
            </a>
          )}
        </div>
      );
    }

    if (status === 'trial') {
      const endsAt = vpnData.trialEndsAt?.toDate ? vpnData.trialEndsAt.toDate() : new Date(vpnData.trialEndsAt);
      const diff = endsAt - new Date();
      const hours = Math.max(0, Math.floor(diff / (1000 * 60 * 60)));
      const mins = Math.max(0, Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)));
      
      return (
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(86,183,255,0.1)', color: '#56B7FF', padding: '6px 16px', borderRadius: 20, fontWeight: 800, marginBottom: 16 }}>
            <Clock size={16} /> Free Trial Active
          </div>
          <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
            Muda Uliobaki: {hours > 0 ? `${hours}h ${mins}m` : `${mins}m`}
          </h3>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 20 }}>Access yako ya muda itafungwa baada ya muda huu kuisha.</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
            <a 
              href={user ? "#pricing" : "#"} 
              onClick={(e) => { if(!user) { e.preventDefault(); onAuth(); } }}
              style={{ padding: '10px 20px', background: G, color: '#000', borderRadius: 12, fontWeight: 800, textDecoration: 'none', fontSize: 14 }}
            >
              Nunua Plan Sasa
            </a>
          </div>
        </div>
      );
    }

    if (status === 'active') {
      const endsAt = vpnData.endDate?.toDate ? vpnData.endDate.toDate() : new Date(vpnData.endDate);
      return (
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(46,213,115,0.1)', color: '#2ed573', padding: '6px 16px', borderRadius: 20, fontWeight: 800, marginBottom: 16 }}>
            <CheckCircle size={16} /> VPN Ipo Active
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Inaisha: {endsAt.toLocaleDateString()}</h3>
          <p style={{ color: 'rgba(255,255,255,0.6)' }}>Asante kwa kutumia STEA VPN.</p>
        </div>
      );
    }

    if (status === 'expired') {
      return (
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,71,87,0.1)', color: '#ff4757', padding: '6px 16px', borderRadius: 20, fontWeight: 800, marginBottom: 16 }}>
            <AlertCircle size={16} /> Trial / Plan Expired
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>Muda wako wa kutumia VPN umeisha.</h3>
          <a 
            href={user ? "#pricing" : "#"} 
            onClick={(e) => { if(!user) { e.preventDefault(); onAuth(); } }}
            style={{ padding: '12px 24px', background: G, color: '#000', borderRadius: 12, fontWeight: 800, textDecoration: 'none', display: 'inline-block' }}
          >
            {vpnData?.planType ? 'Renew Plan' : 'Buy Plan'}
          </a>
        </div>
      );
    }

    if (status === 'pending_approval') {
      return (
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(245,166,35,0.1)', color: G, padding: '6px 16px', borderRadius: 20, fontWeight: 800, marginBottom: 16 }}>
            <Clock size={16} /> Inasubiri Uthibitisho
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Malipo Yako Yanahakikiwa</h3>
          <p style={{ color: 'rgba(255,255,255,0.6)' }}>Tafadhali subiri admin athibitishe malipo yako. Utapata taarifa hivi punde.</p>
        </div>
      );
    }
  };

  return (
    <div style={{ paddingTop: 80, paddingBottom: 60, minHeight: '100vh', background: '#05060a', color: '#fff', fontFamily: "'Instrument Sans', sans-serif" }}>
      {/* Hero Section */}
      <div style={{ padding: isMobile ? "40px 20px" : "80px 40px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "100%", height: "100%", background: "radial-gradient(circle at center, rgba(245,166,35,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />
        
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
          <Shield size={64} color={G} style={{ margin: "0 auto 24px", filter: "drop-shadow(0 0 20px rgba(245,166,35,0.4))" }} />
        </motion.div>
        
        <h1 style={{ fontSize: isMobile ? 36 : 56, fontWeight: 900, fontFamily: "'Bricolage Grotesque', sans-serif", marginBottom: 16, lineHeight: 1.1 }}>
          Browse Like a Ghost.<br />
          <span style={{ background: `linear-gradient(135deg, ${G}, ${G2})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Fast. Secure. Private.</span>
        </h1>
        <p style={{ fontSize: isMobile ? 16 : 20, color: "rgba(255,255,255,0.6)", maxWidth: 600, margin: "0 auto 40px" }}>
          Ficha IP yako, fungua mitandao iliyofungwa, na uperuzi kwa kasi ya 5G ukiwa na STEA VPN.
        </p>
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 20px" }}>
        
        {message && (
          <div style={{ padding: 16, borderRadius: 12, marginBottom: 24, background: message.type === 'error' ? 'rgba(255,71,87,0.1)' : 'rgba(46,213,115,0.1)', color: message.type === 'error' ? '#ff4757' : '#2ed573', border: `1px solid ${message.type === 'error' ? 'rgba(255,71,87,0.3)' : 'rgba(46,213,115,0.3)'}`, display: 'flex', alignItems: 'center', gap: 12 }}>
            {message.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
            {message.text}
          </div>
        )}

        {/* Status Card */}
        <div style={{ background: "#0a0c14", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 24, padding: isMobile ? 24 : 40, marginBottom: 40, boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}>
          {getStatusDisplay()}
        </div>

        {/* Quick Actions */}
        {user && (getEffectiveStatus() === 'active' || getEffectiveStatus() === 'trial') && (
          <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16, marginBottom: 32, msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
            <style>{`::-webkit-scrollbar { display: none; }`}</style>
            {[
              { id: 'connect', label: 'Connect Now', icon: <Zap size={20} />, action: () => { const configUrl = vpnData?.configLink; if (configUrl) { window.location.href = configUrl; } else { setMessage({type: 'error', text: 'Config yako bado haijaandaliwa. Tafadhali subiri au wasiliana na admin.'}); } }, primary: true },
              { id: 'copy', label: 'Copy Access', icon: <Copy size={20} />, action: () => { if(vpnData?.configLink) { navigator.clipboard.writeText(vpnData.configLink); setMessage({type: 'success', text: 'Config copied!'}); } } },
              { id: 'servers', label: 'Change Server', icon: <Server size={20} />, action: () => { document.getElementById('servers-section')?.scrollIntoView({behavior: 'smooth'}); } },
              { id: 'guide', label: 'Setup Guide', icon: <HelpCircle size={20} />, action: () => { document.getElementById('setup-guide')?.scrollIntoView({behavior: 'smooth'}); } },
              { id: 'buy', label: 'Buy Plan', icon: <CreditCard size={20} />, action: () => { document.getElementById('pricing')?.scrollIntoView({behavior: 'smooth'}); } },
            ].map(btn => (
              <button
                key={btn.id}
                onClick={btn.action}
                style={{
                  minWidth: 100,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  background: btn.primary ? G : 'rgba(255,255,255,0.05)',
                  color: btn.primary ? '#000' : '#fff',
                  border: btn.primary ? 'none' : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 16,
                  padding: '16px 12px',
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                {btn.icon}
                {btn.label}
              </button>
            ))}
          </div>
        )}

        {/* Config Access Area */}
        {user && (getEffectiveStatus() === 'active' || getEffectiveStatus() === 'trial') && (
          <div style={{ background: "linear-gradient(135deg, rgba(245,166,35,0.1), rgba(245,166,35,0.02))", border: `1px solid rgba(245,166,35,0.2)`, borderRadius: 24, padding: isMobile ? 24 : 40, marginBottom: 40 }}>
            <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16, color: G, display: 'flex', alignItems: 'center', gap: 12 }}>
              <Lock size={24} /> Config Yako
            </h3>
            {vpnData?.configAssigned && vpnData?.configLink ? (
              <div>
                <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 20 }}>Hii ni config yako maalum. Usishiriki na mtu mwingine.</p>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <button onClick={() => { navigator.clipboard.writeText(vpnData.configLink); setMessage({type: 'success', text: 'Config copied to clipboard!'}) }} style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: 12, border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                    <Copy size={18} /> Copy Link
                  </button>
                  <a href={vpnData.configLink} download style={{ padding: '12px 24px', background: G, color: '#000', borderRadius: 12, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, textDecoration: 'none' }}>
                    <Download size={18} /> Pakua Config
                  </a>
                </div>
              </div>
            ) : (
              <p style={{ color: 'rgba(255,255,255,0.7)' }}>Config yako inaandaliwa. Tafadhali rudi baada ya muda mfupi au wasiliana na admin.</p>
            )}
          </div>
        )}

        {/* Servers Section */}
        {user && (getEffectiveStatus() === 'active' || getEffectiveStatus() === 'trial') && settings.servers?.length > 0 && (
          <div id="servers-section" style={{ background: "#0a0c14", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 24, padding: isMobile ? 24 : 40, marginBottom: 40 }}>
            <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
              <Server size={24} color={G} /> Chagua Server
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 16 }}>
              {settings.servers.map((server, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if(vpnData?.configLink) window.location.href = vpnData.configLink;
                    else setMessage({type: 'error', text: 'Config not ready yet.'});
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 16,
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: 16,
                    cursor: 'pointer',
                    color: '#fff',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 24 }}>{server.flag}</span>
                    <span style={{ fontWeight: 700 }}>{server.name}</span>
                  </div>
                  <Zap size={16} color={G} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* How to Connect */}
        <h3 id="setup-guide" style={{ fontSize: 28, fontWeight: 900, marginBottom: 24, textAlign: 'center', fontFamily: "'Bricolage Grotesque', sans-serif" }}>Jinsi ya Kuanza Kutumia STEA VPN</h3>
        
        {/* Device Selector */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 32, flexWrap: 'wrap' }}>
          {[
            { id: 'android', label: 'Android', icon: <Smartphone size={18} /> },
            { id: 'iphone', label: 'iPhone', icon: <Smartphone size={18} /> },
            { id: 'windows', label: 'Windows', icon: <Monitor size={18} /> },
            { id: 'mac', label: 'Mac', icon: <Laptop size={18} /> }
          ].map(device => (
            <button
              key={device.id}
              onClick={() => setSelectedDevice(device.id)}
              style={{
                padding: '10px 20px',
                background: selectedDevice === device.id ? 'rgba(245,166,35,0.1)' : 'rgba(255,255,255,0.05)',
                color: selectedDevice === device.id ? G : '#fff',
                border: `1px solid ${selectedDevice === device.id ? G : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.2s'
              }}
            >
              {device.icon} {device.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 20, marginBottom: 40 }}>
          {[
            { step: 1, title: "Pakua App", desc: "Pakua app inayopendekezwa kwa kifaa chako.", icon: <Download size={24} />, action: instructions?.appLink ? <a href={instructions.appLink} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 12, padding: '8px 16px', background: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>Pakua {instructions?.appName || 'App'} Hapa</a> : null },
            { step: 2, title: "Pata Access Yako", desc: "Ingia STEA VPN, anza free trial au nunua plan, kisha access yako itaonekana kulingana na akaunti yako.", icon: <Copy size={24} /> },
            { step: 3, title: "Unganisha", desc: "Baada ya access yako kuonekana, bonyeza Connect Now au tumia access yako ndani ya app.", icon: <Globe size={24} /> }
          ].map((item) => (
            <div key={item.step} style={{ background: "#0a0c14", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 20, padding: 24, position: 'relative' }}>
              <div style={{ position: 'absolute', top: -12, left: 24, width: 24, height: 24, background: G, color: '#000', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 12 }}>
                {item.step}
              </div>
              <div style={{ color: G, marginBottom: 16, marginTop: 8 }}>{item.icon}</div>
              <h4 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>{item.title}</h4>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.5 }}>{item.desc}</p>
              {item.action}
            </div>
          ))}
        </div>

        {instructions?.troubleshooting && (
          <div style={{ background: 'rgba(245,166,35,0.05)', border: `1px solid rgba(245,166,35,0.2)`, borderRadius: 16, padding: 20, marginBottom: 40 }}>
            <h4 style={{ fontSize: 16, fontWeight: 800, color: G, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={18} /> Troubleshooting
            </h4>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>{instructions.troubleshooting}</p>
          </div>
        )}

        {instructions?.videoLink && (
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <a href={instructions.videoLink} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: 12, fontWeight: 700, textDecoration: 'none' }}>
              <Play size={18} color={G} /> Tazama Video ya Maelekezo
            </a>
          </div>
        )}

        {/* Pricing & Payment */}
        <div id="pricing" style={{ background: "#0a0c14", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 24, padding: isMobile ? 24 : 40, marginBottom: 40 }}>
          <h3 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8, textAlign: 'center', fontFamily: "'Bricolage Grotesque', sans-serif" }}>Vifurushi Vyetu</h3>
          <p style={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginBottom: 32 }}>
            Chagua kifurushi kinachokufaa na ufanye malipo.<br />
            <span style={{ fontSize: 13, color: G, marginTop: 8, display: 'block' }}>Baada ya malipo kuthibitishwa, access yako itawekwa kwenye akaunti yako ya STEA VPN.</span>
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 20, marginBottom: 40 }}>
            {(settings.plans && settings.plans.length > 0 ? settings.plans.filter(p => p.active !== false) : [
              { id: 'weekly', name: 'Wiki 1', price: 'Tsh 2,000' },
              { id: 'monthly', name: 'Mwezi 1', price: 'Tsh 5,000', highlight: 'Popular' },
              { id: 'yearly', name: 'Mwaka 1', price: 'Tsh 50,000' }
            ]).map((plan) => (
              <div 
                key={plan.id} 
                onClick={() => setPaymentPlan(plan.id)}
                style={{ 
                  background: paymentPlan === plan.id ? 'rgba(245,166,35,0.1)' : 'rgba(255,255,255,0.02)', 
                  border: `1px solid ${paymentPlan === plan.id ? G : 'rgba(255,255,255,0.05)'}`, 
                  borderRadius: 16, 
                  padding: 24, 
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.2s'
                }}
              >
                {plan.highlight && (
                  <div style={{ position: 'absolute', top: -10, right: 20, background: G, color: '#000', fontSize: 10, fontWeight: 900, padding: '4px 8px', borderRadius: 8, textTransform: 'uppercase' }}>
                    {plan.highlight}
                  </div>
                )}
                <h4 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>{plan.name}</h4>
                <div style={{ fontSize: 24, fontWeight: 900, color: paymentPlan === plan.id ? G : '#fff' }}>{plan.price}</div>
              </div>
            ))}
          </div>

          {/* Payment Form */}
          <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 16, padding: 24, border: '1px solid rgba(255,255,255,0.05)' }}>
            <h4 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CreditCard size={20} color={G} /> Fanya Malipo
            </h4>
            
            {/* Payment Method Selection */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 12, fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>Chagua Njia ya Malipo (Payment Method)</label>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {paymentSettings.filter(m => m.enabled).length > 0 ? (
                  paymentSettings.filter(m => m.enabled).map(method => (
                    <button
                      key={method.id}
                      onClick={() => setSelectedPaymentMethod(method)}
                      style={{
                        padding: '10px 20px',
                        background: selectedPaymentMethod?.id === method.id ? 'rgba(245,166,35,0.1)' : 'rgba(255,255,255,0.05)',
                        color: selectedPaymentMethod?.id === method.id ? G : '#fff',
                        border: `1px solid ${selectedPaymentMethod?.id === method.id ? G : 'rgba(255,255,255,0.1)'}`,
                        borderRadius: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {method.name}
                    </button>
                  ))
                ) : (
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>No payment methods available. Contact admin.</p>
                )}
              </div>
            </div>

            {/* Dynamic Payment Display */}
            {selectedPaymentMethod && (
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: 20, borderRadius: 12, marginBottom: 24, border: '1px dashed rgba(255,255,255,0.1)' }}>
                <h5 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: G }}>Maelekezo ya {selectedPaymentMethod.name}</h5>
                {selectedPaymentMethod.qrImage && (
                  <div style={{ marginBottom: 16 }}>
                    <img src={selectedPaymentMethod.qrImage} alt={`QR Code for ${selectedPaymentMethod.name}`} style={{ maxWidth: 200, borderRadius: 8 }} />
                  </div>
                )}
                {selectedPaymentMethod.phoneNumber && (
                  <p style={{ fontSize: 16, marginBottom: 8 }}>Namba ya Simu: <strong style={{ color: '#fff', fontSize: 18 }}>{selectedPaymentMethod.phoneNumber}</strong></p>
                )}
                {selectedPaymentMethod.accountNumber && (
                  <p style={{ fontSize: 16, marginBottom: 8 }}>Akaunti: <strong style={{ color: '#fff', fontSize: 18 }}>{selectedPaymentMethod.accountNumber}</strong></p>
                )}
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>Tafadhali fanya malipo kisha ujaze fomu hapa chini.</p>
              </div>
            )}

            <div style={{ background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.2)', padding: 12, borderRadius: 8, marginBottom: 24 }}>
              <p style={{ color: '#ff4757', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertCircle size={16} /> Make sure you enter your correct username. Payments without correct username may not be approved.
              </p>
            </div>
            
            <form onSubmit={handleSubmitPayment}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>Username au Email ya STEA <span style={{color: '#ff4757'}}>*</span></label>
                <input 
                  type="text" 
                  value={usernameEmail}
                  onChange={(e) => setUsernameEmail(e.target.value)}
                  placeholder="Username au Email uliyojisajili nayo"
                  style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 16, outline: 'none' }}
                  required
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>Kiasi Ulicholipa (Amount Paid) <span style={{color: '#ff4757'}}>*</span></label>
                <input 
                  type="number" 
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder="Mfano: 5000"
                  style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 16, outline: 'none' }}
                  required
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>Namba ya Muamala (Transaction ID) - Optional</label>
                <input 
                  type="text" 
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="Mfano: 7G12H34J5K"
                  style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 16, outline: 'none' }}
                />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>Weka Picha ya Muamala (Screenshot) <span style={{color: '#ff4757'}}>*</span></label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setScreenshotFile(e.target.files[0])}
                  style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 16, outline: 'none' }}
                  required
                />
              </div>
              <button 
                type="submit" 
                disabled={submitting || !paymentPlan || !usernameEmail || !selectedPaymentMethod || !screenshotFile}
                style={{ width: '100%', padding: '14px', background: (!paymentPlan || !usernameEmail || !selectedPaymentMethod || !screenshotFile) ? 'rgba(255,255,255,0.1)' : G, color: (!paymentPlan || !usernameEmail || !selectedPaymentMethod || !screenshotFile) ? 'rgba(255,255,255,0.3)' : '#000', borderRadius: 12, fontWeight: 800, border: 'none', cursor: (!paymentPlan || !transactionId || !usernameEmail) ? 'not-allowed' : 'pointer', fontSize: 16, transition: 'all 0.2s' }}
              >
                {submitting ? 'Inatuma...' : 'Thibitisha Malipo'}
              </button>
            </form>
          </div>
        </div>

        {/* Support Section */}
        <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.05)', marginBottom: 40 }}>
          <HelpCircle size={32} color={G} style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Unahitaji Msaada?</h3>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 24, maxWidth: 500, margin: '0 auto 24px' }}>
            Tusaidie kukusaidia! Wasiliana nasi kwa msaada wa kusetup, matatizo ya malipo, au kama huoni access yako baada ya kulipia.
          </p>
          <a href="https://wa.me/8619715852043" target="_blank" rel="noreferrer" style={{ padding: '12px 24px', background: '#25D366', color: '#fff', borderRadius: 12, fontWeight: 800, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            Wasiliana Nasi WhatsApp
          </a>
        </div>

        {/* Security Note */}
        <div style={{ textAlign: 'center', padding: '20px', opacity: 0.5, fontSize: 12 }}>
          <p>Access ya VPN hutolewa kulingana na akaunti yako na inaweza kubadilishwa baada ya trial au plan kuisha.</p>
        </div>

      </div>
    </div>
  );
}
