// backend/models/attendance.js
const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ['Present', 'Absent', 'On Leave'], required: true },
  course: { type: String },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // teacher/admin
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Attendance', attendanceSchema);
