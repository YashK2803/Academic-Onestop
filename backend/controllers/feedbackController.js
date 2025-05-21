// backend/controllers/feedbackController.js
const Feedback = require('../models/feedback');

// Submit feedback (student/teacher)
exports.submitFeedback = async (req, res) => {
  const { userId, courseId, instructorId, rating, comments } = req.body;
  const feedback = new Feedback({ userId, courseId, instructorId, rating, comments, date: new Date() });
  await feedback.save();
  res.json({ message: 'Feedback submitted' });
};

// Get feedback for a course/instructor (admin/teacher)
exports.getFeedback = async (req, res) => {
  const { courseId, instructorId } = req.query;
  const filter = {};
  if (courseId) filter.courseId = courseId;
  if (instructorId) filter.instructorId = instructorId;
  const feedbacks = await Feedback.find(filter);
  res.json(feedbacks);
};

// Get all feedback (admin)
exports.getAllFeedback = async (req, res) => {
  const feedbacks = await Feedback.find();
  res.json(feedbacks);
};
