// backend/controllers/attendanceController.js
const Attendance = require('../models/attendance');

// Mark attendance (teacher/admin)
exports.markAttendance = async (req, res) => {
  const { studentId, date, status } = req.body;
  const attendance = new Attendance({ studentId, date, status });
  await attendance.save();
  res.json({ message: 'Attendance marked' });
};

// Get attendance for a student (student/teacher/admin)
exports.getAttendance = async (req, res) => {
  const { studentId } = req.params;
  const records = await Attendance.find({ studentId });
  res.json(records);
};

// Get all attendance (admin)
exports.getAllAttendance = async (req, res) => {
  const records = await Attendance.find();
  res.json(records);
};
