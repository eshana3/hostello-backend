import multer from "multer";
import { Request, Response, NextFunction } from "express";
import { cloudinary } from "../config/cloudinary";
import { UploadApiResponse } from "cloudinary";

// ── Multer config: store in memory (buffer) ──────────────────────
const storage = multer.memoryStorage();

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, PNG, and WebP images are allowed"));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 5, // max 5 files
  },
});

// ── Multer middlewares ───────────────────────────────────────────
export const uploadSingle = upload.single("image");
export const uploadMultiple = upload.array("images", 5);

// ── Upload buffer to Cloudinary ──────────────────────────────────
export const uploadToCloudinary = (
  buffer: Buffer,
  folder: string = "hostelhub/products"
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        transformation: [
          { width: 800, height: 800, crop: "limit" },
          { quality: "auto:good" },
          { fetch_format: "auto" },
        ],
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error("Cloudinary upload failed"));
        } else {
          resolve(result);
        }
      }
    );
    stream.end(buffer);
  });
};

// ── Delete image from Cloudinary ─────────────────────────────────
export const deleteFromCloudinary = async (
  public_id: string
): Promise<void> => {
  await cloudinary.uploader.destroy(public_id);
};

// ── Error handler for multer errors ─────────────────────────────
export const handleMulterError = (
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      res
        .status(400)
        .json({ success: false, message: "File too large. Max 5MB per image." });
      return;
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      res
        .status(400)
        .json({ success: false, message: "Too many files. Max 5 images." });
      return;
    }
    res.status(400).json({ success: false, message: err.message });
    return;
  }
  if (err instanceof Error) {
    res.status(400).json({ success: false, message: err.message });
    return;
  }
  next(err);
};
