import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { Task } from '../../entities';
import { AppError } from '../../lib/errors';
import { paginate } from '../../lib/pagination';
import { errorResponseSchema, listResponse, paginationQuerySchema, uuidParamSchema } from '../../schemas/common';
import { TASK_PRIORITIES, TASK_STATUSES } from '../../schemas/enums';

const response = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  assignedTo: z.string().uuid().nullable(),
  contactId: z.string().uuid().nullable(),
  propertyId: z.string().uuid().nullable(),
  opportunityId: z.string().uuid().nullable(),
  dealId: z.string().uuid().nullable(),
  dueDate: z.date().nullable(),
  priority: z.enum(TASK_PRIORITIES),
  status: z.enum(TASK_STATUSES),
  createdBy: z.string().uuid().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const createBody = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  assignedTo: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
  propertyId: z.string().uuid().optional(),
  opportunityId: z.string().uuid().optional(),
  dealId: z.string().uuid().optional(),
  dueDate: z.coerce.date().optional(),
  priority: z.enum(TASK_PRIORITIES).default('MEDIUM'),
  status: z.enum(TASK_STATUSES).default('OPEN'),
});

const updateBody = createBody.partial();
const listQuery = paginationQuerySchema.extend({
  assignedTo: z.string().uuid().optional(),
  status: z.enum(TASK_STATUSES).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  // Past-due tasks that are still actionable (not DONE/CANCELLED).
  overdue: z.coerce.boolean().optional(),
});

export async function taskRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();
  r.addHook('preHandler', app.authGuard);
  const repo = () => app.repo(Task);

  r.get('/', { schema: { tags: ['tasks'], querystring: listQuery, response: { 200: listResponse(response) } } },
    async (req) => {
      const q = req.query;
      const qb = repo().createQueryBuilder('t');
      if (q.assignedTo) qb.andWhere('t.assigned_to = :a', { a: q.assignedTo });
      if (q.status) qb.andWhere('t.status = :s', { s: q.status });
      if (q.priority) qb.andWhere('t.priority = :p', { p: q.priority });
      if (q.overdue) {
        qb.andWhere('t.due_date IS NOT NULL')
          .andWhere('t.due_date < CURRENT_DATE')
          .andWhere("t.status NOT IN ('DONE', 'CANCELLED')");
      }
      return paginate(qb, req.query, { createdAt: 't.created_at', dueDate: 't.due_date' }, 't.created_at');
    });

  r.get('/:id', { schema: { tags: ['tasks'], params: uuidParamSchema, response: { 200: response, 404: errorResponseSchema } } },
    async (req) => {
      const row = await repo().findOneBy({ id: req.params.id });
      if (!row) throw AppError.notFound('Task');
      return row;
    });

  r.post('/', { schema: { tags: ['tasks'], body: createBody, response: { 201: response } } },
    async (req, reply) => reply.status(201).send(await repo().save(repo().create({ ...req.body, createdBy: req.authUser!.id }))));

  r.patch('/:id', { schema: { tags: ['tasks'], params: uuidParamSchema, body: updateBody, response: { 200: response, 404: errorResponseSchema } } },
    async (req) => {
      const row = await repo().findOneBy({ id: req.params.id });
      if (!row) throw AppError.notFound('Task');
      repo().merge(row, req.body);
      await repo().save(row);
      return row;
    });

  r.delete('/:id', { schema: { tags: ['tasks'], params: uuidParamSchema, response: { 204: z.null(), 404: errorResponseSchema } } },
    async (req, reply) => {
      const result = await repo().delete({ id: req.params.id });
      if (!result.affected) throw AppError.notFound('Task');
      return reply.status(204).send(null);
    });
}
