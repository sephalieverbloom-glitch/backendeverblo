import Contact from "../models/contact.model.js";
import ApiError from "../utils/ApiError.js";

export const createContactService = async (data) => {
  return await Contact.create(data);
};

export const getAllContactsService = async (query) => {
  const { status, search, page = 1, limit = 5 } = query;
  const filter = {};
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { name: new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
      { email: new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
      { phone: new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
      { subject: new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
    ];
  }

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.max(1, Number(limit));
  const skip = (pageNum - 1) * limitNum;

  const [contacts, total] = await Promise.all([
    Contact.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    Contact.countDocuments(filter),
  ]);

  return {
    contacts,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };
};

export const updateContactStatusService = async (id, status) => {
  const contact = await Contact.findByIdAndUpdate(id, { status }, { new: true });
  if (!contact) throw new ApiError(404, "Contact submission not found.", "CONTACT_NOT_FOUND");
  return contact;
};

export const deleteContactService = async (id) => {
  const contact = await Contact.findByIdAndDelete(id);
  if (!contact) throw new ApiError(404, "Contact submission not found.", "CONTACT_NOT_FOUND");
  return true;
};
