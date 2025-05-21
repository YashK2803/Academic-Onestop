// backend/models/finance.js
const mongoose = require('mongoose');

const financeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  method: { type: String, enum: ['Online', 'Cash', 'Cheque'], required: true },
  description: String,
  date: { type: Date, default: Date.now },
  receiptUrl: String
});

module.exports = mongoose.model('Finance', financeSchema);
