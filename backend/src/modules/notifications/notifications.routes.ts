import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { Notification } from '../../entities';
import { AppError } from '../../lib/errors';
import { errorResponseSchema, uuidParamSchema } from '../../schemas/common';

const notificationResponse = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.string(),
  title: z.string(),
  body: z.string().nullable(),
  linkPath: z.string().nullable(),
  isRead: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const listQuery = z.object({
  unreadOnly: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

const listResult = z.object({
  data: z.array(notificationResponse),
  unreadCount: z.number(),
});

/** Per-user in-app notifications. Every query is scoped to the authenticated user. */
export async function notificationRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();
  r.addHook('preHandler', app.authGuard);
  const repo = () => app.repo(Notification);

  r.get('/', { schema: { tags: ['notifications'], querystring: listQuery, response: { 200: listResult } } },
    async (req) => {
      const userId = req.authUser!.id;
      const qb = repo().createQueryBuilder('n').where('n.user_id = :userId', { userId });
      if (req.query.unreadOnly) qb.andWhere('n.is_read = false');
      const data = await qb.orderBy('n.created_at', 'DESC').take(req.query.limit).getMany();
      const unreadCount = await repo().count({ where: { userId, isRead: false } });
      return { data, unreadCount };
    });

  r.post('/:id/read', { schema: { tags: ['notifications'], params: uuidParamSchema, response: { 200: notificationResponse, 404: errorResponseSchema } } },
    async (req) => {
      const row = await repo().findOneBy({ id: req.params.id, userId: req.authUser!.id });
      if (!row) throw AppError.notFound('Notification');
      if (!row.isRead) {
        row.isRead = true;
        await repo().save(row);
      }
      return row;
    });

  r.post('/read-all', { schema: { tags: ['notifications'], response: { 200: z.object({ updated: z.number() }) } } },
    async (req) => {
      const result = await repo().update({ userId: req.authUser!.id, isRead: false }, { isRead: true });
      return { updated: result.affected ?? 0 };
    });
}
