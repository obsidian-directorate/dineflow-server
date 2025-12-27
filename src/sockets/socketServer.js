const socketIO = require('socket.io');
require('dotenv').config();

const { verifyToken } = require('../utils/jwt');
const logger = require('../config/logger');

let io;

const initSocketServer = server => {
  io = socketIO(server, {
    cors: {
      origin: process.env.CORS_ORIGIN,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = verifyToken(token);
      if (!decoded) {
        return next(new Error('Authentication error: Invalid token'));
      }

      socket.userID = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', socket => {
    logger.info(`Socket connected: ${socket.id} | User: ${socket.userID}`);

    // Join restaurant room
    socket.on('join_restaurant', restaurantID => {
      socket.join(`restaurant:${restaurantID}`);
      logger.info(`Socket ${socket.id} joined restaurant:${restaurantId}`);
    });

    // Leave restaurant room
    socket.on('leave_restaurant', restaurantID => {
      socket.leave(`restaurant:${restaurantID}`);
    });

    // Table lock request (from customer)
    socket.on('lock_table', async ({ restaurantID, tableID }) => {
      try {
        const room = `restaurant:${restaurantID}`;

        // Broadcast lock to everyone in restaurant room
        socket.to(room).emit('table_locked', {
          tableID,
          lockedBy: socket.userID,
          lockUntil: new Date(Date.now() + 60 * 1000), // 60 seconds
          timestamp: new Date(),
        });

        // Confirm lock to requester
        socket.emit('lock_confirmed', {
          tableID,
          lockUntil: new Date(Date.now() + 60 * 1000),
        });

        logger.info(`Table ${tableID} locked by ${socket.userID} in ${restaurantID}`);
      } catch (error) {
        socket.emit('lock_error', { error: 'Failed to lock table' });
        logger.error('Socket lock error:', error);
      }
    });

    // Table release (from customer)
    socket.on('release_table', ({ restaurantID, tableID }) => {
      const room = `restaurant:${restaurantID}`;
      io.to(room).emit('table_released', {
        tableID,
        releasedBy: socket.userID,
        timestamp: new Date(),
      });
      logger.info(`Table ${tableID} released by ${socket.userID}`);
    });

    // Check connection status
    socket.on('ping', callback => {
      if (typeof callback === 'function') {
        callback({ status: 'ping', userID: socket.userID });
      }
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

module.exports = { initSocketServer, getIO };
