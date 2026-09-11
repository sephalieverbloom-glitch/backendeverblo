import asyncHandler from "../middlewares/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import {
  getAllPopupsService,
  getActivePopupService,
  createPopupService,
  updatePopupService,
  togglePopupActiveService,
  deletePopupService,
} from "../services/popup.service.js";

export const getAllPopups = asyncHandler(async (req, res) => {
  const popups = await getAllPopupsService();
  return ApiResponse.success(res, "Popups retrieved successfully", popups);
});

export const getActivePopup = asyncHandler(async (req, res) => {
  const popup = await getActivePopupService();
  return ApiResponse.success(res, "Active popup retrieved successfully", popup);
});

export const createPopup = asyncHandler(async (req, res) => {
  const fileBuffer = req.file ? req.file.buffer : null;
  const newPopup = await createPopupService(req.body, fileBuffer);
  return ApiResponse.success(res, "Popup created successfully", newPopup, 201);
});

export const updatePopup = asyncHandler(async (req, res) => {
  const fileBuffer = req.file ? req.file.buffer : null;
  const updatedPopup = await updatePopupService(req.params.id, req.body, fileBuffer);
  return ApiResponse.success(res, "Popup updated successfully", updatedPopup);
});

export const togglePopupActive = asyncHandler(async (req, res) => {
  const updatedPopup = await togglePopupActiveService(req.params.id);
  return ApiResponse.success(
    res,
    `Popup is now ${updatedPopup.active ? "active" : "inactive"}`,
    updatedPopup
  );
});

export const deletePopup = asyncHandler(async (req, res) => {
  const result = await deletePopupService(req.params.id);
  return ApiResponse.success(res, "Popup deleted successfully", result);
});
