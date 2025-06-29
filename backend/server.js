// backend/server.js

const app = require('./app');
const { appConfig } = require('./config');

const PORT = appConfig.port || 3000;

app.listen(PORT, () => {
  console.log(`Academic OneStop backend server running on port ${PORT}`);
});
