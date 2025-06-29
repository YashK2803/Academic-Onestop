// backend/utils/jwt.js

const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/keys');

// Sign a JWT token
function signToken(payload, expiresIn = '7d') {
  return jwt.sign(payload, jwtSecret, { expiresIn });
}

// Verify a JWT token
function verifyToken(token) {
  return jwt.verify(token, jwtSecret);
}

module.exports = {
  signToken,
  verifyToken,
};
