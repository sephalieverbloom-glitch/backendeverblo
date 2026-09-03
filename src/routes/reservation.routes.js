import express from "express";
import {
  createReservation,
  getAllReservations,
  updateReservationStatus,
  deleteReservation,
} from "../controllers/reservation.controller.js";
import protect, { authorize } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createReservationSchema,
  updateReservationStatusSchema,
} from "../validations/reservation.validation.js";

const router = express.Router();

// Public: Submit table reservation
router.post("/", validate({ body: createReservationSchema }), createReservation);

// Admin Protected Routes
router.get("/", protect, authorize("admin", "superadmin"), getAllReservations);
router.patch(
  "/:id/status",
  protect,
  authorize("admin", "superadmin"),
  validate({ body: updateReservationStatusSchema }),
  updateReservationStatus
);
router.delete("/:id", protect, authorize("admin", "superadmin"), deleteReservation);

export default router;
