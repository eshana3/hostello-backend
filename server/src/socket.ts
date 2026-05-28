import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { Types } from "mongoose";
import { verifyToken } from "./utils/token";
import Chat from "./models/Chat";
import User from "./models/User";
import {
  createNotification,
} from "./services/notificationService";

// ── Augment Socket type to carry authenticated user ──────────────
interface AuthenticatedUser {
  id: string;
  name?: string;
  hostel?: string;
  tokenVersion: number;
}

interface AuthenticatedSocket extends Socket {
  user: AuthenticatedUser;
}

// ── Online users map: userId → Set of socketIds ──────────────────
// A user can be logged in from multiple devices/tabs simultaneously
const onlineUsers = new Map<string, Set<string>>();

// ── Socket.io server instance (exported for use elsewhere) ───────
let io: SocketIOServer;

// ─────────────────────────────────────────────────────────────────
// init — attach Socket.io to an existing HTTP server
// ─────────────────────────────────────────────────────────────────
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

  // ── Authentication middleware ──────────────────────────────────
  io.use(async (socket, next) => {
    try {
      // Extract token from handshake auth or query string or cookie
      const token =
        (socket.handshake.auth?.token as string | undefined) ||
        (socket.handshake.query?.token as string | undefined) ||
        extractTokenFromCookie(socket.handshake.headers.cookie);

      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      // Verify JWT
      let decoded;
      try {
        decoded = verifyToken(token);
      } catch {
        return next(new Error("Authentication error: Invalid or expired token"));
      }

      // Fetch user from DB to get name, hostel, tokenVersion
      const user = await User.findById(decoded.userId).populate(
        "hostel",
        "name type number"
      );

      if (!user) {
        return next(new Error("Authentication error: User not found"));
      }

      if (!user.isVerified) {
        return next(new Error("Authentication error: Account not verified"));
      }

      // tokenVersion check (handles logout-all)
      if (user.tokenVersion !== decoded.tokenVersion) {
        return next(
          new Error("Authentication error: Token invalidated. Please log in again.")
        );
      }

      // Attach user to socket
      (socket as AuthenticatedSocket).user = {
        id: user._id.toString(),
        name: user.name,
        hostel: user.hostel?.toString(),
        tokenVersion: user.tokenVersion,
      };

      next();
    } catch (err) {
      console.error("[Socket] Auth middleware error:", err);
      next(new Error("Authentication error: Server error"));
    }
  });

  // ── Connection handler ─────────────────────────────────────────
  io.on("connection", (rawSocket: Socket) => {
    const socket = rawSocket as AuthenticatedSocket;
    const userId = socket.user.id;

    console.log(`[Socket] ✅ Connected: ${userId} (${socket.id})`);

    // ── Join personal room ───────────────────────────────────────
    socket.join(userId);

    // ── Track online users ───────────────────────────────────────
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId)!.add(socket.id);

    // Broadcast to everyone that this user is online
    socket.broadcast.emit("user_online", { userId });

    // Send current online users list to the newly connected socket
    socket.emit(
      "online_users",
      Array.from(onlineUsers.keys())
    );

    // ── join_chat event ──────────────────────────────────────────
    socket.on(
      "join_chat",
      async (payload: { chatId: string }) => {
        try {
          const { chatId } = payload;

          if (!chatId || !Types.ObjectId.isValid(chatId)) {
            socket.emit("error", { message: "Invalid chatId" });
            return;
          }

          // Verify user is a participant
          const chat = await Chat.findOne({
            _id: chatId,
            participants: new Types.ObjectId(userId),
          });

          if (!chat) {
            socket.emit("error", {
              message: "Chat not found or you are not a participant",
            });
            return;
          }

          socket.join(chatId);
          socket.emit("joined_chat", { chatId });
          console.log(`[Socket] ${userId} joined chat room ${chatId}`);
        } catch (err) {
          console.error("[Socket] join_chat error:", err);
          socket.emit("error", { message: "Failed to join chat" });
        }
      }
    );

    // ── send_message event ───────────────────────────────────────
    socket.on(
      "send_message",
      async (payload: {
        to: string;
        text: string;
        productId?: string;
      }) => {
        try {
          const { to, text, productId } = payload;

          // Validate
          if (!to || !text?.trim()) {
            socket.emit("error", {
              message: "Recipient (to) and text are required",
            });
            return;
          }

          if (!Types.ObjectId.isValid(to)) {
            socket.emit("error", { message: "Invalid recipient userId" });
            return;
          }

          if (to === userId) {
            socket.emit("error", {
              message: "You cannot send a message to yourself",
            });
            return;
          }

          // Find existing chat between the two users
          // If productId given, try to match on that too first
          let chat = await Chat.findOne({
            participants: {
              $all: [
                new Types.ObjectId(userId),
                new Types.ObjectId(to),
              ],
            },
            ...(productId && Types.ObjectId.isValid(productId)
              ? { product: new Types.ObjectId(productId) }
              : {}),
          });

          // If no chat exists, create one
          if (!chat) {
            chat = await Chat.create({
              participants: [
                new Types.ObjectId(userId),
                new Types.ObjectId(to),
              ],
              product:
                productId && Types.ObjectId.isValid(productId)
                  ? new Types.ObjectId(productId)
                  : undefined,
              messages: [],
            });
          } else if (
            productId &&
            Types.ObjectId.isValid(productId) &&
            !chat.product
          ) {
            // Attach product to existing chat if not already set
            chat.product = new Types.ObjectId(productId);
          }

          // Push new message
          const newMessage = {
            sender: new Types.ObjectId(userId),
            text: text.trim(),
            timestamp: new Date(),
            read: false,
          };

          chat.messages.push(newMessage as any);
          await chat.save();

          // Get the saved message (last in array, has _id assigned by Mongo)
          const savedMessage =
            chat.messages[chat.messages.length - 1];

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

          // Emit to sender's personal room
          io.to(userId).emit("new_message", messagePayload);

          // Emit to recipient's personal room
          io.to(to).emit("new_message", messagePayload);

          // Emit to the shared chat room (if anyone joined it)
          io.to(chat._id.toString()).emit("new_message", messagePayload);

          // Create notification for recipient
          const textPreview =
            text.length > 50 ? text.substring(0, 50) + "…" : text;
          await createNotification(to, "new_message", textPreview, {
            chatId: chat._id.toString(),
            senderId: userId,
            senderName: socket.user.name,
          });

          console.log(
            `[Socket] Message sent: ${userId} → ${to} in chat ${chat._id}`
          );
        } catch (err) {
          console.error("[Socket] send_message error:", err);
          socket.emit("error", { message: "Failed to send message" });
        }
      }
    );

    // ── mark_read event ──────────────────────────────────────────
    socket.on(
      "mark_read",
      async (payload: { chatId: string }) => {
        try {
          const { chatId } = payload;

          if (!chatId || !Types.ObjectId.isValid(chatId)) {
            socket.emit("error", { message: "Invalid chatId" });
            return;
          }

          // Verify participant
          const chat = await Chat.findOne({
            _id: chatId,
            participants: new Types.ObjectId(userId),
          });

          if (!chat) {
            socket.emit("error", {
              message: "Chat not found or access denied",
            });
            return;
          }

          // Mark all messages NOT sent by current user as read
          let updated = false;
          chat.messages.forEach((msg) => {
            if (
              msg.sender.toString() !== userId &&
              msg.read === false
            ) {
              msg.read = true;
              updated = true;
            }
          });

          if (updated) {
            await chat.save();
          }

          // Notify everyone in the chat room that messages were read
          io.to(chatId).emit("messages_read", {
            chatId,
            readBy: userId,
          });

          console.log(`[Socket] Messages marked read in chat ${chatId} by ${userId}`);
        } catch (err) {
          console.error("[Socket] mark_read error:", err);
          socket.emit("error", { message: "Failed to mark messages as read" });
        }
      }
    );

    // ── disconnect ───────────────────────────────────────────────
    socket.on("disconnect", (reason) => {
      console.log(
        `[Socket] ❌ Disconnected: ${userId} (${socket.id}) — reason: ${reason}`
      );

      // Remove this socket from the user's set
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);

        // Only broadcast offline if user has NO remaining sockets
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          socket.broadcast.emit("user_offline", { userId });
          console.log(`[Socket] 🔴 User offline: ${userId}`);
        }
      }
    });
  });

  console.log("✅ Socket.io initialized");
  return io;
};

// ── Helper: extract Bearer token from cookie string ─────────────
const extractTokenFromCookie = (
  cookieHeader?: string
): string | undefined => {
  if (!cookieHeader) return undefined;
  const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
  return match ? match[1] : undefined;
};

// ── Utility: get online users map (for REST endpoints if needed) ─
export const getOnlineUsers = (): Map<string, Set<string>> => onlineUsers;

// ── Export io instance ───────────────────────────────────────────
export { io };
