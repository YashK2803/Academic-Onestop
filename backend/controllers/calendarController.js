// backend/controllers/calendarController.js
const Calendar = require('../models/calendar');

// Create event (admin/teacher)
exports.createEvent = async (req, res) => {
  const { title, date, description } = req.body;
  const event = new Calendar({ title, date, description });
  await event.save();
  res.json({ message: 'Event created' });
};

// Get events (any user)
exports.getEvents = async (req, res) => {
  const events = await Calendar.find();
  res.json(events);
};
