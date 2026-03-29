import React from "react";

export default function EmptyState({
  title = "Hakuna content kwa sasa",
  message = "Content mpya inaandaliwa. Tafadhali angalia tena hivi karibuni.",
  icon = "📭",
  minHeight = 180,
  fullWidth = true,
}) {
  return (
    <div
      style={{
        gridColumn: fullWidth ? "1 / -1" : "auto",
        minHeight,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "28px 20px",
        borderRadius: 24,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: 420 }}>
        <div
          style={{
            fontSize: 30,
            marginBottom: 12,
            opacity: 0.95,
          }}
        >
          {icon}
        </div>

        <div
          style={{
            color: "#fff",
            fontSize: 20,
            fontWeight: 800,
            marginBottom: 8,
            lineHeight: 1.2,
          }}
        >
          {title}
        </div>

        <div
          style={{
            color: "rgba(255,255,255,0.68)",
            fontSize: 14,
            lineHeight: 1.7,
          }}
        >
          {message}
        </div>
      </div>
    </div>
  );
}
