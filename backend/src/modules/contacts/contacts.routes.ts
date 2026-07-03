import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { Brackets } from 'typeorm';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { Contact, Deal, Opportunity, Property } from '../../entities';
import { AppError } from '../../lib/errors';
import { paginate } from '../../lib/pagination';
import {
  errorResponseSchema,
  listResponse,
  localizedSchema,
  paginationQuerySchema,
  uuidParamSchema,
} from '../../schemas/common';
import { CONTACT_SOURCES, LISTING_TYPES, PROPERTY_STATUSES, PROPERTY_TYPES } from '../../schemas/enums';

const contactResponse = z.object({
  id: z.string().uuid(),
  code: z.string(),
  fullName: z.string(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  idNumber: z.string().nullable(),
  source: z.enum(CONTACT_SOURCES),
  notes: z.string().nullable(),
  createdBy: z.string().uuid().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  /** Number of linked buyer/tenant opportunities. Lets the UI flag website "property request" leads. Only populated by the list endpoint. */
  opportunityCount: z.number().optional(),
});

/** A property linked to a contact, with the role(s) the contact plays for it. */
const contactPropertyResponse = z.object({
  id: z.string().uuid(),
  propertyCode: z.string(),
  titleJson: localizedSchema,
  status: z.enum(PROPERTY_STATUSES),
  listingType: z.enum(LISTING_TYPES),
  propertyType: z.enum(PROPERTY_TYPES),
  city: z.string(),
  area: z.string().nullable(),
  price: z.number(),
  roles: z.array(z.string()),
});

const createBody = z.object({
  fullName: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  idNumber: z.string().optional(),
  source: z.enum(CONTACT_SOURCES).default('OTHER'),
  notes: z.string().optional(),
});

const updateBody = createBody.partial();

const listQuery = paginationQuerySchema.extend({
  source: z.enum(CONTACT_SOURCES).optional(),
  search: z.string().optional(),
});

const SORTABLE = { createdAt: 'c.created_at', fullName: 'c.full_name', code: 'c.code' };

export async function contactRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();
  r.addHook('preHandler', app.authGuard);

  r.get(
    '/',
    {
      schema: {
        tags: ['contacts'],
        summary: 'List contacts',
        querystring: listQuery,
        response: { 200: listResponse(contactResponse) },
      },
    },
    async (req) => {
      const { source, search } = req.query;
      const qb = app.repo(Contact).createQueryBuilder('c');
      if (source) qb.andWhere('c.source = :source', { source });
      if (search) {
        qb.andWhere(
          new Brackets((w) => {
            w.where('c.full_name ILIKE :s', { s: `%${search}%` })
              .orWhere('c.email ILIKE :s', { s: `%${search}%` })
              .orWhere('c.phone ILIKE :s', { s: `%${search}%` })
              .orWhere('c.id_number ILIKE :s', { s: `%${search}%` })
              .orWhere('c.code ILIKE :s', { s: `%${search}%` });
          }),
        );
      }
      const result = await paginate(qb, req.query, SORTABLE, 'c.created_at');

      // Annotate each row with its opportunity count so the UI can flag "property request" leads.
      const ids = result.data.map((c) => c.id);
      if (ids.length) {
        const counts = await app
          .repo(Opportunity)
          .createQueryBuilder('o')
          .select('o.contact_id', 'contactId')
          .addSelect('COUNT(*)', 'count')
          .where('o.contact_id IN (:...ids)', { ids })
          .groupBy('o.contact_id')
          .getRawMany<{ contactId: string; count: string }>();
        const byId = new Map(counts.map((r) => [r.contactId, Number(r.count)]));
        for (const c of result.data) {
          (c as Contact & { opportunityCount: number }).opportunityCount = byId.get(c.id) ?? 0;
        }
      }

      return result;
    },
  );

  r.get(
    '/:id',
    {
      schema: {
        tags: ['contacts'],
        summary: 'Get a contact',
        params: uuidParamSchema,
        response: { 200: contactResponse, 404: errorResponseSchema },
      },
    },
    async (req) => {
      const contact = await app.repo(Contact).findOneBy({ id: req.params.id });
      if (!contact) throw AppError.notFound('Contact');
      return contact;
    },
  );

  r.get(
    '/:id/properties',
    {
      schema: {
        tags: ['contacts'],
        summary: 'Properties linked to a contact (as owner, buyer or seller)',
        params: uuidParamSchema,
        response: { 200: z.array(contactPropertyResponse), 404: errorResponseSchema },
      },
    },
    async (req) => {
      const contactId = req.params.id;
      if (!(await app.repo(Contact).existsBy({ id: contactId }))) throw AppError.notFound('Contact');

      // Owned listings + properties from deals where the contact is buyer or seller.
      const owned = await app.repo(Property).findBy({ ownerContactId: contactId });
      const deals = await app.repo(Deal).find({
        where: [{ buyerContactId: contactId }, { sellerContactId: contactId }],
        relations: { property: true },
      });

      const byId = new Map<string, { property: Property; roles: Set<string> }>();
      const add = (p: Property | undefined, role: string) => {
        if (!p) return;
        if (!byId.has(p.id)) byId.set(p.id, { property: p, roles: new Set() });
        byId.get(p.id)!.roles.add(role);
      };
      for (const p of owned) add(p, 'OWNER');
      for (const d of deals) {
        if (d.buyerContactId === contactId) add(d.property, 'BUYER');
        if (d.sellerContactId === contactId) add(d.property, 'SELLER');
      }

      return [...byId.values()].map(({ property: p, roles }) => ({
        id: p.id,
        propertyCode: p.propertyCode,
        titleJson: p.titleJson,
        status: p.status,
        listingType: p.listingType,
        propertyType: p.propertyType,
        city: p.city,
        area: p.area,
        price: p.price,
        roles: [...roles],
      }));
    },
  );

  r.post(
    '/',
    {
      schema: {
        tags: ['contacts'],
        summary: 'Create a contact',
        body: createBody,
        response: { 201: contactResponse },
      },
    },
    async (req, reply) => {
      const repo = app.repo(Contact);
      const saved = await repo.save(repo.create({ ...req.body, createdBy: req.authUser!.id }));
      // Reload so the DB-trigger-generated `code` (and timestamps) are present.
      return reply.status(201).send(await repo.findOneByOrFail({ id: saved.id }));
    },
  );

  r.patch(
    '/:id',
    {
      schema: {
        tags: ['contacts'],
        summary: 'Update a contact',
        params: uuidParamSchema,
        body: updateBody,
        response: { 200: contactResponse, 404: errorResponseSchema },
      },
    },
    async (req) => {
      const repo = app.repo(Contact);
      const contact = await repo.findOneBy({ id: req.params.id });
      if (!contact) throw AppError.notFound('Contact');
      repo.merge(contact, req.body);
      await repo.save(contact);
      return contact;
    },
  );

  r.delete(
    '/:id',
    {
      schema: {
        tags: ['contacts'],
        summary: 'Delete a contact',
        params: uuidParamSchema,
        response: { 204: z.null(), 404: errorResponseSchema },
      },
    },
    async (req, reply) => {
      const result = await app.repo(Contact).delete({ id: req.params.id });
      if (!result.affected) throw AppError.notFound('Contact');
      return reply.status(204).send(null);
    },
  );
}
