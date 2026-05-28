import { Router } from "express";
import {
  createPoll,
  getPolls,
  getPollById,
  replyToPoll,
  closePoll,
} from "../controllers/pollController";
import { protect } from "../middleware/auth";

const router = Router();

// ── Public routes ────────────────────────────
router.get("/", getPolls);
router.get("/:id", getPollById);

// ── Protected routes ─────────────────────────
router.post("/", protect, createPoll);
router.post("/:id/reply", protect, replyToPoll);
router.patch("/:id/close", protect, closePoll);

export default router;
