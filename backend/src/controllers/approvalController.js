const Request = require('../models/Request');
const Approval = require('../models/Approval');
const User = require('../models/User');
const { sendApprovalEmail, sendFinalApprovalEmail, sendRejectionEmail } = require('../utils/emailService');

// Role Level mapping
const roleLevelMap = {
  manager: 1,
  'senior-manager': 2,
  approver: 3,
  admin: 'all' // Added admin to see everything
};

//  GET ALL APPROVALS
exports.getApprovals = async (req, res) => {
  try {
    const approvals = await Approval.find()
      .populate('request', 'title tcodeName overallStatus')
      .populate('approver', 'name email role')
      .sort({ actionTakenAt: -1 });

    res.json({
      success: true,
      count: approvals.length,
      approvals
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//  GET PENDING 
exports.getPendingApprovals = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    const userLevel = roleLevelMap[user.role];

    if (!userLevel) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to view approvals"
      });
    }

    const query = user.role === 'admin'
      ? { overallStatus: { $in: ['level1_pending', 'level2_pending', 'level3_pending'] } }
      : { overallStatus: `level${userLevel}_pending` };

    const requests = await Request.find(query).populate("requestedBy", "name email");

    res.json({
      success: true,
      count: requests.length,
      requests
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//  APPROVE 
exports.approveRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { comments } = req.body;

    const user = await User.findById(req.user.id);
    const userLevel = roleLevelMap[user.role];

    if (!userLevel) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to approve"
      });
    }

    const request = await Request.findById(requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found"
      });
    }

    if (request.overallStatus !== `level${userLevel}_pending`) {
      return res.status(400).json({
        success: false,
        message: "Request is not pending at your level"
      });
    }

    // Update current level
    const levelKey = `level${userLevel}`;
    request.approvalWorkflow[levelKey].status = "approved";
    request.approvalWorkflow[levelKey].approvedAt = new Date();
    request.approvalWorkflow[levelKey].comments = comments || "";

    // Move to next level or final
    if (userLevel === 3) {
      request.overallStatus = "approved";
    } else {
      request.overallStatus = `level${userLevel + 1}_pending`;
    }

    await request.save();

    // Send emails based on level
    if (userLevel === 3) {
      // Final approval - email original requester
      const requester = await User.findById(request.requestedBy);
      if (requester && requester.email) {
        await sendFinalApprovalEmail(requester.email, request);
      }
    } else {
      // Elevated to next step - email next manager
      const nextRole = userLevel === 1 ? 'senior-manager' : 'approver';
      const nextManager = await User.findOne({ role: nextRole });
      if (nextManager && nextManager.email) {
        await sendApprovalEmail(nextManager, request, userLevel + 1);
      }
    }

    await Approval.create({
      request: requestId,
      approvalLevel: userLevel,
      approver: user._id,
      status: "approved",
      comments: comments || "",
      actionTakenAt: new Date()
    });

    res.json({
      success: true,
      message: "Request approved successfully",
      request
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//  REJECT 
exports.rejectRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { comments } = req.body;

    const user = await User.findById(req.user.id);
    const userLevel = roleLevelMap[user.role];

    if (!userLevel) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to reject"
      });
    }

    const request = await Request.findById(requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found"
      });
    }

    const levelKey = `level${userLevel}`;

    request.approvalWorkflow[levelKey].status = "rejected";
    request.approvalWorkflow[levelKey].approvedAt = new Date();
    request.approvalWorkflow[levelKey].comments = comments || "";

    request.overallStatus = "rejected";
    request.rejectionReason = comments || "Rejected";

    await request.save();

    // Send rejection email to original requester
    const requester = await User.findById(request.requestedBy);
    if (requester && requester.email) {
      await sendRejectionEmail(requester.email, request);
    }

    await Approval.create({
      request: requestId,
      approvalLevel: userLevel,
      approver: user._id,
      status: "rejected",
      comments: comments || "",
      actionTakenAt: new Date()
    });

    res.json({
      success: true,
      message: "Request rejected successfully",
      request
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//  GET APPROVAL HISTORY
exports.getApprovalHistory = async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await Request.findById(requestId)
      .populate('requestedBy', 'name email');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found"
      });
    }

    const approvals = await Approval.find({ request: requestId })
      .populate('approver', 'name email role')
      .sort({ actionTakenAt: 1 });

    res.json({
      success: true,
      request,
      approvals,
      count: approvals.length
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//  GET MANAGER DASHBOARD STATS
exports.getManagerDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const userLevel = roleLevelMap[user.role];

    if (!userLevel) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to view dashboard"
      });
    }

    const query = user.role === 'admin'
      ? { overallStatus: { $in: ['level1_pending', 'level2_pending', 'level3_pending'] } }
      : { overallStatus: `level${userLevel}_pending` };

    const pendingCount = await Request.countDocuments(query);

    const approvedCount = await Request.countDocuments({
      overallStatus: 'approved'
    });

    const rejectedCount = await Request.countDocuments({
      overallStatus: 'rejected'
    });

    const approvalStats = await Approval.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      dashboard: {
        pendingCount,
        approvedCount,
        rejectedCount,
        approvalStats
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//  QUICK ACTION EMAIL WEBHOOK
exports.quickAction = async (req, res) => {
  try {
    const { token } = req.params;
    const jwt = require('jsonwebtoken');
    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
    } catch (err) {
      return res.status(401).send('<h1>Link Expired or Invalid</h1><p>Please log in to the portal to manage your approvals.</p>');
    }

    const { requestId, managerId, action, level } = decoded;

    const request = global.MOCK_DB ? global.MOCK_DB.requests.find(r => r._id === requestId) : await Request.findById(requestId);

    if (!request) {
      return res.status(404).send('<h1>Request Not Found</h1>');
    }

    if (request.overallStatus !== `level${level}_pending`) {
      return res.status(400).send('<h1>Action Failed</h1><p>This request has already been processed or is not pending at your level.</p>');
    }

    const levelKey = `level${level}`;
    const dateNow = new Date();

    if (action === 'approve') {
      request.approvalWorkflow[levelKey].status = 'approved';
      request.approvalWorkflow[levelKey].approvedAt = dateNow;
      request.approvalWorkflow[levelKey].comments = "Quick Approved via Email";

      if (level === 3) {
        request.overallStatus = "approved";

        // Email original requester
        const requester = global.MOCK_DB ? global.MOCK_DB.users.find(u => u._id === request.requestedBy || u.id === request.requestedBy) : await User.findById(request.requestedBy);
        if (requester && requester.email) await sendFinalApprovalEmail(requester.email, request);
      } else {
        request.overallStatus = `level${level + 1}_pending`;

        // Email next manager
        const nextRole = level === 1 ? 'senior-manager' : 'approver';
        const nextManager = global.MOCK_DB ? global.MOCK_DB.users.find(u => u.role === nextRole) : await User.findOne({ role: nextRole });
        if (nextManager && nextManager.email) await sendApprovalEmail(nextManager, request, level + 1);
      }
    } else if (action === 'reject') {
      request.approvalWorkflow[levelKey].status = 'rejected';
      request.approvalWorkflow[levelKey].approvedAt = dateNow;
      request.approvalWorkflow[levelKey].comments = "Quick Rejected via Email";

      request.overallStatus = "rejected";
      request.rejectionReason = "Quick Rejected via Email Link";

      // Email original requester
      const requester = global.MOCK_DB ? global.MOCK_DB.users.find(u => u._id === request.requestedBy || u.id === request.requestedBy) : await User.findById(request.requestedBy);
      if (requester && requester.email) await sendRejectionEmail(requester.email, request);
    }

    if (!global.MOCK_DB) await request.save();

    // Send visual HTML response directly to browser
    const color = action === 'approve' ? '#28a745' : '#dc3545';
    const textContext = action === 'approve' ? 'Successfully Approved!' : 'Request Rejected.';

    res.send(`
      <div style="font-family: sans-serif; text-align: center; margin-top: 50px;">
        <h1 style="color: ${color};">${textContext}</h1>
        <p>Your action has been recorded in the system.</p>
        <p>You may now close this tab.</p>
      </div>
    `);

  } catch (error) {
    res.status(500).send('<h1>Server Error</h1><p>Could not process your quick action request.</p>');
  }
};