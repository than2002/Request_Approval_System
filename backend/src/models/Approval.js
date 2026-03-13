const mongoose = require('mongoose');

const approvalSchema = new mongoose.Schema({
  request: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Request',
    required: true,
  },

  approvalLevel: {
    type: Number,
    enum: [1, 2, 3],
    required: true,
  },

  approver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },

  comments: String,

  assignedAt: {
    type: Date,
    default: Date.now,
  },

  actionTakenAt: Date,
  viewedAt: Date

}, { timestamps: true });

approvalSchema.index({ request: 1 });
approvalSchema.index({ approver: 1 });
approvalSchema.index({ approvalLevel: 1 });

module.exports = mongoose.model('Approval', approvalSchema);