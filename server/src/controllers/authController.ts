import { Request, Response } from "express";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User";
import Hostel from "../models/Hostel";
import { generateToken } from "../utils/token";
import { sendMagicLinkEmail } from "../utils/email";
import { env } from "../config/env";

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

// ─────────────────────────────────────────────
// POST /api/auth/google
// Body: { idToken: string }
// ─────────────────────────────────────────────
export const googleAuth = async (req: Request, res: Response): Promise<void> => {
  const { idToken } = req.body;
  if (!idToken) {
    res.status(400).json({ success: false, message: "Google ID token is required" });
    return;
  }

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload?.email) {
    res.status(401).json({ success: false, message: "Invalid Google token" });
    return;
  }

  const { email, name, picture, sub: googleId } = payload;

  let user = await User.findOne({ $or: [{ googleId }, { email }] }).populate("hostel");

  if (!user) {
    user = await User.create({
      email,
      name: name || email.split("@")[0],
      avatar: picture,
      googleId,
      isVerified: true,
      lastLogin: new Date(),
    });
  } else {
    if (!user.googleId) user.googleId = googleId;
    if (picture && !user.avatar) user.avatar = picture;
    user.isVerified = true;
    user.lastLogin = new Date();
    await user.save();
    await user.populate("hostel");
  }

  const token = generateToken(user._id, user.tokenVersion);
  const isNewUser = !user.name || !user.hostel;

  res.status(200).json({
    success: true,
    message: "Login successful",
    token,
    isNewUser,
    user: {
      _id: user._id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      isVerified: user.isVerified,
      isAdmin: user.isAdmin,
      hostel: user.hostel,
    },
  });
};

// ─────────────────────────────────────────────
// POST /api/auth/magic-link/send
// Body: { email: string }
// ─────────────────────────────────────────────
export const sendMagicLink = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ success: false, message: "Please provide a valid email address" });
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();

  let user = await User.findOne({ email: normalizedEmail }).select("+magicLinkToken +magicLinkExpiry");

  // Rate limit: if a link was sent < 60 seconds ago, block
  if (user?.magicLinkExpiry) {
    const secondsLeft = (user.magicLinkExpiry.getTime() - Date.now()) / 1000;
    if (secondsLeft > 14 * 60) {
      res.status(429).json({ success: false, message: "Please wait 60 seconds before requesting another link" });
      return;
    }
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 min

  if (!user) {
    user = await User.create({
      email: normalizedEmail,
      name: normalizedEmail.split("@")[0],
      magicLinkToken: token,
      magicLinkExpiry: expiry,
      isVerified: false,
    });
  } else {
    user.magicLinkToken = token;
    user.magicLinkExpiry = expiry;
    await user.save();
  }

  const magicLink = `${env.CLIENT_URL}/auth/verify?token=${token}&email=${encodeURIComponent(normalizedEmail)}`;
  await sendMagicLinkEmail(normalizedEmail, user.name || "", magicLink);

  res.status(200).json({ success: true, message: "Magic link sent! Check your email." });
};

// ─────────────────────────────────────────────
// GET /api/auth/magic-link/verify?token=xxx&email=xxx
// ─────────────────────────────────────────────
export const verifyMagicLink = async (req: Request, res: Response): Promise<void> => {
  const { token, email } = req.query as { token: string; email: string };

  if (!token || !email) {
    res.status(400).json({ success: false, message: "Invalid magic link" });
    return;
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() })
    .select("+magicLinkToken +magicLinkExpiry");

  if (
    !user ||
    user.magicLinkToken !== token ||
    !user.magicLinkExpiry ||
    user.magicLinkExpiry < new Date()
  ) {
    res.status(401).json({ success: false, message: "Magic link is invalid or has expired" });
    return;
  }

  user.magicLinkToken = undefined;
  user.magicLinkExpiry = undefined;
  user.isVerified = true;
  user.lastLogin = new Date();
  await user.save();
  await user.populate("hostel");

  const jwtToken = generateToken(user._id, user.tokenVersion);
  const isNewUser = !user.name || !user.hostel;

  res.status(200).json({
    success: true,
    message: "Login successful",
    token: jwtToken,
    isNewUser,
    user: {
      _id: user._id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      isVerified: user.isVerified,
      isAdmin: user.isAdmin,
      hostel: user.hostel,
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
      mobile: user.mobile,
      name: user.name,
      avatar: user.avatar,
      isVerified: user.isVerified,
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
  res.status(200).json({ success: true, message: "Logged out successfully" });
};

// ─────────────────────────────────────────────
// PUT /api/auth/update-profile  (protected)
// Body: { name: string, hostel: string }
// ─────────────────────────────────────────────
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  const { name, hostel: hostelName } = req.body;

  if (!name?.trim()) {
    res.status(400).json({ success: false, message: "Name is required" });
    return;
  }
  if (!hostelName) {
    res.status(400).json({ success: false, message: "Hostel is required" });
    return;
  }

  const hostelDoc = await Hostel.findOne({ name: hostelName.trim() });
  if (!hostelDoc) {
    res.status(400).json({ success: false, message: `Hostel "${hostelName}" not found` });
    return;
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { name: name.trim(), hostel: hostelDoc._id },
    { new: true }
  ).populate("hostel");

  if (!user) {
    res.status(404).json({ success: false, message: "User not found" });
    return;
  }

  res.status(200).json({
    success: true,
    message: "Profile updated",
    user: {
      _id: user._id,
      email: user.email,
      mobile: user.mobile,
      name: user.name,
      isVerified: user.isVerified,
      isAdmin: user.isAdmin,
      hostel: user.hostel,
    },
  });
};
