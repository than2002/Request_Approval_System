const User = require('../models/User');
const Request = require('../models/Request');
const { sendNewRequestEmail } = require('../utils/emailService');

//  CREATE REQUEST 
exports.createRequest = async (req, res) => {
  try {
    const {
      title,
      description,
      requestType,
      tcodeName,
      tcodeDescription,
      businessJustification,
      priority,
      dueDate
    } = req.body;

    if (!title || !businessJustification) {
      return res.status(400).json({
        success: false,
        message: 'Title and Business Justification are required'
      });
    }

    const effectiveType = requestType || 'tcode';

    // T-Code name is required only when request type is tcode
    if (effectiveType === 'tcode' && !tcodeName) {
      return res.status(400).json({
        success: false,
        message: 'T-Code Name is required for T-Code requests'
      });
    }

    const request = await Request.create({
      title,
      description,
      requestType: effectiveType,
      tcodeName,
      tcodeDescription,
      businessJustification,
      requestedBy: req.user.id,
      priority: priority || 'medium',
      overallStatus: 'draft',
      dueDate
    });

    res.status(201).json({
      success: true,
      message: 'Request created successfully',
      request
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating request',
      error: error.message
    });
  }
};

//  GET USER REQUESTS 
exports.getUserRequests = async (req, res) => {
  try {
    const requests = await Request.find({ requestedBy: req.user.id })
      .populate('requestedBy', 'name email')
      .populate('approvalWorkflow.level1.manager', 'name email')
      .populate('approvalWorkflow.level2.manager', 'name email')
      .populate('approvalWorkflow.level3.manager', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: requests.length,
      requests
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching requests',
      error: error.message
    });
  }
};

//  GET SINGLE REQUEST 
exports.getRequestById = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate('requestedBy', 'name email department')
      .populate('approvalWorkflow.level1.manager', 'name email')
      .populate('approvalWorkflow.level2.manager', 'name email')
      .populate('approvalWorkflow.level3.manager', 'name email');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Authorization check: User must be the owner, or a manager/admin
    const isOwner = request.requestedBy._id.toString() === req.user.id;
    const isPrivileged = ['manager', 'senior-manager', 'approver', 'admin'].includes(req.user.role);

    if (!isOwner && !isPrivileged) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this request'
      });
    }

    res.json({
      success: true,
      request
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching request',
      error: error.message
    });
  }
};

//  UPDATE DRAFT 
exports.updateRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    if (request.requestedBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this request'
      });
    }

    if (request.overallStatus !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Only draft requests can be updated'
      });
    }

    const allowedUpdates = [
      'title', 'description', 'tcodeName', 'tcodeDescription', 
      'businessJustification', 'priority', 'dueDate'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        request[field] = req.body[field];
      }
    });

    await request.save();

    res.json({
      success: true,
      message: 'Request updated successfully',
      request
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating request',
      error: error.message
    });
  }
};

//  SUBMIT REQUEST 
exports.submitRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    if (request.requestedBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to submit this request'
      });
    }

    if (request.overallStatus !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Only draft requests can be submitted'
      });
    }

    //  Assign Managers (Level 1, 2, 3) — only approved & active users
    const level1 = await User.findOne({ role: 'manager', isApproved: true, isActive: true });
    const level2 = await User.findOne({ role: 'senior-manager', isApproved: true, isActive: true });
    const level3 = await User.findOne({ role: 'approver', isApproved: true, isActive: true });

    if (!level1) {
      return res.status(400).json({
        success: false,
        message: 'No active Level 1 Manager (manager role) is configured. Please contact admin.'
      });
    }
    if (!level2) {
      return res.status(400).json({
        success: false,
        message: 'No active Level 2 Senior Manager is configured. Please contact admin.'
      });
    }
    if (!level3) {
      return res.status(400).json({
        success: false,
        message: 'No active Level 3 Approver is configured. Please contact admin.'
      });
    }

    request.approvalWorkflow = {
      level1: {
        manager: level1._id,
        status: 'pending'
      },
      level2: {
        manager: level2._id,
        status: 'pending'
      },
      level3: {
        manager: level3._id,
        status: 'pending'
      }
    };

    request.overallStatus = 'level1_pending';

    await request.save();

    // Send email with Quick Action Links to Level 1 Manager
    if (level1.email) {
      await sendNewRequestEmail(level1, request);
    }

    res.json({
      success: true,
      message: 'Request submitted for approval',
      request
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error submitting request',
      error: error.message
    });
  }
};

//  DELETE DRAFT 
exports.deleteRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    if (request.requestedBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this request'
      });
    }

    if (request.overallStatus !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Only draft requests can be deleted'
      });
    }

    await request.deleteOne();

    res.json({
      success: true,
      message: 'Request deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting request',
      error: error.message
    });
  }
};