import { Router, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { verifyToken, AuthenticatedRequest } from '../middleware/authMiddleware';
import dotenv from 'dotenv';

dotenv.config();

const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const router = Router();

router.post('/', verifyToken, upload.single('image'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  // Config at request-time to ensure process.env variables are fully loaded
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });

  try {
    if (!req.file) {
      res.status(400).json({ message: 'No image file provided' });
      return;
    }

    const base64Format = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    
    const result = await cloudinary.uploader.upload(base64Format, {
      folder: 'agricare'
    });

    res.status(200).json({ url: result.secure_url });
  } catch (error: any) {
    console.error('Cloudinary upload error:', error);
    res.status(500).json({ message: error.message || 'Image upload failed' });
  }
});

export default router;
