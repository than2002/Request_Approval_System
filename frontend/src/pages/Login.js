import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError("Invalid email or password");
    }
  };

  return (
    <div style={styles.container}>
      {/* Decorative Background Elements */}
      <div style={styles.blob1}></div>
      <div style={styles.blob2}></div>
      <div style={styles.blob3}></div>

      <div className="glass-card" style={styles.card}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '10px', background: 'linear-gradient(to right, #6366f1, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Welcome Back
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>Sign in to access the Request Portal</p>
        </div>

        {error && (
          <div style={styles.errorBox}>
            <span style={{ marginRight: '8px' }}>⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="name@jbmgroup.com"
              value={form.email}
              onChange={handleChange}
              className="glass-input"
              pattern=".*@jbmgroup\.com$"
              title="Please log in with your @jbmgroup.com email address"
              required
            />
          </div>

          <div>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              className="glass-input"
              required
            />
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '10px', padding: '14px', fontSize: '1rem', fontWeight: 'bold' }}>
            Sign In
          </button>
        </form>

        <p style={styles.footerText}>
          Don’t have an account? <Link to="/register" style={styles.link}>Create one here</Link>
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "var(--bg-gradient)",
    position: "relative",
    overflow: "hidden",
  },
  card: {
    width: "100%",
    maxWidth: "420px",
    padding: "40px",
    position: "relative",
    zIndex: 10,
    boxSizing: 'border-box'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '0.9rem',
    color: 'var(--text-main)',
    fontWeight: '500'
  },
  errorBox: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#fca5a5',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'center'
  },
  footerText: {
    textAlign: 'center',
    marginTop: '30px',
    fontSize: '0.95rem',
    color: 'var(--text-muted)'
  },
  link: {
    color: 'var(--accent-color)',
    fontWeight: '600',
    textDecoration: 'none',
    transition: 'color 0.2s'
  },
  blob1: {
    position: 'absolute',
    top: '-10%',
    left: '-10%',
    width: '400px',
    height: '400px',
    background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, rgba(255,255,255,0) 70%)',
    borderRadius: '50%',
    filter: 'blur(40px)',
    zIndex: 1
  },
  blob2: {
    position: 'absolute',
    bottom: '-20%',
    right: '-10%',
    width: '500px',
    height: '500px',
    background: 'radial-gradient(circle, rgba(168,85,247,0.25) 0%, rgba(255,255,255,0) 70%)',
    borderRadius: '50%',
    filter: 'blur(50px)',
    zIndex: 1
  },
  blob3: {
    position: 'absolute',
    top: '20%',
    right: '15%',
    width: '300px',
    height: '300px',
    background: 'radial-gradient(circle, rgba(16,185,129,0.2) 0%, rgba(255,255,255,0) 70%)',
    borderRadius: '50%',
    filter: 'blur(40px)',
    zIndex: 1
  }
};

export default Login;