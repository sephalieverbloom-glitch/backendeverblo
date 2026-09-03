import jwt from "jsonwebtoken";
import AdminModel from "../models/admin.model.js";
import logger from "../configs/logger.js";

export const protect = async (req, res, next) => {
  try {
    let token = req.cookies?.accessToken || req.cookies?.token;

    const authHeader = req.headers.authorization;
    if (!token && authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token) {
      logger.warn(`Auth Warning: Missing token from IP: ${req.ip || req.socket.remoteAddress} on route: ${req.method} ${req.originalUrl}`);
      return res.status(401).json({
        success: false,
        code: "UNAUTHORIZED",
        message: "Access denied. Authentication token required.",
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

      const admin = await AdminModel.findById(decoded.id).select("-password");

      if (!admin) {
        logger.warn(`Auth Warning: Token ID not found in Admin database. ID: ${decoded.id} from IP: ${req.ip || req.socket.remoteAddress} on route: ${req.method} ${req.originalUrl}`);
        return res.status(401).json({
          success: false,
          code: "UNAUTHORIZED",
          message: "Admin account no longer exists.",
        });
      }

      if (admin.isBlocked) {
        logger.warn(`Auth Warning: Blocked admin: ${admin.email} tried to access route: ${req.method} ${req.originalUrl} from IP: ${req.ip || req.socket.remoteAddress}`);
        return res.status(403).json({
          success: false,
          message: "Account is blocked. Please contact system administrator.",
        });
      }

      if (decoded.tv !== undefined && decoded.tv !== admin.tokenVersion) {
        logger.warn(`Auth Warning: Session expired for admin: ${admin.email} (token version mismatch). IP: ${req.ip || req.socket.remoteAddress}`);
        return res.status(401).json({
          success: false,
          code: "SESSION_EXPIRED",
          message: "Session invalidated. Please log in again.",
        });
      }

      req.admin = admin;
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

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: "Not Authorized",
      });
    }

    if (!roles.includes(req.admin.role)) {
      logger.warn(`Auth Warning: Admin ${req.admin.email} with role '${req.admin.role}' tried to access route requiring '${roles.join(",")}'. IP: ${req.ip || req.socket.remoteAddress}`);
      return res.status(403).json({
        success: false,
        message: `Access Denied: Role '${req.admin.role}' does not have permission to perform this action`,
      });
    }

    next();
  };
};

export default protect;