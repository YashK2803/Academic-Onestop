// backend/controllers/financeController.js
const Finance = require('../models/finance');

// Record payment (student/admin)
exports.recordPayment = async (req, res) => {
  const { userId, amount, method, description } = req.body;
  const payment = new Finance({ userId, amount, method, description, date: new Date() });
  await payment.save();
  res.json({ message: 'Payment recorded' });
};

// Get payment history for a user (student/admin)
exports.getPayments = async (req, res) => {
  const { userId } = req.params;
  const payments = await Finance.find({ userId });
  res.json(payments);
};

// Get all payments (admin)
exports.getAllPayments = async (req, res) => {
  const payments = await Finance.find();
  res.json(payments);
};
