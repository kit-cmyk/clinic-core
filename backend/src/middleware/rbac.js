import { PERMISSIONS } from '../config/permissions.js';

export { PERMISSION_SCOPES } from '../config/permissions.js';

/**
 * Resource-based permission middleware factory.
 *
 * Looks up `action` in the permission matrix and returns 403 if the
 * authenticated user's role is not allowed. Fails closed: unknown
 * permission keys always return 403, never 200.
 *
 * Must be placed AFTER requireAuth (which populates req.user).
 *
 * @param {string} action - Permission key e.g. 'plans:create', 'patients:read'
 *
 * @example
 * router.post('/plans', requireAuth, requirePermission('plans:create'), handler)
 */
export function requirePermission(action) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Authentication required',
      });
    }

    const allowedRoles = PERMISSIONS[action];

    // Unknown permission key — fail closed, never fail open
    if (!allowedRoles) {
      return res.status(403).json({
        error: 'forbidden',
        message: `Unknown permission: ${action}`,
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'forbidden',
        message: 'Insufficient permissions',
      });
    }

    next();
  };
}
