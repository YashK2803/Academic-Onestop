// backend/models/assignment.js
const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  dueDate: { type: Date, required: true },
  classId: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  submissions: [
    {
      studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      submission: String, // URL or text
      submittedAt: Date,
      grade: String,
      feedback: String
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Assignment', assignmentSchema);
