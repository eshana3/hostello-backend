import { Router, Request, Response, NextFunction } from "express";
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

// Simple rate limiter without external package
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const createRateLimit = (maxRequests: number, windowMs: number) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || "unknown";
    const now = Date.now();
    const record = rateLimitMap.get(ip);

    if (!record || now > record.resetTime) {
      rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
      next();
      return;
    }

    if (record.count >= maxRequests) {
      res.status(429).json({ success: false, message: "Too many requests. Please try again later." });
      return;
    }

    record.count++;
    next();
  };
};

const magicLinkLimiter = createRateLimit(5, 15 * 60 * 1000);
const googleLimiter = createRateLimit(20, 15 * 60 * 1000);

// Google OAuth
router.post("/google", googleLimiter, googleAuth);

// Magic Link
router.post("/magic-link/send", magicLinkLimiter, sendMagicLink);
router.get("/magic-link/verify", verifyMagicLink);

// Protected routes
router.get("/me", protect, getMe);
router.put("/update-profile", protect, updateProfile);
router.post("/logout", protect, logout);

export default router;
