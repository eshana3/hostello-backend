import Notification, { NotificationType } from "../models/Notification";

// io is imported lazily to avoid circular dependency
// We get it from the socket module only when needed
let _io: any = null;

export const setIO = (ioInstance: any): void => {
  _io = ioInstance;
};

// ─────────────────────────────────────────────────────────────────
// Core function: create a notification and emit real-time event
// ─────────────────────────────────────────────────────────────────
export const createNotification = async (
  recipientId: string,
  type: NotificationType,
  message: string,
  meta?: Record<string, unknown>
): Promise<void> => {
  try {
    const reference = meta?.reference as string | undefined
      || meta?.chatId as string | undefined
      || meta?.productId as string | undefined
      || meta?.pollId as string | undefined
      || null;

    const notification = await Notification.create({
      recipient: recipientId,
      type,
      message,
      isRead: false,
      reference: reference || undefined,
    });

    // Emit real-time notification to user's personal room
    if (_io) {
      _io.to(recipientId).emit("notification", {
        _id: notification._id,
        type: notification.type,
        message: notification.message,
        isRead: notification.isRead,
        reference: notification.reference,
        createdAt: notification.createdAt,
      });
    }

    console.log(
      `[Notification] → ${type} for user ${recipientId}: "${message}"`
    );
  } catch (error) {
    // Notifications should never crash main flow
    console.error("[Notification] Failed to create notification:", error);
  }
};

// ─────────────────────────────────────────────────────────────────
// Convenience helpers for each notification type
// ─────────────────────────────────────────────────────────────────

export const notifyNewMessage = async (
  recipientId: string,
  senderName: string,
  textPreview: string,
  chatId: string
): Promise<void> => {
  await createNotification(
    recipientId,
    "new_message",
    `${senderName || "Someone"} sent you a message: "${textPreview}"`,
    { reference: chatId, chatId }
  );
};

export const notifyProductSold = async (
  sellerId: string,
  productTitle: string,
  productId: string
): Promise<void> => {
  await createNotification(
    sellerId,
    "product_sold",
    `Your listing "${productTitle}" has been marked as sold! 🎉`,
    { reference: productId, productId }
  );
};

export const notifyInterestedBuyer = async (
  sellerId: string,
  buyerName: string,
  productTitle: string,
  productId: string
): Promise<void> => {
  await createNotification(
    sellerId,
    "interested_buyer",
    `${buyerName || "Someone"} is interested in your listing "${productTitle}"`,
    { reference: productId, productId }
  );
};

export const notifyPollReply = async (
  pollCreatorId: string,
  replierName: string,
  itemName: string,
  pollId: string,
  messagePreview: string
): Promise<void> => {
  await createNotification(
    pollCreatorId,
    "poll_reply",
    `${replierName || "Someone"} replied to your poll "${itemName}": "${messagePreview}"`,
    { reference: pollId, pollId }
  );
};
