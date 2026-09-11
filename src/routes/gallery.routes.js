import express from "express";
import {
  getAllPhotos,
  getPhotoById,
  createPhoto,
  updatePhoto,
  deletePhoto,
  seedDefaultPhotos,
} from "../controllers/gallery.controller.js";
import protect, { authorize } from "../middlewares/auth.middleware.js";
import uploadSingleImage from "../middlewares/multer.middleware.js";

const router = express.Router();

// ─── Public Endpoints ───
router.get("/", getAllPhotos);
router.get("/:id", getPhotoById);

// ─── Admin / Management Endpoints ───
router.post("/seed", seedDefaultPhotos);

router.post(
  "/",
  protect,
  authorize("admin", "superadmin"),
  uploadSingleImage,
  createPhoto
);

router.put(
  "/:id",
  protect,
  authorize("admin", "superadmin"),
  uploadSingleImage,
  updatePhoto
);

router.delete(
  "/:id",
  protect,
  authorize("admin", "superadmin"),
  deletePhoto
);

export default router;
