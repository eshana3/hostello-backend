import { Request, Response } from "express";
import { suggestCategory } from "../services/ai/categoryService";
import { suggestPrice } from "../services/ai/priceService";
import { detectSpam } from "../services/ai/spamService";
import { detectDuplicate } from "../services/ai/duplicateService";
import { detectFraud } from "../services/ai/fraudService";
import { expandSearchQuery } from "../services/ai/searchService";

// POST /api/ai/categorize
export const categorize = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description } = req.body;
    if (!title || !description) {
      res.status(400).json({ success: false, message: "title and description are required" });
      return;
    }
    const result = suggestCategory(title, description);
    res.status(200).json({
      success: true,
      category: result.category,
      confidence: result.confidence,
      scores: result.scores,
    });
  } catch (error) {
    console.error("categorize error:", error);
    res.status(500).json({ success: false, message: "Categorization failed" });
  }
};

// POST /api/ai/price-suggest
export const pricesSuggest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, condition } = req.body;
    if (!category || !condition) {
      res.status(400).json({ success: false, message: "category and condition are required" });
      return;
    }
    if (!["new", "used"].includes(condition)) {
      res.status(400).json({ success: false, message: "condition must be 'new' or 'used'" });
      return;
    }
    const result = suggestPrice(category, condition as "new" | "used");
    res.status(200).json({
      success: true,
      suggestedPrice: result.suggestedPrice,
      range: result.range,
      condition: result.condition,
      category: result.category,
    });
  } catch (error) {
    console.error("pricesSuggest error:", error);
    res.status(500).json({ success: false, message: "Price suggestion failed" });
  }
};

// POST /api/ai/check-listing
export const checkListing = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, price, category, hostelId } = req.body;
    const sellerId = req.user!._id.toString();

    if (!title || !description || !price || !category) {
      res.status(400).json({ success: false, message: "title, description, price and category are required" });
      return;
    }

    // Run all checks in parallel
    const [spam, fraud, duplicate] = await Promise.all([
      Promise.resolve(detectSpam(title, description)),
      Promise.resolve(detectFraud(Number(price), category)),
      hostelId
        ? detectDuplicate(title, sellerId, hostelId)
        : Promise.resolve({ isDuplicate: false }),
    ]);

    res.status(200).json({
      success: true,
      checks: {
        spam: {
          isSpam: spam.isSpam,
          reasons: spam.reasons,
          score: spam.score,
        },
        fraud: {
          isFraudulent: fraud.isFraudulent,
          reason: fraud.reason || null,
          expectedRange: fraud.expectedRange || null,
        },
        duplicate: {
          isDuplicate: duplicate.isDuplicate,
          reason: (duplicate as any).reason || null,
          similarProductId: (duplicate as any).similarProductId || null,
        },
      },
      passed: !spam.isSpam && !fraud.isFraudulent && !duplicate.isDuplicate,
    });
  } catch (error) {
    console.error("checkListing error:", error);
    res.status(500).json({ success: false, message: "Listing check failed" });
  }
};

// POST /api/ai/search-expand
export const searchExpand = async (req: Request, res: Response): Promise<void> => {
  try {
    const { query } = req.body;
    if (!query) {
      res.status(400).json({ success: false, message: "query is required" });
      return;
    }
    const expanded = expandSearchQuery(query);
    res.status(200).json({
      success: true,
      original: query,
      expanded,
    });
  } catch (error) {
    console.error("searchExpand error:", error);
    res.status(500).json({ success: false, message: "Search expansion failed" });
  }
};