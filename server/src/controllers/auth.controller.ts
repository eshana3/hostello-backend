import { Request, Response } from "express";
import User from "../models/User";
import { generateOTP, hashOTP, verifyOTPHash, getOTPExpiry, sendOTP } from "../utils/otp";
import { generateToken } from "../utils/token";

// POST /api/auth/send-otp
export const sendOTPHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { mobile } = req.body;

    if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
      res.status(400).json({ success: false, message: "Please provide a valid 10-digit Indian mobile number" });
      return;
    }

    const otp = generateOTP();
    const hashedOTP = hashOTP(otp);
    const otpExpires = getOTPExpiry();

    let user = await User.findOne({ mobile });

    if (!user) {
      user = await User.create({ mobile, otp: hashedOTP, otpExpires, isVerified: false });
    } else {
      user.otp = hashedOTP;
      user.otpExpires = otpExpires;
      await user.save();
    }

    await sendOTP(mobile, otp);

    res.status(200).json({
      success: true,
      message: `OTP sent to ${mobile}`,
      ...(process.env.NODE_ENV !== "production" && { devOTP: otp }),
    });
  } catch (error) {
    console.error("sendOTP error:", error);
    res.status(500).json({ success: false, message: "Failed to send OTP" });
  }
};

// POST /api/auth/verify-otp
export const verifyOTPHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { mobile, otp } = req.body;

    if (!mobile || !otp) {
      res.status(400).json({ success: false, message: "Mobile and OTP are required" });
      return;
    }

    const user = await User.findOne({ mobile }).select("+otp +otpExpires");

    if (!user) {
      res.status(404).json({ success: false, message: "User not found. Please request an OTP first." });
      return;
    }

    if (!user.otp || !user.otpExpires) {
      res.status(400).json({ success: false, message: "No OTP found. Please request a new one." });
      return;
    }

    if (user.otpExpires < new Date()) {
      res.status(400).json({ success: false, message: "OTP has expired. Please request a new one." });
      return;
    }

    if (!verifyOTPHash(otp, user.otp)) {
      res.status(400).json({ success: false, message: "Invalid OTP. Please try again." });
      return;
    }

    const isNewUser = !user.isVerified;
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    user.lastLogin = new Date(); // ← track last login for DAU
    await user.save();

    const token = generateToken(user._id, user.tokenVersion);
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
        isAdmin: user.isAdmin,
        hostel: user.hostel,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("verifyOTP error:", error);
    res.status(500).json({ success: false, message: "OTP verification failed" });
  }
};

// GET /api/auth/me
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?._id).populate("hostel");
    if (!user) { res.status(404).json({ success: false, message: "User not found" }); return; }
    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        mobile: user.mobile,
        name: user.name,
        isVerified: user.isVerified,
        isAdmin: user.isAdmin,
        hostel: user.hostel,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("getMe error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch user" });
  }
};

// POST /api/auth/logout
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    await User.findByIdAndUpdate(req.user?._id, { $inc: { tokenVersion: 1 } });
    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("logout error:", error);
    res.status(500).json({ success: false, message: "Logout failed" });
  }
};
