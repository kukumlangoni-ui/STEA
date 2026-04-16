import { useState, useEffect } from "react";
import {
  getFirebaseDb, collection, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, query, where, onSnapshot, orderBy,
  handleFirestoreError, OperationType
} from "../firebase.js";
import { MARKET_CATEGORIES } from "../constants/marketplace.js";
import { MessageCircle, Package, Plus, LayoutDashboard, ShoppingBag, User, CreditCard } from "lucide-react";

const G = "#F5A623", G2 = "#FFD17C";

// ── Shared UI ─────────────────────────────────────────
const Btn = ({ children, onClick, color = G, textColor = "#111", disabled, style = {} }) => (
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

const Select = (props) => (
  <select {...props} style={{ height:46, borderRadius:12, border:"1px solid rgba(255,255,255,.1)",
    background:"rgba(255,255,255,.05)", color:"#fff", padding:"0 14px", outline:"none",
    fontFamily:"inherit", fontSize:14, width:"100%", cursor:"pointer", ...props.style }}
    onFocus={e=>e.target.style.borderColor=G}
    onBlur={e=>e.target.style.borderColor="rgba(255,255,255,.1)"}>
    {props.children}
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

function StatCard({ icon, label, value, color = G }) {
  return (
    <div style={{ borderRadius:18, border:"1px solid rgba(255,255,255,.08)", background:"#141823",
      padding:"20px 24px", display:"flex", alignItems:"center", gap:16 }}>
      <div style={{ width:52, height:52, borderRadius:14, display:"grid", placeItems:"center",
        background:`${color}18`, fontSize:26 }}>{icon}</div>
      <div>
        <div style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize: 28, fontWeight:800, color, lineHeight:1 }}>
          {value}
        </div>
        <div style={{ fontSize:13, color:"rgba(255,255,255,.45)", marginTop:4 }}>{label}</div>
      </div>
    </div>
  );
}

// ── Seller Dashboard Component ────────────────────────
export default function SellerDashboard({ user, onBack }) {
  const [section, setSection] = useState("dashboard");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const db = getFirebaseDb();
  const toast_ = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!db || !user?.uid) return;

    // Listen to seller's products
    const qProducts = query(
      collection(db, "products"),
      where("ownerId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsubProducts = onSnapshot(qProducts, (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => {
      console.error("Error loading products:", err);
      handleFirestoreError(err, OperationType.LIST, "products");
    });

    // Listen to seller's orders
    const qOrders = query(
      collection(db, "orders"),
      where("sellerId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsubOrders = onSnapshot(qOrders, (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.error("Error loading orders:", err);
      handleFirestoreError(err, OperationType.LIST, "orders");
    });

    return () => {
      unsubProducts();
      unsubOrders();
    };
  }, [db, user?.uid]);

  const SECTIONS = [
    { id: "dashboard", icon: <LayoutDashboard size={18} />, label: "Dashboard" },
    { id: "products", icon: <ShoppingBag size={18} />, label: "My Products" },
    { id: "add_product", icon: <Plus size={18} />, label: "Add Product" },
    { id: "orders", icon: <Package size={18} />, label: "Orders / Messages" },
    { id: "profile", icon: <User size={18} />, label: "My Profile" },
    { id: "plan", icon: <CreditCard size={18} />, label: "Subscription / Plan" },
  ];

  const handleSaveProduct = async (formData) => {
    try {
      const isNew = !editingProduct;
      const canDirect = !!user.canPublishDirect;
      
      const data = {
        ...formData,
        updatedAt: serverTimestamp(),
      };

      if (isNew) {
        data.ownerId = user.uid;
        data.ownerName = user.displayName || user.email;
        data.ownerRole = user.role || "seller";
        data.sector = "marketplace";
        data.createdAt = serverTimestamp();
        data.status = canDirect ? "published" : "pending_review";
        data.published = canDirect;
        
        if (canDirect) {
          data.approvedBy = "system_trusted";
          data.approvedAt = serverTimestamp();
        }

        await addDoc(collection(db, "products"), data);
        toast_(canDirect ? "Bidhaa imewekwa live!" : "Bidhaa imeongezwa na inasubiri review!");
      } else {
        // Preserve original metadata
        delete data.id;
        delete data.createdAt;
        delete data.ownerId;
        delete data.ownerName;
        delete data.ownerRole;
        delete data.sector;

        // If editing an already published product and user is NOT trusted, maybe it should go back to review?
        if (!canDirect && editingProduct.status === "published") {
          data.status = "pending_review";
          data.published = false;
        }
        
        await updateDoc(doc(db, "products", editingProduct.id), data);
        toast_("Bidhaa imesasishwa!");
      }
      setSection("products");
      setEditingProduct(null);
    } catch (err) {
      console.error("Error saving product:", err);
      toast_("Imeshindwa kuhifadhi bidhaa", "error");
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Una uhakika unataka kufuta bidhaa hii?")) return;
    try {
      await deleteDoc(doc(db, "products", id));
      toast_("Bidhaa imefutwa");
    } catch (err) {
      console.error("Error deleting product:", err);
      toast_("Imeshindwa kufuta bidhaa", "error");
    }
  };

  return (
    <div className="seller-dashboard-container" style={{ minHeight:"100vh", display:"grid", gridTemplateColumns: "260px 1fr", background:"#0a0b0f", color: "#fff" }}>
      <style>{`
        @media (max-width: 768px) {
          .seller-dashboard-container { grid-template-columns: 1fr !important; }
          .seller-sidebar { display: ${sidebarOpen ? 'flex' : 'none'} !important; position: fixed !important; z-index: 1000 !important; background: #0a0b0f !important; width: 100% !important; }
          .seller-main-content { padding: 16px !important; }
          .mobile-menu-btn { display: block !important; }
        }
        @media (min-width: 769px) {
          .mobile-menu-btn { display: none !important; }
        }
      `}</style>

      {/* Sidebar */}
      <div className="seller-sidebar" style={{ borderRight:"1px solid rgba(255,255,255,.06)", padding:"24px 16px", position:"sticky", top:0, height:"100vh", overflowY:"auto", display: "flex", flexDirection: "column" }}>
        <div style={{ marginBottom:28, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:20, fontWeight:800, marginBottom:4, color: G }}>🛍️ Seller Panel</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,.35)" }}>STEA Marketplace</div>
          </div>
          <button className="mobile-menu-btn" onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 24, cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ display:"grid", gap:4 }}>
          {SECTIONS.map(s=>(
            <button key={s.id} onClick={()=>{setSection(s.id); setSidebarOpen(false); setEditingProduct(null);}}
              style={{ border:"none", borderRadius:12, padding:"12px 14px", textAlign:"left", cursor:"pointer", fontWeight:700, fontSize:14,
                background:section===s.id?`linear-gradient(135deg,${G},${G2})`:"transparent",
                color:section===s.id?"#111":"rgba(255,255,255,.65)",
                display:"flex", alignItems:"center", gap:10, transition:"all .2s" }}>
              {s.icon} {s.label}
            </button>
          ))}
        </div>

        <div style={{ marginTop:"auto", paddingTop:24 }}>
          <button onClick={onBack} style={{ border:"1px solid rgba(255,255,255,.08)", borderRadius:12, padding:"10px 14px", background:"transparent", color:"rgba(255,255,255,.5)", cursor:"pointer", fontWeight:700, fontSize:13, width:"100%", display:"flex", alignItems:"center", gap:8 }}>
            ← Rudi Website
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="seller-main-content" style={{ padding:"28px 32px", overflowY:"auto" }}>
        <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)} style={{ marginBottom: 20, padding: '10px 15px', background: G, border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>☰ Menu</button>
        
        {toast && <Toast msg={toast.msg} type={toast.type} />}

        {section === "dashboard" && (
          <div>
            <h1 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:32, margin:"0 0 24px" }}>
              Karibu, <span style={{ color:G }}>{user?.displayName || "Seller"}</span> 🚀
            </h1>
            
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:16, marginBottom:32 }}>
              <StatCard icon="📦" label="Total Products" value={products.length} color="#818cf8" />
              <StatCard icon="✅" label="Approved" value={products.filter(p => p.status === "approved" || p.status === "published").length} color="#22c55e" />
              <StatCard icon="⏳" label="Pending Review" value={products.filter(p => p.status === "pending_review").length} color="#fbbf24" />
              <StatCard icon="💳" label="Total Orders" value={orders.length} color="#ff85cf" />
            </div>

            <div style={{ borderRadius:20, border:"1px solid rgba(245,166,35,.2)", background:"rgba(245,166,35,.06)", padding:24 }}>
              <h3 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:20, margin:"0 0 16px", color:G }}>📈 Muhtasari wa Mauzo</h3>
              <p style={{ color: "rgba(255,255,255,.5)", fontSize: 14 }}>Hapa utaona takwimu za mauzo yako pindi yatakapoanza kuingia.</p>
            </div>
          </div>
        )}

        {section === "products" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:28, margin: 0 }}>📦 Bidhaa <span style={{color:G}}>Zangu</span></h2>
              <Btn onClick={() => setSection("add_product")}>+ Ongeza Mpya</Btn>
            </div>

            {loading ? (
              <div style={{ textAlign: "center", padding: 40 }}>Inapakia...</div>
            ) : products.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, background: "rgba(255,255,255,.02)", borderRadius: 20 }}>
                <ShoppingBag size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
                <p style={{ color: "rgba(255,255,255,.4)" }}>Huna bidhaa yoyote bado.</p>
                <Btn onClick={() => setSection("add_product")} style={{ marginTop: 16 }}>Anza Kuuza Sasa</Btn>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {products.map(p => (
                  <div key={p.id} style={{ background: "#141823", borderRadius: 16, padding: 16, border: "1px solid rgba(255,255,255,.06)", display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ width: 60, height: 60, borderRadius: 12, background: "rgba(255,255,255,.05)", overflow: "hidden", display: "grid", placeItems: "center" }}>
                      {p.imageUrl ? <img src={p.imageUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Package size={24} opacity={0.3} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>{p.name}</div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ color: G, fontWeight: 700, fontSize: 14 }}>Tsh {Number(p.price).toLocaleString()}</span>
                        <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, background: p.status === "approved" || p.status === "published" ? "rgba(34,197,94,.1)" : p.status === "rejected" ? "rgba(239,68,68,.1)" : "rgba(251,191,36,.1)", color: p.status === "approved" || p.status === "published" ? "#22c55e" : p.status === "rejected" ? "#ef4444" : "#fbbf24", fontWeight: 800, textTransform: "uppercase" }}>
                          {p.status?.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => { setEditingProduct(p); setSection("add_product"); }} style={{ background: "rgba(255,255,255,.05)", border: "none", color: "#fff", padding: "8px 12px", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>Edit</button>
                      <button onClick={() => handleDeleteProduct(p.id)} style={{ background: "rgba(239,68,68,.1)", border: "none", color: "#ef4444", padding: "8px 12px", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {section === "add_product" && (
          <div style={{ maxWidth: 600 }}>
            <h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:28, marginBottom: 24 }}>
              {editingProduct ? "✏️ Hariri" : "➕ Ongeza"} <span style={{color:G}}>Bidhaa</span>
            </h2>
            <SellerProductForm 
              initial={editingProduct} 
              onSave={handleSaveProduct} 
              onCancel={() => { setSection("products"); setEditingProduct(null); }} 
            />
          </div>
        )}

        {section === "orders" && (
          <div>
            <h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:28, marginBottom: 24 }}>📦 Oda <span style={{color:G}}>& Ujumbe</span></h2>
            {orders.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, background: "rgba(255,255,255,.02)", borderRadius: 20 }}>
                <MessageCircle size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
                <p style={{ color: "rgba(255,255,255,.4)" }}>Huna oda yoyote bado.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {orders.map(o => (
                  <div key={o.id} style={{ background: "#141823", borderRadius: 16, padding: 16, border: "1px solid rgba(255,255,255,.06)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                      <span style={{ fontWeight: 800 }}>Oda #{o.id.substring(0,6).toUpperCase()}</span>
                      <span style={{ color: G, fontWeight: 800 }}>Tsh {Number(o.amount).toLocaleString()}</span>
                    </div>
                    <div style={{ fontSize: 14, color: "rgba(255,255,255,.6)", marginBottom: 4 }}>Mteja: {o.customerName}</div>
                    <div style={{ fontSize: 14, color: "rgba(255,255,255,.6)" }}>Bidhaa: {o.productName}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {section === "profile" && (
          <div style={{ maxWidth: 500 }}>
            <h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:28, marginBottom: 24 }}>👤 Profile <span style={{color:G}}>Yangu</span></h2>
            <div style={{ background: "#141823", borderRadius: 20, padding: 24, border: "1px solid rgba(255,255,255,.06)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
                <div style={{ width: 80, height: 80, borderRadius: "50%", background: G, display: "grid", placeItems: "center", fontSize: 32 }}>
                  {user?.photoURL ? <img src={user.photoURL} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} /> : user?.displayName?.[0] || "S"}
                </div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800 }}>{user?.displayName}</div>
                  <div style={{ color: "rgba(255,255,255,.4)", fontSize: 14 }}>{user?.email}</div>
                </div>
              </div>
              <div style={{ display: "grid", gap: 16 }}>
                <Field label="Jina la Biashara"><Input value={user?.displayName} disabled /></Field>
                <Field label="Email"><Input value={user?.email} disabled /></Field>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,.3)", marginTop: 8 }}>Ili kubadilisha maelezo ya profile, wasiliana na super admin.</p>
              </div>
            </div>
          </div>
        )}

        {section === "plan" && (
          <div style={{ maxWidth: 500 }}>
            <h2 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:28, marginBottom: 24 }}>💳 Mpango <span style={{color:G}}>wa Malipo</span></h2>
            <div style={{ background: `linear-gradient(135deg, ${G}22, transparent)`, borderRadius: 20, padding: 32, border: `1px solid ${G}33`, textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: G, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 8 }}>Current Plan</div>
              <div style={{ fontSize: 40, fontWeight: 900, marginBottom: 16 }}>Free Seller</div>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px", display: "grid", gap: 12, color: "rgba(255,255,255,.7)", fontSize: 15 }}>
                <li>✅ Unlimited Product Listings</li>
                <li>✅ Basic Analytics</li>
                <li>✅ WhatsApp Integration</li>
                <li>❌ Featured Badge</li>
                <li>❌ Direct Publishing</li>
              </ul>
              <Btn style={{ width: "100%", height: 50, fontSize: 15 }}>Upgrade to Premium</Btn>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function SellerProductForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    imageUrl: "",
    whatsappNumber: "",
    ...initial
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.category) return;
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 20 }}>
      <Field label="Jina la Bidhaa *">
        <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Mfano: iPhone 15 Pro" required />
      </Field>
      
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Field label="Bei (Tsh) *">
          <Input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} placeholder="2,500,000" required />
        </Field>
        <Field label="Kategoria *">
          <Select value={form.category} onChange={e => setForm({...form, category: e.target.value})} required>
            <option value="">Chagua...</option>
            {Object.values(MARKET_CATEGORIES).map(c => (
              <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Picha URL">
        <Input value={form.imageUrl} onChange={e => setForm({...form, imageUrl: e.target.value})} placeholder="https://..." />
      </Field>

      <Field label="WhatsApp Number (Optional)">
        <Input value={form.whatsappNumber} onChange={e => setForm({...form, whatsappNumber: e.target.value})} placeholder="2557..." />
      </Field>

      <Field label="Maelezo">
        <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Elezea bidhaa yako..." />
      </Field>

      <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
        <Btn type="submit" style={{ flex: 1, height: 50, fontSize: 15 }}>{initial ? "Hifadhi Mabadiliko" : "Ongeza Bidhaa"}</Btn>
        <Btn onClick={onCancel} color="rgba(255,255,255,.05)" textColor="#fff" style={{ height: 50, padding: "0 24px" }}>Acha</Btn>
      </div>
    </form>
  );
}
