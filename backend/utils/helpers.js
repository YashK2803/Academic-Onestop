// backend/utils/helpers.js

const crypto = require('crypto');

// Generate a random string (e.g., for tokens, filenames)
function generateRandomString(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

// Format date as YYYY-MM-DD
function formatDate(date) {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

// Capitalize the first letter of a string
function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = {
  generateRandomString,
  formatDate,
  capitalize,
};
