import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "../api/axios";

const L = { display: "block", marginBottom: "6px", fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em" };

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    try {
      await axios.post("/auth/forgot-password", { email });
      setMessage("A password reset link has been sent to your email address.");
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred. Please try again.");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", width: "100vw", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      {/* Background */}
      <div style={{ position: "fixed", inset: 0, backgroundImage: "url('/jbm-bg.png')", backgroundSize: "cover", backgroundPosition: "center", zIndex: 0 }} />
      <div style={{ position: "fixed", inset: 0, background: "rgba(8,16,40,0.62)", zIndex: 1 }} />

      {/* Card */}
      <div style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: "420px", background: "#fff", borderRadius: "14px", padding: "40px", boxShadow: "0 28px 72px rgba(0,0,0,0.45)" }}>

        {/* JBM Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px", paddingBottom: "22px", borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ background: "linear-gradient(135deg,#1d4ed8,#2563eb)", width: "42px", height: "42px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(29,78,216,0.35)", flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5Z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "1rem", color: "#0f172a", lineHeight: 1.1 }}>JBM Group</div>
            <div style={{ fontSize: "0.68rem", color: "#94a3b8", fontWeight: 500, letterSpacing: "0.07em", textTransform: "uppercase", marginTop: "2px" }}>Approval Management System</div>
          </div>
        </div>

        {/* Back arrow */}
        <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", color: "#64748b", textDecoration: "none", marginBottom: "20px", fontWeight: 500 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Back to Sign In
        </Link>

        <div style={{ marginBottom: "22px" }}>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", marginBottom: "5px" }}>Forgot your password?</h2>
          <p style={{ color: "#64748b", fontSize: "0.85rem" }}>Enter your corporate email and we will send you a reset link.</p>
        </div>

        {message && (
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderLeft: "4px solid #16a34a", color: "#166534", padding: "11px 14px", borderRadius: "6px", fontSize: "0.85rem", marginBottom: "18px", display: "flex", alignItems: "flex-start", gap: "8px" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: "1px" }}><polyline points="20 6 9 17 4 12"/></svg>
            {message}
          </div>
        )}

        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderLeft: "4px solid #dc2626", color: "#991b1b", padding: "10px 14px", borderRadius: "6px", fontSize: "0.85rem", marginBottom: "18px" }}>
            {error}
          </div>
        )}

        {!message && (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={L}>Corporate Email</label>
              <input className="glass-input" type="email" placeholder="name@jbmgroup.com" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
            </div>
            <button className="btn-primary" type="submit" disabled={loading} style={{ width: "100%", justifyContent: "center", padding: "12px" }}>
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}

        <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>Secured by JBM Group IT</span>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
