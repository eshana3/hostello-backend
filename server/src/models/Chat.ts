import mongoose, { Document, Schema, Types } from "mongoose";

// ── Message sub-document interface ──────────────────────────────
export interface IMessage {
  _id: Types.ObjectId;
  sender: Types.ObjectId;
  text: string;
  timestamp: Date;
  read: boolean;
}

// ── Chat document interface ──────────────────────────────────────
export interface IChat extends Document {
  _id: Types.ObjectId;
  participants: Types.ObjectId[];
  product?: Types.ObjectId;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

// ── Message sub-schema ───────────────────────────────────────────
const MessageSchema = new Schema<IMessage>(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Sender is required"],
    },
    text: {
      type: String,
      required: [true, "Message text is required"],
      trim: true,
      maxlength: [1000, "Message cannot exceed 1000 characters"],
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

// ── Chat schema ──────────────────────────────────────────────────
const ChatSchema = new Schema<IChat>(
  {
    participants: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      required: [true, "Participants are required"],
      validate: [
        {
          validator: (arr: Types.ObjectId[]) => arr.length === 2,
          message: "A chat must have exactly 2 participants",
        },
      ],
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },
    messages: {
      type: [MessageSchema],
      default: [],
    },
  },
  {
    timestamps: true, // auto-manages createdAt and updatedAt
  }
);

// ── Indexes ──────────────────────────────────────────────────────
// Fast lookup of all chats a user is part of
ChatSchema.index({ participants: 1 });

// Find existing chat between two users about a product
ChatSchema.index({ participants: 1, product: 1 });

// Sort chats by latest activity
ChatSchema.index({ updatedAt: -1 });

export default mongoose.model<IChat>("Chat", ChatSchema);
