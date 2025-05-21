// backend/routes/communicationRoutes.js
const express = require('express');
const router = express.Router();
const communicationController = require('../controllers/communicationController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Send message (any user)
router.post(
  '/send',
  authMiddleware,
  roleMiddleware(['student', 'teacher', 'admin']),
  communicationController.sendMessage
);

// Get messages for a user (any user)
router.get(
  '/user/:userId',
  authMiddleware,
  roleMiddleware(['student', 'teacher', 'admin']),
  communicationController.getMessages
);

// Get all messages (admin)
router.get(
  '/all',
  authMiddleware,
  roleMiddleware(['admin']),
  communicationController.getAllMessages
);

module.exports = router;
