/**
 * Role-Based Access Control Middleware
 * Restricts access based on user roles
 * 
 * IMPORTANT: Must be used AFTER authenticate middleware
 * 
 * Usage:
 *   const { authenticate } = require('../middleware/auth.middleware');
 *   const { requireRole, requireAdmin } = require('../middleware/role.middleware');
 *   
 *   // Admin only
 *   router.post('/books', authenticate, requireAdmin, BookController.createBook);
 *   
 *   // Multiple roles
 *   router.get('/reports', authenticate, requireRole(['admin', 'librarian']), controller);
 */

/**
 * Require specific role(s) to access route
 * @param {string|string[]} allowedRoles - Single role or array of allowed roles
 * @returns {Function} Express middleware function
 */
const requireRole = (allowedRoles) => {
  // Normalize to array
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  
  return (req, res, next) => {
    try {
      // 1. Check if user exists (from authenticate middleware)
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required. Please login.',
          code: 'AUTH_REQUIRED'
        });
      }

      // 2. Check if user has required role
      if (!req.user.role) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. User role not defined.',
          code: 'NO_ROLE'
        });
      }

      // 3. Verify user role is in allowed roles
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required role: ${roles.join(' or ')}`,
          code: 'INSUFFICIENT_PERMISSIONS',
          requiredRoles: roles,
          userRole: req.user.role
        });
      }

      // 4. User has permission, continue
      next();

    } catch (error) {
      console.error('❌ Role middleware error:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Authorization check failed. Please try again.',
        code: 'AUTHORIZATION_ERROR'
      });
    }
  };
};

/**
 * Require admin role (convenience function)
 * Equivalent to requireRole('admin')
 */
const requireAdmin = (req, res, next) => {
  return requireRole('admin')(req, res, next);
};

/**
 * Require librarian or admin role (convenience function)
 * Useful for library management tasks
 */
const requireLibrarian = (req, res, next) => {
  return requireRole(['admin', 'librarian'])(req, res, next);
};

/**
 * Require user to be owner of resource OR admin
 * @param {string} resourceIdParam - Name of param containing resource owner ID
 * @returns {Function} Express middleware function
 * 
 * Usage:
 *   router.put('/profile/:userId', authenticate, requireOwnerOrAdmin('userId'), controller);
 */
const requireOwnerOrAdmin = (resourceIdParam = 'userId') => {
  return (req, res, next) => {
    try {
      // 1. Check authentication
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required. Please login.',
          code: 'AUTH_REQUIRED'
        });
      }

      // 2. Admin can access anything
      if (req.user.role === 'admin') {
        return next();
      }

      // 3. Check if user is owner
      const resourceOwnerId = parseInt(req.params[resourceIdParam] || req.body[resourceIdParam]);
      
      if (!resourceOwnerId) {
        return res.status(400).json({
          success: false,
          message: `Resource owner ID (${resourceIdParam}) not provided.`,
          code: 'MISSING_RESOURCE_ID'
        });
      }

      if (req.user.userId !== resourceOwnerId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only access your own resources.',
          code: 'NOT_OWNER'
        });
      }

      // 4. User is owner
      next();

    } catch (error) {
      console.error('❌ Owner/Admin middleware error:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Authorization check failed. Please try again.',
        code: 'AUTHORIZATION_ERROR'
      });
    }
  };
};

/**
 * Block specific roles from accessing route
 * @param {string|string[]} blockedRoles - Roles to block
 * @returns {Function} Express middleware function
 * 
 * Usage:
 *   router.get('/public', authenticate, blockRole('guest'), controller);
 */
const blockRole = (blockedRoles) => {
  const roles = Array.isArray(blockedRoles) ? blockedRoles : [blockedRoles];
  
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required.',
          code: 'AUTH_REQUIRED'
        });
      }

      if (roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied for role: ${req.user.role}`,
          code: 'ROLE_BLOCKED'
        });
      }

      next();

    } catch (error) {
      console.error('❌ Block role middleware error:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Authorization check failed.',
        code: 'AUTHORIZATION_ERROR'
      });
    }
  };
};

module.exports = {
  requireRole,
  requireAdmin,
  requireLibrarian,
  requireOwnerOrAdmin,
  blockRole
};