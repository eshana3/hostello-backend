import { Router } from "express";
import {
  categorize,
  pricesSuggest,
  checkListing,
  searchExpand,
} from "../controllers/aiController";
import { protect } from "../middleware/auth";

const router = Router();

// Public AI endpoints
router.post("/categorize", categorize);
router.post("/price-suggest", pricesSuggest);
router.post("/search-expand", searchExpand);

// Check listing requires auth (uses sellerId from JWT)
router.post("/check-listing", protect, checkListing);

export default router;
