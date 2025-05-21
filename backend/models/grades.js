// backend/models/grades.js
const mongoose = require('mongoose');

const gradesSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: String, required: true },
  semester: { type: String, required: true },
  grade: { type: String, required: true },
  gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Grades', gradesSchema);
