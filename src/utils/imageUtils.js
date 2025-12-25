const fs = require('fs');
const path = require('path');

const AppError = require('./appError');

// Create the full URL for the photo
const getImageURL = (req, filename) => {
  if (!filename) return null;
  return `${req.protocol}://${req.get('host')}/uploads/${filename}`;
};

// Delete old image files (if have)
const deleteOldImage = imagePath => {
  if (imagePath && !imagePath.startsWith('http')) {
    const fullPath = path.join('public', imagePath.replace('/uploads/', ''));
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }
};

// Check and create the uploads directory
const ensureUploadsDir = () => {
  const dir = 'public/uploads';
  if (fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

module.exports = { getImageURL, deleteOldImage, ensureUploadsDir };
