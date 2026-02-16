/**
 * F-14: Structured Security Logging
 * Lexora Library Management System
 *
 * Usage:
 *   const logger = require('../config/logger');
 *   logger.info('message', { meta: 'data' });
 *   logger.warn('message');
 *   logger.error('message', { error: err.message });
 *   logger.security('LOGIN_FAILED', { username, ip });
 */

const winston = require('winston');
const path    = require('path');
const fs      = require('fs');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

const isDev = process.env.NODE_ENV === 'development';

// ── Custom log format ─────────────────────────────────────────────────────────
const jsonFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
    return `[${timestamp}] ${level}: ${message}${metaStr}`;
  })
);

// ── Transports ────────────────────────────────────────────────────────────────
const transports = [
  // Always log errors to file
  new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    format: jsonFormat,
    maxsize: 5 * 1024 * 1024,  // 5MB
    maxFiles: 5,
    tailable: true,
  }),
  // Combined log for all levels
  new winston.transports.File({
    filename: path.join(logsDir, 'combined.log'),
    format: jsonFormat,
    maxsize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
    tailable: true,
  }),
  // Security-specific log
  new winston.transports.File({
    filename: path.join(logsDir, 'security.log'),
    level: 'warn',
    format: jsonFormat,
    maxsize: 10 * 1024 * 1024,
    maxFiles: 10,
    tailable: true,
  }),
];

// Console output in development
if (isDev) {
  transports.push(new winston.transports.Console({ format: devFormat }));
}

// ── Logger instance ───────────────────────────────────────────────────────────
const logger = winston.createLogger({
  level: isDev ? 'debug' : 'info',
  transports,
  // Don't crash on uncaught exceptions — log them instead
  exceptionHandlers: [
    new winston.transports.File({ filename: path.join(logsDir, 'exceptions.log') })
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: path.join(logsDir, 'rejections.log') })
  ],
});

// ── Security event helper ─────────────────────────────────────────────────────
// Use for: LOGIN_FAILED, LOGIN_SUCCESS, TOKEN_EXPIRED, RATE_LIMITED,
//          UNAUTHORIZED_ACCESS, PASSWORD_CHANGED, PROFILE_UPDATED
logger.security = (event, meta = {}) => {
  logger.warn(`SECURITY_EVENT:${event}`, {
    event,
    ...meta,
    timestamp: new Date().toISOString(),
  });
};

module.exports = logger;
