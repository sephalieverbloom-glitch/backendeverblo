import express from "express";
import menuRoutes from "./menu.routes.js";
import reservationRoutes from "./reservation.routes.js";
import contactRoutes from "./contact.routes.js";
import adminRoutes from "./admin.routes.js";

const router = express.Router();

// Health Check Endpoint (Lightweight for Vercel / Uptime Monitoring)
router.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Everbloom Café API Server is healthy and running.",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

// Cafe Core Domain Routes
router.use("/menu", menuRoutes);
router.use("/reservations", reservationRoutes);
router.use("/contact", contactRoutes);
router.use("/admin", adminRoutes);

export default router;