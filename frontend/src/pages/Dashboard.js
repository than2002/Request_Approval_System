import { useState, useEffect, useContext, useCallback } from "react";
import Layout from "../layout/Layout";
import { AuthContext } from "../context/AuthContext";
import axios from "../api/axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import RequestDetailsModal from "../components/RequestDetailsModal";

const MANAGER_ROLES = ["manager", "senior-manager", "approver", "admin"];
const STATUS_MAP = { level1_pending: "Pending L1", level2_pending: "Pending L2", level3_pending: "Pending L3", approved: "Approved", rejected: "Rejected", draft: "Draft" };
const fmtDate = d => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const StatusBadge = ({ status }) => {
  const cls = status?.includes("pending") ? "pending" : status === "approved" ? "approved" : status === "rejected" ? "rejected" : "";
  return <span className={`status-badge ${cls}`}>{STATUS_MAP[status] || status}</span>;
};

const Stat = ({ label, value, color, icon }) => (
  <div className="dash-stat-card" style={{ borderTop: `3px solid ${color}` }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div>
        <div className="dash-stat-label">{label}</div>
        <div className="dash-stat-value" style={{ color }}>{value}</div>
      </div>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const isManager = MANAGER_ROLES.includes(user?.role);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0, draft: 0 });
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      if (isManager) {
        const [s, p] = await Promise.all([axios.get("/approvals/dashboard/stats"), axios.get("/approvals/pending")]);
        const d = s.data.dashboard;
        setStats({ total: (d.pendingCount || 0) + (d.approvedCount || 0) + (d.rejectedCount || 0), pending: d.pendingCount || 0, approved: d.approvedCount || 0, rejected: d.rejectedCount || 0, draft: 0 });
        setRows(p.data.requests || []);
      } else {
        const r = await axios.get("/requests");
        const reqs = r.data.requests || [];
        let pending = 0, approved = 0, rejected = 0, draft = 0;
        reqs.forEach(r => {
          if (r.overallStatus === "approved") approved++;
          else if (r.overallStatus === "rejected") rejected++;
          else if (r.overallStatus === "draft") draft++;
          else pending++;
        });
        setStats({ total: reqs.length, pending, approved, rejected, draft });
        setRows(reqs.slice(0, 6));
      }
    } catch { toast.error("Failed to load dashboard data."); }
    finally { setLoading(false); }
  }, [isManager]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Layout><div className="ap-loading"><div className="ap-loading-spinner" /><p>Loading...</p></div></Layout>;

  return (
    <Layout>
      <div className="dash-header">
        <div>
          <h2 className="dash-title">{isManager ? "Dashboard" : `Welcome, ${user?.name?.split(" ")[0]}`}</h2>
          <p className="dash-subtitle">{isManager ? `${stats.pending} request${stats.pending !== 1 ? "s" : ""} pending your review` : "Track your access requests and their approval status."}</p>
        </div>
        {!isManager && <button className="btn-primary" onClick={() => navigate("/create-request")}>New Request</button>}
      </div>

      <div className="dash-stats-row">
        <Stat label="Total" value={stats.total} color="#1d4ed8" icon={<><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></>} />
        <Stat label="Pending" value={stats.pending} color="#d97706" icon={<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>} />
        <Stat label="Approved" value={stats.approved} color="#16a34a" icon={<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>} />
        <Stat label="Rejected" value={stats.rejected} color="#dc2626" icon={<><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></>} />
      </div>

      {isManager && stats.pending > 0 && (
        <div className="ap-alert-banner" style={{ marginBottom: "18px" }}>
          <strong>{stats.pending} request{stats.pending !== 1 ? "s" : ""}</strong> {stats.pending === 1 ? "is" : "are"} awaiting your approval. <button onClick={() => navigate("/approvals")} style={{ background: "none", border: "none", color: "#d97706", fontWeight: 700, cursor: "pointer", textDecoration: "underline", fontSize: "inherit", fontFamily: "inherit", padding: 0 }}>Review now</button>
        </div>
      )}

      <div className="dash-table-card">
        <div className="dash-table-header">
          <h3>{isManager ? "Pending Approvals" : "Recent Requests"}</h3>
          {!isManager && stats.total > 5 && <button className="dash-view-all" onClick={() => navigate("/requests")}>View all →</button>}
          {isManager && <button className="dash-view-all" onClick={() => navigate("/approvals")}>View all →</button>}
        </div>
        {rows.length === 0 ? (
          <div className="dash-empty">
            <div className="dash-empty-icon"><svg width="40" height="40" fill="none" stroke="#cbd5e1" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></div>
            <h3>{isManager ? "No pending approvals" : "No requests yet"}</h3>
            <p>{isManager ? "All requests have been processed." : "You have not submitted any access requests."}</p>
            {!isManager && <button className="btn-primary" onClick={() => navigate("/create-request")}>Submit a Request</button>}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="ap-table">
              <thead><tr>
                {isManager && <th>Requester</th>}
                <th>T-Code</th><th>Title</th><th>Priority</th><th>Date</th><th>Status</th>
              </tr></thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r._id} className="clickable-row" onClick={() => setSelectedRequest(r)}>
                    {isManager && <td><div style={{ fontWeight: 600, color: "#0f172a" }}>{r.requestedBy?.name || "—"}</div><div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{r.requestedBy?.email}</div></td>}
                    <td><span className="dash-tcode-badge">{r.tcodeName || "—"}</span></td>
                    <td style={{ fontWeight: 500, color: "#334155", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</td>
                    <td><span className={`dash-priority-badge dash-priority--${r.priority || "medium"}`}>{(r.priority || "medium").charAt(0).toUpperCase() + (r.priority || "medium").slice(1)}</span></td>
                    <td className="ap-date">{fmtDate(r.createdAt)}</td>
                    <td><StatusBadge status={r.overallStatus} /></td>
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

export default Dashboard;