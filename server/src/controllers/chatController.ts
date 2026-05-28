import { Request, Response } from "express";
import Chat from "../models/Chat";

// ─────────────────────────────────────────────
// GET /api/chats
// Get all chats for current user
// ─────────────────────────────────────────────
export const getMyChats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!._id.toString();

    const chats = await Chat.find({ participants: userId })
      .sort({ updatedAt: -1 })
      .populate("participants", "name mobile")
      .populate("product", "title images price status")
      .lean();

    // Shape response: attach lastMessage and otherParticipant
    const shaped = chats.map((chat) => {
      const lastMessage =
        chat.messages.length > 0
          ? chat.messages[chat.messages.length - 1]
          : null;

      const unreadCount = chat.messages.filter(
        (m) => !m.read && m.sender.toString() !== userId
      ).length;

      const otherParticipant = (chat.participants as any[]).find(
        (p) => p._id.toString() !== userId
      );

      return {
        _id: chat._id,
        otherParticipant,
        product: chat.product,
        lastMessage,
        unreadCount,
        updatedAt: chat.updatedAt,
      };
    });

    res.status(200).json({ success: true, chats: shaped });
  } catch (error) {
    console.error("getMyChats error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch chats" });
  }
};

// ─────────────────────────────────────────────
// GET /api/chats/:id/messages
// Get paginated messages for a chat
// ─────────────────────────────────────────────
export const getChatMessages = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!._id.toString();
    const { id } = req.params;
    const page = Math.max(1, parseInt((req.query.page as string) || "1"));
    const limit = Math.min(50, parseInt((req.query.limit as string) || "30"));

    const chat = await Chat.findOne({
      _id: id,
      participants: userId,
    })
      .populate("participants", "name mobile")
      .populate("product", "title images price status")
      .lean();

    if (!chat) {
      res
        .status(404)
        .json({ success: false, message: "Chat not found or access denied" });
      return;
    }

    // Paginate messages (newest last, slice from end)
    const totalMessages = chat.messages.length;
    const start = Math.max(0, totalMessages - page * limit);
    const end = totalMessages - (page - 1) * limit;
    const messages = chat.messages.slice(start, end);

    res.status(200).json({
      success: true,
      chatId: chat._id,
      participants: chat.participants,
      product: chat.product,
      messages,
      pagination: {
        page,
        limit,
        total: totalMessages,
        pages: Math.ceil(totalMessages / limit),
        hasMore: start > 0,
      },
    });
  } catch (error) {
    console.error("getChatMessages error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch messages" });
  }
};

// ─────────────────────────────────────────────
// POST /api/chats
// Create or get existing chat between two users
// Body: { recipientId, productId? }
// ─────────────────────────────────────────────
export const createOrGetChat = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const senderId = req.user!._id.toString();
    const { recipientId, productId } = req.body;

    if (!recipientId) {
      res
        .status(400)
        .json({ success: false, message: "recipientId is required" });
      return;
    }

    if (recipientId === senderId) {
      res
        .status(400)
        .json({ success: false, message: "Cannot create chat with yourself" });
      return;
    }

    // Find existing chat
    let chat = await Chat.findOne({
      participants: { $all: [senderId, recipientId] },
      ...(productId ? { product: productId } : {}),
    })
      .populate("participants", "name mobile")
      .populate("product", "title images price status");

    if (chat) {
      res.status(200).json({ success: true, chat, isNew: false });
      return;
    }

    // Create new chat
    chat = await Chat.create({
      participants: [senderId, recipientId],
      product: productId || null,
      messages: [],
    });

    await chat.populate([
      { path: "participants", select: "name mobile" },
      { path: "product", select: "title images price status" },
    ]);

    res.status(201).json({ success: true, chat, isNew: true });
  } catch (error) {
    console.error("createOrGetChat error:", error);
    res.status(500).json({ success: false, message: "Failed to create chat" });
  }
};
