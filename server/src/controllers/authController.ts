import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User";
import { generateToken } from "../utils/token";
import { env } from "../config/env";

// ─────────────────────────────────────────────
// POST /api/auth/register
// Body: { name, email, password, hostel }
// ─────────────────────────────────────────────
export const register = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, hostel } = req.body;

  if (!name || !email || !password || !hostel) {
    res.status(400).json({ success: false, message: "All fields are required" });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    return;
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    res.status(400).json({ success: false, message: "An account with this email already exists" });
    return;
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: hashed,
    hostel,
    isVerified: true,
    lastLogin: new Date(),
  });

  const token = generateToken(user._id, user.tokenVersion);

  res.status(201).json({
    success: true,
    message: "Account created!",
    token,
    user: {
      _id: user._id,
      email: user.email,
      name: user.name,
      hostel: user.hostel,
      isAdmin: user.isAdmin,
    },
  });
};

// ─────────────────────────────────────────────
// POST /api/auth/login
// Body: { email, password }
// ─────────────────────────────────────────────
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ success: false, message: "Email and password are required" });
    return;
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");
  if (!user || !user.password) {
    res.status(401).json({ success: false, message: "Invalid email or password" });
    return;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    res.status(401).json({ success: false, message: "Invalid email or password" });
    return;
  }

  user.lastLogin = new Date();
  await user.save();

  const token = generateToken(user._id, user.tokenVersion);

  res.status(200).json({
    success: true,
    message: "Login successful",
    token,
    user: {
      _id: user._id,
      email: user.email,
      name: user.name,
      hostel: user.hostel,
      isAdmin: user.isAdmin,
      avatar: user.avatar,
    },
  });
};

// ─────────────────────────────────────────────
// GET /api/auth/me  (protected)
// ─────────────────────────────────────────────
export const getMe = async (req: Request, res: Response): Promise<void> => {
  const user = await User.findById(req.user?._id).populate("hostel");
  if (!user) {
    res.status(404).json({ success: false, message: "User not found" });
    return;
  }
  res.status(200).json({
    success: true,
    user: {
      _id: user._id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      isAdmin: user.isAdmin,
      hostel: user.hostel,
    },
  });
};

// ─────────────────────────────────────────────
// POST /api/auth/logout  (protected)
// ─────────────────────────────────────────────
export const logout = async (req: Request, res: Response): Promise<void> => {
  await User.findByIdAndUpdate(req.user?._id, { $inc: { tokenVersion: 1 } });
  res.status(200).json({ success: true, message: "Logged out" });
};
