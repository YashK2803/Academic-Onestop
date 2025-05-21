// backend/controllers/leaveController.js
const Leave = require('../models/leave');

// Apply for leave (student/teacher)
exports.applyLeave = async (req, res) => {
  const { userId, from, to, reason, type } = req.body;
  const leave = new Leave({ userId, from, to, reason, type, status: 'Pending' });
  await leave.save();
  res.json({ message: 'Leave application submitted' });
};

// Approve or reject leave (admin/teacher)
exports.updateLeaveStatus = async (req, res) => {
  const { leaveId, status } = req.body;
  const leave = await Leave.findById(leaveId);
  if (!leave) return res.status(404).json({ message: 'Leave not found' });
  leave.status = status;
  await leave.save();
  res.json({ message: `Leave ${status}` });
};

// Get leave applications for a user (student/teacher/admin)
exports.getLeaves = async (req, res) => {
  const { userId } = req.params;
  const leaves = await Leave.find({ userId });
  res.json(leaves);
};

// Get all leave applications (admin)
exports.getAllLeaves = async (req, res) => {
  const leaves = await Leave.find();
  res.json(leaves);
};
