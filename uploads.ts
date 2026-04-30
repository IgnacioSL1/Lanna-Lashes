/**
 * Upload route — S3 presigned URL for community post images
 * POST /api/uploads/presign
 */
import { Router, Response } from 'express';
import AWS from 'aws-sdk';
import { v4 as uuid } from 'uuid';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const s3 = new AWS.S3({ region: process.env.AWS_REGION });

router.post('/presign', authenticate, async (req: AuthRequest, res: Response) => {
  const { filename, contentType } = req.body;
  const ext = filename?.split('.').pop() ?? 'jpg';
  const key = `community/${req.userId}/${uuid()}.${ext}`;

  const url = await s3.getSignedUrlPromise('putObject', {
    Bucket:      process.env.AWS_S3_BUCKET,
    Key:         key,
    ContentType: contentType ?? 'image/jpeg',
    Expires:     300,
  });

  res.json({
    uploadUrl: url,
    publicUrl: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
  });
});

export default router;
