/**
 * @fileoverview JWT authentication middleware.
 * Verifies token from Authorization header or httpOnly cookie.
 */

import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import { UnauthorizedError } from '@aios/shared/errors';

/**
 * Require authentication. Attaches req.user on success.
 */
export function requireAuth(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      throw new UnauthorizedError('No authentication token provided');
    }

    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error);
    } else if (error.name === 'JsonWebTokenError') {
      next(new UnauthorizedError('Invalid token'));
    } else if (error.name === 'TokenExpiredError') {
      next(new UnauthorizedError('Token expired'));
    } else {
      next(error);
    }
  }
}

/**
 * Optional authentication. Attaches req.user if token present, continues regardless.
 */
export function optionalAuth(req, _res, next) {
  try {
    const token = extractToken(req);
    if (token) {
      req.user = jwt.verify(token, config.jwt.secret);
    }
  } catch {
    // Ignore invalid tokens in optional auth
  }
  next();
}

/**
 * Require specific role(s).
 * @param {...string} roles - Allowed roles
 */
export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }
    if (!roles.includes(req.user.role)) {
      return next(new UnauthorizedError(`Role ${req.user.role} not authorized`));
    }
    next();
  };
}

/**
 * Extract JWT from Authorization header or cookie.
 * @param {import('express').Request} req
 * @returns {string|null}
 */
function extractToken(req) {
  // Check Authorization header first
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // Fall back to cookie
  return req.cookies?.token || null;
}
