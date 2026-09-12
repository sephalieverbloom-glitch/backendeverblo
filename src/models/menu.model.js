import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Menu item name is required"],
      trim: true,
      maxlength: [120, "Name cannot exceed 120 characters"],
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    priceDisplay: {
      type: String,
      default: null,
      trim: true,
    },
    currency: {
      type: String,
      default: "₹",
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      default: "Starters & Wraps",
    },
    sectionNumber: {
      type: String,
      default: "01",
      trim: true,
    },
    sectionEyebrow: {
      type: String,
      default: "BEGIN YOUR JOURNEY",
      trim: true,
    },
    image: {
      type: String,
      required: [true, "Item image is required"],
      trim: true,
    },
    cloudinaryPublicId: {
      type: String,
      default: null,
    },
    isVegetarian: {
      type: Boolean,
      default: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    isSpecial: {
      type: Boolean,
      default: false,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

menuItemSchema.index({ category: 1, displayOrder: 1 });
menuItemSchema.index({ isAvailable: 1 });
menuItemSchema.index({ name: "text", description: "text" });

const MenuItem = mongoose.models.MenuItem || mongoose.model("MenuItem", menuItemSchema);

export default MenuItem;
