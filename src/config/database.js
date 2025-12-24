const mongoose = require('mongoose');
require('dotenv').config();

const logger = require('./logger');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    logger.colored.success(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    logger.colored.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
