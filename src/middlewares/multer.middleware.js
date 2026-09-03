import multer from "multer";
import ApiError from "../utils/ApiError.js";

// Use memory storage so files are held in buffer before uploading to Cloudinary
const storage = multer.memoryStorage();

// File filter: image files only (jpg, jpeg, png, webp)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new ApiError(400, "Only image files (JPEG, PNG, WebP) are allowed!", "INVALID_FILE_TYPE"), false);
  }
};

export const uploadSingleImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max per file
}).single("image");

export const uploadMultipleImages = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).array("images", 10); // Max 10 images at once

export default uploadSingleImage;
