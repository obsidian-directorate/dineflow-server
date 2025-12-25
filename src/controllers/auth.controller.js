const User = require('../models/User');
const AppError = require('../utils/appError');
const { generateToken } = require('../utils/jwt');
const { hashPassword, comparePassword } = require('../utils/bcrypt');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, phone, password, role = 'customer' } = req.body;

    // Check is user exists
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return next(new AppError('Email hoặc số điện thoại đã được sử dụng', 400));
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      phone,
      password: await hashPassword(password),
      role: ['customer', 'owner'].includes(role) ? role : 'customer',
    });

    // Create token
    const token = generateToken(user._id, user.role);

    // Hide password in response
    user.password = undefined;

    res.status(201).json({
      status: 'success',
      token,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Check if email and password are provided
    if (!email || !password) {
      return next(new AppError('Vui lòng cung cấp email và mật khẩu', 400));
    }

    // 2. Find user and check
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await comparePassword(password, user.password))) {
      return next(new AppError('Email hoặc mật khẩu không chính xác', 401));
    }

    // 3. Create token
    const token = generateToken(user._id, user.role);
    user.password = undefined;

    res.status(200).json({
      status: 'success',
      token,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      status: 'success',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user (client-side token deletion)
// @route   POST /api/auth/logout
// @access  Private
const logout = (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Đăng xuất thành công',
  });
};

module.exports = { register, login, getProfile, logout };
