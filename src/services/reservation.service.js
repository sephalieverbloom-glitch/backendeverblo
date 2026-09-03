import Reservation from "../models/reservation.model.js";
import ApiError from "../utils/ApiError.js";

/**
 * Create a new table reservation
 */
export const createReservationService = async (data) => {
  const reservation = await Reservation.create(data);
  return reservation;
};

/**
 * Get all reservations with optional status / date filters
 */
export const getAllReservationsService = async (query = {}) => {
  const filter = {};
  if (query.status) {
    filter.status = query.status;
  }
  if (query.date) {
    filter.date = query.date;
  }

  const reservations = await Reservation.find(filter).sort({ date: -1, time: 1 }).lean();
  return reservations;
};

/**
 * Update reservation status (e.g. confirmed, cancelled, seated)
 */
export const updateReservationStatusService = async (id, status) => {
  const reservation = await Reservation.findById(id);
  if (!reservation) {
    throw new ApiError(404, "Reservation not found");
  }

  reservation.status = status;
  await reservation.save();
  return reservation;
};

/**
 * Delete a reservation
 */
export const deleteReservationService = async (id) => {
  const reservation = await Reservation.findById(id);
  if (!reservation) {
    throw new ApiError(404, "Reservation not found");
  }

  await reservation.deleteOne();
  return { id };
};
