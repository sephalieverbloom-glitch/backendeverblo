import mongoose from "mongoose";

const gallerySchema = new mongoose.Schema(
  {
    src: {
      type: String,
      required: [true, "Image source/URL is required"],
      trim: true,
    },
    alt: {
      type: String,
      required: [true, "Photo title / alt description is required"],
      trim: true,
      maxlength: [200, "Alt text cannot exceed 200 characters"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: ["interior", "outdoor", "food", "events", "ambience"],
      default: "interior",
      trim: true,
    },
    desc: {
      type: String,
      default: "",
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    span: {
      type: String,
      default: "",
      trim: true,
    },
    cloudinaryPublicId: {
      type: String,
      default: null,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
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

gallerySchema.index({ category: 1, createdAt: -1 });
gallerySchema.index({ displayOrder: 1, createdAt: -1 });

const Gallery = mongoose.models.Gallery || mongoose.model("Gallery", gallerySchema);

export default Gallery;
