import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { errorResponseSchema } from '../../schemas/common';
import { translatePropertyContent } from './translation.service';

const translateBody = z.object({
  title: z.string().min(1, 'Albanian title is required'),
  description: z.string().optional(),
});

const translateResponse = z.object({
  title: z.object({ en: z.string(), de: z.string() }),
  description: z.object({ en: z.string(), de: z.string() }),
});

export async function translationRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();
  r.addHook('preHandler', app.authGuard);

  r.post(
    '/property-content',
    {
      schema: {
        tags: ['translation'],
        summary: 'Translate Albanian listing title/description into English and German',
        body: translateBody,
        response: { 200: translateResponse, 400: errorResponseSchema, 502: errorResponseSchema, 503: errorResponseSchema },
      },
    },
    async (req) => translatePropertyContent(req.body),
  );
}
