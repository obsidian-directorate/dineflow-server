const Reservation = require('../models/Reservation');
const Restaurant = require('../models/Restaurant');
const TableLock = require('../models/TableLock');
const AppError = require('../utils/appError');

// Check table availability helper
const checkTableAvailability = async (
  restaurantID,
  tableID,
  startTime,
  endTime,
  excludeReservationID = null
) => {
  const conflictQuery = {
    restaurant_id: restaurantID,
    table_id: tableID,
    status: { $nin: ['cancelled'] },
    $or: [{ start_time: { $lt: endTime }, end_time: { $gt: startTime } }],
  };

  if (excludeReservationID) {
    conflictQuery._id = { $ne: excludeReservationID };
  }

  const conflictingReservation = await Reservation.findOne(conflictQuery);
  return !conflictingReservation;
};

// Check table capacity helper
const checkTableCapacity = (restaurant, tableID, partySize) => {
  for (const zone of restaurant.zones) {
    for (const table of zone.tables) {
      if (table.table_number === tableID) {
        return partySize <= table.capacity;
      }
    }
  }
  return false;
};

// @desc    Create new reservation
// @route   POST /api/reservations
// @access  Private (Customer)
const createReservation = async (req, res, next) => {
  const session = await Reservation.startSession();
  try {
    const { restaurant_id, table_id, start_time, end_time, party_size, special_requests } =
      req.body;

    // 1. Validate input
    if (!restaurant_id || !table_id || !start_time || !end_time || !party_size) {
      return next(new AppError('Thiếu thông tin bắt buộc', 400));
    }

    const startTime = new Date(start_time);
    const endTime = new Date(end_time);

    if (start_time >= end_time) {
      return next(new AppError('Thời gian kết thúc phải sau thời gian bắt đầu', 400));
    }

    // 2. Check if the restaurant exists and is opening
    const restaurant = await Restaurant.findById(restaurant_id).session(session);
    if (!restaurant) {
      return next(new AppError('Nhà hàng không tồn tại', 404));
    }

    // 3. Check the capacity
    if (!checkTableCapacity(restaurant, table_id, party_size)) {
      return next(new AppError('Số lượng khách vượt qua sức chứa của bàn', 400));
    }

    // 4. Check if table empty
    const isAvailable = await checkTableAvailability(restaurant_id, table_id, startTime, endTime);
    if (!isAvailable) {
      return next(new AppError('Bàn đã được đặt trong khoảng thời gian này', 409));
    }

    // 5. Check table lock (if have)
    const existingLock = await TableLock.findOne({
      restaurant_id,
      table_id,
      lock_until: { $gt: new Date() },
    }).session(session);

    // 6. Create reservation
    const reservation = await Reservation.create({
      restaurant_id,
      user_id: req.user.id,
      table_id,
      start_time: startTime,
      end_time: endTime,
      party_size,
      special_requests,
      status: 'confirmed',
      lifecycle: [{ action: 'booked', timestamp: new Date() }],
    });

    // 7. Delete table lock if have
    if (existingLock) {
      await TableLock.deleteOne({ _id: existingLock._id }).session(session);
    }

    res.status(201).json({
      status: 'success',
      data: { reservation },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's reservations
// @route   GET /api/reservations/my-reservations
// @access  Private (Customer)
const getMyReservations = async (req, res, next) => {
  try {
    const { status, upcoming } = req.query;

    let query = { user_id: req.user.id };

    if (status) {
      query.status = status;
    }

    if (upcoming === 'true') {
      query.start_time = { $gte: new Date() };
    }

    const reservations = await Reservation.find(query)
      .populate('restaurant_id', 'name address')
      .sort('-start_time');

    res.status(200).json({
      status: 'success',
      results: reservations.length,
      data: { reservations },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get reservations for a restaurant (owner only)
// @route   GET /api/reservations/restaurant/:restaurantID
// @access  Private (Owner)
const getRestaurantReservations = async (req, res, next) => {
  try {
    const { restaurantID } = req.params;
    const { date, status } = req.query;

    // Check the owner right
    const restaurant = await Restaurant.findById(restaurantID);
    if (!restaurant) {
      return next(new AppError('Nhà hàng không tồn tại', 404));
    }

    if (restaurant.owner_id.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new AppError('Bạn không có quyền xem đặt bàn của nhà hàng này', 403));
    }

    let query = { restaurant_id: restaurantID };

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      query.start_time = { $gte: startDate, $lte: endDate };
    }

    if (status) {
      query.status = status;
    }

    const reservations = await Reservation.find(query)
      .populate('user_id', 'name email phone')
      .sort('start_time');

    res.status(200).json({
      status: 'success',
      results: reservations.length,
      data: { reservations },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update reservation status
// @route   PATCH /api/reservations/:id/status
// @access  Private (Customer/Owner)
const updateReservationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];

    if (!validStatuses.includes(status)) {
      return next(new AppError('Trạng thái không hợp lệ', 404));
    }

    const reservation = await Restaurant.findById(id);
    if (!reservation) {
      return next(new AppError('Đặt bàn không tồn tại', 404));
    }

    // Check role
    const canUpdate =
      req.user.role === 'admin' ||
      reservation.user_id.toString() === req.user.id ||
      (req.user.role === 'owner' &&
        (await Restaurant.findById(reservation.restaurant_id)).owner_id.toString() === req.user.id);

    if (!canUpdate) {
      return next(new AppError('Bạn không có quyền cập nhật đặt bàn này', 403));
    }

    // Add lifecycle entry
    reservation.lifecycle.push({ action: status, timestamp: new Date() });
    reservation.status = status;

    await reservation.save();

    res.status(200).json({
      status: 'success',
      data: { reservation },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check-in customer
// @route   POST /api/reservations/:id/check-in
// @access  Private (Owner)
const checkInReservation = async (req, res, next) => {
  try {
    const { id } = req.params;

    const reservation = await Reservation.findById(id);
    if (!reservation) {
      return next(new AppError('Đặt bàn không tồn tại', 404));
    }

    // Check owner role
    const restaurant = await Restaurant.findById(reservation.restaurant_id);
    if (restaurant.owner_id.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new AppError('Chỉ chủ nhà hàng mới được check-in', 403));
    }

    if (reservation.status !== 'confirmed') {
      return next(new AppError('Chỉ có thể check-in đặt bàn đã xác nhận', 400));
    }

    // Update lifecycle
    reservation.lifecycle.push({ action: 'seated', timestamp: new Date() });
    reservation.status = 'confirmed'; // Keep the confirmed status

    await reservation.save();

    res.status(200).json({
      status: 'success',
      data: {
        reservation,
        message: 'Check-in thành công',
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single reservation
// @route   GET /api/reservations/:id
// @access  Private
const getReservation = async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate('restaurant_id', 'name address zones')
      .populate('user_id', 'name email phone');

    if (!reservation) {
      return next(new AppError('Đặt bàn không tồn tại', 404));
    }

    // Check role
    const canView =
      req.user.role === 'admin' ||
      reservation.user_id._id.toString() === req.user.id ||
      (req.user.role === 'owner' &&
        (await Restaurant.findById(reservation.restaurant_id)).owner_id.toString() === req.user.id);

    if (!canView) {
      return next(new AppError('Bạn không có quyền xem đặt bàn này', 403));
    }

    res.status(200).json({
      status: 'success',
      data: { reservation },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update reservation
// @route   PUT /api/reservations/:id
// @access  Private (Customer)
const updateReservation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { table_id, start_time, end_time, party_size, special_requests } = req.body;

    const reservation = await Reservation.findById(id).session(session);
    if (!reservation) {
      return next(new AppError('Đặt bàn không tồn tại', 404));
    }

    // Only allow customers update their reservations
    if (reservation.user_id.toString() !== req.user.id) {
      return next(new AppError('Bạn chỉ có thể sửa đặt bàn của mình', 403));
    }

    // Updating is only permitted before check-in
    const hasCheckIn = reservation.lifecycle.some(item => item.action === 'seated');
    if (hasCheckIn) {
      return next(new AppError('Không thể sửa đặt bàn đã check-in', 400));
    }

    // Update the fields
    const finalTableID = table_id || reservation.table_id;
    const finalStartTime = start_time ? new Date(start_time) : reservation.start_time;
    const finalEndTime = end_time ? new Date(end_time) : reservation.end_time;

    const isAvailable = await checkTableAvailability(
      reservation.restaurant_id,
      finalTableID,
      finalStartTime,
      finalEndTime,
      reservation._id
    );

    if (!isAvailable) {
      return next(new AppError('Bàn đã được đặt trong khoảng thời gian này', 409));
    }

    // Check the capacity if changing reservations or party size
    if (table_id || party_size) {
      const restaurant = await Restaurant.findById(reservation.restaurant_id).session(session);
      const finalPartySize = party_size || reservation.party_size;

      if (!checkTableCapacity(restaurant, finalTableID, finalPartySize)) {
        return next(new AppError('Số lượng khách vượt quá sức chứa của bàn', 400));
      }
    }

    await reservation.save({ session });

    res.status(200).json({
      status: 'success',
      data: { reservation },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReservation,
  getMyReservations,
  getRestaurantReservations,
  updateReservationStatus,
  checkInReservation,
  getReservation,
  updateReservation,
};
