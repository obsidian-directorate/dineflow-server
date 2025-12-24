require('dotenv').config();

const app = require('./app');
const logger = require('./config/logger');
const connectDB = require('./config/database');

const PORT = process.env.PORT;
const HOST = process.env.HOST;

// Connect the database
connectDB();

// Start server
const server = app.listen(PORT, HOST, () => {
  logger.colored.success(`✅ Server started successfully!`);
  logger.colored.info(`🌐 Environment: ${process.env.NODE_ENV}`);
  logger.colored.info(`🚀 Server running at http://${HOST}:${PORT}`);
  logger.colored.info(`📊 Health check: http://${HOST}:${PORT}/health`);
});

// Graceful shutdown handlers
const shutdown = signal => {
  logger.colored.warning(`⚠️ Received ${signal}. Starting graceful shutdown...`);

  server.close(() => {
    logger.colored.success('✅ Server closed successfully');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.colored.error('❌ Could not close connections in time, forcing shutdown');
    process.exit(1);
  }, 10000);
};

// Handle different shutdown signals
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', err => {
  logger.colored.error('UNHANDLED REJECTION! 💥 Shutting down...');
  logger.error('Unhandled Rejection Error:', err);
  shutdown('unhandledRejection');
});

// Handle uncaught exceptions
process.on('uncaughtException', err => {
  logger.colored.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  logger.error('Uncaught Exception Error:', err);
  shutdown('uncaughtException');
});

module.exports = server;
