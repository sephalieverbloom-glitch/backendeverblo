import asyncHandler from "../middlewares/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import {
  createContactService,
  getAllContactsService,
  updateContactStatusService,
  deleteContactService,
} from "../services/contact.service.js";

export const createContact = asyncHandler(async (req, res) => {
  const contact = await createContactService(req.body);
  return ApiResponse.success(res, "Your message has been sent successfully. We will respond shortly.", contact, 201);
});

export const getAllContacts = asyncHandler(async (req, res) => {
  const result = await getAllContactsService(req.query);
  return ApiResponse.success(res, "Contact submissions retrieved successfully", result);
});

export const updateContactStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const contact = await updateContactStatusService(req.params.id, status);
  return ApiResponse.success(res, "Contact status updated successfully", contact);
});

export const deleteContact = asyncHandler(async (req, res) => {
  await deleteContactService(req.params.id);
  return ApiResponse.success(res, "Contact message deleted successfully");
});
