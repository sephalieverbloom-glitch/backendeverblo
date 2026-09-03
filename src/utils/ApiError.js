/**
 * Custom ApiError class for standardized HTTP error handling across all modules.
 * Extends native JavaScript Error with HTTP status code, error codes, and operational flags.
 */
class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code (e.g. 400, 404, 500)
   * @param {string} message - Human-readable error message
   * @param {string} [code="INTERNAL_SERVER_ERROR"] - Error code identifier
   * @param {Array} [errors=[]] - Array of specific field validation errors or details
   */
  constructor(statusCode, message = "Something went wrong", code = "INTERNAL_SERVER_ERROR", errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
    this.success = false;

    // Capture stack trace for non-operational errors
    Error.captureStackTrace(this, this.constructor);
  }
}

export default ApiError;
