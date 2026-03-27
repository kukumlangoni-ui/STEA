/* global process */
import { useState, useEffect, useRef } from "react";
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from "react-markdown";
import { Send, Loader2, X, MessageSquare, Phone, ChevronLeft, Sparkles, Bot } from "lucide-react";

export default function AIChat({ onClose }) {
  const [view, setView] = useState("home"); // "home" or "chat"
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasCustomKey, setHasCustomKey] = useState(false);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio?.hasSelectedApiKey) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasCustomKey(hasKey);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      setHasCustomKey(true);
    }
  };

  const chatEndRef = useRef(null);
  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  
  useEffect(() => {
    if (view === "chat") scrollToBottom();
  }, [messages, view]);

  // Prevent background scroll when chat is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const getAIInstance = () => {
    const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.API_KEY || "";
    return new GoogleGenAI({ apiKey: key });
  };

  const handleSend = async (textOverride) => {
    const text = textOverride || input;
    if (!text.trim()) return;
    
    if (view !== "chat") setView("chat");
    
    const userMsg = { role: "user", text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const ai = getAIInstance();
      const config = {
        systemInstruction: `You are STEA AI, a helpful assistant for SwahiliTech Elite Academy (STEA). 
STEA was created and is owned by Isaya Hans Masika, a Tanzanian tech creator and web developer originally from Mbeya Region, currently based in China. 
Isaya holds a Bachelor's Degree in Computer Science from Guilin University of Electronic Technology, China. 
His education background includes Lugufu Boys Secondary School, Mbezi Beach Secondary School, and Wazo Hill Primary School. 
He is the 4th born in a family of 6 children and is passionate about technology, website development, and digital tools.
STEA focuses on tech education, AI tools, and digital resources in Kiswahili. 
The platform was officially launched recently after Isaya successfully built and deployed multiple working websites.
When asked "Who owns STEA?", always answer clearly: Isaya Hans Masika. 
Respond confidently and accurately in Swahili and English. Keep responses concise and helpful.`,
      };
      
      const response = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
        contents: text,
        config
      });

      const aiMsg = { 
        role: "ai", 
        text: response.text,
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error("AI Error:", error);
      if (error.message?.includes("Requested entity was not found")) {
        setHasCustomKey(false);
        setMessages(prev => [...prev, { role: "ai", text: "Samahani, kuna tatizo na API key yako. Tafadhali chagua key upya kwa kutumia kitufe cha 'Use Paid Key' hapo juu." }]);
      } else {
        setMessages(prev => [...prev, { role: "ai", text: "Samahani, kuna tatizo limetokea. Tafadhali jaribu tena." }]);
      }
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { label: "Nionyeshe courses", prompt: "Nionyeshe courses zinazopatikana STEA" },
    { label: "Deals za leo", prompt: "Kuna deals gani za leo?" },
    { label: "Website tools", prompt: "Nisaidie kupata website tools bora" },
    { label: "Wasiliana nasi", prompt: "Nataka kuwasiliana na STEA moja kwa moja" },
  ];

  return (
    <div className="flex flex-col h-full w-full bg-[#0d111a] rounded-[28px] border border-white/10 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative">
      {/* Background Glow */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#F5A623]/5 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="px-5 py-4 border-b border-white/5 bg-white/[0.02] backdrop-blur-xl flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          {view === "chat" ? (
            <button 
              onClick={() => setView("home")}
              className="p-1.5 hover:bg-white/10 rounded-xl text-white/50 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-[#F5A623]/10 flex items-center justify-center border border-[#F5A623]/20">
              <Bot size={22} className="text-[#F5A623]" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-[15px] text-white tracking-tight">STEA AI Assistant</h2>
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            </div>
            <p className="text-[11px] text-white/40 font-medium uppercase tracking-wider">Msaada wa tech kwa Kiswahili</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {!hasCustomKey && (
            <button 
              onClick={handleSelectKey}
              className="px-3 py-1.5 bg-[#F5A623]/10 border border-[#F5A623]/20 rounded-lg text-[#F5A623] text-[10px] font-bold uppercase tracking-wider hover:bg-[#F5A623]/20 transition-all flex items-center gap-1.5"
              title="Tumia Paid API Key yako"
            >
              <Sparkles size={12} />
              Use Paid Key
            </button>
          )}
          {hasCustomKey && (
            <div className="px-3 py-1.5 bg-[#00C48C]/10 border border-[#00C48C]/20 rounded-lg text-[#00C48C] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={12} />
              Paid Key Active
            </div>
          )}
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-all"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-none relative">
        {view === "home" ? (
          <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-white tracking-tight">Karibu STEA! 👋</h3>
              <p className="text-[14px] text-white/60 leading-relaxed">
                Mimi ni msaidizi wako wa kidijitali. Naweza kukusaidia kupata kozi, tools, au kukuunganisha na timu yetu.
              </p>
            </div>

            <div className="space-y-3">
              <button 
                onClick={() => setView("chat")}
                className="w-full p-4 rounded-2xl bg-[#F5A623] hover:bg-[#FFD17C] text-[#111] font-bold flex items-center justify-between group transition-all shadow-lg shadow-[#F5A623]/10"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-black/10 rounded-lg">
                    <Sparkles size={18} />
                  </div>
                  <span className="text-sm">Anza Chat na AI</span>
                </div>
                <ChevronLeft size={18} className="rotate-180 group-hover:translate-x-1 transition-transform" />
              </button>

              <a 
                href="https://wa.me/255752661307" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 text-white font-bold flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#25D366]/10 text-[#25D366] rounded-lg">
                    <Phone size={18} />
                  </div>
                  <span className="text-sm">Chat nasi WhatsApp</span>
                </div>
                <ChevronLeft size={18} className="rotate-180 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Quick Actions</p>
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => handleSend(action.prompt)}
                    className="text-left text-[12px] p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 transition-all text-white/70 hover:text-white"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-5 space-y-4 min-h-full flex flex-col">
            {messages.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-10 space-y-4 opacity-40">
                <div className="w-16 h-16 bg-white/[0.02] rounded-3xl flex items-center justify-center border border-white/5">
                  <MessageSquare size={28} className="text-white" />
                </div>
                <p className="text-sm text-white max-w-[200px]">Uliza chochote kuhusu tech au STEA...</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                <div className={`max-w-[80%] p-3.5 rounded-2xl text-[14px] leading-relaxed break-words overflow-hidden ${
                  msg.role === "user" 
                    ? "bg-[#F5A623] text-[#111] font-medium rounded-tr-none shadow-lg shadow-[#F5A623]/10" 
                    : "bg-white/[0.05] border border-white/10 text-white/90 rounded-tl-none"
                }`} style={{ wordBreak: "break-word" }}>
                  <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-black/30 prose-code:text-[#F5A623] break-words">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start animate-in fade-in duration-300">
                <div className="bg-white/[0.03] border border-white/5 p-3 rounded-2xl rounded-tl-none flex items-center gap-3">
                  <Loader2 className="w-4 h-4 animate-spin text-[#F5A623]" />
                  <span className="text-[12px] text-white/40 font-medium">STEA AI anafikiria...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} className="h-2" />
          </div>
        )}
      </div>

      {/* Input Area */}
      {(view === "chat" || messages.length > 0) && (
        <div className="p-4 border-t border-white/5 bg-white/[0.01] backdrop-blur-xl z-10">
          <div className="flex items-center gap-2 bg-white/[0.03] border border-white/10 rounded-2xl p-1.5 focus-within:border-[#F5A623]/50 transition-all">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Andika swali lako hapa..."
              className="flex-1 bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-white/20"
            />
            <button 
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="w-10 h-10 flex items-center justify-center bg-[#F5A623] text-[#111] rounded-xl font-bold disabled:opacity-30 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#F5A623]/20"
            >
              <Send size={18} />
            </button>
          </div>
          <p className="text-[9px] text-center text-white/20 mt-3 uppercase tracking-widest font-bold">Powered by SwahiliTech AI</p>
        </div>
      )}
    </div>
  );
}


