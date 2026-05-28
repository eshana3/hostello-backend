import { Request, Response } from 'express';

// GET /api/listings
export const getListings = async (_req: Request, res: Response): Promise<void> => {
  // TODO: fetch from DB with filters/pagination
  res.status(200).json({
    success: true,
    message: 'Listings endpoint ready',
    data: [],
  });
};

// POST /api/listings
export const createListing = async (req: Request, res: Response): Promise<void> => {
  // TODO: validate body, upload images, save to DB
  res.status(201).json({
    success: true,
    message: 'Create listing endpoint ready',
    data: req.body,
  });
};
