import mongoose, { Document, Schema, Types } from "mongoose";

export type NotificationType =
  | "new_message"
  | "product_sold"
  | "interested_buyer"
  | "poll_reply"
  | "product_removed"
  | "general";

export interface INotification extends Document {
  _id: Types.ObjectId;
  recipient: Types.ObjectId;
  type: NotificationType;
  message: string;
  isRead: boolean;
  reference?: string; // e.g. chatId, productId, pollId
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Recipient is required"],
    },
    type: {
      type: String,
      required: [true, "Notification type is required"],
      enum: {
        values: [
          "new_message",
          "product_sold",
          "interested_buyer",
          "poll_reply",
          "product_removed",
          "general",
        ],
        message: "Invalid notification type",
      },
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      maxlength: [300, "Message cannot exceed 300 characters"],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    reference: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Indexes
NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, isRead: 1 });

export default mongoose.model<INotification>(
  "Notification",
  NotificationSchema
);
