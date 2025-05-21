// backend/routes/timetableRoutes.js
const express = require('express');
const router = express.Router();
const timetableController = require('../controllers/timetableController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Create or update timetable (admin/teacher)
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['admin', 'teacher']),
  timetableController.createOrUpdateTimetable
);

// Get timetable for a class (student/teacher/admin)
router.get(
  '/class/:classId',
  authMiddleware,
  roleMiddleware(['student', 'teacher', 'admin']),
  timetableController.getTimetable
);

// Get all timetables (admin)
router.get(
  '/all',
  authMiddleware,
  roleMiddleware(['admin']),
  timetableController.getAllTimetables
);

module.exports = router;
