import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { Viewing } from '../../entities';
import { AppError } from '../../lib/errors';
import { paginate } from '../../lib/pagination';
import { errorResponseSchema, listResponse, paginationQuerySchema, uuidParamSchema } from '../../schemas/common';
import { VIEWING_STATUSES } from '../../schemas/enums';

const response = z.object({
  id: z.string().uuid(),
  propertyId: z.string().uuid(),
  opportunityId: z.string().uuid().nullable(),
  contactId: z.string().uuid().nullable(),
  agentUserId: z.string().uuid().nullable(),
  scheduledAt: z.date(),
  status: z.enum(VIEWING_STATUSES),
  feedback: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const createBody = z.object({
  propertyId: z.string().uuid(),
  opportunityId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
  agentUserId: z.string().uuid().optional(),
  scheduledAt: z.coerce.date(),
  status: z.enum(VIEWING_STATUSES).default('SCHEDULED'),
  feedback: z.string().optional(),
});

const updateBody = createBody.partial();
const listQuery = paginationQuerySchema.extend({
  propertyId: z.string().uuid().optional(),
  opportunityId: z.string().uuid().optional(),
  agentUserId: z.string().uuid().optional(),
  status: z.enum(VIEWING_STATUSES).optional(),
});

export async function viewingRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();
  r.addHook('preHandler', app.authGuard);
  const repo = () => app.repo(Viewing);

  r.get('/', { schema: { tags: ['viewings'], querystring: listQuery, response: { 200: listResponse(response) } } },
    async (req) => {
      const q = req.query;
      const qb = repo().createQueryBuilder('v');
      if (q.propertyId) qb.andWhere('v.property_id = :p', { p: q.propertyId });
      if (q.opportunityId) qb.andWhere('v.opportunity_id = :o', { o: q.opportunityId });
      if (q.agentUserId) qb.andWhere('v.agent_user_id = :a', { a: q.agentUserId });
      if (q.status) qb.andWhere('v.status = :s', { s: q.status });
      return paginate(qb, req.query, { createdAt: 'v.created_at', scheduledAt: 'v.scheduled_at' }, 'v.scheduled_at');
    });

  r.get('/:id', { schema: { tags: ['viewings'], params: uuidParamSchema, response: { 200: response, 404: errorResponseSchema } } },
    async (req) => {
      const row = await repo().findOneBy({ id: req.params.id });
      if (!row) throw AppError.notFound('Viewing');
      return row;
    });

  r.post('/', { schema: { tags: ['viewings'], body: createBody, response: { 201: response } } },
    async (req, reply) => reply.status(201).send(await repo().save(repo().create(req.body))));

  r.patch('/:id', { schema: { tags: ['viewings'], params: uuidParamSchema, body: updateBody, response: { 200: response, 404: errorResponseSchema } } },
    async (req) => {
      const row = await repo().findOneBy({ id: req.params.id });
      if (!row) throw AppError.notFound('Viewing');
      repo().merge(row, req.body);
      await repo().save(row);
      return row;
    });

  r.delete('/:id', { schema: { tags: ['viewings'], params: uuidParamSchema, response: { 204: z.null(), 404: errorResponseSchema } } },
    async (req, reply) => {
      const result = await repo().delete({ id: req.params.id });
      if (!result.affected) throw AppError.notFound('Viewing');
      return reply.status(204).send(null);
    });
}
