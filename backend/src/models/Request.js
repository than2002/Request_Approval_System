const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({

  //  BASIC INFO 
  title: {
    type: String,
    required: true,
    trim: true,
  },

  description: {
    type: String,
    trim: true,
  },

  requestType: {
    type: String,
    enum: ['tcode', 'leave', 'budget', 'access', 'other'],
    required: true,
  },

  //  T-CODE FIELDS 
  tcodeName: {
    type: String,
    required: function () {
      return this.requestType === 'tcode';
    },
  },

  tcodeDescription: String,

  businessJustification: {
    type: String,
    required: function () {
      return this.requestType === 'tcode';
    },
  },

  //  USER INFO 
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  //  APPROVAL WORKFLOW
  approvalWorkflow: {

    level1: {
      manager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
      },
      approvedAt: Date,
      comments: String,
    },

    level2: {
      manager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
      },
      approvedAt: Date,
      comments: String,
    },

    level3: {
      manager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
      },
      approvedAt: Date,
      comments: String,
    },

  },

  // OVERALL STATUS 
  overallStatus: {
    type: String,
    enum: [
      'draft',
      'level1_pending',
      'level2_pending',
      'level3_pending',
      'approved',
      'rejected'
    ],
    default: 'draft',
  },

  /* priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  }, */

  rejectionReason: String,

  attachments: [
    {
      fileName: String,
      filePath: String,
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],

  dueDate: Date,

}, { timestamps: true });


//  INDEXES (Performance Boost) 
requestSchema.index({ requestedBy: 1 });
requestSchema.index({ overallStatus: 1 });
requestSchema.index({ 'approvalWorkflow.level1.manager': 1 });
requestSchema.index({ 'approvalWorkflow.level2.manager': 1 });
requestSchema.index({ 'approvalWorkflow.level3.manager': 1 });


module.exports = mongoose.model('Request', requestSchema);