import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { Property, PropertyVideo } from '../../entities';
import { AppError } from '../../lib/errors';
import { errorResponseSchema } from '../../schemas/common';

const videoResponse = z.object({
  id: z.string().uuid(),
  propertyId: z.string().uuid(),
  videoUrl: z.string(),
  storageKey: z.string().nullable(),
  sortOrder: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const propertyParam = z.object({ id: z.string().uuid() });
const videoParam = z.object({ id: z.string().uuid(), videoId: z.string().uuid() });

const addBody = z.object({
  videoUrl: z.string().url(),
  storageKey: z.string().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

const reorderBody = z.object({
  order: z.array(z.object({ id: z.string().uuid(), sortOrder: z.number().int().min(0) })).min(1),
});

/** Mounted at /api/properties - video gallery management for a property. */
export async function propertyVideoRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();
  r.addHook('preHandler', app.authGuard);

  async function assertProperty(id: string) {
    const exists = await app.repo(Property).existsBy({ id });
    if (!exists) throw AppError.notFound('Property');
  }

  r.get('/:id/videos', { schema: { tags: ['property-videos'], params: propertyParam, response: { 200: z.array(videoResponse) } } },
    async (req) => app.repo(PropertyVideo).find({ where: { propertyId: req.params.id }, order: { sortOrder: 'ASC' } }));

  r.post('/:id/videos', { schema: { tags: ['property-videos'], summary: 'Attach an uploaded video to a property', params: propertyParam, body: addBody, response: { 201: videoResponse, 404: errorResponseSchema } } },
    async (req, reply) => {
      await assertProperty(req.params.id);
      const video = await app.db.transaction(async (manager) => {
        const repo = manager.getRepository(PropertyVideo);
        const count = await repo.countBy({ propertyId: req.params.id });
        return repo.save(
          repo.create({
            propertyId: req.params.id,
            videoUrl: req.body.videoUrl,
            storageKey: req.body.storageKey ?? null,
            sortOrder: req.body.sortOrder ?? count,
          }),
        );
      });
      return reply.status(201).send(video);
    });

  r.patch('/:id/videos/reorder', { schema: { tags: ['property-videos'], summary: 'Reorder videos', params: propertyParam, body: reorderBody, response: { 200: z.array(videoResponse) } } },
    async (req) => {
      await assertProperty(req.params.id);
      await app.db.transaction(async (manager) => {
        const repo = manager.getRepository(PropertyVideo);
        for (const item of req.body.order) {
          await repo.update({ id: item.id, propertyId: req.params.id }, { sortOrder: item.sortOrder });
        }
      });
      return app.repo(PropertyVideo).find({ where: { propertyId: req.params.id }, order: { sortOrder: 'ASC' } });
    });

  r.delete('/:id/videos/:videoId', { schema: { tags: ['property-videos'], params: videoParam, response: { 204: z.null(), 404: errorResponseSchema } } },
    async (req, reply) => {
      const result = await app.repo(PropertyVideo).delete({ id: req.params.videoId, propertyId: req.params.id });
      if (!result.affected) throw AppError.notFound('Video');
      return reply.status(204).send(null);
    });
}
