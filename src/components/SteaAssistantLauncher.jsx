import React from "react";

export default function SteaAssistantLauncher() {
  const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
    navigator.userAgent
  );

  const handleOpenAssistant = () => {
    const url = "https://assistant.stea.africa";
    if (isMobile) {
      window.location.href = url;
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <button
      onClick={handleOpenAssistant}
      aria-label="Chat na STEA Assistant"
      title="Chat na STEA Assistant"
      className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-50 group"
    >
      <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-[#0b0f1a] border-2 border-[#f5b642] shadow-[0_0_20px_rgba(245,182,66,0.45)] transition-transform duration-300 group-hover:scale-105">
        <img
          src="/icons/stea-assistant-bot.png"
          alt="STEA Assistant"
          className="w-9 h-9 object-contain"
          onError={(e) => {
            // Fallback if icon doesn't exist
            e.target.style.display = 'none';
            e.target.parentElement.innerHTML += '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#f5b642" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>';
          }}
        />
        <span className="absolute -top-11 right-0 whitespace-nowrap rounded-full bg-[#111827] text-[#f5b642] text-xs px-3 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg border border-[#f5b642]/20">
          Chat na STEA Assistant
        </span>
      </div>
    </button>
  );
}
