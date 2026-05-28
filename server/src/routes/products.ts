import { Router } from "express";
import {
  createProduct,
  getProducts,
  getProductById,
  markAsSold,
  deleteProduct,
  getTrendingProducts,
} from "../controllers/productController";
import { protect } from "../middleware/auth";
import { uploadMultiple, handleMulterError } from "../middleware/upload";

const router = Router();

// ── Public routes ────────────────────────────────────────────────
// IMPORTANT: /trending must be defined BEFORE /:id
// otherwise Express matches "trending" as an :id param
router.get("/trending", getTrendingProducts);
router.get("/", getProducts);
router.get("/:id", getProductById);

// ── Protected routes ─────────────────────────────────────────────
router.post(
  "/",
  protect,
  uploadMultiple,
  handleMulterError,
  createProduct
);

router.patch("/:id/sold", protect, markAsSold);
router.delete("/:id", protect, deleteProduct);

export default router;
