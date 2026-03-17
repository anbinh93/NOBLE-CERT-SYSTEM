import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { getUploadsBucket, toObjectId } from '../services/gridfs.service';
import { AppError } from '../utils/AppError';

/**
 * GET /api/v1/files/:id
 * Stream a stored file from MongoDB GridFS.
 */
export async function streamFile(req: Request, res: Response) {
  const id = req.params.id;
  let oid: ObjectId;
  try {
    oid = toObjectId(id);
  } catch {
    throw new AppError('File id không hợp lệ', 400);
  }

  const bucket = await getUploadsBucket();
  const files = await bucket.find({ _id: oid }).limit(1).toArray();
  const file = files[0];
  if (!file) throw new AppError('Không tìm thấy file', 404);

  const meta = (file as any).metadata as Record<string, unknown> | undefined;
  const contentType =
    (meta?.contentType as string | undefined) || 'application/octet-stream';

  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Length', String(file.length));
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

  const stream = bucket.openDownloadStream(oid);
  stream.on('error', () => {
    res.status(500).end();
  });
  stream.pipe(res);
}

