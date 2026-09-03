import asyncHandler from "../middlewares/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import {
  getAllMenuItemsService,
  getGroupedMenuItemsService,
  getMenuItemByIdOrSlugService,
  createMenuItemService,
  updateMenuItemService,
  updateMenuItemPriceService,
  toggleMenuItemAvailabilityService,
  deleteMenuItemService,
  seedDefaultMenuItemsService,
} from "../services/menu.service.js";

export const getAllMenuItems = asyncHandler(async (req, res) => {
  const items = await getAllMenuItemsService(req.query);
  return ApiResponse.success(res, "Menu items retrieved successfully", items);
});

export const getGroupedMenuItems = asyncHandler(async (req, res) => {
  const sections = await getGroupedMenuItemsService();
  return ApiResponse.success(res, "Grouped menu sections retrieved successfully", sections);
});

export const getMenuItemByIdOrSlug = asyncHandler(async (req, res) => {
  const item = await getMenuItemByIdOrSlugService(req.params.id);
  return ApiResponse.success(res, "Menu item retrieved successfully", item);
});

export const createMenuItem = asyncHandler(async (req, res) => {
  const fileBuffer = req.file ? req.file.buffer : null;
  const newItem = await createMenuItemService(req.body, fileBuffer);
  return ApiResponse.success(res, "Menu item created successfully", newItem, 201);
});

export const updateMenuItem = asyncHandler(async (req, res) => {
  const fileBuffer = req.file ? req.file.buffer : null;
  const updatedItem = await updateMenuItemService(req.params.id, req.body, fileBuffer);
  return ApiResponse.success(res, "Menu item updated successfully", updatedItem);
});

export const updateMenuItemPrice = asyncHandler(async (req, res) => {
  const { price } = req.body;
  const updatedItem = await updateMenuItemPriceService(req.params.id, price);
  return ApiResponse.success(res, "Menu item price updated successfully", updatedItem);
});

export const toggleMenuItemAvailability = asyncHandler(async (req, res) => {
  const { isAvailable } = req.body;
  const updatedItem = await toggleMenuItemAvailabilityService(req.params.id, isAvailable);
  return ApiResponse.success(
    res,
    `Menu item marked as ${updatedItem.isAvailable ? "available" : "sold out"}`,
    updatedItem
  );
});

export const deleteMenuItem = asyncHandler(async (req, res) => {
  const result = await deleteMenuItemService(req.params.id);
  return ApiResponse.success(res, "Menu item deleted successfully", result);
});

export const seedDefaultMenuItems = asyncHandler(async (req, res) => {
  const force = req.query.force === "true" || req.body?.force === true;
  const result = await seedDefaultMenuItemsService(force);
  return ApiResponse.success(res, result.message, result);
});
