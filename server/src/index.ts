import express from "express";
import { createServer } from "http";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db";
import { configureCloudinary } from "./config/cloudinary";
import { initSocket } from "./socket";
import authRoutes from "./routes/auth";
import productRoutes from "./routes/products";
import chatRoutes from "./routes/chats";
import pollRoutes from "./routes/polls";
import notificationRoutes from "./routes/notifications";
import adminRoutes from "./routes/admin";
import aiRoutes from "./routes/ai";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

// ── Connect to MongoDB ───────────────────────
connectDB();

// ── Configure Cloudinary ─────────────────────
configureCloudinary();

// ── Initialize Socket.io ─────────────────────
initSocket(httpServer);

// ── Middleware ───────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ───────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/polls", pollRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/ai", aiRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "HostelHub API is running 🚀" });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ── Start server ─────────────────────────────
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || "development"}`);
});

export default app;
