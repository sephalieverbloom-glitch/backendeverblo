import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import logger from "../configs/logger.js";

export const isAuthenticated = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let token;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      logger.warn(`Auth Warning: Missing token from IP: ${req.ip || req.socket.remoteAddress} on route: ${req.method} ${req.originalUrl}`);
      return res.status(401).json({
        success: false,
        code: "UNAUTHORIZED",
        message: "Authentication token is required.",
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

      const user = await User.findById(decoded.id);

      if (!user) {
        logger.warn(`Auth Warning: Token ID not found in User database. ID: ${decoded.id} from IP: ${req.ip || req.socket.remoteAddress} on route: ${req.method} ${req.originalUrl}`);
        return res.status(401).json({
          success: false,
          code: "UNAUTHORIZED",
          message: "User account no longer exists.",
        });
      }

      if (!user.isActive) {
        logger.warn(`Auth Warning: Inactive user: ${user.email} tried to access route: ${req.method} ${req.originalUrl} from IP: ${req.ip || req.socket.remoteAddress}`);
        return res.status(403).json({
          success: false,
          code: "ACCOUNT_INACTIVE",
          message: "Your account is inactive. Please contact support.",
        });
      }

      if (decoded.tv !== undefined && decoded.tv !== user.tokenVersion) {
        logger.warn(`Auth Warning: Session expired for user: ${user.email} (token version mismatch). IP: ${req.ip || req.socket.remoteAddress}`);
        return res.status(401).json({
          success: false,
          code: "SESSION_EXPIRED",
          message: "Session invalidated. Please log in again.",
        });
      }

      req.user = user;
      return next();
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        logger.warn(`Auth Warning: Expired token from IP: ${req.ip || req.socket.remoteAddress} on route: ${req.method} ${req.originalUrl}`);
        return res.status(401).json({
          success: false,
          code: "TOKEN_EXPIRED",
          message: "Access token expired. Please refresh your session.",
        });
      }
      logger.warn(`Auth Warning: Invalid token signature/format from IP: ${req.ip || req.socket.remoteAddress} on route: ${req.method} ${req.originalUrl}. Error: ${error.message}`);
      return res.status(401).json({
        success: false,
        code: "INVALID_TOKEN",
        message: "Invalid access token.",
      });
    }
  } catch (error) {
    return next(error);
  }
};
