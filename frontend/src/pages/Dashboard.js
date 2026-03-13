import { useState, useEffect, useContext, useCallback } from "react";
import Layout from "../layout/Layout";
import { AuthContext } from "../context/AuthContext";
import axios from "../api/axios";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      // Determine endpoints based on role
      const isManager = ["manager", "senior-manager", "approver", "admin"].includes(user?.role);
      
      let res;
      if (isManager) {
        // Fetch manager dashboard stats
        res = await axios.get("/approvals/dashboard/stats");
        setStats({
          total: res.data.dashboard.pendingCount + res.data.dashboard.approvedCount + res.data.dashboard.rejectedCount,
          pending: res.data.dashboard.pendingCount,
          approved: res.data.dashboard.approvedCount,
          rejected: res.data.dashboard.rejectedCount,
        });

        // Also fetch pending approvals for the table
        const pendingRes = await axios.get("/approvals/pending");
        setRecentRequests(pendingRes.data.requests);
      } else {
        // Fetch user requests
        res = await axios.get("/requests");
        const requests = res.data.requests;
        
        let pending = 0, approved = 0, rejected = 0;
        requests.forEach(req => {
          if (req.overallStatus === 'approved') approved++;
          else if (req.overallStatus === 'rejected') rejected++;
          else pending++;
        });

        setStats({
          total: requests.length,
          pending,
          approved,
          rejected
        });
        setRecentRequests(requests.slice(0, 5)); // show latest 5
      }

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const getStatusBadgeClass = (status) => {
    if (status.includes("pending")) return "status-badge pending";
    if (status === "approved") return "status-badge approved";
    if (status === "rejected") return "status-badge rejected";
    return "status-badge";
  };

  const formatStatus = (status) => {
    if (status === "level1_pending") return "Pending (L1)";
    if (status === "level2_pending") return "Pending (L2)";
    if (status === "level3_pending") return "Pending (L3)";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <Layout>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h2>Dashboard Overview</h2>
        {!["manager", "senior-manager", "approver"].includes(user?.role) && (
          <button className="btn-primary" onClick={() => navigate("/create-request")}>Create Request</button>
        )}
      </div>

      {loading ? (
        <p>Loading dashboard...</p>
      ) : (
        <>
          {["manager", "senior-manager", "approver", "admin"].includes(user?.role) ? (
            <>
              {/* Stats Widgets for Managers */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "24px", marginBottom: "40px" }}>
                <div className="glass-card">
                  <h3 style={{ color: "var(--text-muted)", fontSize: "0.9rem", textTransform: "uppercase", marginBottom: "10px" }}>Total System Requests</h3>
                  <p style={{ fontSize: "2.5rem", fontWeight: "700", color: "var(--text-main)", margin: 0 }}>{stats.total}</p>
                </div>
                <div className="glass-card" style={{ borderLeft: "4px solid var(--status-pending)" }}>
                  <h3 style={{ color: "var(--status-pending)", fontSize: "0.9rem", textTransform: "uppercase", marginBottom: "10px" }}>Pending in Queue</h3>
                  <p style={{ fontSize: "2.5rem", fontWeight: "700", color: "var(--text-main)", margin: 0 }}>{stats.pending}</p>
                </div>
                <div className="glass-card" style={{ borderLeft: "4px solid var(--status-approved)" }}>
                  <h3 style={{ color: "var(--status-approved)", fontSize: "0.9rem", textTransform: "uppercase", marginBottom: "10px" }}>Approved</h3>
                  <p style={{ fontSize: "2.5rem", fontWeight: "700", color: "var(--text-main)", margin: 0 }}>{stats.approved}</p>
                </div>
                <div className="glass-card" style={{ borderLeft: "4px solid var(--status-rejected)" }}>
                  <h3 style={{ color: "var(--status-rejected)", fontSize: "0.9rem", textTransform: "uppercase", marginBottom: "10px" }}>Rejected</h3>
                  <p style={{ fontSize: "2.5rem", fontWeight: "700", color: "var(--text-main)", margin: 0 }}>{stats.rejected}</p>
                </div>
              </div>

              {/* Recent Requests Table for Managers */}
              <div className="glass-card" style={{ padding: "24px" }}>
                <h3 style={{ marginBottom: "20px" }}>Pending Approvals Queue</h3>
                <div style={{ overflowX: "auto" }}>
                  <table className="glass-table">
                    <thead>
                      <tr>
                        <th>T-Code</th>
                        <th>Title</th>
                        <th>Requester Email</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentRequests.map((req) => (
                        <tr key={req._id}>
                          <td style={{ fontWeight: "600", color: "var(--accent-color)" }}>{req.tcodeName}</td>
                          <td>{req.title}</td>
                          <td>{req.requestedBy?.email || "Unknown"}</td>
                          <td style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>{new Date(req.createdAt).toLocaleDateString()}</td>
                          <td>
                            <span className={getStatusBadgeClass(req.overallStatus)}>
                              {formatStatus(req.overallStatus)}
                            </span>
                          </td>
                          <td>
                            <button className="btn-primary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem", marginRight: "10px" }}>
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                      {recentRequests.length === 0 && (
                        <tr>
                          <td colSpan="6" style={{ textAlign: "center", padding: "2rem" }}>
                            <p>You have no pending approvals.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="glass-card" style={{ padding: "40px", textAlign: "center" }}>
              <h2>Welcome to the Request Portal</h2>
              <p style={{ color: "var(--text-muted)", marginTop: "10px", marginBottom: "30px" }}>
                You can create a new request or view the status of your existing requests using the sidebar menu.
              </p>
              <button 
                className="btn-primary" 
                onClick={() => navigate("/create-request")}
                style={{ fontSize: "1.1rem", padding: "12px 30px" }}
              >
                Create a New Request
              </button>
            </div>
          )}
        </>
      )}
    </Layout>
  );
};

export default Dashboard;