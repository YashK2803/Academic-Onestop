// backend/controllers/timetableController.js
const Timetable = require('../models/timetable');

// Create or update timetable (admin/teacher)
exports.createOrUpdateTimetable = async (req, res) => {
  const { classId, schedule } = req.body;
  let timetable = await Timetable.findOne({ classId });
  if (timetable) {
    timetable.schedule = schedule;
    await timetable.save();
    return res.json({ message: 'Timetable updated' });
  }
  timetable = new Timetable({ classId, schedule });
  await timetable.save();
  res.json({ message: 'Timetable created' });
};

// Get timetable for a class (student/teacher/admin)
exports.getTimetable = async (req, res) => {
  const { classId } = req.params;
  const timetable = await Timetable.findOne({ classId });
  res.json(timetable);
};

// Get all timetables (admin)
exports.getAllTimetables = async (req, res) => {
  const timetables = await Timetable.find();
  res.json(timetables);
};
