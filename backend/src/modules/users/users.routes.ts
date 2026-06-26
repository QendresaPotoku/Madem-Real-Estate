import { hash } from '@node-rs/argon2';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { User } from '../../entities';
import { AppError } from '../../lib/errors';
import { paginate } from '../../lib/pagination';
import {
  errorResponseSchema,
  listResponse,
  localizedSchema,
  paginationQuerySchema,
  uuidParamSchema,
} from '../../schemas/common';
import { USER_ROLES, USER_STATUSES } from '../../schemas/enums';

const userResponse = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  role: z.enum(USER_ROLES),
  status: z.enum(USER_STATUSES),
  photoUrl: z.string().nullable(),
  titleJson: localizedSchema.nullable(),
  bioJson: localizedSchema.nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const createBody = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
  role: z.enum(USER_ROLES).default('AGENT'),
  status: z.enum(USER_STATUSES).default('ACTIVE'),
  photoUrl: z.string().url().optional(),
  titleJson: localizedSchema.optional(),
  bioJson: localizedSchema.optional(),
});

const updateBody = z.object({
  fullName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  phone: z.string().optional(),
  role: z.enum(USER_ROLES).optional(),
  status: z.enum(USER_STATUSES).optional(),
  photoUrl: z.string().url().nullable().optional(),
  titleJson: localizedSchema.optional(),
  bioJson: localizedSchema.optional(),
});

const listQuery = paginationQuerySchema.extend({
  role: z.enum(USER_ROLES).optional(),
  status: z.enum(USER_STATUSES).optional(),
  search: z.string().optional(),
});

/** Admin-only staff/agent management. */
export async function userRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();
  r.addHook('preHandler', app.authGuard);
  r.addHook('preHandler', app.roleGuard(['ADMIN']));
  const repo = () => app.repo(User);

  r.get('/', { schema: { tags: ['users'], summary: 'List staff/agents', querystring: listQuery, response: { 200: listResponse(userResponse) } } },
    async (req) => {
      const q = req.query;
      const qb = repo().createQueryBuilder('u');
      if (q.role) qb.andWhere('u.role = :role', { role: q.role });
      if (q.status) qb.andWhere('u.status = :status', { status: q.status });
      if (q.search) qb.andWhere('(u.full_name ILIKE :s OR u.email ILIKE :s)', { s: `%${q.search}%` });
      return paginate(qb, req.query, { createdAt: 'u.created_at', fullName: 'u.full_name' }, 'u.created_at');
    });

  r.get('/:id', { schema: { tags: ['users'], params: uuidParamSchema, response: { 200: userResponse, 404: errorResponseSchema } } },
    async (req) => {
      const user = await repo().findOneBy({ id: req.params.id });
      if (!user) throw AppError.notFound('User');
      return user;
    });

  r.post('/', { schema: { tags: ['users'], summary: 'Create a staff/agent user', body: createBody, response: { 201: userResponse } } },
    async (req, reply) => {
      const { password, ...rest } = req.body;
      const passwordHash = await hash(password);
      const saved = await repo().save(repo().create({ ...rest, passwordHash }));
      return reply.status(201).send(await repo().findOneByOrFail({ id: saved.id }));
    });

  r.patch('/:id', { schema: { tags: ['users'], summary: 'Update a user (optionally reset password)', params: uuidParamSchema, body: updateBody, response: { 200: userResponse, 404: errorResponseSchema } } },
    async (req) => {
      const user = await repo().findOneBy({ id: req.params.id });
      if (!user) throw AppError.notFound('User');
      const { password, ...rest } = req.body;
      repo().merge(user, rest);
      if (password) user.passwordHash = await hash(password);
      await repo().save(user);
      return repo().findOneByOrFail({ id: user.id });
    });

  r.delete('/:id', { schema: { tags: ['users'], summary: 'Deactivate a user (soft — sets status INACTIVE)', params: uuidParamSchema, response: { 204: z.null(), 400: errorResponseSchema, 404: errorResponseSchema } } },
    async (req, reply) => {
      if (req.authUser!.id === req.params.id) throw AppError.badRequest('You cannot deactivate your own account');
      const user = await repo().findOneBy({ id: req.params.id });
      if (!user) throw AppError.notFound('User');
      // Hard delete is blocked by RESTRICT FKs (properties/deals); deactivate instead.
      user.status = 'INACTIVE';
      await repo().save(user);
      return reply.status(204).send(null);
    });
}
