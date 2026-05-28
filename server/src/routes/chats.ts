import { Router } from "express";
import {
  getMyChats,
  getChatMessages,
  createOrGetChat,
} from "../controllers/chatController";
import { protect } from "../middleware/auth";

const router = Router();

// All chat routes are protected
router.use(protect);

router.get("/", getMyChats);
router.get("/:id/messages", getChatMessages);
router.post("/", createOrGetChat);

export default router;
