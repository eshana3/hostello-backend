import { Request, Response } from "express";
import Notification from "../models/Notification";

// ─────────────────────────────────────────────
// GET /api/notifications
// Get paginated notifications for current user
// ─────────────────────────────────────────────
export const getNotifications = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!._id.toString();
    const page = Math.max(1, parseInt((req.query.page as string) || "1"));
    const limit = Math.min(50, parseInt((req.query.limit as string) || "20"));
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ recipient: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments({ recipient: userId }),
      Notification.countDocuments({ recipient: userId, isRead: false }),
    ]);

    res.status(200).json({
      success: true,
      total,
      unreadCount,
      page,
      pages: Math.ceil(total / limit),
      notifications,
    });
  } catch (error) {
    console.error("getNotifications error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch notifications" });
  }
};

// ─────────────────────────────────────────────
// PATCH /api/notifications/:id/read
// Mark a single notification as read
// ─────────────────────────────────────────────
export const markAsRead = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!._id.toString();

    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      res.status(404).json({
        success: false,
        message: "Notification not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    console.error("markAsRead error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update notification" });
  }
};

// ─────────────────────────────────────────────
// POST /api/notifications/mark-all-read
// Mark all notifications as read for user
// ─────────────────────────────────────────────
export const markAllAsRead = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!._id.toString();

    const result = await Notification.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} notifications marked as read`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("markAllAsRead error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to mark notifications as read" });
  }
};
