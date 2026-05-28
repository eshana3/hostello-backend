import { Router } from "express";
import {
  sendOTPHandler,
  verifyOTPHandler,
  getMe,
  logout,
  updateProfile,
} from "../controllers/authController";
import { protect } from "../middleware/auth";

const router = Router();

// Public routes
router.post("/send-otp", sendOTPHandler);
router.post("/verify-otp", verifyOTPHandler);

// Protected routes
router.get("/me", protect, getMe);
router.put("/update-profile", protect, updateProfile);
router.post("/logout", protect, logout);

export default router;
