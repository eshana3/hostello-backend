import { Router, Request, Response, NextFunction } from "express";
import { register, login, getMe, logout } from "../controllers/authController";
import { protect } from "../middleware/auth";

const router = Router();

// Simple rate limiter
const attempts = new Map<string, { count: number; reset: number }>();
const rateLimit = (max: number, windowMs: number) => (req: Request, res: Response, next: NextFunction): void => {
  const key = req.ip || "unknown";
  const now = Date.now();
  const rec = attempts.get(key);
  if (!rec || now > rec.reset) { attempts.set(key, { count: 1, reset: now + windowMs }); next(); return; }
  if (rec.count >= max) { res.status(429).json({ success: false, message: "Too many attempts. Try again later." }); return; }
  rec.count++;
  next();
};

router.post("/register", rateLimit(10, 15 * 60 * 1000), register);
router.post("/login",    rateLimit(10, 15 * 60 * 1000), login);
router.get("/me",        protect, getMe);
router.post("/logout",   protect, logout);

export default router;
