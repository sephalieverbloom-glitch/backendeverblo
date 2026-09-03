import { z } from "zod";

export const createContactSchema = z.object({
  name: z.string({ required_error: "Name is required" }).trim().min(2),
  email: z.string({ required_error: "Email is required" }).trim().email(),
  phone: z.string().trim().optional(),
  subject: z.string().trim().optional(),
  message: z.string({ required_error: "Message is required" }).trim().min(5),
});
