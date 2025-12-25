const { getTokenFromHeader, verifyToken } = require('../utils/jwt');
const AppError = require('../utils/appError');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    // 1. Get token
    const token = getTokenFromHeader(req);
    if (!token) {
      return next(new AppError('Không có token. Vui lòng đăng nhập.', 401));
    }

    // 2. Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return next(new AppError('Token không hợp lệ hoặc đã hết hạn.', 401));
    }

    // 3. Check if user exists
    const currentUser = await User.findById(decoded.id).select('-password');
    if (!currentUser) {
      return next(new AppError('Người dùng không còn tồn tại.', 401));
    }

    // 4. Attach user into request
    req.user = currentUser;
    next();
  } catch (error) {
    next(error);
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Bạn không có quyền thực hiện hành động này.', 403));
    }
    next();
  };
};

module.exports = { protect, restrictTo };
