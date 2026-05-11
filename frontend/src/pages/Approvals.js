import { useState, useEffect } from "react";
import Layout from "../layout/Layout";
import axios from "../api/axios";
import { toast } from "react-hot-toast";
import RequestDetailsModal from "../components/RequestDetailsModal";

const LEVELS = { level1_pending: { label: "Level 1 — Manager Review", color: "#1d4ed8" }, level2_pending: { label: "Level 2 — Senior Manager Review", color: "#7c3aed" }, level3_pending: { label: "Level 3 — Final Approval", color: "#d97706" } };
const fmtDate = d => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const Approvals = () => {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [comments, setComments] = useState({});
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => { fetchPending(); }, []);

  const fetchPending = async () => {
    try { setLoading(true); const r = await axios.get("/approvals/pending"); setPending(r.data.requests || []); }
    catch { toast.error("Failed to load approval queue."); }
    finally { setLoading(false); }
  };

  const action = async (id, level, act) => {
    const comment = comments[id]?.trim() || "";
    if (act === "reject" && !comment) { toast.error("A rejection reason is required."); return; }
    try {
      setActionLoading(id + act);
      await axios.post(`/approvals/${id}/level/${level}/${act}`, { comments: comment || `${act === "approve" ? "Approved" : "Rejected"} via portal` });
      toast.success(act === "approve" ? "Request approved." : "Request rejected.");
      setComments(c => ({ ...c, [id]: "" }));
      fetchPending();
    } catch (err) { toast.error(err.response?.data?.message || `Failed to ${act}.`); }
    finally { setActionLoading(null); }
  };

  if (loading) return <Layout><div className="ap-loading"><div className="ap-loading-spinner" /><p>Loading...</p></div></Layout>;

  return (
    <Layout>
      <div className="ap-page-header">
        <div className="ap-page-header-text">
          <h2>Approval Queue</h2>
          <p>Review and take action on access requests assigned to your approval level.</p>
        </div>
        {pending.length > 0 && <div className="apq-badge-count"><span>{pending.length}</span>{pending.length === 1 ? "Pending" : "Pending"}</div>}
      </div>

      {pending.length === 0 ? (
        <div className="dash-table-card">
          <div className="dash-empty" style={{ padding: "72px 24px" }}>
            <div className="dash-empty-icon"><svg width="44" height="44" fill="none" stroke="#bbf7d0" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>
            <h3 style={{ color: "#166534" }}>All caught up</h3>
            <p>There are no pending approvals in your queue at this time.</p>
          </div>
        </div>
      ) : (
        <div className="apq-list">
          {pending.map(req => {
            const lvl = req.overallStatus === "level3_pending" ? 3 : req.overallStatus === "level2_pending" ? 2 : 1;
            const lvlInfo = LEVELS[req.overallStatus] || { label: "Pending Review", color: "#1d4ed8" };
            const processing = actionLoading === req._id + "approve" || actionLoading === req._id + "reject";
            const hasComment = !!(comments[req._id]?.trim());

            return (
              <div key={req._id} className="apq-card">
                <div className="apq-level-bar" style={{ background: lvlInfo.color }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {lvlInfo.label}
                </div>
                <div className="apq-card-body">
                  <div className="apq-card-header">
                    <div className="apq-card-title-area">
                      <h3 className="apq-title">{req.title}</h3>
                      <div className="apq-meta">
                        {req.tcodeName && <span className="dash-tcode-badge">{req.tcodeName}</span>}
                        <span className={`dash-priority-badge dash-priority--${req.priority || "medium"}`}>{req.priority || "medium"}</span>
                        <button
                          className="apq-detail-link"
                          onClick={(e) => { e.stopPropagation(); setSelectedRequest(req); }}
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                    <div className="apq-requester">
                      <div className="apq-requester-avatar">{req.requestedBy?.name?.charAt(0)?.toUpperCase() || "?"}</div>
                      <div>
                        <div className="apq-requester-name">{req.requestedBy?.name || "Unknown"}</div>
                        <div className="apq-requester-email">{req.requestedBy?.email}</div>
                        <div className="apq-requester-date">Submitted {fmtDate(req.createdAt)}</div>
                      </div>
                    </div>
                  </div>

                  {req.businessJustification && (
                    <div className="apq-justification">
                      <div className="apq-field-label">Business Justification</div>
                      <p className="apq-field-value">{req.businessJustification}</p>
                    </div>
                  )}
                  {req.tcodeDescription && (
                    <div className="apq-justification">
                      <div className="apq-field-label">T-Code Description</div>
                      <p className="apq-field-value">{req.tcodeDescription}</p>
                    </div>
                  )}

                  <div className="apq-comment-area">
                    <div className="apq-field-label">Review Comment <span className="apq-required-note">— required to reject</span></div>
                    <textarea className="glass-input" rows={3} placeholder="Enter your comments or rejection reason..." style={{ resize: "vertical", marginTop: "6px" }} value={comments[req._id] || ""} onChange={e => setComments(c => ({ ...c, [req._id]: e.target.value }))} />
                  </div>

                  <div className="apq-actions">
                    <button className="apq-btn apq-btn--reject" disabled={processing || !hasComment} onClick={() => action(req._id, lvl, "reject")}>
                      {actionLoading === req._id + "reject" ? "Processing..." : "Reject"}
                    </button>
                    <button className="apq-btn apq-btn--approve" disabled={processing} onClick={() => action(req._id, lvl, "approve")}>
                      {actionLoading === req._id + "approve" ? "Processing..." : `Approve — Level ${lvl}`}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <RequestDetailsModal
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        request={selectedRequest}
      />
    </Layout>
  );
};

export default Approvals;
