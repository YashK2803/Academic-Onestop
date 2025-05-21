// backend/models/leave.js
const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  from: { type: Date, required: true },
  to: { type: Date, required: true },
  reason: { type: String, required: true },
  type: { type: String, enum: ['Medical', 'Academic', 'Personal'], required: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  appliedAt: { type: Date, default: Date.now },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('Leave', leaveSchema);
