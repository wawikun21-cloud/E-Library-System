/**
 * Error Handler Middleware — updated with Winston logging (F-14)
 * Place this file at: server/src/middleware/Errorhandler.middleware.js
 */

const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const isDev  = process.env.NODE_ENV === 'development';

  // Log the error with structured context
  logger.error(err.message || 'Internal Server Error', {
    status,
    method:  req.method,
    path:    req.path,
    ip:      req.ip,
    stack:   isDev ? err.stack : undefined,
  });

  // Never leak stack traces to the client in production
  res.status(status).json({
    success: false,
    message: status === 500
      ? 'An internal server error occurred'
      : err.message,
    ...(isDev && { stack: err.stack }),
  });
};

const notFound = (req, res) => {
  logger.warn('Route not found', { method: req.method, path: req.path, ip: req.ip });
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
    code: 'NOT_FOUND',
  });
};

module.exports = { errorHandler, notFound };