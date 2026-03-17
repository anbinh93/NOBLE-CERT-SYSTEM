import { Request, Response } from 'express';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/AppError';
import sharp from 'sharp';
import { getUploadsBucket } from '../services/gridfs.service';

export const uploadCourseThumbnail = async (req: Request, res: Response) => {
  const file = req.file;
  if (!file) throw new AppError('Thiếu file upload', 400);

  // Process image -> WebP (max 1920x1080) to save space while keeping quality.
  const webp = await sharp(file.buffer)
    .rotate() // respect EXIF orientation
    .resize({ width: 1920, height: 1080, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

  const bucket = await getUploadsBucket();
  const uploadStream = bucket.openUploadStream(`course-thumb-${Date.now()}.webp`, {
    metadata: {
      kind: 'course-thumbnail',
      originalName: file.originalname,
      originalMime: file.mimetype,
      contentType: 'image/webp',
      size: webp.length,
    },
  });

  uploadStream.end(webp);
  const saved = await new Promise<{ id: unknown }>((resolve, reject) => {
    uploadStream.on('finish', (f: any) => resolve({ id: f?._id }));
    uploadStream.on('error', reject);
  });

  // Return absolute URL (backend host) + API path
  const relativeUrl = `/api/v1/files/${String(saved.id)}`;
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const url = new URL(relativeUrl, baseUrl).toString();

  sendSuccess(res, 201, { url, path: relativeUrl, fileId: String(saved.id) }, 'Upload thành công');
};

