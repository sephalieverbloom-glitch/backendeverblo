import { z } from "zod";

export const createMenuItemSchema = z.object({
  name: z.string({ required_error: "Name is required" }).min(2).max(120).trim(),
  description: z.string({ required_error: "Description is required" }).min(5).max(500).trim(),
  price: z.coerce.number({ required_error: "Price is required" }).min(0, "Price must be >= 0"),
  currency: z.string().default("₹").optional(),
  category: z.string({ required_error: "Category is required" }).trim(),
  sectionNumber: z.string().optional().default("01"),
  sectionEyebrow: z.string().optional().default("SPECIALTY"),
  image: z.string().optional(),
  isVegetarian: z.coerce.boolean().optional().default(true),
  isAvailable: z.coerce.boolean().optional().default(true),
  isSpecial: z.coerce.boolean().optional().default(false),
  displayOrder: z.coerce.number().optional().default(0),
  tags: z.preprocess((val) => {
    if (typeof val === "string") {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return val.split(",").map((s) => s.trim()).filter(Boolean);
      }
      return val.split(",").map((s) => s.trim()).filter(Boolean);
    }
    return val;
  }, z.array(z.string()).optional()),
});

export const updateMenuItemSchema = z.object({
  name: z.string().min(2).max(120).trim().optional(),
  description: z.string().min(5).max(500).trim().optional(),
  price: z.coerce.number().min(0, "Price must be >= 0").optional(),
  currency: z.string().optional(),
  category: z.string().trim().optional(),
  sectionNumber: z.string().optional(),
  sectionEyebrow: z.string().optional(),
  image: z.string().optional(),
  isVegetarian: z.coerce.boolean().optional(),
  isAvailable: z.coerce.boolean().optional(),
  isSpecial: z.coerce.boolean().optional(),
  displayOrder: z.coerce.number().optional(),
  tags: z.preprocess((val) => {
    if (typeof val === "string") {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return val.split(",").map((s) => s.trim()).filter(Boolean);
      }
      return val.split(",").map((s) => s.trim()).filter(Boolean);
    }
    return val;
  }, z.array(z.string()).optional()),
});

export const updatePriceSchema = z.object({
  price: z.coerce.number({ required_error: "New price is required" }).min(0, "Price must be >= 0"),
});

export const toggleAvailabilitySchema = z.object({
  isAvailable: z.coerce.boolean({ required_error: "isAvailable boolean is required" }),
});

export const menuQuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  isVegetarian: z.enum(["true", "false"]).optional(),
  isAvailable: z.enum(["true", "false"]).optional(),
  sortBy: z.enum(["displayOrder", "price_asc", "price_desc", "name"]).optional(),
  page: z.coerce.number().min(1).default(1).optional(),
  limit: z.coerce.number().min(1).max(200).optional(),
});
