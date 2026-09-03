import express from "express";
import {
  getAllMenuItems,
  getGroupedMenuItems,
  getMenuItemByIdOrSlug,
  createMenuItem,
  updateMenuItem,
  updateMenuItemPrice,
  toggleMenuItemAvailability,
  deleteMenuItem,
  seedDefaultMenuItems,
} from "../controllers/menu.controller.js";
import protect, { authorize } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import uploadSingleImage from "../middlewares/multer.middleware.js";
import {
  createMenuItemSchema,
  updateMenuItemSchema,
  updatePriceSchema,
  toggleAvailabilitySchema,
  menuQuerySchema,
} from "../validations/menu.validation.js";

const router = express.Router();

// ─── Public Endpoints ───
router.get("/", validate({ query: menuQuerySchema }), getAllMenuItems);
router.get("/grouped", getGroupedMenuItems);
router.get("/:id", getMenuItemByIdOrSlug);

// ─── Admin / Management Endpoints ───
// Seed default menu items (available for initial setup or admin)
router.post("/seed", seedDefaultMenuItems);

// Protected Admin CRUD routes
router.post(
  "/",
  protect,
  authorize("admin", "superadmin"),
  uploadSingleImage,
  validate({ body: createMenuItemSchema }),
  createMenuItem
);

router.put(
  "/:id",
  protect,
  authorize("admin", "superadmin"),
  uploadSingleImage,
  validate({ body: updateMenuItemSchema }),
  updateMenuItem
);

router.patch(
  "/:id/price",
  protect,
  authorize("admin", "superadmin"),
  validate({ body: updatePriceSchema }),
  updateMenuItemPrice
);

router.patch(
  "/:id/availability",
  protect,
  authorize("admin", "superadmin"),
  validate({ body: toggleAvailabilitySchema }),
  toggleMenuItemAvailability
);

router.delete(
  "/:id",
  protect,
  authorize("admin", "superadmin"),
  deleteMenuItem
);

export default router;
