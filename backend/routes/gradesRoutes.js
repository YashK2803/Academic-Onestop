// backend/routes/gradesRoutes.js
const express = require('express');
const router = express.Router();
const gradesController = require('../controllers/gradesController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Add or update grade (teacher/admin)
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['teacher', 'admin']),
  gradesController.addOrUpdateGrade
);

// Get grades for a student (student/teacher/admin)
router.get(
  '/student/:studentId',
  authMiddleware,
  roleMiddleware(['student', 'teacher', 'admin']),
  gradesController.getGrades
);

// Get all grades (admin)
router.get(
  '/all',
  authMiddleware,
  roleMiddleware(['admin']),
  gradesController.getAllGrades
);

module.exports = router;
