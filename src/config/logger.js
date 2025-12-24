const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const colors = require('colors');
require('dotenv').config();

const levels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
  },
};

const logger = winston.createLogger({
  levels: levels.levels,
  level: process.env.LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'dineflow-backend' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
          let logMessage = `${timestamp} [${service}] ${level}: ${message}`;

          if (Object.keys(meta).length > 0) {
            logMessage += ` ${JSON.stringify(meta)}`;
          }

          return logMessage;
        })
      ),
    }),

    // Daily rotate file for errors
    new DailyRotateFile({
      level: 'error',
      filename: 'logs/error%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: winston.format.combine(winston.format.uncolorize(), winston.format.json()),
    }),

    // Daily rotate file for all logs
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: winston.format.combine(winston.format.uncolorize(), winston.format.json()),
    }),
  ],
});

winston.addColors(levels.colors);

logger.stream = {
  write: message => logger.http(message.trim()),
};

logger.colored = {
  success: (message, meta) => {
    console.log(colors.green(`✓ ${message}`));
    logger.info(message, meta);
  },

  error: (message, meta) => {
    console.log(colors.red(`✗ ${message}`));
    logger.error(message, meta);
  },

  warning: (message, meta) => {
    console.log(colors.yellow(`⚠ ${message}`));
    logger.warn(message, meta);
  },

  info: (message, meta) => {
    console.log(colors.cyan(`ℹ ${message}`));
    logger.info(message, meta);
  },

  debug: (message, meta) => {
    console.log(colors.blue(`🔍 ${message}`));
    logger.debug(message, meta);
  },
};

module.exports = logger;
