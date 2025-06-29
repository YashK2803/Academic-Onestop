// backend/middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// Middleware to verify JWT token and authenticate user
const authMiddleware = async (req, res, next) => {
  let token = null;

  // Check Authorization header for API requests
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Check cookies for browser requests
  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    // For API requests
    if (req.xhr || (req.path && req.path.startsWith('/api/'))) {
      return res.status(401).json({ message: 'Authorization token missing or malformed' });
    }
    // For web requests
    return res.redirect('/auth/login');
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const [rows] = await pool.query(
      'SELECT id, name, email, role, department, enrollmentNo, employeeId, createdAt FROM users WHERE id = ?',
      [decoded.id]
    );
    const user = rows[0];
    if (!user) {
      // For API requests
      if (req.xhr || (req.path && req.path.startsWith('/api/'))) {
        return res.status(401).json({ message: 'User not found' });
      }
      // For web requests
      return res.redirect('/auth/login');
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    // For API requests
    if (req.xhr || (req.path && req.path.startsWith('/api/'))) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    // For web requests
    return res.redirect('/auth/login');
  }
};

module.exports = authMiddleware;