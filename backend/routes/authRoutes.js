const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');



// Render login page
router.get('/login', (req, res) => {
  res.render('auth/login', { user: null, error: null });
});

// Render register page
router.get('/register', (req, res) => {
  res.render('auth/register', { user: null, error: null });
});

// Handle login form submission
router.post('/login', authController.login);

// Handle registration form submission
router.post('/register', authController.register);

// Protected route: user profile
router.get('/profile', authMiddleware, authController.profile);

router.get('/logout', authController.logout);

module.exports = router;
