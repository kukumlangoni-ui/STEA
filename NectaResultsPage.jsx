import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, X, ChevronLeft, ChevronRight, ArrowLeft,
  MapPin, Tag, MessageCircle,
  Filter, Zap, Shield
} from "lucide-react";
import {
  getFirebaseDb, collection, onSnapshot, query,
  orderBy, where, limit
} from "../firebase.js";
import { useMobile } from "../hooks/useMobile.js";

import { MARKET_CATEGORIES } from "../constants/marketplace.js";

// ── Constants ────────────────────────────────────────
const G = "#F5A623";
const G2 = "#FFD17C";
const DARK = "#05060a";
const CARD_BG = "#0e1018";
const BORDER = "rgba(255,255,255,0.06)";

// ── Category Config ──────────────────────────────────
// (Moved to src/constants/marketplace.js)

const STEA_WA = "8619715852043";
const CONDITIONS = ["New","Used","Refurbished"];

// ── WhatsApp Link Builder ────────────────────────────
function buildWaLink(product) {
  const wa = product.whatsappNumber || STEA_WA;
  const ref = `STEA-${(product.category||"").toUpperCase()}-${(product.id||"").substring(0,6).toUpperCase()}`;
  const msg = product.sellerType === "seller"
    ? `Habari, nimefika kupitia STEA na nataka kununua: ${product.name}. Tafadhali nipe maelezo zaidi.\n\nRef: ${ref}`
    : `Habari, nimefika kupitia STEA na nataka kununua: ${product.name}.\n\nRef: ${ref}`;
  return `https://wa.me/${wa.replace(/\D/g,"")}?text=${encodeURIComponent(msg)}`;
}

// ── Price Formatter ─────────────────────────────────
function fmtPrice(n) {
  if (!n && n !== 0) return "";
  return `Tsh ${Number(n).toLocaleString()}`;
}

// ── Shared Micro Components ──────────────────────────
const Badge = ({ children, color = G, bg }) => (
  <span style={{
    padding: "3px 9px", borderRadius: 999, fontSize: 10, fontWeight: 800,
    background: bg || `${color}18`, color, border: `1px solid ${color}30`,
    textTransform: "uppercase", letterSpacing: ".04em", whiteSpace: "nowrap",
  }}>{children}</span>
);

const WaBtn = ({ label = "Nunua Sasa", product, style = {}, large }) => (
  <button
    onClick={(e) => { e.stopPropagation(); window.open(buildWaLink(product), "_blank"); }}
    style={{
      display: "inline-flex", alignItems: "center", gap: 7,
      background: "#25d366", color: "#fff", border: "none",
      borderRadius: large ? 14 : 10, fontWeight: 800,
      fontSize: large ? 15 : 12,
      padding: large ? "13px 24px" : "8px 14px",
      cursor: "pointer", transition: "all .2s",
      boxShadow: "0 4px 16px rgba(37,211,102,.25)",
      ...style,
    }}
    onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
    onMouseLeave={e => e.currentTarget.style.transform = ""}
  >
    <MessageCircle size={large ? 18 : 14} />
    {label}
  </button>
);

// ── Product Card ────────────────────────────────────
function ProductCard({ product, onClick }) {
  const isMobile = useMobile();
  const [imgIdx, setImgIdx] = useState(0);
  const [imgErr, setImgErr] = useState(false);
  const imgs = Array.isArray(product.images) ? product.images.filter(Boolean) : [product.images].filter(Boolean);
  const img = imgs[imgIdx] || null;
  const cat = MARKET_CATEGORIES[product.category];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={!isMobile ? { y: -4 } : {}}
      onClick={() => onClick(product)}
      style={{
        background: CARD_BG, borderRadius: 16, border: `1px solid ${BORDER}`,
        overflow: "hidden", cursor: "pointer", display: "flex", flexDirection: "column",
        transition: "box-shadow .25s, border-color .25s",
        boxShadow: "0 4px 20px rgba(0,0,0,.35)",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = "0 12px 36px rgba(0,0,0,.5)";
        e.currentTarget.style.borderColor = "rgba(245,166,35,.2)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,.35)";
        e.currentTarget.style.borderColor = BORDER;
      }}
    >
      {/* Image Area */}
      <div style={{ position: "relative", aspectRatio: "1/1", background: "#060810", overflow: "hidden" }}>
        {img && !imgErr ? (
          <img
            src={img} alt={product.name}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            loading="lazy" referrerPolicy="no-referrer"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div style={{
            width: "100%", height: "100%", display: "grid", placeItems: "center",
            background: cat?.gradient || "linear-gradient(135deg,#1a1d2e,#0a0b14)",
            fontSize: 48, opacity: .6,
          }}>{cat?.emoji || "📦"}</div>
        )}

        {/* Multiple images indicator */}
        {imgs.length > 1 && (
          <div style={{ position: "absolute", bottom: 8, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 4 }}>
            {imgs.map((_, i) => (
              <div key={i} onClick={e => { e.stopPropagation(); setImgIdx(i); }}
                style={{ width: i === imgIdx ? 14 : 5, height: 5, borderRadius: 99,
                  background: i === imgIdx ? "#fff" : "rgba(255,255,255,.4)", transition: ".2s", cursor: "pointer" }} />
            ))}
          </div>
        )}

        {/* Badges */}
        <div style={{ position: "absolute", top: 8, left: 8, display: "flex", flexDirection: "column", gap: 4 }}>
          {product.isFeatured && <Badge color={G}>⭐ Featured</Badge>}
          {product.condition && (
            <Badge
              color={product.condition === "New" ? "#10b981" : product.condition === "Refurbished" ? "#8b5cf6" : "#94a3b8"}
            >{product.condition}</Badge>
          )}
        </div>

        {product.discountPrice && product.price && (
          <div style={{
            position: "absolute", top: 8, right: 8,
            background: "rgba(239,68,68,.9)", color: "#fff",
            padding: "3px 8px", borderRadius: 8, fontSize: 10, fontWeight: 900,
          }}>
            -{Math.round((1 - product.discountPrice / product.price) * 100)}%
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: isMobile ? 10 : 14, display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
        <div>
          <h3 style={{
            fontSize: isMobile ? 13 : 15, fontWeight: 800, margin: 0,
            lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical", overflow: "hidden",
          }}>{product.name}</h3>
          {product.brand && (
            <div style={{ fontSize: 10, color: "rgba(255,255,255,.4)", marginTop: 2, fontWeight: 600 }}>
              {product.brand}
            </div>
          )}
        </div>

        {/* Price */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ color: G, fontWeight: 900, fontSize: isMobile ? 15 : 17 }}>
            {fmtPrice(product.discountPrice || product.price)}
          </span>
          {product.discountPrice && product.price && (
            <span style={{ color: "rgba(255,255,255,.3)", textDecoration: "line-through", fontSize: 11, fontWeight: 700 }}>
              {fmtPrice(product.price)}
            </span>
          )}
        </div>

        {/* Location */}
        {product.location && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, color: "rgba(255,255,255,.4)", fontSize: 11 }}>
            <MapPin size={10} />
            <span>{product.location}</span>
          </div>
        )}

        {/* CTA */}
        <div style={{ marginTop: "auto" }}>
          <WaBtn product={product} style={{ width: "100%", justifyContent: "center" }} />
        </div>
      </div>
    </motion.div>
  );
}

// ── Product Detail Modal ─────────────────────────────
function ProductDetail({ product, onClose }) {
  const isMobile = useMobile();
  const [activeImg, setActiveImg] = useState(0);
  const [imgErr, setImgErr] = useState(false);
  const imgs = Array.isArray(product.images) ? product.images.filter(Boolean) : [product.images].filter(Boolean);
  const cat = MARKET_CATEGORIES[product.category];

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 2000,
        background: "rgba(4,5,9,.95)", backdropFilter: "blur(20px)",
        display: "flex", alignItems: isMobile ? "flex-end" : "center",
        justifyContent: "center", padding: isMobile ? 0 : 16,
        overflowY: isMobile ? "hidden" : "auto",
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={isMobile ? { y: "100%" } : { scale: .94, y: 20, opacity: 0 }}
        animate={isMobile ? { y: 0 } : { scale: 1, y: 0, opacity: 1 }}
        exit={isMobile ? { y: "100%" } : { scale: .94, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        style={{
          width: "100%", maxWidth: isMobile ? "100%" : 860,
          background: "#0b0d16", borderRadius: isMobile ? "24px 24px 0 0" : 28,
          border: `1px solid ${BORDER}`, overflow: "hidden",
          maxHeight: isMobile ? "94vh" : "90vh",
          display: "flex", flexDirection: isMobile ? "column" : "row",
        }}
      >
        {/* Image Gallery */}
        <div style={{
          width: isMobile ? "100%" : 380, flexShrink: 0, position: "relative",
          background: "#060810", minHeight: isMobile ? 280 : "auto",
        }}>
          {/* Main Image */}
          <div style={{ width: "100%", aspectRatio: "1/1", overflow: "hidden", position: "relative", maxHeight: isMobile ? 300 : "auto" }}>
            {imgs[activeImg] && !imgErr ? (
              <img src={imgs[activeImg]} alt={product.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                referrerPolicy="no-referrer"
                onError={() => setImgErr(true)} />
            ) : (
              <div style={{
                width: "100%", height: "100%", display: "grid", placeItems: "center",
                background: cat?.gradient, fontSize: isMobile ? 64 : 80,
              }}>{cat?.emoji || "📦"}</div>
            )}

            {/* Nav arrows */}
            {imgs.length > 1 && (
              <>
                {activeImg > 0 && (
                  <button onClick={() => setActiveImg(p => p - 1)}
                    style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 32, height: 32, borderRadius: "50%", background: "rgba(0,0,0,.5)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ChevronLeft size={18} />
                  </button>
                )}
                {activeImg < imgs.length - 1 && (
                  <button onClick={() => setActiveImg(p => p + 1)}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", width: 32, height: 32, borderRadius: "50%", background: "rgba(0,0,0,.5)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ChevronRight size={18} />
                  </button>
                )}
              </>
            )}
          </div>

          {/* Thumbnails */}
          {imgs.length > 1 && (
            <div style={{ display: "flex", gap: 6, padding: "10px 12px", overflowX: "auto" }}>
              {imgs.map((src, i) => (
                <div key={i} onClick={() => setActiveImg(i)}
                  style={{
                    width: 52, height: 52, borderRadius: 8, overflow: "hidden", flexShrink: 0,
                    border: `2px solid ${i === activeImg ? G : "transparent"}`, cursor: "pointer",
                  }}>
                  <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} referrerPolicy="no-referrer" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Panel */}
        <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "20px 16px 24px" : "32px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Close */}
          <button onClick={onClose}
            style={{ position: "absolute", top: 16, right: 16, width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,.08)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}>
            <X size={18} />
          </button>

          {/* Category / Sub */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {cat && <Badge color={cat.color}>{cat.emoji} {cat.label}</Badge>}
            {product.subcategory && <Badge color="rgba(255,255,255,.5)" bg="rgba(255,255,255,.05)">{product.subcategory}</Badge>}
            {product.condition && (
              <Badge color={product.condition === "New" ? "#10b981" : product.condition === "Refurbished" ? "#8b5cf6" : "#94a3b8"}>
                {product.condition}
              </Badge>
            )}
          </div>

          {/* Name */}
          <div>
            <h2 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 900, margin: 0, lineHeight: 1.2, letterSpacing: "-.02em" }}>
              {product.name}
            </h2>
            {product.brand && <div style={{ color: "rgba(255,255,255,.45)", fontSize: 14, marginTop: 4, fontWeight: 600 }}>{product.brand}</div>}
          </div>

          {/* Price */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: isMobile ? 26 : 30, fontWeight: 900, color: G }}>
              {fmtPrice(product.discountPrice || product.price)}
            </span>
            {product.discountPrice && product.price && (
              <>
                <span style={{ color: "rgba(255,255,255,.3)", textDecoration: "line-through", fontSize: 16 }}>
                  {fmtPrice(product.price)}
                </span>
                <Badge color="#ef4444">
                  -{Math.round((1 - product.discountPrice / product.price) * 100)}% OFF
                </Badge>
              </>
            )}
          </div>

          {/* Meta grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {product.location && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,.6)", fontSize: 13 }}>
                <MapPin size={14} color={G} /><span>{product.location}</span>
              </div>
            )}
            {product.sellerName && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,.6)", fontSize: 13 }}>
                <Shield size={14} color={G} />
                <span>{product.sellerType === "stea" ? "STEA Official" : product.sellerName}</span>
              </div>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <div style={{ background: "rgba(255,255,255,.02)", padding: "14px 16px", borderRadius: 12, border: `1px solid ${BORDER}` }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.35)", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>Maelezo</div>
              <p style={{ color: "rgba(255,255,255,.7)", fontSize: 14, lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap" }}>{product.description}</p>
            </div>
          )}

          {/* CTA Buttons */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", paddingTop: 4 }}>
            <WaBtn label="Nunua Sasa" product={product} large
              style={{ flex: 1, justifyContent: "center", background: "#25d366" }} />
            <WaBtn label="Wasiliana na Seller" product={product} large
              style={{ flex: 1, justifyContent: "center", background: "rgba(37,211,102,.12)", color: "#25d366", border: "1px solid rgba(37,211,102,.25)" }} />
          </div>

          {/* Tracking note */}
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.2)", textAlign: "center" }}>
            Ref: STEA-{(product.category||"").toUpperCase()}-{(product.id||"").substring(0,6).toUpperCase()}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Category Landing Cards ───────────────────────────
function CategoryLanding({ onSelect }) {
  const isMobile = useMobile();

  return (
    <div style={{ padding: isMobile ? "20px 0" : "32px 0" }}>
      {/* Header */}
      <div style={{ marginBottom: isMobile ? 24 : 36 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 999, background: `${G}12`, border: `1px solid ${G}25`, color: G, fontSize: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 14 }}>
          <Tag size={12} /> STEA DUKA
        </div>
        <h1 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: isMobile ? 32 : "clamp(36px,5vw,56px)", fontWeight: 900, lineHeight: 1.05, letterSpacing: "-.04em", margin: "0 0 10px" }}>
          Soko Letu la{" "}
          <span style={{ background: `linear-gradient(135deg,${G},${G2})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Kidijitali
          </span>
        </h1>
        <p style={{ color: "rgba(255,255,255,.5)", fontSize: isMobile ? 14 : 16, maxWidth: 520, lineHeight: 1.6 }}>
          Bidhaa bora za teknolojia, samani na uzuri — bei rahisi, ununuzi kupitia WhatsApp.
        </p>
      </div>

      {/* Category Cards Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fill, minmax(min(200px,100%), 1fr))",
        gap: isMobile ? 12 : 18,
      }}>
        {Object.values(MARKET_CATEGORIES).map((cat, i) => (
          <motion.button
            key={cat.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * .07 }}
            whileHover={{ y: -5, scale: 1.02 }}
            whileTap={{ scale: .97 }}
            onClick={() => onSelect(cat.id)}
            style={{
              background: cat.gradient, borderRadius: isMobile ? 18 : 22,
              border: `1px solid ${cat.color}22`,
              padding: isMobile ? "22px 16px" : "32px 24px",
              cursor: "pointer", textAlign: "left", color: "#fff",
              boxShadow: `0 8px 32px rgba(0,0,0,.4), 0 0 0 0 ${cat.color}00`,
              transition: "all .3s cubic-bezier(.4,0,.2,1)",
              position: "relative", overflow: "hidden",
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = `0 16px 48px rgba(0,0,0,.5), 0 0 28px ${cat.color}20`}
            onMouseLeave={e => e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,.4)"}
          >
            {/* Glow blob */}
            <div style={{
              position: "absolute", top: -20, right: -20, width: 80, height: 80,
              borderRadius: "50%", background: `radial-gradient(circle, ${cat.color}30, transparent 70%)`,
              filter: "blur(20px)", pointerEvents: "none",
            }} />
            <div style={{ fontSize: isMobile ? 32 : 40, marginBottom: 12, display: "block" }}>{cat.emoji}</div>
            <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: isMobile ? 18 : 22, fontWeight: 900, letterSpacing: "-.02em" }}>
              {cat.label}
            </div>
            <div style={{ fontSize: isMobile ? 10 : 12, color: `${cat.color}cc`, marginTop: 4, fontWeight: 700 }}>
              {cat.subcategories.slice(0, 2).join(" · ")} · zaidi...
            </div>
            <div style={{ position: "absolute", bottom: isMobile ? 14 : 18, right: isMobile ? 14 : 18, width: 28, height: 28, borderRadius: "50%", background: `${cat.color}25`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ChevronRight size={14} color={cat.color} />
            </div>
          </motion.button>
        ))}
      </div>

      {/* Trust badges */}
      <div style={{ display: "flex", gap: isMobile ? 12 : 20, marginTop: isMobile ? 28 : 40, flexWrap: "wrap" }}>
        {[
          { icon: <MessageCircle size={14} />, label: "WhatsApp Checkout" },
          { icon: <Shield size={14} />, label: "Verified Sellers" },
          { icon: <Zap size={14} />, label: "Bidhaa Halisi" },
        ].map((b, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, color: "rgba(255,255,255,.4)", fontSize: 12, fontWeight: 700 }}>
            <span style={{ color: G }}>{b.icon}</span>{b.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Category Filters ─────────────────────────────────
function CategoryFilters({ catId, filters, onChange }) {
  const cat = MARKET_CATEGORIES[catId];
  if (!cat) return null;

  const hasSubcats = cat.subcategories?.length > 0;
  const hasBrands = cat.brands?.length > 0;
  const hasSubItems = cat.subItems && filters.subcategory;

  return (
    <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}>
      <style>{`.filter-scroll::-webkit-scrollbar{display:none}`}</style>

      {/* Subcategory chips */}
      {hasSubcats && (
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <FilterChip active={!filters.subcategory} onClick={() => onChange({ ...filters, subcategory: null, subItem: null })}>
            Zote
          </FilterChip>
          {cat.subcategories.map(sub => (
            <FilterChip key={sub} active={filters.subcategory === sub}
              onClick={() => onChange({ ...filters, subcategory: sub, subItem: null })}>
              {sub}
            </FilterChip>
          ))}
        </div>
      )}

      {/* Sub-items for accessories */}
      {hasSubItems && cat.subItems[filters.subcategory] && (
        <div style={{ display: "flex", gap: 6, flexShrink: 0, paddingLeft: 8, borderLeft: "1px solid rgba(255,255,255,.08)" }}>
          {cat.subItems[filters.subcategory].map(item => (
            <FilterChip key={item} active={filters.subItem === item}
              onClick={() => onChange({ ...filters, subItem: filters.subItem === item ? null : item })}>
              {item}
            </FilterChip>
          ))}
        </div>
      )}

      {/* Brand filter (phones & laptops) */}
      {hasBrands && (
        <div style={{ display: "flex", gap: 6, flexShrink: 0, paddingLeft: hasSubcats ? 8 : 0, borderLeft: hasSubcats ? "1px solid rgba(255,255,255,.08)" : "none" }}>
          {!hasSubcats && (
            <FilterChip active={!filters.brand} onClick={() => onChange({ ...filters, brand: null })}>
              All Brands
            </FilterChip>
          )}
          {cat.brands.map(b => (
            <FilterChip key={b} active={filters.brand === b}
              onClick={() => onChange({ ...filters, brand: filters.brand === b ? null : b })}>
              {b}
            </FilterChip>
          ))}
        </div>
      )}

      {/* Condition filter — always available */}
      <div style={{ display: "flex", gap: 6, flexShrink: 0, paddingLeft: 8, borderLeft: "1px solid rgba(255,255,255,.08)" }}>
        {CONDITIONS.map(c => (
          <FilterChip key={c} active={filters.condition === c}
            onClick={() => onChange({ ...filters, condition: filters.condition === c ? null : c })}>
            {c}
          </FilterChip>
        ))}
      </div>
    </div>
  );
}

const FilterChip = ({ children, active, onClick }) => (
  <button onClick={onClick} style={{
    padding: "7px 14px", borderRadius: 999, fontSize: 12, fontWeight: 700,
    border: `1px solid ${active ? G : "rgba(255,255,255,.1)"}`,
    background: active ? `${G}15` : "transparent",
    color: active ? G : "rgba(255,255,255,.55)",
    cursor: "pointer", whiteSpace: "nowrap", transition: "all .15s", flexShrink: 0,
  }}>{children}</button>
);

// ── Products Grid (Live Firebase) ────────────────────
function ProductsGrid({ catId, filters, searchQ, onProduct }) {
  const isMobile = useMobile();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const db = getFirebaseDb();
    if (!db) {
      const timer = setTimeout(() => setLoading(false), 0);
      return () => clearTimeout(timer);
    }

    let q = query(
      collection(db, "marketplace"),
      where("category", "==", catId),
      orderBy("createdAt", "desc"),
      limit(80)
    );

    const unsub = onSnapshot(q, snap => {
      const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Filter active products client-side to be resilient to missing isActive field
      setProducts(fetched.filter(p => p.isActive !== false));
      setLoading(false);
    }, err => {
      console.error("Marketplace fetch error:", err);
      setLoading(false);
    });

    return () => unsub();
  }, [catId]);

  // Client-side filtering
  const filtered = products.filter(p => {
    if (filters.subcategory && p.subcategory !== filters.subcategory) return false;
    if (filters.subItem && p.subItem !== filters.subItem && p.subcategory !== filters.subItem) return false;
    if (filters.brand && p.brand !== filters.brand) return false;
    if (filters.condition && p.condition !== filters.condition) return false;
    if (searchQ) {
      const q = searchQ.toLowerCase();
      return (p.name||"").toLowerCase().includes(q) ||
             (p.brand||"").toLowerCase().includes(q) ||
             (p.description||"").toLowerCase().includes(q) ||
             (p.location||"").toLowerCase().includes(q);
    }
    return true;
  });

  if (loading) {
    return (
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(auto-fill,minmax(min(200px,100%),1fr))",
        gap: isMobile ? 10 : 16,
      }}>
        {[1,2,3,4,5,6].map(i => (
          <div key={i} style={{
            borderRadius: 16, background: CARD_BG, overflow: "hidden",
            border: `1px solid ${BORDER}`,
          }}>
            <div style={{ aspectRatio: "1/1", background: "linear-gradient(90deg,rgba(255,255,255,.03) 25%,rgba(255,255,255,.06) 50%,rgba(255,255,255,.03) 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.8s infinite" }} />
            <div style={{ padding: 14 }}>
              <div style={{ height: 14, borderRadius: 7, background: "rgba(255,255,255,.04)", marginBottom: 8 }} />
              <div style={{ height: 10, borderRadius: 5, background: "rgba(255,255,255,.03)", width: "60%" }} />
            </div>
          </div>
        ))}
        <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      </div>
    );
  }

  if (filtered.length === 0) {
    const cat = MARKET_CATEGORIES[catId];
    return (
      <div style={{ textAlign: "center", padding: "60px 20px", background: "rgba(255,255,255,.02)", borderRadius: 20, border: `1px solid ${BORDER}` }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>{cat?.emoji || "📦"}</div>
        <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Hakuna bidhaa kwa sasa</h3>
        <p style={{ color: "rgba(255,255,255,.5)", fontSize: 14, maxWidth: 380, margin: "0 auto" }}>
          {searchQ ? `Hakuna matokeo ya "${searchQ}" kwa kichujio hiki.` : "Bidhaa mpya zinaongezwa hivi karibuni. Rudi tena au wasiliana nasi."}
        </p>
        <a href={`https://wa.me/${STEA_WA}?text=${encodeURIComponent("Habari STEA, natafuta bidhaa ambayo siioni kwenye STEA Duka.")}`}
          target="_blank" rel="noreferrer"
          style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 20, padding: "10px 20px", background: "#25d366", color: "#fff", borderRadius: 12, fontWeight: 800, textDecoration: "none", fontSize: 14 }}>
          <MessageCircle size={16} /> Omba Bidhaa Hii
        </a>
      </div>
    );
  }

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(auto-fill,minmax(min(200px,100%),1fr))",
      gap: isMobile ? 10 : 16,
    }}>
      {filtered.map(p => (
        <ProductCard key={p.id} product={p} onClick={onProduct} />
      ))}
    </div>
  );
}

// ── Main Marketplace Page ────────────────────────────
export default function MarketplacePage() {
  const isMobile = useMobile();
  const { category: urlCategory } = useParams();
  const navigate = useNavigate();

  // Derive state from URL param
  const validUrlCat = urlCategory && MARKET_CATEGORIES[urlCategory] ? urlCategory : null;
  const view = validUrlCat ? "category" : "landing";
  const activeCat = validUrlCat;

  const [filters, setFilters] = useState({});
  const [searchQ, setSearchQ] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showFilters, setShowFilters] = useState(!isMobile);
  const searchRef = useRef(null);
  const topRef = useRef(null);

  // Reset filters when category changes
  const [prevUrlCategory, setPrevUrlCategory] = useState(urlCategory);
  if (urlCategory !== prevUrlCategory) {
    setPrevUrlCategory(urlCategory);
    setFilters({});
    setSearchQ("");
    setActiveSearch("");
  }

  const cat = activeCat ? MARKET_CATEGORIES[activeCat] : null;

  const handleSelectCategory = (catId) => {
    navigate(`/duka/${catId}`);
    setFilters({});
    setSearchQ("");
    setActiveSearch("");
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleBack = () => {
    navigate("/duka");
    setFilters({});
    setSearchQ("");
  };

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => setActiveSearch(searchQ), 350);
    return () => clearTimeout(t);
  }, [searchQ]);

  return (
    <div ref={topRef} style={{ paddingTop: 80, paddingBottom: "calc(80px + env(safe-area-inset-bottom,0px))", minHeight: "100vh", background: DARK, color: "#fff", fontFamily: "'Instrument Sans',system-ui,sans-serif" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "0 14px" : "0 28px" }}>

        <AnimatePresence mode="wait">
          {/* ── LANDING ── */}
          {view === "landing" && (
            <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -10 }}>
              {/* Search bar on landing */}
              <div style={{ padding: "20px 0 0" }}>
                <div style={{ position: "relative", maxWidth: 560 }}>
                  <Search size={16} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,.35)", pointerEvents: "none" }} />
                  <input
                    ref={searchRef}
                    value={searchQ}
                    onChange={e => setSearchQ(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && searchQ) { /* search across all — navigate to first relevant cat */ } }}
                    placeholder="Tafuta bidhaa yoyote..."
                    style={{ width: "100%", height: 48, borderRadius: 14, border: `1px solid rgba(255,255,255,.1)`, background: "rgba(255,255,255,.04)", color: "#fff", paddingLeft: 44, paddingRight: 16, outline: "none", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" }}
                    onFocus={e => e.target.style.borderColor = G}
                    onBlur={e => e.target.style.borderColor = "rgba(255,255,255,.1)"}
                  />
                  {searchQ && (
                    <button onClick={() => setSearchQ("")}
                      style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,.4)", cursor: "pointer" }}>
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
              <CategoryLanding onSelect={handleSelectCategory} />
            </motion.div>
          )}

          {/* ── CATEGORY VIEW ── */}
          {view === "category" && cat && (
            <motion.div key={`cat-${activeCat}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>

              {/* Top bar */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: isMobile ? "16px 0 12px" : "20px 0 16px" }}>
                <button onClick={handleBack}
                  style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,.05)", border: `1px solid ${BORDER}`, color: "rgba(255,255,255,.7)", padding: "8px 14px", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
                  <ArrowLeft size={15} /> Duka
                </button>

                <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                  <span style={{ fontSize: isMobile ? 22 : 26 }}>{cat.emoji}</span>
                  <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: isMobile ? 20 : 26, fontWeight: 900, letterSpacing: "-.03em", margin: 0 }}>
                    {cat.label}
                  </h2>
                </div>

                {/* Category switcher pills — desktop */}
                {!isMobile && (
                  <div style={{ display: "flex", gap: 6 }}>
                    {Object.values(MARKET_CATEGORIES).filter(c => c.id !== activeCat).map(c => (
                      <button key={c.id} onClick={() => handleSelectCategory(c.id)}
                        style={{ padding: "6px 12px", borderRadius: 999, fontSize: 11, fontWeight: 700, border: `1px solid ${BORDER}`, background: "transparent", color: "rgba(255,255,255,.45)", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                        {c.emoji} {c.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Search + filter toggle row */}
              <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                <div style={{ flex: 1, position: "relative" }}>
                  <Search size={14} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,.3)", pointerEvents: "none" }} />
                  <input
                    value={searchQ}
                    onChange={e => setSearchQ(e.target.value)}
                    placeholder={`Tafuta ${cat.label.toLowerCase()}...`}
                    style={{ width: "100%", height: 42, borderRadius: 12, border: `1px solid ${BORDER}`, background: "rgba(255,255,255,.04)", color: "#fff", paddingLeft: 38, paddingRight: searchQ ? 36 : 14, outline: "none", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" }}
                    onFocus={e => e.target.style.borderColor = G}
                    onBlur={e => e.target.style.borderColor = BORDER}
                  />
                  {searchQ && (
                    <button onClick={() => setSearchQ("")}
                      style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,.35)", cursor: "pointer" }}>
                      <X size={13} />
                    </button>
                  )}
                </div>

                {isMobile && (
                  <button onClick={() => setShowFilters(v => !v)}
                    style={{ height: 42, padding: "0 14px", borderRadius: 12, border: `1px solid ${showFilters ? G : BORDER}`, background: showFilters ? `${G}12` : "rgba(255,255,255,.04)", color: showFilters ? G : "rgba(255,255,255,.6)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                    <Filter size={13} /> Filters
                    {Object.values(filters).filter(Boolean).length > 0 && (
                      <span style={{ width: 16, height: 16, borderRadius: "50%", background: G, color: "#111", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 900 }}>
                        {Object.values(filters).filter(Boolean).length}
                      </span>
                    )}
                  </button>
                )}
              </div>

              {/* Filters */}
              <AnimatePresence>
                {(showFilters || !isMobile) && (
                  <motion.div
                    initial={isMobile ? { height: 0, opacity: 0 } : false}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={isMobile ? { height: 0, opacity: 0 } : {}}
                    style={{ overflow: "hidden", marginBottom: 16 }}
                  >
                    <div style={{ overflowX: "auto", paddingBottom: 4 }} className="filter-scroll">
                      <CategoryFilters catId={activeCat} filters={filters} onChange={f => setFilters(f)} />
                    </div>

                    {/* Active filter badges */}
                    {Object.values(filters).some(Boolean) && (
                      <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap", alignItems: "center" }}>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,.4)", fontWeight: 700 }}>Active:</span>
                        {Object.entries(filters).filter(([,v]) => v).map(([k, v]) => (
                          <button key={k} onClick={() => setFilters(f => ({ ...f, [k]: null }))}
                            style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: `${G}15`, color: G, border: `1px solid ${G}30`, cursor: "pointer" }}>
                            {v} <X size={9} />
                          </button>
                        ))}
                        <button onClick={() => setFilters({})}
                          style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.35)", background: "none", border: "none", cursor: "pointer" }}>
                          Futa Filters
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Mobile category switcher */}
              {isMobile && (
                <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 14, scrollbarWidth: "none", paddingBottom: 4 }}>
                  {Object.values(MARKET_CATEGORIES).filter(c => c.id !== activeCat).map(c => (
                    <button key={c.id} onClick={() => handleSelectCategory(c.id)}
                      style={{ padding: "6px 12px", borderRadius: 999, fontSize: 11, fontWeight: 700, border: `1px solid ${BORDER}`, background: "transparent", color: "rgba(255,255,255,.5)", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, display: "flex", alignItems: "center", gap: 4 }}>
                      {c.emoji} {c.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Products */}
              <ProductsGrid
                catId={activeCat}
                filters={filters}
                searchQ={activeSearch}
                onProduct={setSelectedProduct}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <ProductDetail product={selectedProduct} onClose={() => setSelectedProduct(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
