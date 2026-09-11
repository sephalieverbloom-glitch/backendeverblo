import Gallery from "../models/gallery.model.js";
import ApiError from "../utils/ApiError.js";
import { uploadBufferToCloudinary, deleteFromCloudinary } from "../configs/cloudinary.js";

// Canonical curated Everbloom gallery photos for fallback / seeding
export const DEFAULT_GALLERY_PHOTOS = [
  {
    src: "https://res.cloudinary.com/p2gsrga3/image/upload/v1789146209/myheroimg.png",
    alt: "Iconic Blooming Roses Floral Wall Mural",
    category: "interior",
    desc: "Our signature hand-painted floral centerpiece with plush sage seating.",
    span: "col-span-1 md:col-span-2 row-span-2",
    displayOrder: 1,
  },
  {
    src: "https://res.cloudinary.com/p2gsrga3/image/upload/v1789149129/ed448c81-64a8-4b27-ad99-13e7dfafa61a.jpg",
    alt: "Warm Ambient AC Indoor Lounge",
    category: "interior",
    desc: "Cozy air-conditioned lounge with warm downlighting and acoustic music.",
    span: "col-span-1 md:col-span-2 row-span-2",
    displayOrder: 2,
  },
  {
    src: "https://res.cloudinary.com/p2gsrga3/image/upload/v1789146626/img2.png",
    alt: "Nature-Inspired Outdoor Garden Patio",
    category: "outdoor",
    desc: "Lush tropical plants and fairy string lights for evening chill.",
    span: "col-span-1 md:col-span-2",
    displayOrder: 3,
  },
  {
    src: "https://res.cloudinary.com/p2gsrga3/image/upload/v1789149127/5711f2ca-09f2-49f2-9961-2b6b5d71e8b4.jpg",
    alt: "Signature Everbloom Berry & Citrus Coolers",
    category: "food",
    desc: "Refreshing handcrafted mocktails with fresh berries and mint.",
    span: "col-span-1 md:col-span-2",
    displayOrder: 4,
  },
  {
    src: "https://res.cloudinary.com/p2gsrga3/image/upload/v1789149128/d3bb1a94-7486-4d37-8365-625e7484a6b2.jpg",
    alt: "Handcrafted Artisanal Pasta",
    category: "food",
    desc: "Al dente artisanal pastas tossed in rich savory sauces.",
    span: "",
    displayOrder: 5,
  },
  {
    src: "https://res.cloudinary.com/p2gsrga3/image/upload/v1789146653/img3.png",
    alt: "Wood-Fired Margherita Pizza & Cheesecake",
    category: "food",
    desc: "Crispy thin crust and decadent sweet desserts.",
    span: "",
    displayOrder: 6,
  },
  {
    src: "https://res.cloudinary.com/p2gsrga3/image/upload/v1789146605/myimg.png",
    alt: "Everbloom Aesthetic Floral Seating",
    category: "interior",
    desc: "Lush botanical floral seating and tranquil cafe vibe.",
    span: "",
    displayOrder: 7,
  },
  {
    src: "https://res.cloudinary.com/p2gsrga3/image/upload/v1789149259/signature-coolers.jpg",
    alt: "Sparkling Refreshment Coolers",
    category: "food",
    desc: "Vibrant coolers crafted with citrus notes and effervescent fizz.",
    span: "",
    displayOrder: 8,
  },
  {
    src: "/tacos.jpg",
    alt: "Loaded Wraps & Crispy Bites",
    category: "food",
    desc: "Spiced peri-peri chicken and paneer wraps with house dips.",
    span: "",
    displayOrder: 9,
  },
  {
    src: "/iced-latte.jpg",
    alt: "Hazelnut Iced Frappe",
    category: "food",
    desc: "Rich espresso blended with hazelnut and creamy froth.",
    span: "",
    displayOrder: 10,
  },
];

/**
 * Fetch all gallery photos with optional category filtering.
 * Returns newest photos first (createdAt: -1).
 */
export const getAllPhotosService = async (query = {}) => {
  const filter = { isActive: true };

  if (query.category && query.category !== "all") {
    filter.category = new RegExp(`^${query.category.trim()}$`, "i");
  }

  // Sort newest first by default so admin uploaded photos appear at the beginning
  const photos = await Gallery.find(filter).sort({ createdAt: -1 }).lean();

  // If no photos in DB yet, auto-seed defaults in background and return them
  if (photos.length === 0 && (!query.category || query.category === "all")) {
    try {
      const seeded = await Gallery.insertMany(DEFAULT_GALLERY_PHOTOS);
      return seeded.map((doc) => doc.toJSON());
    } catch {
      return DEFAULT_GALLERY_PHOTOS.map((p, idx) => ({ ...p, id: `photo_${idx + 1}`, _id: `photo_${idx + 1}` }));
    }
  }

  return photos;
};

/**
 * Get single photo by ID
 */
export const getPhotoByIdService = async (id) => {
  const photo = await Gallery.findById(id).lean();
  if (!photo) {
    throw new ApiError(404, "Photo not found in gallery");
  }
  return photo;
};

/**
 * Create a new Gallery photo (supports Cloudinary file buffer or direct URL)
 */
export const createPhotoService = async (data, fileBuffer = null) => {
  let imageUrl = data.imageUrl || data.src;
  let cloudinaryPublicId = null;

  if (fileBuffer) {
    const uploadResult = await uploadBufferToCloudinary(fileBuffer, "everbloom_cafe/gallery");
    imageUrl = uploadResult.url;
    cloudinaryPublicId = uploadResult.public_id;
  }

  if (!imageUrl) {
    imageUrl = "https://res.cloudinary.com/p2gsrga3/image/upload/v1789146605/myimg.png";
  }

  const newPhoto = await Gallery.create({
    src: imageUrl,
    alt: data.alt || "Everbloom Café Ambience",
    category: data.category || "interior",
    desc: data.desc || "",
    span: data.span || "",
    displayOrder: data.displayOrder || 0,
    cloudinaryPublicId,
    isActive: true,
  });

  return newPhoto;
};

/**
 * Update existing photo details or replace image
 */
export const updatePhotoService = async (id, updateData, fileBuffer = null) => {
  const photo = await Gallery.findById(id);
  if (!photo) {
    throw new ApiError(404, "Photo not found");
  }

  if (fileBuffer) {
    if (photo.cloudinaryPublicId) {
      await deleteFromCloudinary(photo.cloudinaryPublicId);
    }
    const uploadResult = await uploadBufferToCloudinary(fileBuffer, "everbloom_cafe/gallery");
    updateData.src = uploadResult.url;
    updateData.cloudinaryPublicId = uploadResult.public_id;
  } else if (updateData.imageUrl || updateData.src) {
    updateData.src = updateData.imageUrl || updateData.src;
  }

  Object.assign(photo, updateData);
  await photo.save();

  return photo;
};

/**
 * Delete a photo and remove its Cloudinary asset
 */
export const deletePhotoService = async (id) => {
  const photo = await Gallery.findById(id);
  if (!photo) {
    throw new ApiError(404, "Photo not found");
  }

  if (photo.cloudinaryPublicId) {
    await deleteFromCloudinary(photo.cloudinaryPublicId);
  }

  await photo.deleteOne();
  return { id, message: "Photo deleted successfully" };
};

/**
 * Seed or reset default Everbloom gallery images
 */
export const seedDefaultPhotosService = async (force = false) => {
  const count = await Gallery.countDocuments();
  if (count > 0 && !force) {
    return {
      message: `Gallery already contains ${count} photos. Use force=true to reseed.`,
      count,
    };
  }

  if (force) {
    await Gallery.deleteMany({});
  }

  const inserted = await Gallery.insertMany(DEFAULT_GALLERY_PHOTOS);
  return {
    message: "Successfully seeded default Everbloom Café gallery photos!",
    count: inserted.length,
  };
};
