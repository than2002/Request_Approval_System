import { useState, useEffect, useContext } from "react";
import Layout from "../layout/Layout";
import { AuthContext } from "../context/AuthContext";
import axios from "../api/axios";
import { toast } from "react-hot-toast";

const getRoleColor = (role) => {
    switch (role) {
        case "admin": return { bg: "#fef2f2", color: "#b91c1c", border: "#fecaca" };
        case "approver": return { bg: "#fdf4ff", color: "#7c3aed", border: "#e9d5ff" };
        case "senior-manager": return { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" };
        case "manager": return { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" };
        default: return { bg: "#f8fafc", color: "#475569", border: "#e2e8f0" };
    }
};

const getRoleLabel = (role) => {
    switch (role) {
        case "admin": return "Administrator";
        case "senior-manager": return "L2 Sr. Manager";
        case "manager": return "L1 Manager";
        case "approver": return "L3 Approver";
        default: return "User";
    }
};

const AdminPanel = () => {
    const { user } = useContext(AuthContext);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        employeeCode: "",
        plant: "",
        role: "manager"
    });
    const [selectedRoles, setSelectedRoles] = useState({});

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await axios.get("/auth/users");
            setUsers(res.data.users);
        } catch (error) {
            toast.error("Failed to load users directory.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (userId) => {
        if (!window.confirm("Are you sure you want to permanently remove this user? This action cannot be undone.")) return;
        try {
            await axios.delete(`/auth/users/${userId}`);
            toast.success("User removed successfully.");
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to remove user.");
        }
    };

    const handleApprove = async (userId) => {
        try {
            const role = selectedRoles[userId] || "user";
            await axios.put(`/auth/users/${userId}/approve`, { role });
            toast.success(`User approved and assigned as ${getRoleLabel(role)}.`);
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || "Approval failed. Please try again.");
        }
    };

    const handleToggleStatus = async (userId, currentlyActive) => {
        const action = currentlyActive ? "suspend" : "reactivate";
        if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;
        try {
            await axios.put(`/auth/users/${userId}/toggle-status`);
            toast.success(`User ${currentlyActive ? "suspended" : "reactivated"} successfully.`);
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || "Status update failed.");
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await axios.post("/auth/create-manager", formData);
            toast.success(`New ${getRoleLabel(formData.role)} account created successfully!`);
            setShowCreateModal(false);
            setFormData({ name: "", email: "", password: "", employeeCode: "", plant: "", role: "manager" });
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || "Account creation failed.");
        }
    };

    // Computed stats
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.isActive && u.isApproved).length;
    const pendingUsers = users.filter(u => !u.isApproved).length;
    const inactiveUsers = users.filter(u => !u.isActive).length;

    // Search filter
    const filteredUsers = searchQuery.trim()
        ? users.filter(u =>
            u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (u.employeeCode && u.employeeCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (u.plant && u.plant.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        : users;

    return (
        <Layout>
            {/* Page Header */}
            <div className="ap-page-header">
                <div className="ap-page-header-text">
                    <h2>User Management</h2>
                    <p>View, approve, and manage all registered users on this platform.</p>
                </div>
                <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
                    + Add New User
                </button>
            </div>

            {/* Stats Overview */}
            <div className="ap-stats-row">
                <div className="ap-stat-card">
                    <span className="ap-stat-label">Total Registered</span>
                    <span className="ap-stat-value" style={{ color: "var(--primary)" }}>{totalUsers}</span>
                </div>
                <div className="ap-stat-card">
                    <span className="ap-stat-label">Active &amp; Approved</span>
                    <span className="ap-stat-value" style={{ color: "var(--success)" }}>{activeUsers}</span>
                </div>
                <div className="ap-stat-card ap-stat-card--alert">
                    <span className="ap-stat-label">⏳ Awaiting Approval</span>
                    <span className="ap-stat-value" style={{ color: "#d97706" }}>{pendingUsers}</span>
                </div>
                <div className="ap-stat-card">
                    <span className="ap-stat-label">Suspended</span>
                    <span className="ap-stat-value" style={{ color: "var(--danger)" }}>{inactiveUsers}</span>
                </div>
            </div>

            {/* Pending Approvals Banner */}
            {pendingUsers > 0 && (
                <div className="ap-alert-banner">
                    <span>⚠️ You have <strong>{pendingUsers} user{pendingUsers > 1 ? "s" : ""}</strong> waiting for approval. Review them in the table below.</span>
                </div>
            )}

            {/* Search Bar */}
            <div className="ap-search-bar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input
                    className="glass-input"
                    type="text"
                    placeholder="Search by name, email, employee code, or plant..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{ border: "none", boxShadow: "none", paddingLeft: "0" }}
                />
                {searchQuery && (
                    <button onClick={() => setSearchQuery("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: "4px", display: "flex" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                )}
            </div>

            {/* User Table */}
            {loading ? (
                <div className="ap-loading">
                    <div className="ap-loading-spinner"></div>
                    <p>Loading user directory, please wait...</p>
                </div>
            ) : (
                <div className="animate-fade">
                    {/* Desktop Table */}
                    <div className="ap-table-card">
                        <div className="ap-table-scroll">
                            <table className="ap-table">
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Employee Code</th>
                                        <th>Role</th>
                                        <th>Plant</th>
                                        <th>Status</th>
                                        <th>Joined On</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map((u) => {
                                        const roleStyle = getRoleColor(u.role);
                                        const isSelf = u._id === user?.id;
                                        return (
                                            <tr key={u._id} className={isSelf ? "ap-row-self" : ""}>
                                                <td>
                                                    <div className="ap-user-cell">
                                                        <div className="ap-avatar" style={{ background: roleStyle.bg, color: roleStyle.color }}>
                                                            {u.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="ap-user-name">
                                                                {u.name}
                                                                {isSelf && <span className="ap-self-tag">You</span>}
                                                            </div>
                                                            <div className="ap-user-email">{u.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="ap-mono">{u.employeeCode || "—"}</td>
                                                <td>
                                                    <span className="ap-role-badge" style={{
                                                        background: roleStyle.bg,
                                                        color: roleStyle.color,
                                                        border: `1px solid ${roleStyle.border}`
                                                    }}>
                                                        {getRoleLabel(u.role)}
                                                    </span>
                                                </td>
                                                <td>{u.plant || "—"}</td>
                                                <td>
                                                    {!u.isActive ? (
                                                        <span className="ap-status ap-status--suspended">Suspended</span>
                                                    ) : u.isApproved ? (
                                                        <span className="ap-status ap-status--active">Active</span>
                                                    ) : (
                                                        <span className="ap-status ap-status--pending">Pending</span>
                                                    )}
                                                </td>
                                                <td className="ap-date">{new Date(u.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                                                <td>
                                                    <div className="ap-actions">
                                                        {!u.isApproved && (
                                                            <div className="ap-approve-row">
                                                                <select
                                                                    className="ap-role-select"
                                                                    value={selectedRoles[u._id] || "user"}
                                                                    onChange={(e) => setSelectedRoles({ ...selectedRoles, [u._id]: e.target.value })}
                                                                >
                                                                    <option value="user">User</option>
                                                                    <option value="manager">L1 Manager</option>
                                                                    <option value="senior-manager">L2 Sr. Manager</option>
                                                                    <option value="approver">L3 Approver</option>
                                                                </select>
                                                                <button
                                                                    className="ap-btn ap-btn--approve"
                                                                    onClick={() => handleApprove(u._id)}
                                                                >
                                                                    Approve
                                                                </button>
                                                            </div>
                                                        )}
                                                        {u.isApproved && (
                                                            <button
                                                                className={`ap-btn ${u.isActive ? "ap-btn--suspend" : "ap-btn--activate"}`}
                                                                onClick={() => handleToggleStatus(u._id, u.isActive)}
                                                                disabled={isSelf}
                                                                title={isSelf ? "You cannot change your own status" : ""}
                                                            >
                                                                {u.isActive ? "Suspend" : "Activate"}
                                                            </button>
                                                        )}
                                                        <button
                                                            className="ap-btn ap-btn--remove"
                                                            onClick={() => handleDelete(u._id)}
                                                            disabled={isSelf}
                                                            title={isSelf ? "You cannot remove your own account" : ""}
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredUsers.length === 0 && (
                                        <tr>
                                            <td colSpan="7" style={{ textAlign: "center", padding: "48px", color: "var(--text-tertiary)" }}>
                                                {searchQuery ? `No users matching "${searchQuery}"` : "No users found in the system."}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Mobile Cards */}
                    <div className="ap-card-list">
                        {filteredUsers.map((u) => {
                            const roleStyle = getRoleColor(u.role);
                            const isSelf = u._id === user?.id;
                            return (
                                <div key={u._id} className="ap-user-card glass-card">
                                    <div className="ap-user-card-top">
                                        <div className="ap-user-cell">
                                            <div className="ap-avatar" style={{ background: roleStyle.bg, color: roleStyle.color }}>
                                                {u.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="ap-user-name">
                                                    {u.name}
                                                    {isSelf && <span className="ap-self-tag">You</span>}
                                                </div>
                                                <div className="ap-user-email">{u.email}</div>
                                            </div>
                                        </div>
                                        {!u.isActive ? (
                                            <span className="ap-status ap-status--suspended">Suspended</span>
                                        ) : u.isApproved ? (
                                            <span className="ap-status ap-status--active">Active</span>
                                        ) : (
                                            <span className="ap-status ap-status--pending">Pending</span>
                                        )}
                                    </div>
                                    <div className="ap-user-card-meta">
                                        <div><span className="ap-meta-label">Employee Code</span> <span className="ap-mono">{u.employeeCode || "—"}</span></div>
                                        <div><span className="ap-meta-label">Plant</span> {u.plant || "—"}</div>
                                        <div><span className="ap-meta-label">Role</span>
                                            <span className="ap-role-badge" style={{ background: roleStyle.bg, color: roleStyle.color, border: `1px solid ${roleStyle.border}` }}>
                                                {getRoleLabel(u.role)}
                                            </span>
                                        </div>
                                        <div><span className="ap-meta-label">Joined</span> {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>
                                    </div>
                                    {!u.isApproved && (
                                        <div className="ap-approve-row" style={{ marginBottom: "8px" }}>
                                            <select
                                                className="ap-role-select"
                                                value={selectedRoles[u._id] || "user"}
                                                onChange={(e) => setSelectedRoles({ ...selectedRoles, [u._id]: e.target.value })}
                                            >
                                                <option value="user">User</option>
                                                <option value="manager">L1 Manager</option>
                                                <option value="senior-manager">L2 Sr. Manager</option>
                                                <option value="approver">L3 Approver</option>
                                            </select>
                                            <button className="ap-btn ap-btn--approve" onClick={() => handleApprove(u._id)}>Approve</button>
                                        </div>
                                    )}
                                    <div className="ap-actions">
                                        {u.isApproved && (
                                            <button
                                                className={`ap-btn ${u.isActive ? "ap-btn--suspend" : "ap-btn--activate"}`}
                                                onClick={() => handleToggleStatus(u._id, u.isActive)}
                                                disabled={isSelf}
                                            >
                                                {u.isActive ? "Suspend" : "Activate"}
                                            </button>
                                        )}
                                        <button className="ap-btn ap-btn--remove" onClick={() => handleDelete(u._id)} disabled={isSelf}>Remove</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowCreateModal(false); }}>
                    <div className="modal-content" style={{ maxWidth: "520px" }}>
                        <div className="modal-header">
                            <div>
                                <h3 style={{ margin: 0, fontSize: "1.2rem" }}>Add New User</h3>
                                <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                                    This account will be created as an approved user.
                                </p>
                            </div>
                            <button
                                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.5rem", color: "var(--text-secondary)", lineHeight: 1 }}
                                onClick={() => setShowCreateModal(false)}
                                title="Close"
                            >
                                &times;
                            </button>
                        </div>
                        <div className="modal-body">
                            <form id="create-user-form" onSubmit={handleCreateUser}>
                                <div className="ap-form-group">
                                    <label className="ap-form-label">Full Name *</label>
                                    <input className="glass-input" placeholder="e.g. Arun Kumar" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                </div>
                                <div className="ap-form-group">
                                    <label className="ap-form-label">Official Email *</label>
                                    <input className="glass-input" type="email" placeholder="name@jbmgroup.com" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                </div>
                                <div className="ap-form-group">
                                    <label className="ap-form-label">Temporary Password *</label>
                                    <input className="glass-input" type="password" placeholder="Set a secure temporary password" required value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                                    <small style={{ color: "var(--text-tertiary)", marginTop: "4px", display: "block" }}>The user should change this after first login.</small>
                                </div>
                                <div className="ap-form-row">
                                    <div className="ap-form-group">
                                        <label className="ap-form-label">Employee Code *</label>
                                        <input className="glass-input" placeholder="e.g. JBM1234" required value={formData.employeeCode} onChange={e => setFormData({ ...formData, employeeCode: e.target.value })} />
                                    </div>
                                    <div className="ap-form-group">
                                        <label className="ap-form-label">Plant / Location *</label>
                                        <input className="glass-input" placeholder="e.g. Plant A, Faridabad" required value={formData.plant} onChange={e => setFormData({ ...formData, plant: e.target.value })} />
                                    </div>
                                </div>
                                <div className="ap-form-group">
                                    <label className="ap-form-label">Assign Role *</label>
                                    <select className="glass-input" style={{ width: "100%" }} value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                                        <option value="manager">Level 1 Manager</option>
                                        <option value="senior-manager">Level 2 Senior Manager</option>
                                        <option value="approver">Level 3 Approver</option>
                                        <option value="admin">Administrator</option>
                                    </select>
                                </div>
                            </form>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                            <button type="submit" form="create-user-form" className="btn-primary">Create Account</button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default AdminPanel;
