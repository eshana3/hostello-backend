import { Request, Response } from "express";
import Product from "../models/Product";
import { uploadToCloudinary, deleteFromCloudinary } from "../middleware/upload";
import { notifyProductSold } from "../services/notificationService";
import { detectSpam } from "../services/ai/spamService";
import { detectDuplicate } from "../services/ai/duplicateService";
import { detectFraud } from "../services/ai/fraudService";
import { expandSearchQuery } from "../services/ai/searchService";

// POST /api/products
export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, price, category, condition, negotiable, hostel } = req.body;

    if (!title || !description || !price || !category || !condition || !hostel) {
      res.status(400).json({ success: false, message: "Please provide all required fields" });
      return;
    }

    const sellerId = req.user!._id.toString();
    const numericPrice = Number(price);

    // ── AI Checks ────────────────────────────────────────────────

    // 1. Spam check
    const spam = detectSpam(title, description);
    if (spam.isSpam) {
      res.status(400).json({ success: false, message: "Listing flagged as spam", reasons: spam.reasons });
      return;
    }

    // 2. Fraud check
    const fraud = detectFraud(numericPrice, category);
    if (fraud.isFraudulent) {
      res.status(400).json({ success: false, message: "Listing flagged: suspicious price", reason: fraud.reason, expectedRange: fraud.expectedRange });
      return;
    }

    // 3. Duplicate check
    const duplicate = await detectDuplicate(title, sellerId, hostel);
    if (duplicate.isDuplicate) {
      res.status(400).json({ success: false, message: "Potential duplicate listing detected", reason: duplicate.reason, similarProductId: duplicate.similarProductId });
      return;
    }

    // ── Upload images ────────────────────────────────────────────
    const files = req.files as Express.Multer.File[];
    const uploadedImages: { url: string; public_id: string }[] = [];

    if (files && files.length > 0) {
      for (const file of files) {
        const result = await uploadToCloudinary(file.buffer);
        uploadedImages.push({ url: result.secure_url, public_id: result.public_id });
      }
    }

    const product = await Product.create({
      title, description,
      price: numericPrice,
      category, condition,
      negotiable: negotiable === "true" || negotiable === true,
      images: uploadedImages,
      hostel,
      seller: sellerId,
      status: "active",
    });

    await product.populate([
      { path: "seller", select: "name mobile" },
      { path: "hostel", select: "name type number" },
    ]);

    res.status(201).json({ success: true, message: "Product created successfully", product });
  } catch (error: unknown) {
    console.error("createProduct error:", error);
    if (error instanceof Error && error.message.includes("validation failed")) {
      res.status(400).json({ success: false, message: error.message });
      return;
    }
    res.status(500).json({ success: false, message: "Failed to create product" });
  }
};

// GET /api/products
export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { hostel, category, search, sort = "latest", page = "1", limit = "20", condition, minPrice, maxPrice } = req.query;
    const filter: Record<string, unknown> = { status: "active" };

    if (hostel) filter.hostel = hostel;
    if (category) filter.category = category;
    if (condition) filter.condition = condition;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) (filter.price as Record<string, number>).$gte = Number(minPrice);
      if (maxPrice) (filter.price as Record<string, number>).$lte = Number(maxPrice);
    }

    if (search) {
      // Use smart search expansion
      const expanded = expandSearchQuery(search as string);
      filter.$text = { $search: expanded };
    }

    let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
    if (sort === "price_asc") sortOption = { price: 1 };
    else if (sort === "price_desc") sortOption = { price: -1 };
    else if (sort === "popular") sortOption = { views: -1 };

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(filter).sort(sortOption).skip(skip).limit(limitNum)
        .populate("seller", "name mobile")
        .populate("hostel", "name type number").lean(),
      Product.countDocuments(filter),
    ]);

    res.status(200).json({ success: true, total, page: pageNum, pages: Math.ceil(total / limitNum), limit: limitNum, products });
  } catch (error) {
    console.error("getProducts error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch products" });
  }
};

// GET /api/products/trending
export const getTrendingProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const products = await Product.find({ status: "active", createdAt: { $gte: sevenDaysAgo } })
      .sort({ views: -1 }).limit(10)
      .populate("seller", "name mobile")
      .populate("hostel", "name type number").lean();

    if (products.length < 5) {
      const allTime = await Product.find({ status: "active" }).sort({ views: -1 }).limit(10)
        .populate("seller", "name mobile").populate("hostel", "name type number").lean();
      res.status(200).json({ success: true, note: "All-time trending", products: allTime });
      return;
    }

    res.status(200).json({ success: true, note: "Trending in last 7 days", products });
  } catch (error) {
    console.error("getTrendingProducts error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch trending" });
  }
};

// GET /api/products/:id
export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id, { $inc: { views: 1 } }, { new: true }
    ).populate("seller", "name mobile hostel").populate("hostel", "name type number");

    if (!product) { res.status(404).json({ success: false, message: "Product not found" }); return; }
    if (product.status === "removed") { res.status(410).json({ success: false, message: "Listing removed" }); return; }

    res.status(200).json({ success: true, product });
  } catch (error) {
    console.error("getProductById error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch product" });
  }
};

// PATCH /api/products/:id/sold
export const markAsSold = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) { res.status(404).json({ success: false, message: "Product not found" }); return; }

    if (product.seller.toString() !== req.user!._id.toString()) {
      res.status(403).json({ success: false, message: "Not authorized" }); return;
    }
    if (product.status === "removed") {
      res.status(400).json({ success: false, message: "Cannot update removed listing" }); return;
    }

    product.status = "sold";
    await product.save();

    await notifyProductSold(product.seller.toString(), product.title, product._id.toString());

    res.status(200).json({ success: true, message: "Product marked as sold", product });
  } catch (error) {
    console.error("markAsSold error:", error);
    res.status(500).json({ success: false, message: "Failed to update product" });
  }
};

// DELETE /api/products/:id
export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) { res.status(404).json({ success: false, message: "Product not found" }); return; }

    if (product.seller.toString() !== req.user!._id.toString()) {
      res.status(403).json({ success: false, message: "Not authorized" }); return;
    }

    product.status = "removed";
    await product.save();

    if (product.images.length > 0) {
      await Promise.allSettled(product.images.map((img) => deleteFromCloudinary(img.public_id).catch(console.error)));
    }

    res.status(200).json({ success: true, message: "Product removed successfully" });
  } catch (error) {
    console.error("deleteProduct error:", error);
    res.status(500).json({ success: false, message: "Failed to delete product" });
  }
};