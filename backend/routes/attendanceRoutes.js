// backend/routes/attendanceRoutes.js
const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Mark attendance (teacher/admin)
router.post(
  '/mark',
  authMiddleware,
  roleMiddleware(['teacher', 'admin']),
  attendanceController.markAttendance
);

// Get attendance for a student (student/teacher/admin)
router.get(
  '/student/:studentId',
  authMiddleware,
  roleMiddleware(['student', 'teacher', 'admin']),
  attendanceController.getAttendance
);

// Get all attendance (admin)
router.get(
  '/all',
  authMiddleware,
  roleMiddleware(['admin']),
  attendanceController.getAllAttendance
);

module.exports = router;
