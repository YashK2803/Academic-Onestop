// backend/routes/financeRoutes.js
const express = require('express');
const router = express.Router();
const financeController = require('../controllers/financeController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Record payment (student/admin)
router.post(
  '/record',
  authMiddleware,
  roleMiddleware(['student', 'admin']),
  financeController.recordPayment
);

// Get payment history for a user (student/admin)
router.get(
  '/user/:userId',
  authMiddleware,
  roleMiddleware(['student', 'admin']),
  financeController.getPayments
);

// Get all payments (admin)
router.get(
  '/all',
  authMiddleware,
  roleMiddleware(['admin']),
  financeController.getAllPayments
);

module.exports = router;
