import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { AuthContext } from "../context/AuthContext";

const L = { display: "block", marginBottom: "6px", fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em" };

const Register = () => {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "", employeeCode: "", plant: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const set = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    try {
      setLoading(true);
      await register({ name: form.name, email: form.email, password: form.password, employeeCode: form.employeeCode, plant: form.plant });
      setSuccess(true);
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed. Please try again.";
      setError(msg); toast.error(msg);
    } finally { setLoading(false); }
  };

  const BgLayer = () => <>
    <div style={{ position: "fixed", inset: 0, backgroundImage: "url('/jbm-bg.png')", backgroundSize: "cover", backgroundPosition: "center", zIndex: 0 }} />
    <div style={{ position: "fixed", inset: 0, background: "rgba(8,16,40,0.62)", zIndex: 1 }} />
  </>;

  const LogoBar = () => (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px", paddingBottom: "20px", borderBottom: "1px solid #f1f5f9" }}>
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
  );

  if (success) return (
    <div style={{ minHeight: "100vh", width: "100vw", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <BgLayer />
      <div style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: "420px", background: "#fff", borderRadius: "14px", padding: "40px", boxShadow: "0 28px 72px rgba(0,0,0,0.45)", textAlign: "center" }}>
        <LogoBar />
        <div style={{ width: "56px", height: "56px", background: "#f0fdf4", border: "2px solid #bbf7d0", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0f172a", marginBottom: "10px" }}>Registration Submitted</h2>
        <p style={{ color: "#64748b", fontSize: "0.875rem", lineHeight: 1.65, marginBottom: "6px" }}>Your request has been received and is pending administrator review.</p>
        <p style={{ color: "#94a3b8", fontSize: "0.78rem", marginBottom: "28px" }}>You will be notified via email once your account is approved.</p>
        <button className="btn-primary" onClick={() => navigate("/")} style={{ width: "100%", justifyContent: "center", padding: "11px" }}>Back to Sign In</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", width: "100vw", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <BgLayer />

      <div style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: "480px", background: "#fff", borderRadius: "14px", padding: "36px 40px", boxShadow: "0 28px 72px rgba(0,0,0,0.45)" }}>
        <LogoBar />

        <div style={{ marginBottom: "20px" }}>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", marginBottom: "5px" }}>Request Account Access</h2>
          <p style={{ color: "#64748b", fontSize: "0.85rem" }}>Complete the form. Your request will be reviewed before activation.</p>
        </div>

        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderLeft: "4px solid #dc2626", color: "#991b1b", padding: "10px 14px", borderRadius: "6px", fontSize: "0.85rem", marginBottom: "16px" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "13px" }}>
          <div>
            <label style={L}>Full Name *</label>
            <input className="glass-input" name="name" value={form.name} onChange={set} placeholder="First and last name" required />
          </div>
          <div>
            <label style={L}>Corporate Email *</label>
            <input className="glass-input" name="email" type="email" value={form.email} onChange={set} placeholder="name@jbmgroup.com" required />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={L}>Employee Code *</label>
              <input className="glass-input" name="employeeCode" value={form.employeeCode} onChange={set} placeholder="e.g. JBM001" required />
            </div>
            <div>
              <label style={L}>Plant Code *</label>
              <input className="glass-input" name="plant" value={form.plant} onChange={set} placeholder="e.g. Faridabad" required />
            </div>
          </div>
          <div>
            <label style={L}>Password *</label>
            <input className="glass-input" name="password" type="password" value={form.password} onChange={set} placeholder="Minimum 6 characters" minLength="6" required />
          </div>
          <div>
            <label style={L}>Confirm Password *</label>
            <input className="glass-input" name="confirmPassword" type="password" value={form.confirmPassword} onChange={set} placeholder="Re-enter your password" required />
          </div>
          <button className="btn-primary" type="submit" disabled={loading} style={{ width: "100%", justifyContent: "center", padding: "12px", marginTop: "4px" }}>
            {loading ? "Submitting..." : "Submit Registration"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "18px", fontSize: "0.85rem", color: "#64748b" }}>
          Already have an account? <Link to="/" style={{ color: "#1d4ed8", fontWeight: 600, textDecoration: "none" }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;