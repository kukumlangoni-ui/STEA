import { motion } from "framer-motion";

export function Skeleton({ width = "100%", height = "20px", borderRadius = "8px", style = {} }) {
  return (
    <motion.div
      animate={{ opacity: [0.3, 0.6, 0.3] }}
      transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
      style={{
        width,
        height,
        borderRadius,
        background: "rgba(255,255,255,0.05)",
        ...style
      }}
    />
  );
}

export function PostSkeleton() {
  return (
    <div style={{ padding: "16px", background: "rgba(255,255,255,0.02)", borderRadius: "16px", marginBottom: "12px" }}>
      <Skeleton width="40%" height="12px" style={{ marginBottom: "12px" }} />
      <Skeleton width="100%" height="24px" style={{ marginBottom: "8px" }} />
      <Skeleton width="100%" height="24px" style={{ marginBottom: "16px" }} />
      <div style={{ display: "flex", gap: "12px" }}>
        <Skeleton width="60px" height="24px" borderRadius="12px" />
        <Skeleton width="60px" height="24px" borderRadius="12px" />
      </div>
    </div>
  );
}

export function ProductSkeleton() {
    return (
      <div style={{ background: "#141823", borderRadius: "16px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }}>
        <Skeleton width="100%" height="180px" borderRadius="0" />
        <div style={{ padding: "16px" }}>
          <Skeleton width="80%" height="20px" style={{ marginBottom: "8px" }} />
          <Skeleton width="40%" height="16px" style={{ marginBottom: "16px" }} />
          <Skeleton width="100%" height="40px" borderRadius="12px" />
        </div>
      </div>
    );
}

export function OfflineNotice({ isOffline, isOfflineData }) {
  if (!isOffline && !isOfflineData) return null;

  return (
    <div style={{ 
      background: isOffline ? "rgba(239, 68, 68, 0.1)" : "rgba(245, 166, 35, 0.1)",
      border: `1px solid ${isOffline ? "#ef444433" : "#F5A62333"}`,
      padding: "8px 16px",
      borderRadius: "12px",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      marginBottom: "16px",
      fontSize: "13px",
      color: isOffline ? "#ef4444" : "#F5A623"
    }}>
      <span>{isOffline ? "⚠️ Hauko kwenye mtandao (Offline)" : "📡 Unatumia data zilizohifadhiwa (Cached)"}</span>
      <span style={{ fontSize: "11px", opacity: 0.7 }}>
        {isOffline ? "— Baadhi ya sehemu zinaweza zisipakie." : "— Tutaandika mapya mtandao ukirejea."}
      </span>
    </div>
  );
}
