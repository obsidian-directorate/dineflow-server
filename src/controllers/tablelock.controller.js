const TableLock = require('../models/TableLock');
const Restaurant = require('../models/Restaurant');
const AppError = require('../utils/appError');
const { getIO } = require('../sockets/socketServer');
const logger = require('../config/logger');

// @desc    Lock a table temporarily
// @route   POST /api/tables/:tableID/lock
// @access  Private (Customer)
const lockTable = async (req, res, next) => {
  try {
    const { tableID } = req.params;
    const { restaurant_id } = req.body;

    if (!restaurant_id) {
      return next(new AppError('Thiếu restaurant_id', 400));
    }

    // Check if restaurant exists
    const restaurant = await Restaurant.findById(restaurant_id);
    if (!restaurant) {
      return next(new AppError('Nhà hàng không tồn tại', 404));
    }

    // Check if the table exists in the restaurant
    const tableExists = restaurant.zones.some(zone =>
      zone.tables.some(table => table.table_number === tableID)
    );

    if (!tableExists) {
      return next(new AppError('Bàn không tồn tại trong nhà hàng', 404));
    }

    // Check the current lock
    const existingLock = await TableLock.findOne({
      restaurant_id,
      table_id: tableID,
      lock_until: { $gt: new Date() },
    });

    if (existingLock) {
      const timeLeft = Math.ceil((existingLock.lock_until - new Date()) / 1000);
      return next(new AppError(`Bàn đang bị khóa, thử lại sau ${timeLeft} giây`, 423));
    }

    // Create new lock (60 seconds)
    const lockUntil = new Date(Date.now() + 60 * 1000);

    const tableLock = await TableLock.create({
      table_id: tableID,
      restaurant_id,
      lock_until: lockUntil,
      locked_by: req.user.id,
    });

    // Broadcast lock via socket
    try {
      const io = getIO();
      io.to(`restaurant:${restaurant_id}`).emit('table_locked', {
        tableId: tableId,
        lockedBy: req.user.id,
        lockUntil: lockUntil,
        timestamp: new Date(),
      });
    } catch (socketError) {
      logger.error('Socket broadcast error:', socketError);
    }

    res.status(200).json({
      status: 'success',
      data: {
        tableLock,
        lock_until: lockUntil,
        message: 'Bàn đã được khóa tạm thời (60 giây)',
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Release table lock
// @route   DELETE /api/tables/:tableID/lock
// @access  Private (Customer)
const releaseTableLock = async (req, res, next) => {
  try {
    const { tableID } = req.params;
    const { restaurant_id } = req.body;

    if (!restaurant_id) {
      return next(new AppError('Thiếu restaurant_id', 400));
    }

    const tableLock = await TableLock.findOneAndDelete({
      table_id: tableID,
      restaurant_id,
      locked_by: req.user.id,
    });

    if (!tableLock) {
      return next(new AppError('Không tìm thấy lock hoặc bạn không có quyền', 404));
    }

    // Broadcast release via socket
    try {
      const io = getIO();
      io.to(`restaurant:${restaurant_id}`).emit('table_released', {
        tableId: tableId,
        releasedBy: req.user.id,
        timestamp: new Date(),
      });
    } catch (socketError) {
      logger.error('Socket broadcast error:', socketError);
    }

    res.status(200).json({
      status: 'success',
      message: 'Đã giải phóng khóa bàn',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all active locks for a restaurant
// @route   GET /api/tables/locks/:restaruantID
// @access  Private (Owner)
const getRestaurantLocks = async (req, res, next) => {
  try {
    const { restaurantID } = req.params;

    // Check owner role
    const restaurant = await Restaurant.findById(restaurantID);
    if (!restaurant) {
      return next(new AppError('Nhà hàng không tồn tại', 404));
    }

    if (restaurant.owner_id.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new AppError('Bạn không có quyền xem locks của nhà hàng này', 403));
    }

    const locks = await TableLock.find({
      restaurant_id: restaurantID,
      lock_until: { $gt: new Date() },
    }).populate('locked_by', 'name email');

    res.status(200).json({
      status: 'success',
      results: locks.length,
      data: { locks },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { lockTable, releaseTableLock, getRestaurantLocks };
