const Restaurant = require('../models/Restaurant');
const AppError = require('../utils/appError');

// @desc    Create restaurant
// @route   POST /api/restaurants
// @access  Private (Owner/Admin)
const createRestaurant = async (req, res, next) => {
  try {
    // Add owner_id from logged in user
    const restaurantData = {
      ...req.body,
      owner_id: req.user.role === 'admin' ? req.body.owner_id || req.user.id : req.user.id,
    };

    const restaurant = await Restaurant.create(restaurantData);

    res.status(201).json({
      status: 'success',
      data: { restaurant },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all restaurants (with filtering)
// @route   GET /api/restaurants
// @access  Public
const getAllRestaurants = async (req, res, next) => {
  try {
    // Basic filtering
    const queryObj = { ...req.query };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(el => delete queryObj[el]);

    // Advanced filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

    let query = Restaurant.find(JSON.parse(queryStr));

    // Sorting
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 1;
    const skip = (page - 1) * limit;

    const restaurants = await query;
    const total = await Restaurant.countDocuments(JSON.parse(queryStr));

    res.status(200).json({
      status: 'success',
      results: restaurants.length,
      total,
      page,
      data: { restaurants },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single restaurant
// @route   GET /api/restaurants/:id
// @accees  Public
const getRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return next(new AppError('Không tìm thấy nhà hàng', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { restaurant },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update restaurant
// @route   PUT /api/restaurants/:id
// @access  Private (Owner/Admin)
const updateRestaurant = async (req, res, next) => {
  try {
    // Find restaurant
    let restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return next(new AppError('Không tìm thấy nhà hàng', 404));
    }

    // Check role (owner or admin)
    if (req.user.role !== 'admin' && restaurant.owner_id.toString() !== req.user.id) {
      return next(new AppError('Bạn không có quyền chỉnh sửa nhà hàng này', 403));
    }

    // Update
    restaurant = await Restaurant.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: 'success',
      data: { restaurant },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update floor plan
// @route   PUT /api/restaurants/:id/floorplan
// @access  Private (Owner)
const updateFloorPlan = async (req, res, next) => {
  try {
    const { zones } = req.body;

    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return next(new AppError('Không tìm thấy nhà hàng', 404));
    }

    // Only restaurant owner can update the floor plan
    if (restaurant.owner_id.toString() !== req.user.id) {
      return next(new AppError('Chỉ chủ nhà hàng mới được cập nhật sơ đồ', 403));
    }

    restaurant.zones = zones;
    await restaurant.save();

    res.status(200).json({
      status: 'success',
      data: { restaurant },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete restaurant
// @route   DELETE /api/restaurant/:id
// @access  Private (Owner/Admin)
const deleteRestaurant = async (re, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return next(new AppError('Không tìm thấy nhà hàng', 404));
    }

    // Check role
    if (req.user.role !== 'admin' && restaurant.owner_id.toString() !== req.user.id) {
      return next(new AppError('Bạn không có quyền xóa nhà hàng này', 403));
    }

    await Restaurant.findByIdAndDelete(req.params.id);

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my restaurants (for owner)
// @route   GET /api/restaurants/my-restaurants
// @access  Private (Owner)
const getMyRestaurants = async (req, res, next) => {
  try {
    const restaurants = await Restaurant.find({ owner_id: req.user.id });

    res.status(200).json({
      status: 'success',
      results: restaurants.length,
      data: { restaurants },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRestaurant,
  getAllRestaurants,
  getRestaurant,
  updateRestaurant,
  updateFloorPlan,
  deleteRestaurant,
  getMyRestaurants,
};
