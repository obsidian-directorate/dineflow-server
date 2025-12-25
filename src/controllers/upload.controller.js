const AppError = require('../utils/appError');
const { getImageURL } = require('../utils/imageUtils');

// @desc    Upload single image
// @route   POST /api/upload
// @access  Private
const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('Vui lòng chọn file ảnh', 400));
    }

    const imageURL = getImageURL(req, req.file.filename);

    res.status(200).json({
      status: 'success',
      data: {
        url: imageURL,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload multiple images
// @route   POST /api/upload/multiple
// @access  Private
const uploadMultipleImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next(new AppError('Vui lòng chọn ít nhất 1 file', 400));
    }

    const uploadedFiles = req.files.map(file => ({
      url: getImageURL(req, file.filename),
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
    }));

    res.status(200).json({
      status: 'success',
      count: uploadedFiles.length,
      data: uploadedFiles,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadImage, uploadMultipleImages };
