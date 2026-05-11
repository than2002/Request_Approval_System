import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import Layout from "../layout/Layout";
import axios from "../api/axios";

const S = {
  label: { display: "block", marginBottom: "5px", fontSize: "0.8rem", fontWeight: "700", color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" },
  hint: { display: "block", marginTop: "4px", fontSize: "0.75rem", color: "#94a3b8" },
};

const TYPES = [["tcode", "T-Code Access"], ["access", "System Access"], ["budget", "Budget Approval"], ["leave", "Leave Request"], ["other", "Other"]];
const PRIORITIES = [["low", "Low"], ["medium", "Medium"], ["high", "High"]];

const CreateRequest = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: "", description: "", tcodeName: "", tcodeDescription: "", businessJustification: "", priority: "medium", requestType: "tcode" });
  const [loading, setLoading] = useState(false);

  const set = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.businessJustification.trim().length < 20) { toast.error("Business justification must be at least 20 characters."); return; }
    try {
      setLoading(true);
      const res = await axios.post("/requests", form);
      await axios.patch(`/requests/${res.data.request._id}/submit`);
      toast.success("Request submitted for approval.");
      navigate("/requests");
    } catch (err) {
      toast.error(err.response?.data?.message || "Submission failed. Please try again.");
    } finally { setLoading(false); }
  };

  return (
    <Layout>
      <div className="ap-page-header">
        <div className="ap-page-header-text">
          <h2>New Access Request</h2>
          <p>Submit a request for T-Code or system access. It will be routed through the configured approval chain.</p>
        </div>
        <button className="btn-secondary" onClick={() => navigate("/requests")}>Cancel</button>
      </div>

      <div className="cr-layout">
        <form id="cr-form" onSubmit={handleSubmit}>
          {/* Request Details */}
          <div className="cr-section">
            <div className="cr-section-title">Request Details</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={S.label}>Request Title *</label>
                <input className="glass-input" name="title" value={form.title} onChange={set} required placeholder="Brief title describing the access needed" />
              </div>
              <div className="ap-form-row">
                <div>
                  <label style={S.label}>Request Type *</label>
                  <select className="glass-input" name="requestType" value={form.requestType} onChange={set} style={{ width: "100%" }}>
                    {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.label}>Priority *</label>
                  <select className="glass-input" name="priority" value={form.priority} onChange={set} style={{ width: "100%" }}>
                    {PRIORITIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* T-Code Details (conditional) */}
          {form.requestType === "tcode" && (
            <div className="cr-section">
              <div className="cr-section-title">T-Code Information</div>
              <div className="ap-form-row">
                <div>
                  <label style={S.label}>T-Code *</label>
                  <input className="glass-input" name="tcodeName" value={form.tcodeName} onChange={set} required placeholder="e.g. VA01" style={{ fontFamily: "'Courier New',monospace" }} />
                  <span style={S.hint}>Enter the SAP transaction code.</span>
                </div>
                <div>
                  <label style={S.label}>T-Code Description</label>
                  <input className="glass-input" name="tcodeDescription" value={form.tcodeDescription} onChange={set} placeholder="e.g. Create Sales Order" />
                </div>
              </div>
            </div>
          )}

          {/* Justification */}
          <div className="cr-section">
            <div className="cr-section-title">Business Justification</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={S.label}>Justification *</label>
                <textarea className="glass-input" name="businessJustification" value={form.businessJustification} onChange={set} required rows={5} style={{ resize: "vertical" }} placeholder="Clearly state the business reason for this access request, including your role and how this access will be used." />
                <span style={S.hint}>Minimum 20 characters. Be specific — this directly impacts approval time.</span>
              </div>
              <div>
                <label style={S.label}>Additional Notes</label>
                <textarea className="glass-input" name="description" value={form.description} onChange={set} rows={3} style={{ resize: "vertical" }} placeholder="Optional. Include project names, deadlines, or related reference numbers." />
              </div>
            </div>
          </div>
        </form>

        {/* Sidebar */}
        <div className="cr-sidebar">
          <div className="cr-info-card">
            <div className="cr-info-title">Approval Workflow</div>
            <ol className="cr-info-steps">
              <li><strong>Level 1 — Manager</strong><p>Your direct manager reviews the request.</p></li>
              <li><strong>Level 2 — Senior Manager</strong><p>Escalated to senior management.</p></li>
              <li><strong>Level 3 — Authorised Approver</strong><p>Final authorisation from the IT/SAP authority.</p></li>
            </ol>
            <div className="cr-info-note">You will receive email notifications at each stage of the workflow.</div>
          </div>

          <button form="cr-form" type="submit" className="btn-primary" disabled={loading} style={{ width: "100%", justifyContent: "center", padding: "12px", fontSize: "0.9rem" }}>
            {loading ? <><span className="cr-spinner" />Submitting...</> : "Submit Request"}
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default CreateRequest;
