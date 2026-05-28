import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { verifyToken } from "../utils/token";
import Chat from "../models/Chat";
import User from "../models/User";
import {
  setIO,
  notifyNewMessage,
} from "../services/notificationService";

interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    name?: string;
    hostel?: string;
  };
}

const onlineUsers = new Map<string, Set<string>>();
let io: SocketIOServer;

export const initSocket = (httpServer: HttpServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Pass io to notification service so it can emit real-time events
  setIO(io);

  // ── Auth middleware ──────────────────────────────────────────
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token =
        (socket.handshake.auth?.token as string) ||
        extractTokenFromCookie(socket.handshake.headers.cookie);

      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      let decoded;
      try {
        decoded = verifyToken(token);
      } catch {
        return next(new Error("Authentication error: Invalid or expired token"));
      }

      const user = await User.findById(decoded.userId)
        .populate("hostel", "name type")
        .lean();

      if (!user) return next(new Error("Authentication error: User not found"));
      if (!user.isVerified) return next(new Error("Authentication error: Account not verified"));
      if (user.tokenVersion !== decoded.tokenVersion)
        return next(new Error("Authentication error: Token invalidated"));

      socket.user = {
        id: user._id.toString(),
        name: user.name,
        hostel: user.hostel?.toString(),
      };

      next();
    } catch (err) {
      console.error("[Socket] Auth middleware error:", err);
      next(new Error("Authentication error: Server error"));
    }
  });

  // ── Connection ───────────────────────────────────────────────
  io.on("connection", (socket: AuthenticatedSocket) => {
    const userId = socket.user!.id;
    console.log(`[Socket] ✅ Connected: ${userId} (${socket.id})`);

    socket.join(userId);

    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId)!.add(socket.id);
    socket.broadcast.emit("user_online", { userId });

    // ── join_chat ──────────────────────────────────────────────
    socket.on("join_chat", async (payload: { chatId: string }, cb?: Function) => {
      try {
        const { chatId } = payload;
        if (!chatId) { socket.emit("error", { message: "chatId is required" }); return; }

        const chat = await Chat.findOne({ _id: chatId, participants: userId });
        if (!chat) { socket.emit("error", { message: "Chat not found or access denied" }); return; }

        socket.join(chatId);
        if (typeof cb === "function") cb({ success: true, chatId });
      } catch (err) {
        console.error("[Socket] join_chat error:", err);
        socket.emit("error", { message: "Failed to join chat" });
      }
    });

    // ── send_message ───────────────────────────────────────────
    socket.on(
      "send_message",
      async (payload: { to: string; text: string; productId?: string }, cb?: Function) => {
        try {
          const { to, text, productId } = payload;

          if (!to || !text?.trim()) {
            socket.emit("error", { message: "Recipient and text are required" });
            return;
          }
          if (to === userId) {
            socket.emit("error", { message: "Cannot message yourself" });
            return;
          }

          let chat = await Chat.findOne({
            participants: { $all: [userId, to] },
            ...(productId ? { product: productId } : {}),
          });

          if (!chat) {
            chat = await Chat.create({
              participants: [userId, to],
              product: productId || null,
              messages: [],
            });
          } else if (productId && !chat.product) {
            chat.product = productId as any;
          }

          chat.messages.push({
            sender: userId,
            text: text.trim(),
            timestamp: new Date(),
            read: false,
          } as any);

          await chat.save();

          const savedMessage = chat.messages[chat.messages.length - 1];
          const messagePayload = {
            chatId: chat._id.toString(),
            message: {
              _id: savedMessage._id,
              sender: userId,
              text: savedMessage.text,
              timestamp: savedMessage.timestamp,
              read: savedMessage.read,
            },
          };

          // Emit to sender, recipient, and chat room
          io.to(userId).emit("new_message", messagePayload);
          io.to(to).emit("new_message", messagePayload);
          io.to(chat._id.toString()).emit("new_message", messagePayload);

          // Real notification
          const senderName = socket.user?.name || "Someone";
          const preview = text.length > 50 ? text.substring(0, 50) + "..." : text;
          await notifyNewMessage(to, senderName, preview, chat._id.toString());

          if (typeof cb === "function") cb({ success: true, message: messagePayload.message });
        } catch (err) {
          console.error("[Socket] send_message error:", err);
          socket.emit("error", { message: "Failed to send message" });
        }
      }
    );

    // ── mark_read ──────────────────────────────────────────────
    socket.on("mark_read", async (payload: { chatId: string }, cb?: Function) => {
      try {
        const { chatId } = payload;
        if (!chatId) { socket.emit("error", { message: "chatId is required" }); return; }

        const result = await Chat.updateOne(
          { _id: chatId, participants: userId },
          { $set: { "messages.$[elem].read": true } },
          { arrayFilters: [{ "elem.read": false, "elem.sender": { $ne: userId } }] }
        );

        if (result.matchedCount === 0) {
          socket.emit("error", { message: "Chat not found or access denied" });
          return;
        }

        io.to(chatId).emit("messages_read", { chatId, readBy: userId, timestamp: new Date() });
        if (typeof cb === "function") cb({ success: true });
      } catch (err) {
        console.error("[Socket] mark_read error:", err);
        socket.emit("error", { message: "Failed to mark messages as read" });
      }
    });

    // ── disconnect ─────────────────────────────────────────────
    socket.on("disconnect", (reason) => {
      console.log(`[Socket] ❌ Disconnected: ${userId} (${socket.id}) — ${reason}`);
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          socket.broadcast.emit("user_offline", { userId });
        }
      }
    });
  });

  console.log("✅ Socket.io initialized");
  return io;
};

const extractTokenFromCookie = (cookieHeader?: string): string | null => {
  if (!cookieHeader) return null;
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const [k, ...v] = c.trim().split("=");
      return [k.trim(), v.join("=")];
    })
  );
  return cookies["token"] || null;
};

export const isUserOnline = (userId: string): boolean =>
  onlineUsers.has(userId) && onlineUsers.get(userId)!.size > 0;

export const getOnlineUsers = (): string[] => Array.from(onlineUsers.keys());

export { io };
