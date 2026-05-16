/**
 * @fileoverview Global error handling middleware.
 * Catches all errors and returns standardized JSON responses.
 */

import { AppError } from '@aios/shared/errors';
import config from '../config/index.js';

/**
 * Global error handler — must be registered last in the middleware chain.
 */
export function errorHandler(err, _req, res, _next) {
  // Log error in development
  if (config.isDev) {
    console.error(`[ERROR] ${err.code || 'UNKNOWN'}:`, err.message);
    if (!(err instanceof AppError)) {
      console.error(err.stack);
    }
  }

  // Known application errors
  if (err instanceof AppError) {
    return res.status(err.status).json(err.toJSON());
  }

  // Unknown errors — don't leak internals
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: config.isDev ? err.message : 'An internal error occurred',
      status: 500,
    },
  });
}
