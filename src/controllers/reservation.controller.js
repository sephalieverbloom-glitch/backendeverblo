import asyncHandler from "../middlewares/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import {
  createReservationService,
  getAllReservationsService,
  updateReservationStatusService,
  deleteReservationService,
} from "../services/reservation.service.js";

export const createReservation = asyncHandler(async (req, res) => {
  const reservation = await createReservationService(req.body);
  return ApiResponse.success(
    res,
    "Reservation submitted successfully! Our team will confirm shortly.",
    reservation,
    201
  );
});

export const getAllReservations = asyncHandler(async (req, res) => {
  const reservations = await getAllReservationsService(req.query);
  return ApiResponse.success(res, "Reservations retrieved successfully", reservations);
});

export const updateReservationStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const updated = await updateReservationStatusService(req.params.id, status);
  return ApiResponse.success(res, "Reservation status updated successfully", updated);
});

export const deleteReservation = asyncHandler(async (req, res) => {
  const result = await deleteReservationService(req.params.id);
  return ApiResponse.success(res, "Reservation deleted successfully", result);
});
