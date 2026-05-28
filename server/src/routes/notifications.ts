import { Router } from "express";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from "../controllers/notificationController";
import { protect } from "../middleware/auth";

const router = Router();

// All notification routes are protected
router.use(protect);

router.get("/", getNotifications);
router.patch("/:id/read", markAsRead);
router.post("/mark-all-read", markAllAsRead);

export default router;
