/**
 * Centralized Error Handling Middleware
 * Catches all errors and formats responses consistently
 * 
 * Usage (in server.js, AFTER all routes):
 *   const { errorHandler, notFound } = require('./middleware/errorHandler.middleware');
 *   app.use(notFound);
 *   app.use(errorHandler);
 */

/**
 * Custom error class for operational errors
 */
class AppError extends Error {
  constructor(message, statusCode, code = 'APP_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 404 Not Found Handler
 * Catches all undefined routes
 */
const notFound = (req, res, next) => {
  const error = new AppError(
    `Route not found: ${req.method} ${req.originalUrl}`,
    404,
    'ROUTE_NOT_FOUND'
  );
  next(error);
};

/**
 * Global Error Handler
 * Formats all errors consistently
 * @param {Error} err - Error object
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  // Default error values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let code = err.code || 'INTERNAL_ERROR';
  
  // Log error for debugging
  if (process.env.NODE_ENV !== 'test') {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ Error occurred:');
    console.error('   Route:', req.method, req.originalUrl);
    console.error('   Status:', statusCode);
    console.error('   Code:', code);
    console.error('   Message:', message);
    if (process.env.NODE_ENV === 'development') {
      console.error('   Stack:', err.stack);
    }
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }

  // Handle specific error types
  
  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please login again.';
    code = 'INVALID_TOKEN';
  }
  
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token has expired. Please login again.';
    code = 'TOKEN_EXPIRED';
  }

  // Database Errors
  if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    message = 'Duplicate entry. Record already exists.';
    code = 'DUPLICATE_ENTRY';
  }
  
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    statusCode = 400;
    message = 'Referenced record does not exist.';
    code = 'INVALID_REFERENCE';
  }

  // Validation Errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
    code = 'VALIDATION_ERROR';
  }

  // Cast Errors (invalid ID format)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
    code = 'INVALID_INPUT';
  }

  // Build error response
  const errorResponse = {
    success: false,
    message,
    code
  };

  // Add additional info in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error = {
      message: err.message,
      stack: err.stack,
      ...err
    };
  }

  // Send response
  res.status(statusCode).json(errorResponse);
};

/**
 * Async handler wrapper
 * Eliminates need for try-catch in async route handlers
 * 
 * Usage:
 *   const { asyncHandler } = require('../middleware/errorHandler.middleware');
 *   router.get('/books', asyncHandler(async (req, res) => {
 *     const books = await Book.getAll();
 *     res.json({ success: true, data: books });
 *   }));
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Validation middleware factory
 * @param {Function} schema - Validation schema function
 * @returns {Function} Express middleware
 * 
 * Usage:
 *   const { validate } = require('../middleware/errorHandler.middleware');
 *   router.post('/books', validate(bookSchema), controller.create);
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema(req.body);
    
    if (error) {
      const message = error.details.map(detail => detail.message).join(', ');
      return next(new AppError(message, 400, 'VALIDATION_ERROR'));
    }
    
    next();
  };
};

module.exports = {
  AppError,
  errorHandler,
  notFound,
  asyncHandler,
  validate
};