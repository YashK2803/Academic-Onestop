// backend/utils/fileUpload.js

const path = require('path');
const fs = require('fs');

// Save an uploaded file to the uploads directory
async function saveFile(file, filename) {
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
  }
  const filePath = path.join(uploadsDir, filename);
  await fs.promises.writeFile(filePath, file);
  return filePath;
}

module.exports = {
  saveFile,
};
