import { Router } from "express";
import { protect } from "../middleware/auth";
import { adminOnly } from "../middleware/admin";
import {
  getStats,
  getHostelActivity,
  getCategorySales,
  getChatActivity,
  getRecentActivity,
} from "../controllers/adminController";

const router = Router();

// All admin routes: must be authenticated AND be admin
router.use(protect, adminOnly);

router.get("/stats", getStats);
router.get("/hostel-activity", getHostelActivity);
router.get("/category-sales", getCategorySales);
router.get("/chat-activity", getChatActivity);
router.get("/recent-activity", getRecentActivity);

export default router;
