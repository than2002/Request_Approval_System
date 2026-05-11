import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import Layout from "../layout/Layout";
import axios from "../api/axios";
import RequestDetailsModal from "../components/RequestDetailsModal";

const STATUS_MAP = { level1_pending: "Pending L1", level2_pending: "Pending L2", level3_pending: "Pending L3", approved: "Approved", rejected: "Rejected", draft: "Draft" };
const fmtDate = d => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
const StatusBadge = ({ s }) => { const cls = s?.includes("pending") ? "pending" : s === "approved" ? "approved" : s === "rejected" ? "rejected" : ""; return <span className={`status-badge ${cls}`}>{STATUS_MAP[s] || s}</span>; };

const Requests = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    axios.get("/requests")
      .then(r => setRequests(r.data.requests || []))
      .catch(() => toast.error("Failed to load requests."))
      .finally(() => setLoading(false));
  }, []);

  const count = f => {
    if (f === "all") return requests.length;
    if (f === "pending") return requests.filter(r => r.overallStatus?.includes("pending")).length;
    if (f === "draft") return requests.filter(r => r.overallStatus === "draft").length;
    return requests.filter(r => r.overallStatus === f).length;
  };

  const filtered = (() => {
    if (filter === "all") return requests;
    if (filter === "pending") return requests.filter(r => r.overallStatus?.includes("pending"));
    if (filter === "draft") return requests.filter(r => r.overallStatus === "draft");
    return requests.filter(r => r.overallStatus === filter);
  })();

  if (loading) return <Layout><div className="ap-loading"><div className="ap-loading-spinner" /><p>Loading...</p></div></Layout>;

  return (
    <Layout>
      <div className="ap-page-header">
        <div className="ap-page-header-text">
          <h2>My Requests</h2>
          <p>All T-Code and access requests you have submitted.</p>
        </div>
        <button className="btn-primary" onClick={() => navigate("/create-request")}>New Request</button>
      </div>

      <div className="req-filter-tabs">
        {["all", "draft", "pending", "approved", "rejected"].map(f => (
          <button key={f} className={`req-filter-tab ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}<span className="req-filter-count">{count(f)}</span>
          </button>
        ))}
      </div>

      <div className="ap-table-card">
        {filtered.length === 0 ? (
          <div className="dash-empty" style={{ padding: "56px 24px" }}>
            <div className="dash-empty-icon"><svg width="40" height="40" fill="none" stroke="#cbd5e1" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></div>
            <h3>{filter === "all" ? "No requests found" : `No ${filter} requests`}</h3>
            <p>{filter === "all" ? "You have not submitted any requests yet." : `You have no requests with status "${filter}".`}</p>
            {filter === "all" && <button className="btn-primary" onClick={() => navigate("/create-request")}>Submit a Request</button>}
          </div>
        ) : (
          <div className="ap-table-scroll">
            <table className="ap-table">
              <thead><tr><th>T-Code</th><th>Title</th><th>Type</th><th>Priority</th><th>Submitted</th><th>Status</th></tr></thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r._id} className="clickable-row" onClick={() => setSelectedRequest(r)}>
                    <td><span className="dash-tcode-badge">{r.tcodeName || "—"}</span></td>
                    <td style={{ fontWeight: 500, color: "#334155", maxWidth: "240px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</td>
                    <td style={{ color: "#64748b", textTransform: "capitalize" }}>{r.requestType || "—"}</td>
                    <td><span className={`dash-priority-badge dash-priority--${r.priority || "medium"}`}>{r.priority || "medium"}</span></td>
                    <td className="ap-date">{fmtDate(r.createdAt)}</td>
                    <td><StatusBadge s={r.overallStatus} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <RequestDetailsModal
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        request={selectedRequest}
      />
    </Layout>
  );
};

export default Requests;
