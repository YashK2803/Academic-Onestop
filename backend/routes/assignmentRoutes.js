// backend/routes/assignmentRoutes.js
const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Create assignment (teacher)
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['teacher']),
  assignmentController.createAssignment
);

// Submit assignment (student)
router.post(
  '/submit',
  authMiddleware,
  roleMiddleware(['student']),
  assignmentController.submitAssignment
);

// Get assignments for a class (student/teacher/admin)
router.get(
  '/class/:classId',
  authMiddleware,
  roleMiddleware(['student', 'teacher', 'admin']),
  assignmentController.getAssignments
);

// Get all assignments (admin)
router.get(
  '/all',
  authMiddleware,
  roleMiddleware(['admin']),
  assignmentController.getAllAssignments
);

module.exports = router;
