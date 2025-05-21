// backend/controllers/communicationController.js
const Message = require('../models/message');

// Send message (any user)
exports.sendMessage = async (req, res) => {
  const { from, to, content } = req.body;
  const message = new Message({ from, to, content, sentAt: new Date() });
  await message.save();
  res.json({ message: 'Message sent' });
};

// Get messages for a user (any user)
exports.getMessages = async (req, res) => {
  const { userId } = req.params;
  const messages = await Message.find({ $or: [{ from: userId }, { to: userId }] });
  res.json(messages);
};

// Get all messages (admin)
exports.getAllMessages = async (req, res) => {
  const messages = await Message.find();
  res.json(messages);
};
