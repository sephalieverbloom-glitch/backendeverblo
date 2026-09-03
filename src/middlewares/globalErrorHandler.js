import logger from "../configs/logger.js";

const globalErrorHandler = (err, req, res, next) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
  });

  // Handle Multer upload errors
  if (err.name === "MulterError") {
    return res.status(400).json({
      success: false,
      message: `File upload error: ${err.message}`,
      field: err.field,
    });
  }

  // Handle MongoDB Duplicate Key (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    const value = err.keyValue ? err.keyValue[field] : "";
    let message = `A record with that ${field} ('${value}') already exists.`;
    if (field === "email") {
      message = "An account with that email address already exists.";
    } else if (field === "mobile") {
      message = "An account with that mobile number already exists.";
    } else if (field === "user" || field === "product") {
      message = "This item is already in your wishlist.";
    }
    return res.status(409).json({
      success: false,
      message,
      code: "DUPLICATE_KEY",
    });
  }

  // Handle Mongoose ValidationError
  if (err.name === "ValidationError") {
    const firstError = Object.values(err.errors)[0]?.message || "Validation failed";
    return res.status(400).json({
      success: false,
      message: firstError,
      code: "VALIDATION_ERROR",
    });
  }

  // Handle Mongoose CastError (Invalid ID format)
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: `Invalid ID format: '${err.value}'`,
      code: "CAST_ERROR",
    });
  }

  // Handle JWT Error
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token. Please log in again.",
      code: "INVALID_TOKEN",
    });
  }

  // Handle JWT Expired Error
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Session expired. Please log in again.",
      code: "TOKEN_EXPIRED",
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || "Something went wrong. Please try again later.";

  return res.status(statusCode).json({
    success: false,
    message,
    code: err.code || "INTERNAL_SERVER_ERROR",
  });
};

export { globalErrorHandler };