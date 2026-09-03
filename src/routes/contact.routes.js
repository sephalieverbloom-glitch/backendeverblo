import express from "express";
import { createContact, getAllContacts, updateContactStatus, deleteContact } from "../controllers/contact.controller.js";
import protect, { authorize } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createContactSchema } from "../validations/contact.validation.js";

const router = express.Router();

// Public Route: Contact us form submission
router.post("/", validate({ body: createContactSchema }), createContact);

// Admin Protected Routes
router.get("/admin/all", protect, authorize("admin", "superadmin"), getAllContacts);
router.put("/admin/:id/status", protect, authorize("admin", "superadmin"), updateContactStatus);
router.delete("/admin/:id", protect, authorize("admin", "superadmin"), deleteContact);

export default router;
