import { z } from "zod";

export const createReservationSchema = z.object({
  name: z.string({ required_error: "Name is required" }).min(2).max(100).trim(),
  phone: z.string({ required_error: "Phone number is required" }).min(7).max(20).trim(),
  date: z.string({ required_error: "Date is required" }).trim(),
  time: z.string({ required_error: "Time is required" }).trim(),
  guests: z.coerce.number().int().min(1).max(50).default(2),
  notes: z.string().max(500).optional().default(""),
});

export const updateReservationStatusSchema = z.object({
  status: z.enum(["pending", "confirmed", "seated", "completed", "cancelled"], {
    required_error: "Status is required",
  }),
});
