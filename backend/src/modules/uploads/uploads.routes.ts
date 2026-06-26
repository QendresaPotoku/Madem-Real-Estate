import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { AppError } from '../../lib/errors';
import { errorResponseSchema } from '../../schemas/common';
import { createUploadUrl, isStorageConfigured } from '../../lib/s3';

const ALLOWED_CONTENT_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'application/pdf',
]);

const signBody = z.object({
  folder: z.enum(['properties', 'documents', 'avatars']),
  filename: z.string().min(1),
  contentType: z.string(),
});

const signResponse = z.object({
  key: z.string(),
  uploadUrl: z.string().url(),
  publicUrl: z.string().url(),
  expiresIn: z.number(),
});

function safeExt(filename: string): string {
  const m = filename.toLowerCase().match(/\.[a-z0-9]{1,8}$/);
  return m ? m[0] : '';
}

export async function uploadRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();
  r.addHook('preHandler', app.authGuard);

  r.post(
    '/sign',
    {
      schema: {
        tags: ['uploads'],
        summary: 'Get a presigned PUT URL for a direct browser upload',
        body: signBody,
        response: { 200: signResponse, 400: errorResponseSchema, 503: errorResponseSchema },
      },
    },
    async (req) => {
      if (!isStorageConfigured()) {
        throw new AppError(503, 'Object storage is not configured', 'storage_unavailable');
      }
      if (!ALLOWED_CONTENT_TYPES.has(req.body.contentType)) {
        throw AppError.badRequest(`Unsupported content type: ${req.body.contentType}`);
      }
      const key = `${req.body.folder}/${randomUUID()}${safeExt(req.body.filename)}`;
      const { uploadUrl, publicUrl } = await createUploadUrl(key, req.body.contentType);
      return { key, uploadUrl, publicUrl, expiresIn: 300 };
    },
  );
}
