import { useState, useEffect } from 'react';
import axios from '../api/axios';

const RequestDetailsModal = ({ isOpen, onClose, request }) => {
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (isOpen && request?._id) {
      fetchHistory();
    }
  }, [isOpen, request]);

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await axios.get(`/approvals/history/${request._id}`);
      setHistory(res.data.approvals || []);
    } catch (error) {
      console.error("Error fetching approval history", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  if (!isOpen || !request) return null;

  const formatStatus = (status) => {
    if (status === "level1_pending") return "Pending (Level 1)";
    if (status === "level2_pending") return "Pending (Level 2)";
    if (status === "level3_pending") return "Pending (Level 3)";
    if (status === "draft") return "Draft";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getStatusClass = (status) => {
    if (status?.includes("pending")) return "pending";
    if (status === "approved") return "approved";
    if (status === "rejected") return "rejected";
    return "";
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: "640px" }}>
        <div className="modal-header">
          <div>
            <h3 style={{ margin: 0, fontSize: "1.15rem" }}>Request Details</h3>
            <p style={{ margin: "3px 0 0", fontSize: "0.82rem", color: "var(--text-secondary)" }}>Full overview and approval timeline</p>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.5rem", color: "var(--text-secondary)", lineHeight: 1 }}
            title="Close"
          >
            &times;
          </button>
        </div>

        <div className="modal-body">
          {/* Top Row: T-Code & Status */}
          <div className="rdm-top-row">
            <div className="rdm-field">
              <span className="rdm-label">T-Code</span>
              <span className="dash-tcode-badge" style={{ fontSize: "1rem", padding: "4px 10px" }}>{request.tcodeName || "—"}</span>
            </div>
            <div className="rdm-field">
              <span className="rdm-label">Status</span>
              <span className={`status-badge ${getStatusClass(request.overallStatus)}`}>
                {formatStatus(request.overallStatus)}
              </span>
            </div>
            <div className="rdm-field">
              <span className="rdm-label">Priority</span>
              <span className={`dash-priority-badge dash-priority--${request.priority || "medium"}`}>
                {(request.priority || "medium").charAt(0).toUpperCase() + (request.priority || "medium").slice(1)}
              </span>
            </div>
          </div>

          {/* Title */}
          <div className="rdm-section">
            <span className="rdm-label">Title</span>
            <p className="rdm-value">{request.title}</p>
          </div>

          {/* T-Code Description */}
          {request.tcodeDescription && (
            <div className="rdm-section">
              <span className="rdm-label">T-Code Description</span>
              <p className="rdm-value">{request.tcodeDescription}</p>
            </div>
          )}

          {/* Business Justification */}
          {request.businessJustification && (
            <div className="rdm-section">
              <span className="rdm-label">Business Justification</span>
              <p className="rdm-value" style={{ lineHeight: 1.6 }}>{request.businessJustification}</p>
            </div>
          )}

          {/* Additional Notes */}
          {request.description && (
            <div className="rdm-section">
              <span className="rdm-label">Additional Notes</span>
              <p className="rdm-value">{request.description}</p>
            </div>
          )}

          {/* Meta Row */}
          <div className="rdm-meta-grid">
            <div className="rdm-field">
              <span className="rdm-label">Requested By</span>
              <span className="rdm-value" style={{ fontWeight: 600 }}>{request.requestedBy?.name || "Unknown"}</span>
              <span style={{ fontSize: "0.78rem", color: "var(--text-tertiary)" }}>{request.requestedBy?.email}</span>
            </div>
            <div className="rdm-field">
              <span className="rdm-label">Request Type</span>
              <span className="rdm-value" style={{ textTransform: "capitalize" }}>{request.requestType || "—"}</span>
            </div>
            <div className="rdm-field">
              <span className="rdm-label">Date Submitted</span>
              <span className="rdm-value">{new Date(request.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
            </div>
          </div>

          {/* Rejection Reason */}
          {request.rejectionReason && (
            <div className="rdm-rejection-box">
              <span className="rdm-label" style={{ color: "#991b1b" }}>Rejection Reason</span>
              <p className="rdm-value" style={{ color: "#991b1b" }}>{request.rejectionReason}</p>
            </div>
          )}

          {/* Audit Trail */}
          <div className="rdm-timeline-section">
            <h4 className="rdm-timeline-title">Approval History & Audit Trail</h4>

            {loadingHistory ? (
              <div className="ap-loading" style={{ padding: "24px" }}>
                <div className="ap-loading-spinner" />
                <p>Loading timeline...</p>
              </div>
            ) : history.length === 0 ? (
              <p className="rdm-empty-history">No approval history available yet.</p>
            ) : (
              <div className="rdm-timeline">
                {history.map((record) => (
                  <div key={record._id} className="rdm-timeline-item">
                    <div className={`rdm-timeline-dot rdm-timeline-dot--${record.status}`} />
                    <div className="rdm-timeline-card">
                      <div className="rdm-timeline-header">
                        <span className="rdm-timeline-name">
                          {record.approver?.name || "System"} <span className="rdm-timeline-role">({record.approver?.role || "—"})</span>
                        </span>
                        <span className="rdm-timeline-date">
                          {new Date(record.actionTakenAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div style={{ marginBottom: "6px" }}>
                        <span className={`status-badge ${record.status}`} style={{ padding: "2px 8px", fontSize: "0.65rem" }}>
                          {record.status.toUpperCase()} (L{record.approvalLevel})
                        </span>
                      </div>
                      {record.comments && (
                        <p className="rdm-timeline-comment">"{record.comments}"</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default RequestDetailsModal;
