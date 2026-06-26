import Fastify, { type FastifyInstance } from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import {
  serializerCompiler,
  validatorCompiler,
  jsonSchemaTransform,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { z } from 'zod';

import { config } from './config';
import { errorHandler } from './lib/errors';
import dbPlugin from './plugins/db';
import authPlugin from './plugins/auth';
import { authRoutes } from './modules/auth/auth.routes';
import { userRoutes } from './modules/users/users.routes';
import { lookupRoutes } from './modules/lookups/lookups.routes';
import { locationLookupRoutes } from './modules/location-lookups/location-lookups.routes';
import { contactRoutes } from './modules/contacts/contacts.routes';
import { propertyRoutes } from './modules/properties/properties.routes';
import { listingAgreementRoutes } from './modules/listing-agreements/listing-agreements.routes';
import { opportunityRoutes } from './modules/opportunities/opportunities.routes';
import { matchRoutes } from './modules/matches/matches.routes';
import { viewingRoutes } from './modules/viewings/viewings.routes';
import { offerRoutes } from './modules/offers/offers.routes';
import { dealRoutes } from './modules/deals/deals.routes';
import { contractRoutes } from './modules/contracts/contracts.routes';
import { commissionRoutes } from './modules/commissions/commissions.routes';
import { activityRoutes } from './modules/activities/activities.routes';
import { taskRoutes } from './modules/tasks/tasks.routes';
import { uploadRoutes } from './modules/uploads/uploads.routes';
import { propertyImageRoutes } from './modules/properties/property-images.routes';
import { propertyDocumentRoutes } from './modules/properties/property-documents.routes';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes';
import { publicRoutes } from './modules/public/public.routes';
import { notificationRoutes } from './modules/notifications/notifications.routes';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: config.NODE_ENV === 'development' ? 'info' : 'warn',
      transport:
        config.NODE_ENV === 'development'
          ? { target: 'pino-pretty', options: { translateTime: 'HH:MM:ss', ignore: 'pid,hostname' } }
          : undefined,
    },
    genReqId: () => crypto.randomUUID(),
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  app.setErrorHandler(errorHandler);

  // Security & infra plugins
  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, { origin: config.CORS_ORIGINS, credentials: true });
  await app.register(rateLimit, { max: 300, timeWindow: '1 minute' });

  // OpenAPI
  await app.register(swagger, {
    openapi: {
      info: { title: 'MADEM CRM API', version: '0.1.0' },
      servers: [{ url: '/' }],
      components: {
        securitySchemes: {
          cookieAuth: { type: 'apiKey', in: 'cookie', name: config.COOKIE_NAME },
        },
      },
    },
    transform: jsonSchemaTransform,
  });
  await app.register(swaggerUi, { routePrefix: '/docs' });

  // Core plugins
  await app.register(dbPlugin);
  await app.register(authPlugin);

  // Health
  app.withTypeProvider<ZodTypeProvider>().get(
    '/health',
    { schema: { tags: ['system'], response: { 200: z.object({ status: z.string(), uptime: z.number() }) } } },
    async () => ({ status: 'ok', uptime: process.uptime() }),
  );

  // Domain modules
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(userRoutes, { prefix: '/api/users' });
  await app.register(lookupRoutes, { prefix: '/api/lookups' });
  await app.register(locationLookupRoutes, { prefix: '/api/location-lookups' });
  await app.register(contactRoutes, { prefix: '/api/contacts' });
  await app.register(propertyRoutes, { prefix: '/api/properties' });
  await app.register(propertyImageRoutes, { prefix: '/api/properties' });
  await app.register(propertyDocumentRoutes, { prefix: '/api/properties' });
  await app.register(listingAgreementRoutes, { prefix: '/api/listing-agreements' });
  await app.register(opportunityRoutes, { prefix: '/api/opportunities' });
  await app.register(matchRoutes, { prefix: '/api' });
  await app.register(viewingRoutes, { prefix: '/api/viewings' });
  await app.register(offerRoutes, { prefix: '/api/offers' });
  await app.register(dealRoutes, { prefix: '/api/deals' });
  await app.register(contractRoutes, { prefix: '/api/contracts' });
  await app.register(commissionRoutes, { prefix: '/api/commissions' });
  await app.register(activityRoutes, { prefix: '/api/activities' });
  await app.register(taskRoutes, { prefix: '/api/tasks' });
  await app.register(notificationRoutes, { prefix: '/api/notifications' });
  await app.register(uploadRoutes, { prefix: '/api/uploads' });
  await app.register(dashboardRoutes, { prefix: '/api/dashboard' });
  await app.register(publicRoutes, { prefix: '/api/public' });

  return app;
}
