import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { In, type EntityManager } from 'typeorm';
import { z } from 'zod';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { Activity, Contact, LocationArea, LocationCadastralZone, LocationCity, LocationCountry, Opportunity, Property, PropertyImage, User } from '../../entities';
import { AppError } from '../../lib/errors';
import { paginate } from '../../lib/pagination';
import { createUploadUrl, isStorageConfigured } from '../../lib/s3';
import { notify } from '../../lib/notifications';
import { listResponse, localizedSchema, paginationQuerySchema } from '../../schemas/common';
import {
  BUILDING_CONDITIONS,
  CONTACT_TYPES,
  LISTING_TYPES,
  ORIENTATIONS,
  PROPERTY_TYPES,
  type PropertyType,
} from '../../schemas/enums';

/** Lead contact types the public site is allowed to set. */
const PUBLIC_CONTACT_TYPES = ['BUYER', 'TENANT', 'OWNER', 'LANDLORD'] as const satisfies readonly (typeof CONTACT_TYPES)[number][];

const publicProperty = z.object({
  id: z.string().uuid(),
  propertyCode: z.string(),
  listingType: z.enum(LISTING_TYPES),
  propertyType: z.enum(PROPERTY_TYPES),
  titleJson: localizedSchema,
  descriptionJson: localizedSchema.nullable(),
  price: z.number(),
  currency: z.string(),
  country: z.string(),
  city: z.string(),
  area: z.string().nullable(),
  cadastralZone: z.string().nullable(),
  address: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  bedrooms: z.number().nullable(),
  bathrooms: z.number().nullable(),
  toilets: z.number().nullable(),
  sizeM2: z.number().nullable(),
  lotSizeM2: z.number().nullable(),
  terraceM2: z.number().nullable(),
  basementM2: z.number().nullable(),
  floor: z.number().nullable(),
  garage: z.number().nullable(),
  balconies: z.number().nullable(),
  storage: z.boolean(),
  parking: z.boolean(),
  elevator: z.boolean(),
  furnished: z.boolean(),
  buildingCondition: z.enum(BUILDING_CONDITIONS).nullable(),
  orientation: z.enum(ORIENTATIONS).nullable(),
  yearBuilt: z.number().nullable(),
  isFeatured: z.boolean(),
  agentUserId: z.string().uuid(),
  attributesJson: z.record(z.unknown()),
  coverImageUrl: z.string().nullable(),
  publishedDate: z.string().nullable(),
  createdAt: z.date(),
});

const publicImage = z.object({
  id: z.string().uuid(),
  imageUrl: z.string(),
  isCover: z.boolean(),
  sortOrder: z.number(),
});

const publicAgent = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  photoUrl: z.string().nullable(),
  titleJson: localizedSchema.nullable(),
  bioJson: localizedSchema.nullable(),
});

const listQuery = paginationQuerySchema.extend({
  listingType: z.enum(LISTING_TYPES).optional(),
  propertyType: z.enum(PROPERTY_TYPES).optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  area: z.string().optional(),
  cadastralZone: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  bedrooms: z.coerce.number().int().optional(),
  featured: z.coerce.boolean().optional(),
  search: z.string().optional(),
});

const publicLocationLookups = z.object({
  countries: z.array(z.object({ id: z.string().uuid(), name: z.string() })),
  cities: z.array(z.object({ id: z.string().uuid(), countryId: z.string().uuid(), name: z.string() })),
  areas: z.array(z.object({ id: z.string().uuid(), cityId: z.string().uuid(), name: z.string() })),
  cadastralZones: z.array(z.object({ id: z.string().uuid(), cityId: z.string().uuid(), name: z.string() })),
});

const leadBody = z.object({
  fullName: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  message: z.string().optional(),
  contactType: z.enum(PUBLIC_CONTACT_TYPES).optional(),
  propertyId: z.string().uuid().optional(),
  propertyCode: z.string().optional(),
  listingType: z.enum(LISTING_TYPES).optional(),
  propertyType: z.enum(PROPERTY_TYPES).optional(),
  city: z.string().optional(),
  budgetMin: z.number().min(0).optional(),
  budgetMax: z.number().min(0).optional(),
}).refine((v) => v.budgetMin == null || v.budgetMax == null || v.budgetMax >= v.budgetMin, {
  message: 'budgetMax must be >= budgetMin',
  path: ['budgetMax'],
});

/** Owners/landlords offer property; they are not buyer demand, so no opportunity is created for them. */
const SELLER_CONTACT_TYPES = new Set(['OWNER', 'LANDLORD']);

/* ── Owner property-offer intake (creates a DRAFT listing for agent review) ── */

const PUBLIC_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'] as const;

/** Map the website's property-type slugs onto the CRM enum. Agent can refine after. */
const WEB_PROPERTY_TYPE_MAP: Record<string, PropertyType> = {
  apartment: 'APARTMENT',
  house: 'HOUSE',
  villa: 'VILLA',
  land: 'LAND',
  commercial: 'OFFICE',
  office: 'OFFICE',
  shop: 'SHOP',
  warehouse: 'WAREHOUSE',
  building: 'BUILDING',
};

const publicSignBody = z.object({
  filename: z.string().min(1),
  contentType: z.enum(PUBLIC_IMAGE_TYPES),
});

const publicSignResponse = z.object({
  key: z.string(),
  uploadUrl: z.string().url(),
  publicUrl: z.string().url(),
  expiresIn: z.number(),
});

const propertyOfferBody = z.object({
  fullName: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  propertyType: z.string().min(1),
  listingType: z.enum(LISTING_TYPES).default('SALE'),
  city: z.string().min(1),
  area: z.string().optional(),
  price: z.coerce.number().min(0).optional(),
  currency: z.string().length(3).optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  images: z.array(z.object({ url: z.string().url(), key: z.string().min(1) })).max(20).optional(),
});

function safeExt(filename: string): string {
  const m = filename.toLowerCase().match(/\.[a-z0-9]{1,8}$/);
  return m ? m[0] : '';
}

function titleCase(s: string): string {
  return s.charAt(0) + s.slice(1).toLowerCase();
}

/** Notify every active admin about an inbound website event. */
async function notifyActiveAdmins(
  manager: EntityManager,
  n: { type: string; title: string; body?: string | null; linkPath?: string | null },
): Promise<void> {
  const admins = await manager.getRepository(User).find({ where: { role: 'ADMIN', status: 'ACTIVE' } });
  for (const admin of admins) {
    await notify(manager, { userId: admin.id, type: n.type, title: n.title, body: n.body ?? null, linkPath: n.linkPath ?? null });
  }
}

/** Public, unauthenticated endpoints consumed by the marketing website. */
export async function publicRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();

  r.get('/location-lookups', { schema: { tags: ['public'], summary: 'List public location filters', response: { 200: publicLocationLookups } } },
    async () => ({
      countries: await app.repo(LocationCountry).find({ order: { name: 'ASC' } }),
      cities: await app.repo(LocationCity).find({ order: { name: 'ASC' } }),
      areas: await app.repo(LocationArea).find({ order: { name: 'ASC' } }),
      cadastralZones: await app.repo(LocationCadastralZone).find({ order: { name: 'ASC' } }),
    }));

  r.get('/properties', { schema: { tags: ['public'], summary: 'List published (ACTIVE) properties', querystring: listQuery, response: { 200: listResponse(publicProperty) } } },
    async (req) => {
      const q = req.query;
      const qb = app.repo(Property).createQueryBuilder('p').where('p.status = :active', { active: 'ACTIVE' });
      if (q.listingType) qb.andWhere('p.listing_type = :lt', { lt: q.listingType });
      if (q.propertyType) qb.andWhere('p.property_type = :pt', { pt: q.propertyType });
      if (q.country) qb.andWhere('p.country ILIKE :country', { country: `%${q.country}%` });
      if (q.city) qb.andWhere('p.city ILIKE :city', { city: `%${q.city}%` });
      if (q.area) qb.andWhere('p.area ILIKE :area', { area: `%${q.area}%` });
      if (q.cadastralZone) qb.andWhere('p.cadastral_zone ILIKE :cadastralZone', { cadastralZone: `%${q.cadastralZone}%` });
      if (q.minPrice !== undefined) qb.andWhere('p.price >= :minP', { minP: q.minPrice });
      if (q.maxPrice !== undefined) qb.andWhere('p.price <= :maxP', { maxP: q.maxPrice });
      if (q.bedrooms !== undefined) qb.andWhere('p.bedrooms >= :bd', { bd: q.bedrooms });
      if (q.featured !== undefined) qb.andWhere('p.is_featured = :ft', { ft: q.featured });
      if (q.search) qb.andWhere(`p.search_tsv @@ plainto_tsquery('simple', :search)`, { search: q.search });
      const result = await paginate(qb, req.query, { createdAt: 'p.created_at', price: 'p.price' }, 'p.created_at');

      // Batch-load cover images for the page (one query) and attach.
      const ids = result.data.map((p) => p.id);
      const covers = ids.length
        ? await app.repo(PropertyImage).find({ where: { propertyId: In(ids), isCover: true } })
        : [];
      const coverByProp = new Map(covers.map((c) => [c.propertyId, c.imageUrl]));
      return {
        ...result,
        data: result.data.map((p) => ({ ...p, coverImageUrl: coverByProp.get(p.id) ?? null })),
      };
    });

  r.get('/properties/:code', { schema: { tags: ['public'], summary: 'Get a published property by code, with images', params: z.object({ code: z.string() }), response: { 200: publicProperty.extend({ images: z.array(publicImage) }), 404: z.object({ code: z.string(), message: z.string() }) } } },
    async (req) => {
      const property = await app.repo(Property).findOneBy({ propertyCode: req.params.code, status: 'ACTIVE' });
      if (!property) throw AppError.notFound('Property');
      const images = await app.repo(PropertyImage).find({ where: { propertyId: property.id }, order: { sortOrder: 'ASC' } });
      const cover = images.find((i) => i.isCover) ?? images[0];
      return { ...property, images, coverImageUrl: cover?.imageUrl ?? null };
    });

  r.get('/agents', { schema: { tags: ['public'], summary: 'List active agents', response: { 200: z.array(publicAgent) } } },
    async () => app.repo(User).find({ where: { role: 'AGENT', status: 'ACTIVE' }, order: { fullName: 'ASC' } }));

  r.post('/leads', {
    config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    schema: {
      tags: ['public'],
      summary: 'Submit a website lead (creates a contact + activity, and an opportunity when intent is given)',
      body: leadBody,
      response: { 201: z.object({ contactId: z.string().uuid(), opportunityId: z.string().uuid().nullable() }) },
    },
  }, async (req, reply) => {
    const result = await app.db.transaction(async (manager) => {
      const contactType = req.body.contactType ?? 'BUYER';
      const contact = await manager.getRepository(Contact).save(
        manager.getRepository(Contact).create({
          fullName: req.body.fullName,
          phone: req.body.phone ?? null,
          email: req.body.email ?? null,
          contactType,
          source: 'WEBSITE',
          notes: req.body.message ?? null,
        }),
      );

      let opportunityId: string | null = null;
      if (!SELLER_CONTACT_TYPES.has(contactType) && req.body.listingType && req.body.propertyType) {
        const opp = await manager.getRepository(Opportunity).save(
          manager.getRepository(Opportunity).create({
            contactId: contact.id,
            listingType: req.body.listingType,
            propertyType: req.body.propertyType,
            city: req.body.city ?? null,
            budgetMin: req.body.budgetMin ?? null,
            budgetMax: req.body.budgetMax ?? null,
            status: 'NEW',
            requirementsJson: {},
          }),
        );
        opportunityId = opp.id;
      }

      // Link the related property: prefer an explicit id, else resolve from its code.
      let propertyId = req.body.propertyId ?? null;
      if (!propertyId && req.body.propertyCode) {
        const prop = await manager.getRepository(Property).findOne({
          where: { propertyCode: req.body.propertyCode },
          select: { id: true },
        });
        propertyId = prop?.id ?? null;
      }

      await manager.getRepository(Activity).save(
        manager.getRepository(Activity).create({
          type: 'MESSAGE',
          contactId: contact.id,
          propertyId,
          opportunityId,
          note: req.body.message ?? 'Website inquiry',
        }),
      );

      await notifyActiveAdmins(manager, {
        type: 'NEW_LEAD',
        title: opportunityId ? 'New buyer/tenant request' : 'New website lead',
        body: `${contact.fullName}${req.body.phone ? ` · ${req.body.phone}` : ''}`,
        linkPath: opportunityId ? '/opportunities' : '/contacts',
      });

      return { contactId: contact.id, opportunityId };
    });
    return reply.status(201).send(result);
  });

  r.post('/uploads/sign', {
    config: { rateLimit: { max: 20, timeWindow: '1 minute' } },
    schema: {
      tags: ['public'],
      summary: 'Presigned PUT URL for a public image upload (property offers)',
      body: publicSignBody,
      response: { 200: publicSignResponse, 503: z.object({ code: z.string(), message: z.string() }) },
    },
  }, async (req) => {
    if (!isStorageConfigured()) {
      throw new AppError(503, 'Object storage is not configured', 'storage_unavailable');
    }
    // Force the public-readable `properties/` prefix; never let callers pick the folder.
    const key = `properties/${randomUUID()}${safeExt(req.body.filename)}`;
    const { uploadUrl, publicUrl } = await createUploadUrl(key, req.body.contentType);
    return { key, uploadUrl, publicUrl, expiresIn: 300 };
  });

  r.post('/property-offers', {
    config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
    schema: {
      tags: ['public'],
      summary: 'Owner submits a property to the agency — creates an OWNER contact + a DRAFT listing for review',
      body: propertyOfferBody,
      response: {
        201: z.object({ contactId: z.string().uuid(), propertyId: z.string().uuid() }),
        503: z.object({ code: z.string(), message: z.string() }),
      },
    },
  }, async (req, reply) => {
    const propertyType = WEB_PROPERTY_TYPE_MAP[req.body.propertyType.toLowerCase()] ?? 'APARTMENT';

    const result = await app.db.transaction(async (manager) => {
      // The schema requires an agent; route new intake to the agency's default user.
      const userRepo = manager.getRepository(User);
      const agent =
        (await userRepo.findOne({ where: { role: 'ADMIN', status: 'ACTIVE' }, order: { createdAt: 'ASC' } })) ??
        (await userRepo.findOne({ where: { status: 'ACTIVE' }, order: { createdAt: 'ASC' } }));
      if (!agent) throw new AppError(503, 'No agent available to receive the offer', 'no_agent');

      const contactRepo = manager.getRepository(Contact);
      const contact = await contactRepo.save(
        contactRepo.create({
          fullName: req.body.fullName,
          phone: req.body.phone ?? null,
          email: req.body.email ?? null,
          contactType: 'OWNER',
          source: 'WEBSITE',
          notes: req.body.description ?? null,
        }),
      );

      const title = req.body.title?.trim() || `${titleCase(propertyType)} in ${req.body.city}`;
      const propRepo = manager.getRepository(Property);
      const property = await propRepo.save(
        propRepo.create({
          status: 'DRAFT',
          listingType: req.body.listingType,
          propertyType,
          titleJson: { en: title, sq: title, de: title },
          descriptionJson: req.body.description
            ? { en: req.body.description, sq: req.body.description, de: req.body.description }
            : null,
          price: req.body.price ?? 0,
          currency: req.body.currency ?? 'EUR',
          country: 'Kosovo',
          city: req.body.city,
          area: req.body.area ?? null,
          agentUserId: agent.id,
          ownerContactId: contact.id,
          attributesJson: {},
        }),
      );

      const images = req.body.images ?? [];
      if (images.length) {
        const imgRepo = manager.getRepository(PropertyImage);
        await imgRepo.save(
          images.map((im, i) =>
            imgRepo.create({ propertyId: property.id, imageUrl: im.url, storageKey: im.key, isCover: i === 0, sortOrder: i }),
          ),
        );
      }

      await manager.getRepository(Activity).save(
        manager.getRepository(Activity).create({
          type: 'NOTE',
          contactId: contact.id,
          propertyId: property.id,
          note: 'Website property offer (owner intake) — review & publish.',
        }),
      );

      await notifyActiveAdmins(manager, {
        type: 'PROPERTY_OFFER',
        title: 'New property offer',
        body: `${contact.fullName} offered ${titleCase(propertyType)} in ${req.body.city}`,
        linkPath: '/properties?status=DRAFT',
      });

      return { contactId: contact.id, propertyId: property.id };
    });

    return reply.status(201).send(result);
  });
}
