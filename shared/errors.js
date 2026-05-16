/**
 * @fileoverview Custom error classes for AIOS.
 * Import from '@aios/shared/errors'.
 *
 * All errors extend AppError with a machine-readable code and HTTP status.
 * The global error handler uses these to produce consistent JSON responses.
 */

export class AppError extends Error {
  /**
   * @param {string} message - Human-readable error message
   * @param {string} code - Machine-readable error code (UPPER_SNAKE_CASE)
   * @param {number} status - HTTP status code
   */
  constructor(message, code = 'INTERNAL_ERROR', status = 500) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.status = status;
  }

  /**
   * Serialize to standard API error response format.
   * @returns {{ error: { code: string, message: string, status: number } }}
   */
  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        status: this.status,
      },
    };
  }
}


export class ValidationError extends AppError {
  /**
   * @param {string} message
   * @param {Array} [details] - Field-level validation errors
   */
  constructor(message = 'Validation failed', details = []) {
    super(message, 'VALIDATION_ERROR', 400);
    this.details = details;
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        status: this.status,
        details: this.details,
      },
    };
  }
}


export class NotFoundError extends AppError {
  /**
   * @param {string} resource - Name of the resource not found
   * @param {string|number} [id] - ID of the resource
   */
  constructor(resource = 'Resource', id) {
    const message = id
      ? `${resource} with id ${id} not found`
      : `${resource} not found`;
    super(message, `${resource.toUpperCase()}_NOT_FOUND`, 404);
  }
}


export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 'UNAUTHORIZED', 401);
  }
}


export class ForbiddenError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 'FORBIDDEN', 403);
  }
}


export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 'CONFLICT', 409);
  }
}


export class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 'RATE_LIMITED', 429);
  }
}


export class ProviderError extends AppError {
  /**
   * @param {string} provider - Provider name (demo, ollama, gemini)
   * @param {string} message
   */
  constructor(provider, message = 'AI provider error') {
    super(`[${provider}] ${message}`, 'PROVIDER_ERROR', 502);
    this.provider = provider;
  }
}


export class PermissionDeniedError extends AppError {
  /**
   * @param {string} agentId - Agent that was denied
   * @param {string} permission - Permission that was denied
   */
  constructor(agentId, permission) {
    super(
      `Agent "${agentId}" denied permission: ${permission}`,
      'PERMISSION_DENIED',
      403,
    );
    this.agentId = agentId;
    this.permission = permission;
  }
}
