import multer from 'multer';
import { UploadApiResponse } from 'cloudinary';
import { cloudinary } from '../config/cloudinary';

// ── Multer memory storage (files stored in RAM as Buffer) ─────────────────────
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// ── Upload buffer to Cloudinary ───────────────────────────────────────────────
export const uploadImageBuffer = (
  buffer: Buffer,
  folder: string = 'hostelhub'
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result: UploadApiResponse | undefined) => {
        if (error) return reject(error);
        if (!result) return reject(new Error('Upload failed: no result'));
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
};

// ── Upload file path to Cloudinary ────────────────────────────────────────────
export const uploadImagePath = async (
  filePath: string,
  folder: string = 'hostelhub'
): Promise<string> => {
  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: 'image',
  });
  return result.secure_url;
};
