import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  googleAuth,
  sendMagicLink,
  verifyMagicLink,
  getMe,
  logout,
  updateProfile,
} from "../controllers/authController";
import { protect } from "../middleware/auth";

const router = Router();

const magicLinkLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: "Too many requests. Please try again in 15 minutes." },
});

const googleLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: "Too many requests. Please try again later." },
});

// Google OAuth
router.post("/google", googleLimiter, googleAuth);

// Magic Link
router.post("/magic-link/send", magicLinkLimiter, sendMagicLink);
router.get("/magic-link/verify", verifyMagicLink);

// Shared protected
router.get("/me", protect, getMe);
router.put("/update-profile", protect, updateProfile);
router.post("/logout", protect, logout);

export default router;
