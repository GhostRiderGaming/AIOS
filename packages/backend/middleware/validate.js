/**
 * @fileoverview Zod schema validation middleware.
 * Validates request body against a Zod schema before hitting the controller.
 */

import { ValidationError } from '@aios/shared/errors';

/**
 * Create validation middleware for a Zod schema.
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @param {'body'|'query'|'params'} [source='body'] - Request property to validate
 * @returns {import('express').RequestHandler}
 */
export function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return next(new ValidationError('Validation failed', details));
    }

    // Replace source with parsed (and coerced) data
    req[source] = result.data;
    next();
  };
}
