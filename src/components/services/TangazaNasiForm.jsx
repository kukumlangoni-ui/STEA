import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Send, CheckCircle2, AlertCircle } from "lucide-react";

const G = "#F5A623";

export default function TangazaNasiForm({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    fullName: "",
    businessName: "",
    serviceType: "Matangazo ya Kawaida",
    phone: "",
    message: "",
  });

  const [status, setStatus] = useState("idle"); // idle, loading, success, error

  const isFormValid = 
    formData.fullName.trim() !== "" && 
    formData.phone.trim().length >= 10 && 
    formData.message.trim() !== "";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    setStatus("loading");
    
    // Placeholder for actual submission logic
    console.log("Tangaza Nasi Request Submitted:", formData);
    
    setTimeout(() => {
      setStatus("success");
      setTimeout(() => {
        onClose();
        setStatus("idle");
        setFormData({
          fullName: "",
          businessName: "",
          serviceType: "Matangazo ya Kawaida",
          phone: "",
          message: "",
        });
      }, 2000);
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 10000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          background: "rgba(4, 5, 9, 0.85)",
          backdropFilter: "blur(12px)",
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          style={{
            width: "100%",
            maxWidth: "500px",
            background: "#141823",
            borderRadius: "28px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "#fff",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              zIndex: 10,
            }}
          >
            <X size={20} />
          </button>

          <div style={{ padding: "40px" }}>
            <div style={{ marginBottom: "32px" }}>
              <h2
                style={{
                  fontSize: "28px",
                  fontWeight: 900,
                  color: G,
                  fontFamily: "'Bricolage Grotesque', sans-serif",
                  marginBottom: "8px",
                }}
              >
                Tangaza Nasi 🚀
              </h2>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", lineHeight: 1.6 }}>
                Fikia maelfu ya wadau wa teknolojia Tanzania kupitia STEA. Jaza fomu hii na tutakuwasiliana.
              </p>
            </div>

            {status === "success" ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  textAlign: "center",
                  padding: "40px 0",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "16px",
                }}
              >
                <div style={{ color: "#10b981" }}>
                  <CheckCircle2 size={64} />
                </div>
                <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#fff" }}>Ombi Limepokelewa!</h3>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px" }}>
                  Asante kwa kuchagua STEA. Timu yetu itakupigia hivi punde.
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "grid", gap: "20px" }}>
                <div style={{ display: "grid", gap: "8px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Jina Kamili
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Mfano: John Doe"
                    required
                    style={{
                      width: "100%",
                      height: "52px",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "14px",
                      padding: "0 18px",
                      color: "#fff",
                      fontSize: "15px",
                      outline: "none",
                      transition: "all 0.2s",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = G)}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                  />
                </div>

                <div style={{ display: "grid", gap: "8px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Jina la Biashara (Optional)
                  </label>
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleChange}
                    placeholder="Mfano: Swahili Tech Solutions"
                    style={{
                      width: "100%",
                      height: "52px",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "14px",
                      padding: "0 18px",
                      color: "#fff",
                      fontSize: "15px",
                      outline: "none",
                      transition: "all 0.2s",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = G)}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div style={{ display: "grid", gap: "8px" }}>
                    <label style={{ fontSize: "12px", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Aina ya Huduma
                    </label>
                    <select
                      name="serviceType"
                      value={formData.serviceType}
                      onChange={handleChange}
                      style={{
                        width: "100%",
                        height: "52px",
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "14px",
                        padding: "0 14px",
                        color: "#fff",
                        fontSize: "14px",
                        outline: "none",
                        cursor: "pointer",
                      }}
                    >
                      <option value="Matangazo ya Kawaida">Matangazo</option>
                      <option value="Sponsorship">Sponsorship</option>
                      <option value="Product Review">Product Review</option>
                      <option value="Website Solution">Website Solution</option>
                    </select>
                  </div>

                  <div style={{ display: "grid", gap: "8px" }}>
                    <label style={{ fontSize: "12px", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Namba ya Simu
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="07XXXXXXXX"
                      required
                      style={{
                        width: "100%",
                        height: "52px",
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "14px",
                        padding: "0 18px",
                        color: "#fff",
                        fontSize: "15px",
                        outline: "none",
                        transition: "all 0.2s",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = G)}
                      onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gap: "8px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Ujumbe Wako
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Elezea kidogo unachotaka kutangaza..."
                    required
                    style={{
                      width: "100%",
                      minHeight: "100px",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "14px",
                      padding: "14px 18px",
                      color: "#fff",
                      fontSize: "15px",
                      outline: "none",
                      resize: "none",
                      transition: "all 0.2s",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = G)}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                  />
                </div>

                <button
                  type="submit"
                  disabled={!isFormValid || status === "loading"}
                  style={{
                    width: "100%",
                    height: "56px",
                    background: isFormValid ? G : "rgba(255,255,255,0.05)",
                    color: isFormValid ? "#111" : "rgba(255,255,255,0.2)",
                    borderRadius: "16px",
                    fontWeight: 900,
                    fontSize: "16px",
                    border: "none",
                    cursor: isFormValid ? "pointer" : "not-allowed",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    transition: "all 0.3s",
                    marginTop: "10px",
                    boxShadow: isFormValid ? `0 12px 24px ${G}33` : "none",
                  }}
                >
                  {status === "loading" ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    >
                      <AlertCircle size={20} />
                    </motion.div>
                  ) : (
                    <>
                      Tuma Ombi <Send size={18} />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
