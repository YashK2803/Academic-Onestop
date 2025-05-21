// backend/models/timetable.js
const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
  classId: { type: String, required: true }, // e.g., "BTech-CSE-2022"
  schedule: [
    {
      day: { type: String, required: true }, // e.g., "Monday"
      slots: [
        {
          startTime: String,
          endTime: String,
          subject: String,
          teacher: String,
          room: String
        }
      ]
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Timetable', timetableSchema);
