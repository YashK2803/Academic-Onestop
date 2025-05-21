// backend/routes/feedbackRoutes.js
const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Submit feedback (student/teacher)
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['student', 'teacher']),
  feedbackController.submitFeedback
);

// Get feedback for a course/instructor (admin/teacher)
router.get(
  '/',
  authMiddleware,
  roleMiddleware(['admin', 'teacher']),
  feedbackController.getFeedback
);

// Get all feedback (admin)
router.get(
  '/all',
  authMiddleware,
  roleMiddleware(['admin']),
  feedbackController.getAllFeedback
);

module.exports = router;
