import { Router } from 'express';
import { getListings, createListing } from '../controllers/listing.controller';
import { protect } from '../middleware/auth';

const router = Router();

// Public route — anyone can browse listings
router.get('/', getListings);

// Protected route — only logged-in users can create a listing
router.post('/', protect, createListing);

export default router;
