const jwt = require('jsonwebtoken');
require('dotenv').config();

const logger = require('../config/logger');

const generateToken = (userID, role) => {
  return jwt.sign({ id: userID, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const verifyToken = token => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    logger.error('JWT vertification error:', error.message);
    return null;
  }
};

// Extracts token from Authorization header
const getTokenFromHeader = req => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  return null;
};

module.exports = { generateToken, verifyToken, getTokenFromHeader };
