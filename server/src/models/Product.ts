import mongoose, { Document, Schema, Types } from "mongoose";

export interface IProductImage {
  url: string;
  public_id: string;
}

export interface IProduct extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  price: number;
  category:
    | "Electronics"
    | "Clothes"
    | "Snacks"
    | "Accessories"
    | "Books"
    | "Daily essentials";
  condition: "new" | "used";
  negotiable: boolean;
  images: IProductImage[];
  hostel: Types.ObjectId;
  seller: Types.ObjectId;
  status: "active" | "sold" | "removed";
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProductImageSchema = new Schema<IProductImage>(
  {
    url: { type: String, required: true },
    public_id: { type: String, required: true },
  },
  { _id: false }
);

const ProductSchema = new Schema<IProduct>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: {
        values: [
          "Electronics",
          "Clothes",
          "Snacks",
          "Accessories",
          "Books",
          "Daily essentials",
        ],
        message: "Invalid category",
      },
    },
    condition: {
      type: String,
      required: [true, "Condition is required"],
      enum: {
        values: ["new", "used"],
        message: "Condition must be new or used",
      },
    },
    negotiable: {
      type: Boolean,
      default: false,
    },
    images: {
      type: [ProductImageSchema],
      default: [],
      validate: {
        validator: (arr: IProductImage[]) => arr.length <= 5,
        message: "Maximum 5 images allowed",
      },
    },
    hostel: {
      type: Schema.Types.ObjectId,
      ref: "Hostel",
      required: [true, "Hostel is required"],
    },
    seller: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Seller is required"],
    },
    status: {
      type: String,
      enum: ["active", "sold", "removed"],
      default: "active",
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Text index for search on title and description
ProductSchema.index({ title: "text", description: "text" });

// Regular indexes for common queries
ProductSchema.index({ hostel: 1, status: 1 });
ProductSchema.index({ category: 1, status: 1 });
ProductSchema.index({ seller: 1 });
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ views: -1 });

export default mongoose.model<IProduct>("Product", ProductSchema);
