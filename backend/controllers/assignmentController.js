// backend/controllers/assignmentController.js
const Assignment = require('../models/assignment');

// Create assignment (teacher)
exports.createAssignment = async (req, res) => {
  const { title, description, dueDate, classId } = req.body;
  const assignment = new Assignment({ title, description, dueDate, classId });
  await assignment.save();
  res.json({ message: 'Assignment created' });
};

// Submit assignment (student)
exports.submitAssignment = async (req, res) => {
  const { assignmentId, studentId, submission } = req.body;
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
  assignment.submissions.push({ studentId, submission, submittedAt: new Date() });
  await assignment.save();
  res.json({ message: 'Assignment submitted' });
};

// Get assignments for a class (student/teacher/admin)
exports.getAssignments = async (req, res) => {
  const { classId } = req.params;
  const assignments = await Assignment.find({ classId });
  res.json(assignments);
};

// Get all assignments (admin)
exports.getAllAssignments = async (req, res) => {
  const assignments = await Assignment.find();
  res.json(assignments);
};
