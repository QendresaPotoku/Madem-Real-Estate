import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { LocationArea, LocationCadastralZone, LocationCity, LocationCountry } from '../../entities';
import { AppError } from '../../lib/errors';
import { errorResponseSchema, uuidParamSchema } from '../../schemas/common';

const nameBody = z.object({ name: z.string().trim().min(1) });
const cityBody = nameBody.extend({ countryId: z.string().uuid() });
const childBody = nameBody.extend({ cityId: z.string().uuid() });

const countryResponse = z.object({ id: z.string().uuid(), name: z.string() });
const cityResponse = z.object({ id: z.string().uuid(), countryId: z.string().uuid(), name: z.string() });
const areaResponse = z.object({ id: z.string().uuid(), cityId: z.string().uuid(), name: z.string() });
const cadastralZoneResponse = z.object({ id: z.string().uuid(), cityId: z.string().uuid(), name: z.string() });
const listResponse = z.object({
  countries: z.array(countryResponse),
  cities: z.array(cityResponse),
  areas: z.array(areaResponse),
  cadastralZones: z.array(cadastralZoneResponse),
});

export async function locationLookupRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();
  r.addHook('preHandler', app.authGuard);

  r.get(
    '/',
    { schema: { tags: ['location-lookups'], summary: 'List location lookup values', response: { 200: listResponse } } },
    async () => ({
      countries: await app.repo(LocationCountry).find({ order: { name: 'ASC' } }),
      cities: await app.repo(LocationCity).find({ order: { name: 'ASC' } }),
      areas: await app.repo(LocationArea).find({ order: { name: 'ASC' } }),
      cadastralZones: await app.repo(LocationCadastralZone).find({ order: { name: 'ASC' } }),
    }),
  );

  r.post(
    '/countries',
    { schema: { tags: ['location-lookups'], body: nameBody, response: { 201: countryResponse, 409: errorResponseSchema } } },
    async (req, reply) => reply.status(201).send(await app.repo(LocationCountry).save(app.repo(LocationCountry).create(req.body))),
  );

  r.delete(
    '/countries/:id',
    { schema: { tags: ['location-lookups'], params: uuidParamSchema, response: { 204: z.null(), 404: errorResponseSchema } } },
    async (req, reply) => {
      const result = await app.repo(LocationCountry).delete({ id: req.params.id });
      if (!result.affected) throw AppError.notFound('Country');
      return reply.status(204).send(null);
    },
  );

  r.post(
    '/cities',
    { schema: { tags: ['location-lookups'], body: cityBody, response: { 201: cityResponse, 409: errorResponseSchema } } },
    async (req, reply) => reply.status(201).send(await app.repo(LocationCity).save(app.repo(LocationCity).create(req.body))),
  );

  r.delete(
    '/cities/:id',
    { schema: { tags: ['location-lookups'], params: uuidParamSchema, response: { 204: z.null(), 404: errorResponseSchema } } },
    async (req, reply) => {
      const result = await app.repo(LocationCity).delete({ id: req.params.id });
      if (!result.affected) throw AppError.notFound('City');
      return reply.status(204).send(null);
    },
  );

  r.post(
    '/areas',
    { schema: { tags: ['location-lookups'], body: childBody, response: { 201: areaResponse, 409: errorResponseSchema } } },
    async (req, reply) => reply.status(201).send(await app.repo(LocationArea).save(app.repo(LocationArea).create(req.body))),
  );

  r.delete(
    '/areas/:id',
    { schema: { tags: ['location-lookups'], params: uuidParamSchema, response: { 204: z.null(), 404: errorResponseSchema } } },
    async (req, reply) => {
      const result = await app.repo(LocationArea).delete({ id: req.params.id });
      if (!result.affected) throw AppError.notFound('Area');
      return reply.status(204).send(null);
    },
  );

  r.post(
    '/cadastral-zones',
    { schema: { tags: ['location-lookups'], body: childBody, response: { 201: cadastralZoneResponse, 409: errorResponseSchema } } },
    async (req, reply) =>
      reply.status(201).send(await app.repo(LocationCadastralZone).save(app.repo(LocationCadastralZone).create(req.body))),
  );

  r.delete(
    '/cadastral-zones/:id',
    { schema: { tags: ['location-lookups'], params: uuidParamSchema, response: { 204: z.null(), 404: errorResponseSchema } } },
    async (req, reply) => {
      const result = await app.repo(LocationCadastralZone).delete({ id: req.params.id });
      if (!result.affected) throw AppError.notFound('Cadastral zone');
      return reply.status(204).send(null);
    },
  );
}
