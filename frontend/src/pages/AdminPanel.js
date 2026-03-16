import { useState, useEffect, useContext } from "react";
import Layout from "../layout/Layout";
import { AuthContext } from "../context/AuthContext";
import axios from "../api/axios";

const AdminPanel = () => {
    const { user } = useContext(AuthContext);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "manager"
    });
    const [msg, setMsg] = useState({ type: "", text: "" });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await axios.get("/auth/users");
            setUsers(res.data.users);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (userId) => {
        if (!window.confirm("Are you sure you want to delete this user?")) return;
        try {
            await axios.delete(`/auth/users/${userId}`);
            setMsg({ type: "success", text: "User deleted successfully" });
            fetchUsers();
        } catch (error) {
            setMsg({ type: "error", text: error.response?.data?.message || "Delete failed" });
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await axios.post("/auth/create-manager", formData);
            setMsg({ type: "success", text: "Privileged user created successfully" });
            setShowCreateModal(false);
            setFormData({ name: "", email: "", password: "", role: "manager" });
            fetchUsers();
        } catch (error) {
            setMsg({ type: "error", text: error.response?.data?.message || "Creation failed" });
        }
    };

    return (
        <Layout>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
                <div>
                    <h2>User Management</h2>
                    <p style={{ color: "var(--text-muted)" }}>Manage system users and access roles</p>
                </div>
                <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
                    + Create Managed User
                </button>
            </div>

            {msg.text && (
                <div style={{ 
                    padding: "12px", 
                    borderRadius: "8px", 
                    marginBottom: "20px", 
                    background: msg.type === "success" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                    color: msg.type === "success" ? "#10b981" : "#ef4444",
                    border: `1px solid ${msg.type === "success" ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)"}`
                }}>
                    {msg.text}
                </div>
            )}

            {loading ? (
                <p>Loading user directory...</p>
            ) : (
                <div className="glass-card" style={{ padding: "24px" }}>
                    <div style={{ overflowX: "auto" }}>
                        <table className="glass-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Joined</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr key={u._id}>
                                        <td style={{ fontWeight: "600" }}>{u.name} {u._id === user?.id && <span style={{fontSize: "0.7rem", color: "var(--accent-color)"}}>(You)</span>}</td>
                                        <td>{u.email}</td>
                                        <td>
                                            <span style={{ 
                                                padding: "4px 8px", 
                                                borderRadius: "4px", 
                                                fontSize: "0.75rem", 
                                                background: u.role === "admin" ? "rgba(239, 68, 68, 0.1)" : "rgba(99, 102, 241, 0.1)",
                                                color: u.role === "admin" ? "#f87171" : "var(--accent-color)"
                                            }}>
                                                {u.role.toUpperCase()}
                                            </span>
                                        </td>
                                        <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                                            {new Date(u.createdAt).toLocaleDateString()}
                                        </td>
                                        <td>
                                            <button 
                                                className="btn-primary" 
                                                style={{ padding: "4px 8px", fontSize: "0.8rem", background: "transparent", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#ef4444" }}
                                                onClick={() => handleDelete(u._id)}
                                                disabled={u._id === user?.id}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {showCreateModal && (
                <div style={{
                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: "rgba(0,0,0,0.7)", zIndex: 1000,
                    display: "flex", justifyContent: "center", alignItems: "center", backdropFilter: "blur(4px)"
                }}>
                    <div className="glass-card" style={{ width: "400px", padding: "30px" }}>
                        <h3 style={{ marginBottom: "20px" }}>Create Managed User</h3>
                        <form onSubmit={handleCreateUser} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                            <input 
                                className="glass-input" placeholder="Full Name" required 
                                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                            />
                            <input 
                                className="glass-input" type="email" placeholder="Official Email (@jbmgroup.com)" required 
                                value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                            />
                            <input 
                                className="glass-input" type="password" placeholder="Password" required 
                                value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                            />
                            <select 
                                className="glass-input" style={{ width: "100%" }}
                                value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}
                            >
                                <option value="manager">Level 1 Manager</option>
                                <option value="senior-manager">Level 2 Senior Manager</option>
                                <option value="approver">Level 3 Approver</option>
                                <option value="admin">Administrator</option>
                            </select>
                            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                                <button type="button" className="btn-primary" style={{ background: "transparent", border: "1px solid var(--glass-border)" }} onClick={() => setShowCreateModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Create Account</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default AdminPanel;
