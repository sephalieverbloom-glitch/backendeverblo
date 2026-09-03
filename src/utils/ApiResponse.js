/**
 * Custom ApiResponse class for shaping consistent success HTTP responses across all controllers.
 */
class ApiResponse {
  /**
   * Send a successful JSON response
   * @param {object} res - Express response object
   * @param {string} message - Success message
   * @param {any} [data=null] - Payload data
   * @param {number} [statusCode=200] - HTTP status code
   */
  static success(res, message = "Success", data = null, statusCode = 200) {
    const responseBody = {
      success: true,
      message,
    };
    if (data !== null && data !== undefined) {
      responseBody.data = data;
    }
    return res.status(statusCode).json(responseBody);
  }

  /**
   * Send an error JSON response
   * @param {object} res - Express response object
   * @param {string} message - Error message
   * @param {number} [statusCode=500] - HTTP status code
   * @param {string} [code="ERROR"] - Error code identifier
   * @param {any} [errors=null] - Additional validation errors
   */
  static error(res, message = "Error occurred", statusCode = 500, code = "ERROR", errors = null) {
    const responseBody = {
      success: false,
      message,
      code,
    };
    if (errors) {
      responseBody.errors = errors;
    }
    return res.status(statusCode).json(responseBody);
  }
}

export default ApiResponse;
