import mongoose from "mongoose";

const popupSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Popup title is required"],
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    subtitle: {
      type: String,
      default: "",
      trim: true,
      maxlength: [300, "Subtitle cannot exceed 300 characters"],
    },
    badge: {
      type: String,
      default: "Special Offer",
      trim: true,
    },
    ctaText: {
      type: String,
      default: "Explore Full Menu",
      trim: true,
    },
    ctaLink: {
      type: String,
      default: "/menu",
      trim: true,
    },
    imageUrl: {
      type: String,
      default: "/iced-latte.jpg",
      trim: true,
    },
    cloudinaryPublicId: {
      type: String,
      default: null,
    },
    active: {
      type: Boolean,
      default: true,
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

popupSchema.index({ active: 1, createdAt: -1 });

const Popup = mongoose.models.Popup || mongoose.model("Popup", popupSchema);

export default Popup;
