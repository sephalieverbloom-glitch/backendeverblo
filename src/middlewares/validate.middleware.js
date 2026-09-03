import { z } from "zod";

/**
 * Reusable Express middleware for validating request data using Zod schemas.
 * Supports validating req.body, req.query, and req.params simultaneously or individually.
 *
 * @param {object} schemas - Object containing optional Zod schemas for body, query, and/or params
 * @returns {Function} Express middleware function
 */
export const validate = (schemas) => {
  return async (req, res, next) => {
    try {
      // Validate request body if schema is provided
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }

      // Validate query parameters if schema is provided
      if (schemas.query) {
        Object.defineProperty(req, 'query', {
          value: await schemas.query.parseAsync(req.query),
          enumerable: true,
          configurable: true,
          writable: true,
        });
      }

      // Validate route parameters if schema is provided
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params);
      }

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Zod Validation Error:", error.format());

        const formatted = error.format();

        // Extract first error message
        const firstError =
          Object.values(formatted)
            .flatMap((val) => val?._errors || [])
            .find((msg) => msg) || "Validation error";

        return res.status(400).json({
          success: false,
          message: firstError,
          errors: formatted, 
        });
      }
      next(error);
    }
  };
};
