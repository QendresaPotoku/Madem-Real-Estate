import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { Property, PropertyImage } from '../../entities';
import { AppError } from '../../lib/errors';
import { errorResponseSchema } from '../../schemas/common';

const imageResponse = z.object({
  id: z.string().uuid(),
  propertyId: z.string().uuid(),
  imageUrl: z.string(),
  storageKey: z.string().nullable(),
  isCover: z.boolean(),
  sortOrder: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const propertyParam = z.object({ id: z.string().uuid() });
const imageParam = z.object({ id: z.string().uuid(), imageId: z.string().uuid() });

const addBody = z.object({
  imageUrl: z.string().url(),
  storageKey: z.string().optional(),
  isCover: z.boolean().default(false),
  sortOrder: z.number().int().min(0).optional(),
});

const reorderBody = z.object({
  order: z.array(z.object({ id: z.string().uuid(), sortOrder: z.number().int().min(0) })).min(1),
});

/** Mounted at /api/properties — image gallery management for a property. */
export async function propertyImageRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();
  r.addHook('preHandler', app.authGuard);

  async function assertProperty(id: string) {
    const exists = await app.repo(Property).existsBy({ id });
    if (!exists) throw AppError.notFound('Property');
  }

  r.get('/:id/images', { schema: { tags: ['property-images'], params: propertyParam, response: { 200: z.array(imageResponse) } } },
    async (req) => app.repo(PropertyImage).find({ where: { propertyId: req.params.id }, order: { sortOrder: 'ASC' } }));

  r.post('/:id/images', { schema: { tags: ['property-images'], summary: 'Attach an uploaded image to a property', params: propertyParam, body: addBody, response: { 201: imageResponse, 404: errorResponseSchema } } },
    async (req, reply) => {
      await assertProperty(req.params.id);
      const image = await app.db.transaction(async (manager) => {
        const repo = manager.getRepository(PropertyImage);
        if (req.body.isCover) {
          await repo.update({ propertyId: req.params.id, isCover: true }, { isCover: false });
        }
        const count = await repo.countBy({ propertyId: req.params.id });
        return repo.save(
          repo.create({
            propertyId: req.params.id,
            imageUrl: req.body.imageUrl,
            storageKey: req.body.storageKey ?? null,
            isCover: req.body.isCover,
            sortOrder: req.body.sortOrder ?? count,
          }),
        );
      });
      return reply.status(201).send(image);
    });

  r.patch('/:id/images/reorder', { schema: { tags: ['property-images'], summary: 'Reorder images', params: propertyParam, body: reorderBody, response: { 200: z.array(imageResponse) } } },
    async (req) => {
      await assertProperty(req.params.id);
      await app.db.transaction(async (manager) => {
        const repo = manager.getRepository(PropertyImage);
        for (const item of req.body.order) {
          await repo.update({ id: item.id, propertyId: req.params.id }, { sortOrder: item.sortOrder });
        }
      });
      return app.repo(PropertyImage).find({ where: { propertyId: req.params.id }, order: { sortOrder: 'ASC' } });
    });

  r.patch('/:id/images/:imageId/cover', { schema: { tags: ['property-images'], summary: 'Set an image as the cover', params: imageParam, response: { 200: imageResponse, 404: errorResponseSchema } } },
    async (req) => {
      return app.db.transaction(async (manager) => {
        const repo = manager.getRepository(PropertyImage);
        const image = await repo.findOneBy({ id: req.params.imageId, propertyId: req.params.id });
        if (!image) throw AppError.notFound('Image');
        await repo.update({ propertyId: req.params.id, isCover: true }, { isCover: false });
        image.isCover = true;
        await repo.save(image);
        return image;
      });
    });

  r.delete('/:id/images/:imageId', { schema: { tags: ['property-images'], params: imageParam, response: { 204: z.null(), 404: errorResponseSchema } } },
    async (req, reply) => {
      const result = await app.repo(PropertyImage).delete({ id: req.params.imageId, propertyId: req.params.id });
      if (!result.affected) throw AppError.notFound('Image');
      return reply.status(204).send(null);
    });
}
