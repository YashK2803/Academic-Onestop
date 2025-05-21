// backend/routes/calendarRoutes.js
const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendarController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Create event (admin/teacher)
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['admin', 'teacher']),
  calendarController.createEvent
);

// Get events (any user)
router.get(
  '/',
  authMiddleware,
  roleMiddleware(['student', 'teacher', 'admin']),
  calendarController.getEvents
);

module.exports = router;
