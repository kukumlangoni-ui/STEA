import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Zap, Globe, Smartphone, Laptop, Monitor,
  CheckCircle, ChevronDown, ArrowRight, Lock, Wifi,
  AlertTriangle, HelpCircle, Star, Users, Clock
} from "lucide-react";

const G = "#F5A623";
const G2 = "#FFD17C";

const FAQS = [
  {
    q: "Je, VPN inafanya kazi vizuri nchini China?",
    a: "Ndiyo — lakini si VPN yoyote. Unahitaji VPN iliyoundwa kufanya kazi katika 'Great Firewall' ya China. VPN za kawaida kama bure za play store zinaweza kushindwa. STEA inakusaidia kupata suluhisho linalofanya kazi."
  },
  {
    q: "Ninahitaji kudownload VPN kabla sijaenda China?",
    a: "NDIYO. Hii ni muhimu sana. Baada ya kufika China, Play Store, App Store na tovuti nyingi za VPN hazitafunguka. Unahitaji kudownload na kusanidi VPN kabla ya safari yako."
  },
  {
    q: "Programu zipi zinazuiwa China?",
    a: "WhatsApp, Instagram, Facebook, Twitter/X, YouTube, Google (Search, Gmail, Maps), Telegram, Snapchat, na programu nyingi za kawaida. WeChat na Baidu zinaendelea kufanya kazi."
  },
  {
    q: "VPN inaweza kutumika kwenye simu na laptop?",
    a: "Ndiyo. Unaweza kutumia VPN moja kwenye vifaa vingi — Android, iPhone, Windows laptop, MacBook. Tunaelezea jinsi ya kusanidi kila kifaa."
  },
  {
    q: "Je, VPN ni haramu China?",
    a: "VPN za kiraia zimepigwa marufuku kwa makampuni na raia wa China. Lakini wageni (watu wa nje) wanaoruhusiwa kwa kawaida kutumia VPN kwa matumizi ya kibinafsi. Wengi wa wanafunzi wa Tanzania nchini China wanatumia VPN bila tatizo."
  },
  {
    q: "Ninaweza kupata msaada wa kusanidi VPN yangu?",
    a: "Ndiyo. STEA inatoa mwongozo wa hatua kwa hatua wa kusanidi VPN kwenye vifaa vyako. Unaweza pia kuwasiliana nasi moja kwa moja kupitia WhatsApp kwa msaada wa haraka."
  }
];

const BLOCKED_APPS = [
  { name: "WhatsApp", emoji: "💬" },
  { name: "YouTube", emoji: "▶️" },
  { name: "Instagram", emoji: "📷" },
  { name: "Facebook", emoji: "👥" },
  { name: "Twitter/X", emoji: "🐦" },
  { name: "Google", emoji: "🔍" },
  { name: "Gmail", emoji: "📧" },
  { name: "Telegram", emoji: "✈️" },
  { name: "Snapchat", emoji: "👻" },
  { name: "Google Maps", emoji: "🗺️" },
];

const FEATURES = [
  { icon: <Zap size={22} />, title: "Muunganiko Imara", desc: "Uunganiko unaofanya kazi hata ndani ya Great Firewall ya China" },
  { icon: <Smartphone size={22} />, title: "Vifaa Vingi", desc: "Android, iPhone, Windows, MacBook — vifaa vyote vinafanya kazi" },
  { icon: <Shield size={22} />, title: "Usalama wa Data", desc: "Mawasiliano yako yanabaki salama na ya siri wakati wote" },
  { icon: <Globe size={22} />, title: "Upatikanaji Kamili", desc: "WhatsApp, YouTube, Instagram — vyote vinafunguka upya" },
  { icon: <Clock size={22} />, title: "Msaada wa 24/7", desc: "Tuko hapa kukusaidia wakati wowote utakapohitaji" },
  { icon: <Users size={22} />, title: "Wanafunzi Maelfu", desc: "Wanafunzi elfu nyingi wa Tanzania nchini China wanatumia VPN kupitia STEA" },
];

const STEPS = [
  {
    num: "01",
    title: "Chagua Mpango Wako",
    desc: "Tembelea ukurasa wa VPN wa STEA na chagua mpango unaokufaa — wiki, mwezi, au mwaka. Bei ndogo, huduma kubwa.",
    icon: <Star size={28} />,
    color: "#4ade80"
  },
  {
    num: "02",
    title: "Lipa na M-Pesa / Tigo Pesa",
    desc: "Lipa kwa M-Pesa, Tigo Pesa, au njia nyingine inayokufaa. Unapata uidhinisho wa haraka.",
    icon: <CreditCardIcon />,
    color: G
  },
  {
    num: "03",
    title: "Pokea Maelekezo ya Kusanidi",
    desc: "Utapata maelekezo ya jinsi ya kudownload na kusanidi VPN kwenye simu au laptop yako hatua kwa hatua.",
    icon: <Lock size={28} />,
    color: "#60a5fa"
  },
  {
    num: "04",
    title: "Unganisha na Furahia!",
    desc: "Fungua WhatsApp, YouTube, Instagram kama kawaida. Hakuna vikwazo tena. Karibu kwenye uhuru wa mtandao!",
    icon: <Globe size={28} />,
    color: "#f472b6"
  }
];

const MUST_HAVE_FEATURES = [
  "Inaweza kupita 'Great Firewall' ya China bila shida",
  "Itaendelea kufanya kazi hata baada ya marekebisho ya serikali",
  "Ina seva (servers) nyingi duniani — unaweza kuchagua nchi",
  "Inatoa kasi nzuri ya internet hata baada ya kuunganika",
  "Inafanya kazi kwenye Android, iPhone, Windows, na Mac",
  "Ina ulinzi wa DNS ili kudanganya haitambuliki",
  "Inatoa ulinzi wa kuvunjika kwa maumivu (kill switch)",
  "Ina itifaki za kisasa kama WireGuard au Shadowsocks",
];

function CreditCardIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="5" width="20" height="14" rx="2"/>
      <line x1="2" y1="10" x2="22" y2="10"/>
    </svg>
  );
}

function FaqItem({ faq, i }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      border: `1px solid ${open ? "rgba(245,166,35,0.3)" : "rgba(255,255,255,0.07)"}`,
      borderRadius: 16,
      overflow: "hidden",
      background: open ? "rgba(245,166,35,0.03)" : "rgba(255,255,255,0.02)",
      transition: "all 0.2s"
    }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 24px", background: "none", border: "none",
          color: "#fff", fontWeight: 700, fontSize: 15, textAlign: "left", cursor: "pointer", gap: 16
        }}
      >
        <span>{faq.q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ flexShrink: 0 }}>
          <ChevronDown size={18} color={G} />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "0 24px 20px", color: "rgba(255,255,255,0.65)", lineHeight: 1.7, fontSize: 14 }}>
              {faq.a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function VpnChinaPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#04050a", color: "#fff", overflowX: "hidden" }}>

      {/* ── HERO ── */}
      <section style={{
        padding: "100px 20px 80px",
        background: "radial-gradient(ellipse at 60% 0%, rgba(245,166,35,0.15) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, rgba(96,165,250,0.08) 0%, transparent 50%)",
        textAlign: "center",
        position: "relative"
      }}>
        {/* Warning badge */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 18px", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 20, color: "#fca5a5", fontSize: 13, fontWeight: 700, marginBottom: 28 }}>
          <AlertTriangle size={15} /> Unaenda China? Soma hii KABLA ya safari yako
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontSize: "clamp(36px, 6vw, 72px)",
            fontWeight: 900,
            lineHeight: 1.08,
            marginBottom: 24,
            letterSpacing: "-0.04em"
          }}
        >
          VPN kwa Wanaokwenda <span style={{ color: G }}>China</span><br />
          <span style={{ fontSize: "0.65em", color: "rgba(255,255,255,0.7)" }}>Usipoteze Mawasiliano Yako</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{ color: "rgba(255,255,255,0.6)", maxWidth: 600, margin: "0 auto 40px", fontSize: 17, lineHeight: 1.7 }}
        >
          Nchini China, WhatsApp, YouTube, Google na programu nyingi za kawaida hazifanyi kazi.
          STEA inakusaidia kupata VPN inayofanya kazi — kabla, wakati, na baada ya safari yako.
        </motion.p>

        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <Link to="/vpn" style={{
            background: `linear-gradient(135deg,${G},${G2})`, color: "#111",
            padding: "16px 36px", borderRadius: 16, fontWeight: 900, fontSize: 16,
            textDecoration: "none", display: "flex", alignItems: "center", gap: 10,
            boxShadow: `0 8px 28px ${G}40`
          }}>
            Pata VPN Yako Sasa <ArrowRight size={18} />
          </Link>
          <a href="#steps" style={{
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
            color: "#fff", padding: "16px 32px", borderRadius: 16, fontWeight: 700, fontSize: 16,
            textDecoration: "none"
          }}>
            Jinsi Inavyofanya Kazi
          </a>
        </div>

        {/* Trust badges */}
        <div style={{ display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap", marginTop: 48 }}>
          {["✅ Inafanya Kazi China", "📱 Android & iPhone", "💻 Windows & Mac", "🔒 Salama 100%"].map(t => (
            <div key={t} style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>{t}</div>
          ))}
        </div>
      </section>

      {/* ── WHY CHINA IS DIFFERENT ── */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "60px 20px" }}>
        <div style={{
          background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)",
          borderRadius: 24, padding: "32px 40px"
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(239,68,68,0.12)", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <AlertTriangle size={28} color="#f87171" />
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 22, fontWeight: 900, marginBottom: 12, color: "#f87171" }}>
                Kwa nini China ni tofauti?
              </h2>
              <p style={{ color: "rgba(255,255,255,0.65)", lineHeight: 1.7, marginBottom: 16 }}>
                China ina mfumo wa udhibiti wa mtandao unaojulikana kama <strong style={{ color: "#fff" }}>"Great Firewall"</strong>.
                Mfumo huu unazuia tovuti na programu nyingi tunazotumia kila siku Tanzania.
              </p>
              <p style={{ color: "rgba(255,255,255,0.65)", lineHeight: 1.7, marginBottom: 20 }}>
                Wanafunzi wanaokwenda China kwa masomo wanajikuta hawana uwezo wa kuwasiliana na familia, 
                kutazama YouTube, au hata kutumia Google. <strong style={{ color: G }}>Suluhisho ni VPN — lakini lazima iandaliwe KABLA ya safari.</strong>
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {BLOCKED_APPS.map(app => (
                  <div key={app.name} style={{
                    padding: "6px 14px", background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.15)", borderRadius: 10,
                    fontSize: 13, fontWeight: 700, color: "#fca5a5", display: "flex", alignItems: "center", gap: 6
                  }}>
                    {app.emoji} {app.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 20px 60px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: "clamp(28px,4vw,42px)", fontWeight: 900, marginBottom: 12 }}>
            Kwa Nini Chagua <span style={{ color: G }}>STEA VPN</span>?
          </h2>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 16 }}>
            Hatuchagui VPN yoyote — tunachagua inayofanya kazi kweli kweli nchini China
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
          {FEATURES.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              style={{
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 20, padding: "28px 28px", display: "flex", gap: 18, alignItems: "flex-start"
              }}
            >
              <div style={{ width: 50, height: 50, borderRadius: 14, background: `${G}15`, color: G, display: "grid", placeItems: "center", flexShrink: 0 }}>
                {f.icon}
              </div>
              <div>
                <h3 style={{ fontWeight: 800, fontSize: 16, marginBottom: 6 }}>{f.title}</h3>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── WHAT A GOOD VPN MUST HAVE ── */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "0 20px 80px" }}>
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 24, padding: "40px" }}>
          <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 26, fontWeight: 900, marginBottom: 8 }}>
            VPN Nzuri kwa China Lazima Iwe na:
          </h2>
          <p style={{ color: "rgba(255,255,255,0.4)", marginBottom: 28, fontSize: 14 }}>Sifa muhimu za VPN inayofanya kazi kweli kweli nchini China</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
            {MUST_HAVE_FEATURES.map((feat, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <CheckCircle size={18} color="#4ade80" style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>{feat}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STEPS ── */}
      <section id="steps" style={{ maxWidth: 1000, margin: "0 auto", padding: "0 20px 80px" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: "clamp(28px,4vw,42px)", fontWeight: 900, marginBottom: 12 }}>
            Hatua <span style={{ color: G }}>4 tu</span> Kupata VPN Yako
          </h2>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 16 }}>Rahisi, ya haraka, na inafanya kazi</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 24 }}>
          {STEPS.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              style={{
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 24, padding: "32px 28px", position: "relative", overflow: "hidden"
              }}
            >
              <div style={{ position: "absolute", top: 16, right: 20, fontSize: 48, fontWeight: 900, color: "rgba(255,255,255,0.04)", fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                {s.num}
              </div>
              <div style={{ width: 56, height: 56, borderRadius: 18, background: `${s.color}18`, color: s.color, display: "grid", placeItems: "center", marginBottom: 20 }}>
                {s.icon}
              </div>
              <h3 style={{ fontWeight: 800, fontSize: 17, marginBottom: 10 }}>{s.title}</h3>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13.5, lineHeight: 1.65 }}>{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── DEVICES ── */}
      <section style={{ maxWidth: 800, margin: "0 auto", padding: "0 20px 80px" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 26, fontWeight: 900, marginBottom: 8 }}>
            Inafanya Kazi kwenye Vifaa Vyote
          </h2>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 15 }}>Android, iPhone, Windows, MacBook — chagua chochote</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
          {[
            { icon: <Smartphone size={32} />, name: "Android", note: "✅ Inaungwa mkono" },
            { icon: <Smartphone size={32} />, name: "iPhone (iOS)", note: "✅ Inaungwa mkono" },
            { icon: <Laptop size={32} />, name: "Windows", note: "✅ Inaungwa mkono" },
            { icon: <Monitor size={32} />, name: "MacBook", note: "✅ Inaungwa mkono" },
          ].map((d, i) => (
            <div key={i} style={{
              background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 20, padding: "28px 20px", textAlign: "center"
            }}>
              <div style={{ color: G, marginBottom: 14, display: "flex", justifyContent: "center" }}>{d.icon}</div>
              <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 6 }}>{d.name}</div>
              <div style={{ fontSize: 12, color: "#4ade80", fontWeight: 700 }}>{d.note}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TROUBLESHOOTING ── */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "0 20px 80px" }}>
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 24, padding: "40px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <HelpCircle size={24} color={G} />
            <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 22, fontWeight: 900 }}>Matatizo ya Kawaida na Masuluhisho</h2>
          </div>
          <div style={{ display: "grid", gap: 16 }}>
            {[
              { prob: "VPN inaungana lakini internet haifanyi kazi", sol: "Badilisha seva (server) nyingine kwenye programu yako ya VPN. Jaribu seva ya Hong Kong, Singapore au Taiwan." },
              { prob: "VPN haiungani kabisa", sol: "Jaribu protocol tofauti kama WireGuard badala ya OpenVPN. Pia angalia kama Wi-Fi ya chuoni inazuia VPN." },
              { prob: "Kasi ya internet ni polepole sana", sol: "Chagua seva iliyo karibu nawe — seva za Asia (Singapore, Japan) kawaida ni za haraka zaidi kutoka China." },
              { prob: "VPN inafanya kazi lakini inaacha ghafla", sol: "Washa 'kill switch' na 'auto-reconnect' kwenye mipangilio ya VPN. Pia angalia mipangilio ya betri ya simu yako." },
            ].map((item, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.02)", borderRadius: 14, padding: "20px 20px", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(239,68,68,0.12)", color: "#f87171", display: "grid", placeItems: "center", flexShrink: 0, fontSize: 12, fontWeight: 900 }}>✗</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#fca5a5", marginBottom: 6 }}>{item.prob}</div>
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <CheckCircle size={16} color="#4ade80" style={{ flexShrink: 0, marginTop: 1 }} />
                      <div style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", lineHeight: 1.6 }}>{item.sol}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ maxWidth: 800, margin: "0 auto", padding: "0 20px 80px" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: "clamp(26px,4vw,38px)", fontWeight: 900, marginBottom: 10 }}>
            Maswali Yanayoulizwa <span style={{ color: G }}>Mara kwa Mara</span>
          </h2>
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          {FAQS.map((faq, i) => <FaqItem key={i} faq={faq} i={i} />)}
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ maxWidth: 700, margin: "0 auto", padding: "0 20px 100px", textAlign: "center" }}>
        <div style={{
          background: `linear-gradient(135deg, rgba(245,166,35,0.12), rgba(245,166,35,0.04))`,
          border: "1px solid rgba(245,166,35,0.2)", borderRadius: 28, padding: "56px 40px"
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: "clamp(24px,4vw,36px)", fontWeight: 900, marginBottom: 14 }}>
            Andaa VPN Yako Leo — <span style={{ color: G }}>Kabla ya Safari</span>
          </h2>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 16, lineHeight: 1.7, marginBottom: 32, maxWidth: 500, margin: "0 auto 32px" }}>
            Usijute ukiwa tayari China. Weka VPN yako sasa ukiwa Tanzania, uhakikishe inafanya kazi, kisha safiri kwa amani kamili.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/vpn" style={{
              background: `linear-gradient(135deg,${G},${G2})`, color: "#111",
              padding: "18px 40px", borderRadius: 16, fontWeight: 900, fontSize: 17,
              textDecoration: "none", display: "flex", alignItems: "center", gap: 10,
              boxShadow: `0 8px 30px ${G}45`
            }}>
              Pata VPN Sasa <ArrowRight size={20} />
            </Link>
          </div>
          <div style={{ marginTop: 24, display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>✅ Jaribio la Bure</span>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>✅ Msaada wa Haraka</span>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>✅ Lipa M-Pesa</span>
          </div>
        </div>
      </section>

    </div>
  );
}
