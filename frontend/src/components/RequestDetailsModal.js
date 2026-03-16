import React from 'react';

const RequestDetailsModal = ({ isOpen, onClose, request }) => {
  if (!isOpen || !request) return null;

  const formatStatus = (status) => {
    if (status === "level1_pending") return "Pending (Level 1)";
    if (status === "level2_pending") return "Pending (Level 2)";
    if (status === "level3_pending") return "Pending (Level 3)";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  /* const getPriorityColor = (priority) => {
    if (priority === "high") return "var(--status-rejected)";
    if (priority === "medium") return "var(--status-pending)";
    return "var(--status-approved)";
  }; */

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ margin: 0 }}>Request Details</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div style={{ display: 'flex', gap: '20px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <div className="detail-row" style={{ flex: '1 1 200px' }}>
              <span className="detail-label">T-Code Name</span>
              <span className="detail-value" style={{ color: 'var(--accent-color)', fontSize: '1.2rem' }}>{request.tcodeName}</span>
            </div>
            <div className="detail-row" style={{ flex: '1 1 200px' }}>
              <span className="detail-label">Status</span>
              <span className={`status-badge ${request.overallStatus.includes('pending') ? 'pending' : request.overallStatus}`}>
                {formatStatus(request.overallStatus)}
              </span>
            </div>
          </div>

          <div className="detail-row">
            <span className="detail-label">Title</span>
            <span className="detail-value">{request.title}</span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Business Justification</span>
            <span className="detail-value" style={{ lineHeight: '1.6', fontWeight: '400' }}>
              {request.businessJustification}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '10px' }}>
            <div className="detail-row">
              <span className="detail-label">Requested By</span>
              <span className="detail-value">{request.requestedBy?.name || 'Unknown'}</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{request.requestedBy?.email}</span>
            </div>
            {/* <div className="detail-row">
              <span className="detail-label">Priority</span>
              <span className="detail-value" style={{ color: getPriorityColor(request.priority) }}>
                {request.priority?.toUpperCase()}
              </span>
            </div> */}
            <div className="detail-row">
              <span className="detail-label">Date Submitted</span>
              <span className="detail-value">{new Date(request.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-primary" onClick={onClose} style={{ background: 'var(--text-muted)', boxShadow: 'none' }}>
            Close
          </button>
          {(['manager', 'senior-manager', 'approver', 'admin'].includes(request.currentUserRole)) && request.overallStatus.includes('pending') && (
            <button className="btn-primary" onClick={() => window.location.href = '/approvals'}>
              Go to Approvals
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestDetailsModal;
