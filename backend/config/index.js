// backend/config/index.js
const appConfig = require('./app');
const dbConnect = require('./db');
const keys = require('./keys');

module.exports = {
  appConfig,
  dbConnect,
  keys,
};
