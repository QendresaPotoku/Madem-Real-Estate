import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { Property, PropertyDocument } from '../../entities';
import { AppError } from '../../lib/errors';
import { errorResponseSchema } from '../../schemas/common';
import { DOCUMENT_STATUSES } from '../../schemas/enums';
import { createDownloadUrl, isStorageConfigured } from '../../lib/s3';

const docResponse = z.object({
  id: z.string().uuid(),
  propertyId: z.string().uuid(),
  documentTypeId: z.number(),
  fileUrl: z.string(),
  storageKey: z.string().nullable(),
  status: z.enum(DOCUMENT_STATUSES),
  notes: z.string().nullable(),
  uploadedBy: z.string().uuid().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const propertyParam = z.object({ id: z.string().uuid() });
const docParam = z.object({ id: z.string().uuid(), docId: z.string().uuid() });

const addBody = z.object({
  documentTypeId: z.number().int(),
  fileUrl: z.string().url(),
  storageKey: z.string().optional(),
  status: z.enum(DOCUMENT_STATUSES).default('PENDING'),
  notes: z.string().optional(),
});

const statusBody = z.object({
  status: z.enum(DOCUMENT_STATUSES),
  notes: z.string().optional(),
});

/** Mounted at /api/properties — legal/internal document management for a property. */
export async function propertyDocumentRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();
  r.addHook('preHandler', app.authGuard);

  r.get('/:id/documents', { schema: { tags: ['property-documents'], params: propertyParam, response: { 200: z.array(docResponse) } } },
    async (req) => app.repo(PropertyDocument).find({ where: { propertyId: req.params.id }, order: { createdAt: 'DESC' } }));

  r.post('/:id/documents', { schema: { tags: ['property-documents'], summary: 'Attach an uploaded document to a property', params: propertyParam, body: addBody, response: { 201: docResponse, 404: errorResponseSchema } } },
    async (req, reply) => {
      if (!(await app.repo(Property).existsBy({ id: req.params.id }))) throw AppError.notFound('Property');
      const repo = app.repo(PropertyDocument);
      const doc = await repo.save(
        repo.create({
          propertyId: req.params.id,
          documentTypeId: req.body.documentTypeId,
          fileUrl: req.body.fileUrl,
          storageKey: req.body.storageKey ?? null,
          status: req.body.status,
          notes: req.body.notes ?? null,
          uploadedBy: req.authUser!.id,
        }),
      );
      return reply.status(201).send(doc);
    });

  r.get('/:id/documents/:docId/url', { schema: { tags: ['property-documents'], summary: 'Get a short-lived presigned URL to view/download a private document', params: docParam, response: { 200: z.object({ url: z.string(), expiresIn: z.number() }), 404: errorResponseSchema, 503: errorResponseSchema } } },
    async (req) => {
      const doc = await app.repo(PropertyDocument).findOneBy({ id: req.params.docId, propertyId: req.params.id });
      if (!doc) throw AppError.notFound('Document');
      if (!doc.storageKey) return { url: doc.fileUrl, expiresIn: 0 };
      if (!isStorageConfigured()) throw new AppError(503, 'Object storage is not configured', 'storage_unavailable');
      return { url: await createDownloadUrl(doc.storageKey), expiresIn: 300 };
    });

  r.patch('/:id/documents/:docId', { schema: { tags: ['property-documents'], summary: 'Update a document\'s verification status', params: docParam, body: statusBody, response: { 200: docResponse, 404: errorResponseSchema } } },
    async (req) => {
      const repo = app.repo(PropertyDocument);
      const doc = await repo.findOneBy({ id: req.params.docId, propertyId: req.params.id });
      if (!doc) throw AppError.notFound('Document');
      repo.merge(doc, req.body);
      await repo.save(doc);
      return doc;
    });

  r.delete('/:id/documents/:docId', { schema: { tags: ['property-documents'], params: docParam, response: { 204: z.null(), 404: errorResponseSchema } } },
    async (req, reply) => {
      const result = await app.repo(PropertyDocument).delete({ id: req.params.docId, propertyId: req.params.id });
      if (!result.affected) throw AppError.notFound('Document');
      return reply.status(204).send(null);
    });
}
