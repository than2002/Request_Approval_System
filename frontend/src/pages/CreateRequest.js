import { useState } from "react";
import Layout from "../layout/Layout";
import axios from "../api/axios";
import { useNavigate } from "react-router-dom";

const CreateRequest = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    tcodeName: "",
    tcodeDescription: "",
    businessJustification: "",
    priority: "medium",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      // Create request endpoint outputs status 'draft' by default
      const res = await axios.post("/requests", formData);
      // Automatically submit it for Level 1 Approval
      await axios.patch(`/requests/${res.data.request._id}/submit`);
      navigate("/requests");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h2>Create New T-Code Request</h2>
        <button className="btn-primary" style={{ background: "transparent", border: "1px solid var(--glass-border)" }} onClick={() => navigate("/requests")}>
          Cancel
        </button>
      </div>

      <div className="glass-card" style={{ maxWidth: "800px", margin: "0 auto" }}>
        {error && <div style={{ color: "var(--status-rejected)", marginBottom: "1rem", padding: "1rem", background: "rgba(239, 68, 68, 0.1)", borderRadius: "8px" }}>{error}</div>}
        
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div>
              <label style={labelStyle}>Request Title *</label>
              <input type="text" name="title" className="glass-input" value={formData.title} onChange={handleChange} required placeholder="e.g. Sales Order Access" />
            </div>
            <div>
              <label style={labelStyle}>Priority</label>
              <select name="priority" className="glass-input" value={formData.priority} onChange={handleChange}>
                <option value="low" style={{color: "black"}}>Low</option>
                <option value="medium" style={{color: "black"}}>Medium</option>
                <option value="high" style={{color: "black"}}>High</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div>
              <label style={labelStyle}>T-Code Name *</label>
              <input type="text" name="tcodeName" className="glass-input" value={formData.tcodeName} onChange={handleChange} required placeholder="e.g. VA01" />
            </div>
            <div>
              <label style={labelStyle}>T-Code Description</label>
              <input type="text" name="tcodeDescription" className="glass-input" value={formData.tcodeDescription} onChange={handleChange} placeholder="Create Sales Order" />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Business Justification *</label>
            <textarea name="businessJustification" className="glass-input" value={formData.businessJustification} onChange={handleChange} required rows="4" placeholder="Explain why you need access to this T-Code..."></textarea>
          </div>
          
          <div>
            <label style={labelStyle}>Additional Description</label>
            <textarea name="description" className="glass-input" value={formData.description} onChange={handleChange} rows="2" placeholder="Any extra notes..."></textarea>
          </div>

          <div style={{ marginTop: "10px", textAlign: "right" }}>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Submitting..." : "Submit for Approval"}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

const labelStyle = {
  display: "block",
  marginBottom: "8px",
  color: "var(--text-muted)",
  fontSize: "0.9rem",
  fontWeight: "500"
};

export default CreateRequest;
