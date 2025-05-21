// backend/models/feedback.js
const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: String },
  instructorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rating: { type: Number, min: 1, max: 5 },
  comments: String,
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Feedback', feedbackSchema);
