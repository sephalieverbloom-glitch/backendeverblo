import Popup from "../models/popup.model.js";
import ApiError from "../utils/ApiError.js";
import { uploadBufferToCloudinary, deleteFromCloudinary } from "../configs/cloudinary.js";

const DEFAULT_POPUP = {
  title: "Weekend Artisanal Brew Tasting",
  subtitle: "Get 20% off on all signature hand-poured coffees & fresh berry coolers this Saturday & Sunday.",
  badge: "Weekend Special",
  ctaText: "Explore Full Menu",
  ctaLink: "/menu",
  imageUrl: "/iced-latte.jpg",
  active: true,
};

export const getAllPopupsService = async () => {
  let popups = await Popup.find().sort({ createdAt: -1 }).lean();
  if (popups.length === 0) {
    try {
      const created = await Popup.create(DEFAULT_POPUP);
      return [created.toJSON()];
    } catch {
      return [{ ...DEFAULT_POPUP, id: "default_promo_1", _id: "default_promo_1" }];
    }
  }
  return popups;
};

export const getActivePopupService = async () => {
  let popup = await Popup.findOne({ active: true }).sort({ createdAt: -1 }).lean();
  if (!popup) {
    popup = await Popup.findOne().sort({ createdAt: -1 }).lean();
  }
  return popup || DEFAULT_POPUP;
};

export const createPopupService = async (data, fileBuffer = null) => {
  let imageUrl = data.imageUrl;
  let cloudinaryPublicId = null;

  if (fileBuffer) {
    const uploadResult = await uploadBufferToCloudinary(fileBuffer, "everbloom_cafe/popups");
    imageUrl = uploadResult.url;
    cloudinaryPublicId = uploadResult.public_id;
  }

  const newPopup = await Popup.create({
    title: data.title,
    subtitle: data.subtitle || "",
    badge: data.badge || "Special Offer",
    ctaText: data.ctaText || "Explore Full Menu",
    ctaLink: data.ctaLink || "/menu",
    imageUrl: imageUrl || "/iced-latte.jpg",
    cloudinaryPublicId,
    active: data.active !== undefined ? Boolean(data.active) : true,
  });

  return newPopup;
};

export const updatePopupService = async (id, updateData, fileBuffer = null) => {
  const popup = await Popup.findById(id);
  if (!popup) {
    throw new ApiError(404, "Promotion popup not found");
  }

  if (fileBuffer) {
    if (popup.cloudinaryPublicId) {
      await deleteFromCloudinary(popup.cloudinaryPublicId);
    }
    const uploadResult = await uploadBufferToCloudinary(fileBuffer, "everbloom_cafe/popups");
    updateData.imageUrl = uploadResult.url;
    updateData.cloudinaryPublicId = uploadResult.public_id;
  }

  Object.assign(popup, updateData);
  await popup.save();

  return popup;
};

export const togglePopupActiveService = async (id) => {
  const popup = await Popup.findById(id);
  if (!popup) {
    throw new ApiError(404, "Promotion popup not found");
  }

  popup.active = !popup.active;
  await popup.save();

  return popup;
};

export const deletePopupService = async (id) => {
  const popup = await Popup.findById(id);
  if (!popup) {
    throw new ApiError(404, "Promotion popup not found");
  }

  if (popup.cloudinaryPublicId) {
    await deleteFromCloudinary(popup.cloudinaryPublicId);
  }

  await popup.deleteOne();
  return { id, message: "Promotion popup deleted successfully" };
};
