// backend/config/keys.js
module.exports = {
    jwtSecret: process.env.JWT_SECRET || 'supersecretkey',
    aiApiKey: process.env.AI_API_KEY || '',
    resourceHubKey: process.env.RESOURCE_HUB_KEY || '',
  };
  