import mongoose, { Document, Schema, Types } from "mongoose";

// ── Reply sub-document interface ─────────────────────────────────
export interface IPollReply {
  _id: Types.ObjectId;
  seller: Types.ObjectId;
  message: string;
  createdAt: Date;
}

// ── PollRequest document interface ───────────────────────────────
export interface IPollRequest extends Document {
  _id: Types.ObjectId;
  buyer: Types.ObjectId;
  itemName: string;
  description: string;
  category:
    | "Electronics"
    | "Clothes"
    | "Snacks"
    | "Accessories"
    | "Books"
    | "Daily essentials"
    | "Other";
  maxPrice?: number;
  hostel: Types.ObjectId;
  status: "open" | "closed";
  replies: IPollReply[];
  createdAt: Date;
  updatedAt: Date;
}

// ── Reply sub-schema ─────────────────────────────────────────────
const PollReplySchema = new Schema<IPollReply>(
  {
    seller: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Seller reference is required"],
    },
    message: {
      type: String,
      required: [true, "Reply message is required"],
      trim: true,
      maxlength: [500, "Reply cannot exceed 500 characters"],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

// ── PollRequest schema ───────────────────────────────────────────
const PollRequestSchema = new Schema<IPollRequest>(
  {
    buyer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Buyer is required"],
    },
    itemName: {
      type: String,
      required: [true, "Item name is required"],
      trim: true,
      maxlength: [100, "Item name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
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
          "Other",
        ],
        message: "Invalid category",
      },
    },
    maxPrice: {
      type: Number,
      min: [0, "Max price cannot be negative"],
      default: null,
    },
    hostel: {
      type: Schema.Types.ObjectId,
      ref: "Hostel",
      required: [true, "Hostel is required"],
    },
    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open",
    },
    replies: {
      type: [PollReplySchema],
      default: [],
    },
  },
  { timestamps: true }
);

// ── Indexes ──────────────────────────────────────────────────────
PollRequestSchema.index({ hostel: 1, status: 1 });
PollRequestSchema.index({ category: 1, status: 1 });
PollRequestSchema.index({ buyer: 1 });
PollRequestSchema.index({ createdAt: -1 });

// Text index for search
PollRequestSchema.index({ itemName: "text", description: "text" });

export default mongoose.model<IPollRequest>("PollRequest", PollRequestSchema);
