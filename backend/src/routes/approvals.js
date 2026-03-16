const express = require('express');
const router = express.Router();

const { authenticate, authorize } = require('../middleware/authmiddleware');
const ApprovalController = require('../controllers/approvalController');

// Quick Action - (Email Link Webhook)
router.get('/quick-action/:token', ApprovalController.quickAction);

// Get all approvals (protected)
router.get(
  '/',
  authenticate,
  authorize('manager', 'senior-manager', 'approver', 'admin'),
  ApprovalController.getApprovals
);

// Pending approvals
router.get(
  '/pending',
  authenticate,
  authorize('manager', 'senior-manager', 'approver', 'admin'),
  ApprovalController.getPendingApprovals
);

// Approval history
router.get(
  '/history/:requestId',
  authenticate,
  authorize('manager', 'senior-manager', 'approver', 'admin'),
  ApprovalController.getApprovalHistory
);

// Approve request
router.post(
  '/:requestId/level/:level/approve',
  authenticate,
  authorize('manager', 'senior-manager', 'approver', 'admin'),
  ApprovalController.approveRequest
);

// Reject request
router.post(
  '/:requestId/level/:level/reject',
  authenticate,
  authorize('manager', 'senior-manager', 'approver', 'admin'),
  ApprovalController.rejectRequest
);

// Dashboard
router.get(
  '/dashboard/stats',
  authenticate,
  authorize('manager', 'senior-manager', 'approver', 'admin'),
  ApprovalController.getManagerDashboard
);

module.exports = router;