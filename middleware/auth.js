/**
 * JWT Authentication Middleware — Production Level
 * Verifies JWT tokens and checks against the logout blacklist
 */

import jwt from 'jsonwebtoken';
import { isTokenBlacklisted } from '../controllers/authController.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dairyflow_jwt_secret_key_2025_CHANGE_IN_PROD';

/**
 * Protect routes — verifies JWT and rejects blacklisted (logged-out) tokens.
 */
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Please log in.',
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token format.',
      });
    }

    // Check if token has been logged out
    if (isTokenBlacklisted(token)) {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please log in again.',
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }
    return res.status(500).json({ success: false, message: 'Authentication error.' });
  }
};

/**
 * Role-based access control middleware factory.
 * Usage: roleGuard('Admin') or roleGuard('Admin', 'Manager')
 */
const roleGuard = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated.' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Access denied. Requires one of: ${roles.join(', ')}.`,
    });
  }
  next();
};

/**
 * Optional auth — attaches user if valid token present, proceeds either way.
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token && !isTokenBlacklisted(token)) {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
      }
    }
  } catch {
    // Proceed without user
  }
  next();
};

export { authMiddleware, optionalAuth, roleGuard, JWT_SECRET };
