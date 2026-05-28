import { Request, Response } from "express";
import User from "../models/User";
import Hostel from "../models/Hostel";
import { generateOTP, hashOTP, verifyOTPHash, getOTPExpiry, sendOTP } from "../utils/otp";
import { generateToken } from "../utils/token";

// ─────────────────────────────────────────────
// POST /api/auth/send-otp
// Body: { mobile: string }
// ─────────────────────────────────────────────
export const sendOTPHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { mobile } = req.body;

    // Validate mobile
    if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
      res.status(400).json({
        success: false,
        message: "Please provide a valid 10-digit Indian mobile number",
      });
      return;
    }

    // Generate OTP
    const otp = generateOTP();
    const hashedOTP = hashOTP(otp);
    const otpExpires = getOTPExpiry();

    // Find or create user
    let user = await User.findOne({ mobile });

    if (!user) {
      // New user — create with unverified status
      user = await User.create({
        mobile,
        otp: hashedOTP,
        otpExpires,
        isVerified: false,
      });
    } else {
      // Existing user — update OTP (whether verified or not, for re-login)
      user.otp = hashedOTP;
      user.otpExpires = otpExpires;
      await user.save();
    }

    // Send OTP (console.log in dev, real SMS in prod)
    await sendOTP(mobile, otp);

    res.status(200).json({
      success: true,
      message: `OTP sent to ${mobile}`,
      // Only expose in development for testing convenience
      ...(process.env.NODE_ENV !== "production" && { devOTP: otp }),
    });
  } catch (error) {
    console.error("sendOTP error:", error);
    res.status(500).json({ success: false, message: "Failed to send OTP" });
  }
};

// ─────────────────────────────────────────────
// POST /api/auth/verify-otp
// Body: { mobile: string, otp: string }
// ─────────────────────────────────────────────
export const verifyOTPHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { mobile, otp } = req.body;

    if (!mobile || !otp) {
      res.status(400).json({
        success: false,
        message: "Mobile and OTP are required",
      });
      return;
    }

    // Find user — explicitly select otp and otpExpires (they have select: false)
    const user = await User.findOne({ mobile }).select("+otp +otpExpires");

    if (!user) {
      res.status(404).json({ success: false, message: "User not found. Please request an OTP first." });
      return;
    }

    // Check OTP exists
    if (!user.otp || !user.otpExpires) {
      res.status(400).json({ success: false, message: "No OTP found. Please request a new one." });
      return;
    }

    // Check expiry
    if (user.otpExpires < new Date()) {
      res.status(400).json({ success: false, message: "OTP has expired. Please request a new one." });
      return;
    }

    // Verify hash
    if (!verifyOTPHash(otp, user.otp)) {
      res.status(400).json({ success: false, message: "Invalid OTP. Please try again." });
      return;
    }

    // Mark verified, clear OTP, increment tokenVersion on first verify
    const isNewUser = !user.isVerified;
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    if (isNewUser) {
      // tokenVersion stays 0 for new users
    }
    await user.save();

    // Generate JWT
    const token = generateToken(user._id, user.tokenVersion);

    // Populate hostel if exists
    await user.populate("hostel");

    res.status(200).json({
      success: true,
      message: isNewUser ? "Account created and verified successfully" : "Logged in successfully",
      token,
      user: {
        _id: user._id,
        mobile: user.mobile,
        name: user.name,
        isVerified: user.isVerified,
        hostel: user.hostel,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("verifyOTP error:", error);
    res.status(500).json({ success: false, message: "OTP verification failed" });
  }
};

// ─────────────────────────────────────────────
// GET /api/auth/me  (protected)
// ─────────────────────────────────────────────
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?._id).populate("hostel");

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        mobile: user.mobile,
        name: user.name,
        isVerified: user.isVerified,
        hostel: user.hostel,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("getMe error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch user" });
  }
};

// ─────────────────────────────────────────────
// POST /api/auth/logout  (protected)
// Increments tokenVersion to invalidate all existing tokens
// ─────────────────────────────────────────────
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    await User.findByIdAndUpdate(req.user?._id, {
      $inc: { tokenVersion: 1 },
    });

    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("logout error:", error);
    res.status(500).json({ success: false, message: "Logout failed" });
  }
};

// ─────────────────────────────────────────────
// PUT /api/auth/update-profile  (protected)
// Body: { name: string, hostel: string }
// Called once for new users after OTP verification
// ─────────────────────────────────────────────
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, hostel: hostelName } = req.body;

    if (!name?.trim()) {
      res.status(400).json({ success: false, message: "Name is required" });
      return;
    }
    if (!hostelName) {
      res.status(400).json({ success: false, message: "Hostel is required" });
      return;
    }

    // Resolve hostel name (e.g. "KP-3") to its ObjectId
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
        mobile: user.mobile,
        name: user.name,
        hostel: user.hostel,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error("updateProfile error:", error);
    res.status(500).json({ success: false, message: "Failed to update profile" });
  }
};
