import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { Contract, ContractReminder } from '../../entities';
import { AppError } from '../../lib/errors';
import { paginate } from '../../lib/pagination';
import { errorResponseSchema, listResponse, paginationQuerySchema, uuidParamSchema } from '../../schemas/common';
import { CONTRACT_STATUSES, CONTRACT_TYPES, REMINDER_STATUSES, REMINDER_TYPES } from '../../schemas/enums';
import { dismissPendingReminders, regenerateExpiryReminders } from './reminders.service';

const response = z.object({
  id: z.string().uuid(),
  code: z.string(),
  dealId: z.string().uuid().nullable(),
  propertyId: z.string().uuid(),
  ownerContactId: z.string().uuid(),
  counterpartyContactId: z.string().uuid().nullable(),
  agentUserId: z.string().uuid().nullable(),
  startDate: z.string(),
  endDate: z.string().nullable(),
  contractType: z.enum(CONTRACT_TYPES),
  status: z.enum(CONTRACT_STATUSES),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const reminderResponse = z.object({
  id: z.string().uuid(),
  contractId: z.string().uuid(),
  type: z.enum(REMINDER_TYPES),
  remindAt: z.date(),
  message: z.string().nullable(),
  status: z.enum(REMINDER_STATUSES),
  sentAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const createBody = z.object({
  dealId: z.string().uuid().optional(),
  propertyId: z.string().uuid(),
  ownerContactId: z.string().uuid(),
  counterpartyContactId: z.string().uuid().optional(),
  agentUserId: z.string().uuid().optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
  contractType: z.enum(CONTRACT_TYPES),
  status: z.enum(CONTRACT_STATUSES).default('DRAFT'),
}).refine((v) => v.contractType !== 'RENTAL' || !!v.endDate, {
  message: 'RENTAL contracts require an endDate',
  path: ['endDate'],
});

const updateBody = z.object({
  endDate: z.string().optional(),
  agentUserId: z.string().uuid().optional(),
  counterpartyContactId: z.string().uuid().optional(),
  status: z.enum(CONTRACT_STATUSES).optional(),
});

const listQuery = paginationQuerySchema.extend({
  status: z.enum(CONTRACT_STATUSES).optional(),
  contractType: z.enum(CONTRACT_TYPES).optional(),
  propertyId: z.string().uuid().optional(),
  agentUserId: z.string().uuid().optional(),
  // Only ACTIVE contracts whose end date falls within the next N days (inclusive).
  expiringInDays: z.coerce.number().int().min(0).optional(),
});

export async function contractRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();
  r.addHook('preHandler', app.authGuard);
  const repo = () => app.repo(Contract);

  r.get('/', { schema: { tags: ['contracts'], querystring: listQuery, response: { 200: listResponse(response) } } },
    async (req) => {
      const q = req.query;
      const qb = repo().createQueryBuilder('c');
      if (q.status) qb.andWhere('c.status = :s', { s: q.status });
      if (q.contractType) qb.andWhere('c.contract_type = :t', { t: q.contractType });
      if (q.propertyId) qb.andWhere('c.property_id = :p', { p: q.propertyId });
      if (q.agentUserId) qb.andWhere('c.agent_user_id = :a', { a: q.agentUserId });
      if (q.expiringInDays !== undefined) {
        qb.andWhere("c.status = 'ACTIVE'")
          .andWhere('c.end_date IS NOT NULL')
          .andWhere('c.end_date >= CURRENT_DATE')
          .andWhere("c.end_date <= CURRENT_DATE + (:d::int * INTERVAL '1 day')", { d: q.expiringInDays });
      }
      return paginate(qb, req.query, { createdAt: 'c.created_at', endDate: 'c.end_date' }, 'c.created_at');
    });

  r.get('/:id', { schema: { tags: ['contracts'], params: uuidParamSchema, response: { 200: response, 404: errorResponseSchema } } },
    async (req) => {
      const row = await repo().findOneBy({ id: req.params.id });
      if (!row) throw AppError.notFound('Contract');
      return row;
    });

  r.post('/', { schema: { tags: ['contracts'], summary: 'Create a contract (RENTAL auto-generates expiry reminders)', body: createBody, response: { 201: response } } },
    async (req, reply) => {
      const contract = await app.db.transaction(async (manager) => {
        const cRepo = manager.getRepository(Contract);
        const saved = await cRepo.save(cRepo.create(req.body));
        const full = await cRepo.findOneByOrFail({ id: saved.id });
        await regenerateExpiryReminders(manager, full);
        return full;
      });
      return reply.status(201).send(contract);
    });

  r.patch('/:id', { schema: { tags: ['contracts'], summary: 'Update a contract (re-syncs reminders)', params: uuidParamSchema, body: updateBody, response: { 200: response, 404: errorResponseSchema } } },
    async (req) => {
      return app.db.transaction(async (manager) => {
        const cRepo = manager.getRepository(Contract);
        const contract = await cRepo.findOneBy({ id: req.params.id });
        if (!contract) throw AppError.notFound('Contract');
        const wasActive = contract.status;
        cRepo.merge(contract, req.body);
        await cRepo.save(contract);

        if (['TERMINATED', 'RENEWED', 'COMPLETED'].includes(contract.status) && contract.status !== wasActive) {
          await dismissPendingReminders(manager, contract.id);
        } else {
          await regenerateExpiryReminders(manager, contract);
        }
        return contract;
      });
    });

  r.get('/:id/reminders', { schema: { tags: ['contracts'], summary: 'List a contract\'s reminders', params: uuidParamSchema, response: { 200: z.array(reminderResponse) } } },
    async (req) =>
      app.repo(ContractReminder).find({ where: { contractId: req.params.id }, order: { remindAt: 'ASC' } }));

  r.delete('/:id', { schema: { tags: ['contracts'], params: uuidParamSchema, response: { 204: z.null(), 404: errorResponseSchema } } },
    async (req, reply) => {
      const result = await repo().delete({ id: req.params.id });
      if (!result.affected) throw AppError.notFound('Contract');
      return reply.status(204).send(null);
    });
}
