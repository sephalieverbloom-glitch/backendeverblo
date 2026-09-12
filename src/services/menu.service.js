import fs from "fs";
import MenuItem from "../models/menu.model.js";
import ApiError from "../utils/ApiError.js";
import slugify from "../utils/slugify.js";
import { uploadBufferToCloudinary, deleteFromCloudinary } from "../configs/cloudinary.js";

// Canonical sections for Everbloom Cafe
export const DEFAULT_SECTIONS = [
  {
    number: "01",
    eyebrow: "BEGIN YOUR JOURNEY",
    title: "Starters & Wraps",
    items: [
      {
        name: "Crispy Peri-Peri Chicken Wrap",
        price: 240,
        desc: "Tender spiced chicken, crisp lettuce, and house peri-peri drizzle in toasted flatbread.",
        image: "/tacos.jpg",
        isVegetarian: false,
      },
      {
        name: "Smoky Paneer Tikka Wrap",
        price: 220,
        desc: "Grilled cottage cheese cubes with mint mayo, bell peppers, and fresh greens.",
        image: "/avocado-toast.jpg",
        isVegetarian: true,
      },
      {
        name: "Cheesy Loaded Nachos",
        price: 210,
        desc: "Crisp corn tortilla chips smothered in warm cheese sauce, jalapenos, and tangy salsa.",
        image: "/tacos.jpg",
        isVegetarian: true,
      },
    ],
  },
  {
    number: "02",
    eyebrow: "SIGNATURE CREATIONS",
    title: "Pizzas & Burgers",
    items: [
      {
        name: "Wood-Fired Margherita Pizza",
        price: 290,
        desc: "San Marzano tomatoes, fresh mozzarella, and basil leaves on thin artisanal crust.",
        image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&q=80&w=800",
        isVegetarian: true,
      },
      {
        name: "Everbloom Supreme Farmhouse",
        price: 340,
        desc: "Topped with baby corn, black olives, bell peppers, mushrooms, and double mozzarella.",
        image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=800",
        isVegetarian: true,
      },
      {
        name: "Gourmet Smash Burger",
        price: 260,
        desc: "Juicy handcrafted patty with melted cheddar, caramelized onions, and house sauce.",
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800",
        isVegetarian: false,
      },
    ],
  },
  {
    number: "03",
    eyebrow: "ITALIAN CLASSICS",
    title: "Pastas & Mains",
    items: [
      {
        name: "Classic Aglio Olio Peperoncino",
        price: 260,
        desc: "Spaghetti tossed in extra virgin olive oil, golden garlic, chili flakes, and parsley.",
        image: "/pasta.jpg",
        isVegetarian: true,
      },
      {
        name: "Creamy Alfredo Penne",
        price: 280,
        desc: "Penne pasta enveloped in rich parmesan cream sauce with sauteed mushrooms.",
        image: "/pasta.jpg",
        isVegetarian: true,
      },
      {
        name: "Spicy Arrabbiata Pasta",
        price: 270,
        desc: "Tangy tomato-basil sauce with red chili heat, kalamata olives, and fresh herbs.",
        image: "/pasta.jpg",
        isVegetarian: true,
      },
    ],
  },
  {
    number: "04",
    eyebrow: "HOUSE REFRESHERS",
    title: "Signature Coolers",
    items: [
      {
        name: "Everbloom Berry Blossom Fizz",
        price: 190,
        desc: "Our house special refresher with muddled forest berries, mint, lime, and crushed ice.",
        image: "/everbloom/signature-coolers.jpg",
        isVegetarian: true,
      },
      {
        name: "Watermelon Mint Cooler",
        price: 170,
        desc: "Freshly pressed watermelon, lime zest, mint leaves, and effervescent sparkling soda.",
        image: "/everbloom/signature-coolers.jpg",
        isVegetarian: true,
      },
      {
        name: "Blue Ocean Curacao Fizz",
        price: 180,
        desc: "Vibrant tropical blue cooler with citrus notes and effervescent sparkling soda.",
        image: "/everbloom/signature-coolers.jpg",
        isVegetarian: true,
      },
    ],
  },
  {
    number: "05",
    eyebrow: "SWEET FINALE & BREWS",
    title: "Coffee & Desserts",
    items: [
      {
        name: "Blueberry Baked Cheesecake",
        price: 240,
        desc: "Philadelphia style baked cheesecake crowned with wild mountain blueberry compote.",
        image: "/cheesecake.jpg",
        isVegetarian: true,
      },
      {
        name: "Classic Espresso Tiramisu",
        price: 230,
        desc: "Espresso-soaked ladyfingers with whipped mascarpone cream and dark Dutch cocoa.",
        image: "/tiramisu.jpg",
        isVegetarian: true,
      },
      {
        name: "Signature Hazelnut Frappe",
        price: 210,
        desc: "Double espresso blended with roasted hazelnut, cold milk, and rich micro-foam.",
        image: "/iced-latte.jpg",
        isVegetarian: true,
      },
    ],
  },
];

/**
 * Generate unique slug for a menu item
 */
const generateUniqueSlug = async (name, excludeId = null) => {
  let baseSlug = slugify(name);
  if (!baseSlug) baseSlug = "cafe-item";
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const query = { slug };
    if (excludeId) query._id = { $ne: excludeId };
    const existing = await MenuItem.findOne(query).select("_id").lean();
    if (!existing) break;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};

/**
 * Fetch all menu items with flexible filtering and sorting
 */
export const getAllMenuItemsService = async (query = {}) => {
  const filter = {};

  if (query.category && query.category.trim() !== "" && query.category.toUpperCase() !== "ALL") {
    filter.category = new RegExp(`^${query.category.trim()}$`, "i");
  }

  if (query.isVegetarian !== undefined) {
    filter.isVegetarian = query.isVegetarian === "true" || query.isVegetarian === true;
  }

  if (query.isAvailable !== undefined) {
    filter.isAvailable = query.isAvailable === "true" || query.isAvailable === true;
  }

  if (query.search) {
    const searchRegex = new RegExp(query.search.trim(), "i");
    filter.$or = [{ name: searchRegex }, { description: searchRegex }, { category: searchRegex }];
  }

  let sortOption = { createdAt: -1 };
  if (query.sortBy === "displayOrder" || !query.sortBy) sortOption = { sectionNumber: 1, displayOrder: 1, createdAt: -1 };
  if (query.sortBy === "price_asc") sortOption = { price: 1 };
  if (query.sortBy === "price_desc") sortOption = { price: -1 };
  if (query.sortBy === "name") sortOption = { name: 1 };

  const totalItems = await MenuItem.countDocuments(filter);

  let queryBuilder = MenuItem.find(filter).sort(sortOption);

  const page = query.page ? Math.max(1, parseInt(query.page, 10)) : 1;
  const limit = query.limit ? Math.max(1, parseInt(query.limit, 10)) : 0;

  if (limit > 0) {
    const skip = (page - 1) * limit;
    queryBuilder = queryBuilder.skip(skip).limit(limit);
  }

  const items = await queryBuilder.lean();
  const totalPages = limit > 0 ? Math.max(1, Math.ceil(totalItems / limit)) : 1;

  const pagination = {
    totalItems,
    totalPages,
    currentPage: page,
    limit: limit > 0 ? limit : totalItems,
    hasNextPage: limit > 0 ? page < totalPages : false,
    hasPrevPage: limit > 0 ? page > 1 : false,
  };

  return { items, pagination };
};

/**
 * Get items grouped by category and section structure (matching frontend layout)
 * Newly added dishes appear first in their respective section.
 */
export const getGroupedMenuItemsService = async () => {
  const allItems = await MenuItem.find().sort({ sectionNumber: 1, displayOrder: 1, createdAt: -1 }).lean();

  if (allItems.length === 0) {
    // Return default fallback structure if database hasn't been seeded yet
    return DEFAULT_SECTIONS;
  }

  const sectionMap = new Map();

  for (const item of allItems) {
    const categoryKey = item.category || "Specialties";
    if (!sectionMap.has(categoryKey)) {
      sectionMap.set(categoryKey, {
        number: item.sectionNumber || "01",
        eyebrow: item.sectionEyebrow || "CHEF RECOMMENDATION",
        title: categoryKey,
        items: [],
      });
    }

    const sec = sectionMap.get(categoryKey);
    sec.items.push({
      _id: item._id,
      id: item._id,
      name: item.name,
      price: item.priceDisplay || `${item.currency || "₹"}${item.price}`,
      numericPrice: item.price,
      desc: item.description,
      image: item.image,
      isVegetarian: item.isVegetarian,
      isAvailable: item.isAvailable,
      isSpecial: item.isSpecial,
      tags: item.tags,
    });
  }

  return Array.from(sectionMap.values());
};

/**
 * Get single item by ID or Slug
 */
export const getMenuItemByIdOrSlugService = async (idOrSlug) => {
  let item = null;
  if (idOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
    item = await MenuItem.findById(idOrSlug).lean();
  }
  if (!item) {
    item = await MenuItem.findOne({ slug: idOrSlug.toLowerCase() }).lean();
  }

  if (!item) {
    throw new ApiError(404, "Menu item not found");
  }

  return item;
};

/**
 * Create a new Menu Item
 */
export const createMenuItemService = async (data, fileBuffer = null) => {
  let imageUrl = data.image;
  let cloudinaryPublicId = null;

  if (fileBuffer) {
    const uploadResult = await uploadBufferToCloudinary(fileBuffer, "everbloom_cafe/menu");
    imageUrl = uploadResult.url;
    cloudinaryPublicId = uploadResult.public_id;
  }

  if (!imageUrl) {
    imageUrl = "/everbloom/signature-coolers.jpg";
  }

  const slug = await generateUniqueSlug(data.name);

  const newItem = await MenuItem.create({
    ...data,
    slug,
    image: imageUrl,
    cloudinaryPublicId,
  });

  return newItem;
};

/**
 * Update an existing Menu Item
 */
export const updateMenuItemService = async (id, updateData, fileBuffer = null) => {
  const item = await MenuItem.findById(id);
  if (!item) {
    throw new ApiError(404, "Menu item not found");
  }

  if (fileBuffer) {
    if (item.cloudinaryPublicId) {
      await deleteFromCloudinary(item.cloudinaryPublicId);
    }
    const uploadResult = await uploadBufferToCloudinary(fileBuffer, "everbloom_cafe/menu");
    updateData.image = uploadResult.url;
    updateData.cloudinaryPublicId = uploadResult.public_id;
  }

  if (updateData.name && updateData.name !== item.name) {
    updateData.slug = await generateUniqueSlug(updateData.name, id);
  }

  Object.assign(item, updateData);
  await item.save();

  return item;
};

/**
 * Dedicated price update service
 */
export const updateMenuItemPriceService = async (id, newPrice) => {
  const item = await MenuItem.findById(id);
  if (!item) {
    throw new ApiError(404, "Menu item not found");
  }

  item.price = Number(newPrice);
  await item.save();

  return item;
};

/**
 * Toggle menu item availability
 */
export const toggleMenuItemAvailabilityService = async (id, isAvailable) => {
  const item = await MenuItem.findById(id);
  if (!item) {
    throw new ApiError(404, "Menu item not found");
  }

  item.isAvailable = Boolean(isAvailable);
  await item.save();

  return item;
};

/**
 * Delete a Menu Item
 */
export const deleteMenuItemService = async (id) => {
  const item = await MenuItem.findById(id);
  if (!item) {
    throw new ApiError(404, "Menu item not found");
  }

  if (item.cloudinaryPublicId) {
    await deleteFromCloudinary(item.cloudinaryPublicId);
  }

  await item.deleteOne();
  return { id };
};

/**
 * Seed initial Everbloom Café menu items into database
 */
export const seedDefaultMenuItemsService = async (force = false) => {
  const existingCount = await MenuItem.countDocuments();
  if (existingCount > 0 && !force) {
    return {
      message: `Database already contains ${existingCount} menu items. Use force=true to reset.`,
      count: existingCount,
    };
  }

  if (force) {
    await MenuItem.deleteMany({});
  }

  let itemsToInsert = [];
  try {
    const jsonPath = new URL("../data/menuItems.json", import.meta.url);
    if (fs.existsSync(jsonPath)) {
      const raw = fs.readFileSync(jsonPath, "utf8");
      itemsToInsert = JSON.parse(raw);
    }
  } catch (err) {
    console.warn("Could not load menuItems.json, falling back to DEFAULT_SECTIONS:", err.message);
  }

  if (!itemsToInsert || itemsToInsert.length === 0) {
    itemsToInsert = [];
    let displayCounter = 1;
    for (const sec of DEFAULT_SECTIONS) {
      for (const item of sec.items) {
        const slug = slugify(item.name);
        itemsToInsert.push({
          name: item.name,
          slug,
          description: item.desc,
          price: item.price,
          currency: "₹",
          category: sec.title,
          sectionNumber: sec.number,
          sectionEyebrow: sec.eyebrow,
          image: item.image,
          isVegetarian: item.isVegetarian !== undefined ? item.isVegetarian : true,
          isAvailable: true,
          isSpecial: false,
          displayOrder: displayCounter++,
        });
      }
    }
  }

  const created = await MenuItem.insertMany(itemsToInsert);
  return {
    message: "Successfully seeded default Everbloom Café menu!",
    count: created.length,
  };
};
