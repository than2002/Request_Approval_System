import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import Layout from "../layout/Layout";
import { AuthContext } from "../context/AuthContext";
import axios from "../api/axios";
import RequestDetailsModal from "../components/RequestDetailsModal";

const Requests = () => {
  const { user } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/requests");
      setRequests(res.data.requests);
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

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
        <h2>My Requests</h2>
        <Link to="/create-request" className="btn-primary" style={{ display: "inline-block", textDecoration: "none" }}>
          + New Request
        </Link>
      </div>

      {loading ? (
        <p>Loading requests...</p>
      ) : (
        <div className="glass-card" style={{ padding: "24px" }}>
          <div style={{ overflowX: "auto" }}>
            <table className="glass-table">
              <thead>
                <tr>
                  <th>T-Code</th>
                  <th>Title</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req._id}>
                    <td style={{ fontWeight: "600", color: "var(--accent-color)" }}>{req.tcodeName}</td>
                    <td>{req.title}</td>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>{new Date(req.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span className={getStatusBadgeClass(req.overallStatus)}>
                        {formatStatus(req.overallStatus)}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn-primary" 
                        style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}
                        onClick={() => {
                          setSelectedRequest({...req, currentUserRole: user?.role});
                          setIsModalOpen(true);
                        }}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
                {requests.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", padding: "2rem" }}>
                      <p>You haven't submitted any requests yet.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <RequestDetailsModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        request={selectedRequest} 
      />
    </Layout>
  );
};

export default Requests;
