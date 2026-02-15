/**
 * Middleware Barrel Export
 * Central export point for all middleware
 * 
 * Usage:
 *   const { authenticate, requireAdmin, errorHandler } = require('../middleware');
 */

const { authenticate, optionalAuth } = require('./Auth.middleware');
const { 
  requireRole, 
  requireAdmin, 
  requireLibrarian,
  requireOwnerOrAdmin,
  blockRole 
} = require('./role.middleware');
const { 
  AppError,
  errorHandler, 
  notFound,
  asyncHandler,
  validate 
} = require('./ErrorHandler.middleware');

module.exports = {
  // Authentication
  authenticate,
  optionalAuth,
  
  // Authorization (Roles)
  requireRole,
  requireAdmin,
  requireLibrarian,
  requireOwnerOrAdmin,
  blockRole,
  
  // Error Handling
  AppError,
  errorHandler,
  notFound,
  asyncHandler,
  validate
};