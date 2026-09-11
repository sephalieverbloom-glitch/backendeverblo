import express from "express";
import {
  getAllPopups,
  getActivePopup,
  createPopup,
  updatePopup,
  togglePopupActive,
  deletePopup,
} from "../controllers/popup.controller.js";
import protect, { authorize } from "../middlewares/auth.middleware.js";
import uploadSingleImage from "../middlewares/multer.middleware.js";

const router = express.Router();

// Public route to get currently active promotional popup
router.get("/active", getActivePopup);
router.get("/", getAllPopups);

// Admin protected routes
router.post(
  "/",
  protect,
  authorize("admin", "superadmin"),
  uploadSingleImage,
  createPopup
);

router.put(
  "/:id",
  protect,
  authorize("admin", "superadmin"),
  uploadSingleImage,
  updatePopup
);

router.patch(
  "/:id/toggle",
  protect,
  authorize("admin", "superadmin"),
  togglePopupActive
);

router.delete(
  "/:id",
  protect,
  authorize("admin", "superadmin"),
  deletePopup
);

export default router;
