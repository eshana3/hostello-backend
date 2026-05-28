import { Request, Response } from "express";
import PollRequest from "../models/PollRequest";
import { notifyPollReply } from "../services/notificationService";

export const createPoll = async (req: Request, res: Response): Promise<void> => {
  try {
    const { itemName, description, category, maxPrice, hostel } = req.body;
    if (!itemName || !description || !category || !hostel) {
      res.status(400).json({ success: false, message: "Please provide all required fields" });
      return;
    }
    const poll = await PollRequest.create({
      buyer: req.user!._id, itemName, description, category,
      maxPrice: maxPrice ? Number(maxPrice) : null, hostel, status: "open",
    });
    await poll.populate([
      { path: "buyer", select: "name mobile" },
      { path: "hostel", select: "name type number" },
    ]);
    res.status(201).json({ success: true, message: "Poll created successfully", poll });
  } catch (error: unknown) {
    console.error("createPoll error:", error);
    if (error instanceof Error && error.message.includes("validation failed")) {
      res.status(400).json({ success: false, message: error.message }); return;
    }
    res.status(500).json({ success: false, message: "Failed to create poll" });
  }
};

export const getPolls = async (req: Request, res: Response): Promise<void> => {
  try {
    const { hostel, category, search, page = "1", limit = "20", status = "open" } = req.query;
    const filter: Record<string, unknown> = { status };
    if (hostel) filter.hostel = hostel;
    if (category) filter.category = category;
    if (search) filter.$text = { $search: search as string };

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    const [polls, total] = await Promise.all([
      PollRequest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum)
        .populate("buyer", "name mobile").populate("hostel", "name type number").lean(),
      PollRequest.countDocuments(filter),
    ]);

    res.status(200).json({ success: true, total, page: pageNum, pages: Math.ceil(total / limitNum), limit: limitNum, polls });
  } catch (error) {
    console.error("getPolls error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch polls" });
  }
};

export const getPollById = async (req: Request, res: Response): Promise<void> => {
  try {
    const poll = await PollRequest.findById(req.params.id)
      .populate("buyer", "name mobile hostel")
      .populate("hostel", "name type number")
      .populate("replies.seller", "name mobile");
    if (!poll) { res.status(404).json({ success: false, message: "Poll not found" }); return; }
    res.status(200).json({ success: true, poll });
  } catch (error) {
    console.error("getPollById error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch poll" });
  }
};

export const replyToPoll = async (req: Request, res: Response): Promise<void> => {
  try {
    const { message } = req.body;
    const sellerId = req.user!._id.toString();
    const sellerName = req.user!.name || "Someone";

    if (!message?.trim()) {
      res.status(400).json({ success: false, message: "Reply message is required" });
      return;
    }

    const poll = await PollRequest.findById(req.params.id);
    if (!poll) { res.status(404).json({ success: false, message: "Poll not found" }); return; }
    if (poll.status === "closed") {
      res.status(400).json({ success: false, message: "Cannot reply to a closed poll" }); return;
    }
    if (poll.buyer.toString() === sellerId) {
      res.status(403).json({ success: false, message: "Cannot reply to your own poll" }); return;
    }

    poll.replies.push({ seller: sellerId, message: message.trim(), createdAt: new Date() } as any);
    await poll.save();
    await poll.populate("replies.seller", "name mobile");

    const newReply = poll.replies[poll.replies.length - 1];

    // 🔔 Real notification
    const preview = message.length > 60 ? message.substring(0, 60) + "..." : message;
    await notifyPollReply(
      poll.buyer.toString(),
      sellerName,
      poll.itemName,
      poll._id.toString(),
      preview
    );

    res.status(201).json({ success: true, message: "Reply added successfully", reply: newReply });
  } catch (error) {
    console.error("replyToPoll error:", error);
    res.status(500).json({ success: false, message: "Failed to add reply" });
  }
};

export const closePoll = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id.toString();
    const poll = await PollRequest.findById(req.params.id);
    if (!poll) { res.status(404).json({ success: false, message: "Poll not found" }); return; }
    if (poll.buyer.toString() !== userId) {
      res.status(403).json({ success: false, message: "Only the poll creator can close it." }); return;
    }
    if (poll.status === "closed") {
      res.status(400).json({ success: false, message: "Poll is already closed" }); return;
    }
    poll.status = "closed";
    await poll.save();
    res.status(200).json({ success: true, message: "Poll closed successfully", poll });
  } catch (error) {
    console.error("closePoll error:", error);
    res.status(500).json({ success: false, message: "Failed to close poll" });
  }
};
