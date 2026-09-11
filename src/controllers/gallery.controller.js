import asyncHandler from "../middlewares/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import {
  getAllPhotosService,
  getPhotoByIdService,
  createPhotoService,
  updatePhotoService,
  deletePhotoService,
  seedDefaultPhotosService,
} from "../services/gallery.service.js";

export const getAllPhotos = asyncHandler(async (req, res) => {
  const photos = await getAllPhotosService(req.query);
  return ApiResponse.success(res, "Gallery photos retrieved successfully", photos);
});

export const getPhotoById = asyncHandler(async (req, res) => {
  const photo = await getPhotoByIdService(req.params.id);
  return ApiResponse.success(res, "Gallery photo retrieved successfully", photo);
});

export const createPhoto = asyncHandler(async (req, res) => {
  const fileBuffer = req.file ? req.file.buffer : null;
  const newPhoto = await createPhotoService(req.body, fileBuffer);
  return ApiResponse.success(res, "Photo uploaded to gallery successfully", newPhoto, 201);
});

export const updatePhoto = asyncHandler(async (req, res) => {
  const fileBuffer = req.file ? req.file.buffer : null;
  const updatedPhoto = await updatePhotoService(req.params.id, req.body, fileBuffer);
  return ApiResponse.success(res, "Gallery photo updated successfully", updatedPhoto);
});

export const deletePhoto = asyncHandler(async (req, res) => {
  const result = await deletePhotoService(req.params.id);
  return ApiResponse.success(res, "Gallery photo deleted successfully", result);
});

export const seedDefaultPhotos = asyncHandler(async (req, res) => {
  const force = req.query.force === "true" || req.body?.force === true;
  const result = await seedDefaultPhotosService(force);
  return ApiResponse.success(res, result.message, result);
});
