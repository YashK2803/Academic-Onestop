// backend/controllers/gradesController.js
const Grades = require('../models/grades');

// Add or update grade (teacher/admin)
exports.addOrUpdateGrade = async (req, res) => {
  const { studentId, course, grade, semester } = req.body;
  let record = await Grades.findOne({ studentId, course, semester });
  if (record) {
    record.grade = grade;
    await record.save();
    return res.json({ message: 'Grade updated' });
  }
  record = new Grades({ studentId, course, grade, semester });
  await record.save();
  res.json({ message: 'Grade added' });
};

// Get grades for a student (student/teacher/admin)
exports.getGrades = async (req, res) => {
  const { studentId } = req.params;
  const records = await Grades.find({ studentId });
  res.json(records);
};

// Get all grades (admin)
exports.getAllGrades = async (req, res) => {
  const records = await Grades.find();
  res.json(records);
};
