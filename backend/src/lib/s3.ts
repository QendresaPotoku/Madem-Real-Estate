import {
  CreateBucketCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../config';

let client: S3Client | null = null;

/** S3-compatible client (R2/MinIO). Null when storage isn't configured. */
export function getS3(): S3Client | null {
  if (!config.S3_ENDPOINT || !config.S3_BUCKET || !config.S3_ACCESS_KEY_ID || !config.S3_SECRET_ACCESS_KEY) {
    return null;
  }
  if (!client) {
    client = new S3Client({
      endpoint: config.S3_ENDPOINT,
      region: config.S3_REGION,
      forcePathStyle: true, // required for MinIO
      credentials: {
        accessKeyId: config.S3_ACCESS_KEY_ID,
        secretAccessKey: config.S3_SECRET_ACCESS_KEY,
      },
    });
  }
  return client;
}

export const isStorageConfigured = () => getS3() !== null;

/** Create the bucket if it doesn't exist (best-effort, for local MinIO). */
export async function ensureBucket(): Promise<void> {
  const s3 = getS3();
  if (!s3 || !config.S3_BUCKET) return;
  try {
    await s3.send(new HeadBucketCommand({ Bucket: config.S3_BUCKET }));
  } catch {
    try {
      await s3.send(new CreateBucketCommand({ Bucket: config.S3_BUCKET }));
    } catch {
      /* ignore — bucket may exist or perms differ in prod */
    }
  }

  // Public read for property images + avatars only; documents/* stay private.
  const bucket = config.S3_BUCKET;
  const policy = {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Principal: { AWS: ['*'] },
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${bucket}/properties/*`, `arn:aws:s3:::${bucket}/avatars/*`],
      },
    ],
  };
  try {
    await s3.send(new PutBucketPolicyCommand({ Bucket: bucket, Policy: JSON.stringify(policy) }));
  } catch {
    /* ignore — policy management may be restricted in prod (use CDN/object ACLs there) */
  }
}

/** Presigned PUT URL for a direct browser upload, plus the eventual public URL. */
export async function createUploadUrl(key: string, contentType: string, expiresIn = 300) {
  const s3 = getS3();
  if (!s3 || !config.S3_BUCKET) throw new Error('storage not configured');
  const command = new PutObjectCommand({ Bucket: config.S3_BUCKET, Key: key, ContentType: contentType });
  const uploadUrl = await getSignedUrl(s3, command, { expiresIn });
  return { uploadUrl, publicUrl: publicUrlFor(key) };
}

/** Presigned GET URL for retrieving a private object (e.g. property documents). */
export async function createDownloadUrl(key: string, expiresIn = 300): Promise<string> {
  const s3 = getS3();
  if (!s3 || !config.S3_BUCKET) throw new Error('storage not configured');
  const command = new GetObjectCommand({ Bucket: config.S3_BUCKET, Key: key });
  return getSignedUrl(s3, command, { expiresIn });
}

export function publicUrlFor(key: string): string {
  const base = config.S3_PUBLIC_URL ?? `${config.S3_ENDPOINT}/${config.S3_BUCKET}`;
  return `${base.replace(/\/$/, '')}/${key}`;
}
