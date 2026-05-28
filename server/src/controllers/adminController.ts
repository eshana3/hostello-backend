import { Request, Response } from "express";
import User from "../models/User";
import Product from "../models/Product";
import Chat from "../models/Chat";
import PollRequest from "../models/PollRequest";
import { getOnlineUsers } from "../socket";

export const getStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const [totalUsers, totalProducts, activeListings, soldProducts, totalChats, totalPolls, dailyActiveUsers] = await Promise.all([
      User.countDocuments({ isVerified: true }),
      Product.countDocuments(),
      Product.countDocuments({ status: "active" }),
      Product.countDocuments({ status: "sold" }),
      Chat.countDocuments(),
      PollRequest.countDocuments(),
      User.countDocuments({ lastLogin: { $gte: todayStart } }),
    ]);
    const onlineList = getOnlineUsers();
    const liveActiveUsers = Array.isArray(onlineList) ? onlineList.length : 0;
    res.status(200).json({ success: true, stats: { totalUsers, totalProducts, activeListings, soldProducts, totalChats, totalPolls, dailyActiveUsers, liveActiveUsers } });
  } catch (error) {
    console.error("getStats error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch stats" });
  }
};

export const getHostelActivity = async (req: Request, res: Response): Promise<void> => {
  try {
    const productActivity = await Product.aggregate([
      { $group: { _id: "$hostel", totalProducts: { $sum: 1 }, soldProducts: { $sum: { $cond: [{ $eq: ["$status", "sold"] }, 1, 0] } }, activeProducts: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } } } },
      { $lookup: { from: "hostels", localField: "_id", foreignField: "_id", as: "hostel" } },
      { $unwind: { path: "$hostel", preserveNullAndEmptyArrays: true } },
      { $project: { hostelName: "$hostel.name", hostelType: "$hostel.type", totalProducts: 1, soldProducts: 1, activeProducts: 1 } },
      { $sort: { totalProducts: -1 } },
    ]);
    res.status(200).json({ success: true, hostelActivity: productActivity });
  } catch (error) {
    console.error("getHostelActivity error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch hostel activity" });
  }
};

export const getCategorySales = async (req: Request, res: Response): Promise<void> => {
  try {
    const categorySales = await Product.aggregate([
      { $group: { _id: "$category", total: { $sum: 1 }, sold: { $sum: { $cond: [{ $eq: ["$status", "sold"] }, 1, 0] } }, active: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } }, avgPrice: { $avg: "$price" } } },
      { $project: { category: "$_id", total: 1, sold: 1, active: 1, avgPrice: { $round: ["$avgPrice", 2] } } },
      { $sort: { sold: -1 } },
    ]);
    res.status(200).json({ success: true, categorySales });
  } catch (error) {
    console.error("getCategorySales error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch category sales" });
  }
};

export const getChatActivity = async (req: Request, res: Response): Promise<void> => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const chatActivity = await Chat.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, chats: { $sum: 1 }, totalMessages: { $sum: { $size: "$messages" } } } },
      { $sort: { _id: 1 } },
      { $project: { date: "$_id", chats: 1, totalMessages: 1, _id: 0 } },
    ]);
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split("T")[0];
      const found = chatActivity.find((c: any) => c.date === dateStr);
      result.push({ date: dateStr, chats: found?.chats || 0, totalMessages: found?.totalMessages || 0 });
    }
    res.status(200).json({ success: true, chatActivity: result });
  } catch (error) {
    console.error("getChatActivity error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch chat activity" });
  }
};

export const getRecentActivity = async (req: Request, res: Response): Promise<void> => {
  try {
    const [recentUsers, recentSold, recentPolls] = await Promise.all([
      User.find({ isVerified: true }).sort({ createdAt: -1 }).limit(20).select("name mobile createdAt").lean(),
      Product.find({ status: "sold" }).sort({ updatedAt: -1 }).limit(20).populate("seller", "name mobile").populate("hostel", "name type").select("title price status updatedAt seller hostel").lean(),
      PollRequest.find().sort({ createdAt: -1 }).limit(20).populate("buyer", "name mobile").populate("hostel", "name type").select("itemName category status createdAt buyer hostel").lean(),
    ]);
    const activities = [
      ...recentUsers.map((u: any) => ({ type: "new_user", description: `New user joined: ${u.name || u.mobile}`, timestamp: u.createdAt, data: u })),
      ...recentSold.map((p: any) => ({ type: "product_sold", description: `Product sold: "${p.title}" for ₹${p.price}`, timestamp: p.updatedAt, data: p })),
      ...recentPolls.map((poll: any) => ({ type: "new_poll", description: `New poll: "${poll.itemName}"`, timestamp: poll.createdAt, data: poll })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 20);
    res.status(200).json({ success: true, activities });
  } catch (error) {
    console.error("getRecentActivity error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch recent activity" });
  }
};