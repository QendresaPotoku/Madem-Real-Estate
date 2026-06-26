import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { ListingAgreement, Property } from '../../entities';
import { AppError } from '../../lib/errors';
import { paginate } from '../../lib/pagination';
import { errorResponseSchema, uuidParamSchema } from '../../schemas/common';
import {
  createPropertyBody,
  propertyListQuery,
  propertyListResponse,
  propertyResponse,
  updatePropertyBody,
} from './properties.schemas';

const SORTABLE = {
  createdAt: 'p.created_at',
  updatedAt: 'p.updated_at',
  price: 'p.price',
  publishedDate: 'p.published_date',
};

const NO_ACTIVE_AGREEMENT = 'Property cannot be published without an active listing agreement.';

/**
 * Guard: a property may only be ACTIVE while it has a *current* ACTIVE listing
 * agreement (status ACTIVE, started, and not past its end date). Throws 400 if not.
 * On create no agreement can exist yet (the property has no id to reference), so
 * `propertyId` is omitted there and the guard always blocks — enforcing the
 * intended DRAFT → active agreement → publish flow.
 */
async function assertPublishable(app: FastifyInstance, propertyId?: string): Promise<void> {
  if (!propertyId) throw AppError.badRequest(NO_ACTIVE_AGREEMENT);
  const count = await app
    .repo(ListingAgreement)
    .createQueryBuilder('la')
    .where('la.property_id = :id', { id: propertyId })
    .andWhere("la.status = 'ACTIVE'")
    .andWhere('la.start_date <= CURRENT_DATE')
    .andWhere('(la.end_date IS NULL OR la.end_date >= CURRENT_DATE)')
    .getCount();
  if (count === 0) throw AppError.badRequest(NO_ACTIVE_AGREEMENT);
}

export async function propertyRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();
  r.addHook('preHandler', app.authGuard);

  r.get(
    '/',
    {
      schema: {
        tags: ['properties'],
        summary: 'List/filter properties',
        querystring: propertyListQuery,
        response: { 200: propertyListResponse },
      },
    },
    async (req) => {
      const q = req.query;
      const qb = app.repo(Property).createQueryBuilder('p');
      if (q.status) qb.andWhere('p.status = :status', { status: q.status });
      if (q.listingType) qb.andWhere('p.listing_type = :lt', { lt: q.listingType });
      if (q.propertyType) qb.andWhere('p.property_type = :pt', { pt: q.propertyType });
      if (q.city) qb.andWhere('p.city ILIKE :city', { city: `%${q.city}%` });
      if (q.area) qb.andWhere('p.area ILIKE :area', { area: `%${q.area}%` });
      if (q.minPrice !== undefined) qb.andWhere('p.price >= :minP', { minP: q.minPrice });
      if (q.maxPrice !== undefined) qb.andWhere('p.price <= :maxP', { maxP: q.maxPrice });
      if (q.bedrooms !== undefined) qb.andWhere('p.bedrooms >= :bd', { bd: q.bedrooms });
      if (q.featured !== undefined) qb.andWhere('p.is_featured = :ft', { ft: q.featured });
      if (q.search) {
        qb.andWhere(`p.search_tsv @@ plainto_tsquery('simple', :search)`, { search: q.search });
      }
      return paginate(qb, req.query, SORTABLE, 'p.created_at');
    },
  );

  r.get(
    '/:id',
    {
      schema: {
        tags: ['properties'],
        summary: 'Get a property',
        params: uuidParamSchema,
        response: { 200: propertyResponse, 404: errorResponseSchema },
      },
    },
    async (req) => {
      const property = await app.repo(Property).findOneBy({ id: req.params.id });
      if (!property) throw AppError.notFound('Property');
      return property;
    },
  );

  r.post(
    '/',
    {
      schema: {
        tags: ['properties'],
        summary: 'Create a property',
        body: createPropertyBody,
        response: { 201: propertyResponse, 400: errorResponseSchema },
      },
    },
    async (req, reply) => {
      // A brand-new property cannot yet have a listing agreement, so publishing
      // straight to ACTIVE is always blocked — create as DRAFT, then publish.
      if (req.body.status === 'ACTIVE') await assertPublishable(app);
      const repo = app.repo(Property);
      const saved = await repo.save(repo.create({ ...req.body, createdBy: req.authUser!.id }));
      // Reload so the DB-trigger-generated `property_code` (and timestamps) are present.
      return reply.status(201).send(await repo.findOneByOrFail({ id: saved.id }));
    },
  );

  r.patch(
    '/:id',
    {
      schema: {
        tags: ['properties'],
        summary: 'Update a property',
        params: uuidParamSchema,
        body: updatePropertyBody,
        response: { 200: propertyResponse, 400: errorResponseSchema, 404: errorResponseSchema },
      },
    },
    async (req) => {
      const repo = app.repo(Property);
      const property = await repo.findOneBy({ id: req.params.id });
      if (!property) throw AppError.notFound('Property');
      repo.merge(property, req.body);
      // Enforce the publish guard whenever the update leaves the property ACTIVE.
      if (property.status === 'ACTIVE') await assertPublishable(app, property.id);
      await repo.save(property);
      return property;
    },
  );

  r.delete(
    '/:id',
    {
      schema: {
        tags: ['properties'],
        summary: 'Delete a property',
        params: uuidParamSchema,
        response: { 204: z.null(), 404: errorResponseSchema },
      },
    },
    async (req, reply) => {
      const result = await app.repo(Property).delete({ id: req.params.id });
      if (!result.affected) throw AppError.notFound('Property');
      return reply.status(204).send(null);
    },
  );
}
