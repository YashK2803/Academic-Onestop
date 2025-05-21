// backend/controllers/authController.js

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// User login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Query the user by email
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];

    if (!user) {
      return res.render('auth/login', {
        user: null,
        error: 'Invalid email or password'
      });
    }

    // Compare password with hashed password in database
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.render('auth/login', {
        user: null,
        error: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Store token in cookie for future requests
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: 'lax', // Allows cookie to be sent with top-level navigations
      // secure: process.env.NODE_ENV === 'production' // Uncomment for HTTPS in production
    });

    // Redirect based on user role
    switch (user.role) {
      case 'student':
        return res.redirect('/student/dashboard');
      case 'teacher':
        return res.redirect('/teacher/dashboard');
      case 'admin':
        return res.redirect('/admin/dashboard');
      default:
        return res.redirect('/');
    }
  } catch (err) {
    console.error('Login error:', err);
    return res.render('auth/login', {
      user: null,
      error: 'Server error during login'
    });
  }
};

// User registration
exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    // Check if user already exists
    const [existingUsers] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    if (existingUsers.length > 0) {
      return res.render('auth/register', {
        user: null,
        error: 'User with this email already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert new user into MySQL database
    await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, role]
    );

    // Redirect to login page after successful registration
    return res.render('auth/login', {
      user: null,
      error: null,
      success: 'Registration successful! Please login.'
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.render('auth/register', {
      user: null,
      error: 'Server error during registration'
    });
  }
};

// Get current user profile
exports.profile = async (req, res) => {
  try {
    // Get user without password field using MySQL
    const [rows] = await pool.query(
      'SELECT id, name, email, role, department, enrollmentNo, employeeId, createdAt FROM users WHERE id = ?',
      [req.user.id]
    );
    const user = rows[0];
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ message: 'Server error while fetching profile' });
  }
};

// Logout
exports.logout = (req, res) => {
  res.clearCookie('token'); // Clear the JWT cookie
  res.redirect('/auth/login'); // Redirect to login page
};
