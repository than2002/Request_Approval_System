import { useState, useEffect, useContext } from "react";
import Layout from "../layout/Layout";
import { AuthContext } from "../context/AuthContext";
import axios from "../api/axios";

const Approvals = () => {
  const { user } = useContext(AuthContext);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/approvals/pending");
      setPendingApprovals(res.data.requests);
    } catch (error) {
      console.error("Error fetching pending approvals:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalAction = async (requestId, level, action) => {
    try {
      setActionLoading(requestId);
      await axios.post(`/approvals/${requestId}/level/${level}/${action}`, {
        comments: `Request ${action} by ${user.name} at Level ${level}`,
      });
      // Refresh list
      fetchPendingApprovals();
    } catch (error) {
      console.error(`Error ${action} request:`, error);
      alert(`Failed to ${action} request. Please try again.`);
    } finally {
      setActionLoading(null);
    }
  };

  const getPriorityColor = (priority) => {
    if (priority === "high") return "var(--status-rejected)";
    if (priority === "medium") return "var(--status-pending)";
    return "var(--status-approved)";
  };

  return (
    <Layout>
      <div style={{ marginBottom: "30px" }}>
        <h2>Approval Queue</h2>
        <p>Review and manage T-Code requests assigned to you.</p>
      </div>

      {loading ? (
        <p>Loading pending approvals...</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {pendingApprovals.map((req) => {
            // Determine which level this manager is approving based on the request's status
            let currentApprovalLevel = 1;
            if (req.overallStatus === "level2_pending") currentApprovalLevel = 2;
            if (req.overallStatus === "level3_pending") currentApprovalLevel = 3;

            return (
              <div key={req._id} className="glass-card" style={{ padding: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--glass-border)", paddingBottom: "15px", marginBottom: "15px" }}>
                  <div>
                    <h3 style={{ margin: "0 0 5px 0" }}>{req.title}</h3>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      <span className="status-badge" style={{ background: "rgba(99, 102, 241, 0.15)", color: "var(--accent-color)", border: "1px solid rgba(99, 102, 241, 0.3)" }}>
                        {req.tcodeName}
                      </span>
                      <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                        Priority: <strong style={{ color: getPriorityColor(req.priority) }}>{req.priority?.toUpperCase()}</strong>
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    <div>Requested By: <strong style={{color: "var(--text-main)"}}>{req.requestedBy?.name}</strong></div>
                    <div>{new Date(req.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <h4 style={{ margin: "0 0 10px 0", fontSize: "0.95rem" }}>Business Justification</h4>
                  <p style={{ margin: 0, fontSize: "0.95rem", lineHeight: "1.5" }}>{req.businessJustification}</p>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", paddingTop: "15px", borderTop: "1px solid rgba(255, 255, 255, 0.03)" }}>
                  <button 
                    className="btn-primary" 
                    style={{ background: "transparent", color: "var(--status-rejected)", border: "1px solid rgba(239, 68, 68, 0.3)" }}
                    disabled={actionLoading === req._id}
                    onClick={() => handleApprovalAction(req._id, currentApprovalLevel, "reject")}
                  >
                    Reject
                  </button>
                  <button 
                    className="btn-primary" 
                    style={{ background: "var(--status-approved)", boxShadow: "0 4px 14px 0 rgba(16, 185, 129, 0.39)" }}
                    disabled={actionLoading === req._id}
                    onClick={() => handleApprovalAction(req._id, currentApprovalLevel, "approve")}
                  >
                    {actionLoading === req._id ? "Processing..." : `Approve Level ${currentApprovalLevel}`}
                  </button>
                </div>
              </div>
            );
          })}
          
          {pendingApprovals.length === 0 && (
            <div className="glass-card" style={{ textAlign: "center", padding: "40px 20px" }}>
              <h3 style={{ color: "var(--text-muted)", margin: 0 }}>All caught up!</h3>
              <p>You have no pending approvals in your queue at the moment.</p>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
};

export default Approvals;
