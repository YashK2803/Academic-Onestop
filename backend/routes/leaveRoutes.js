// backend/routes/leaveRoutes.js
const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Apply for leave (student/teacher)
router.post(
  '/apply',
  authMiddleware,
  roleMiddleware(['student', 'teacher']),
  leaveController.applyLeave
);

// Approve or reject leave (admin/teacher)
router.patch(
  '/update-status',
  authMiddleware,
  roleMiddleware(['admin', 'teacher']),
  leaveController.updateLeaveStatus
);

// Get leave applications for a user (student/teacher/admin)
router.get(
  '/user/:userId',
  authMiddleware,
  roleMiddleware(['student', 'teacher', 'admin']),
  leaveController.getLeaves
);

// Get all leave applications (admin)
router.get(
  '/all',
  authMiddleware,
  roleMiddleware(['admin']),
  leaveController.getAllLeaves
);

module.exports = router;
