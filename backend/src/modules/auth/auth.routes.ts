import { verify } from '@node-rs/argon2';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { User } from '../../entities';
import { AppError } from '../../lib/errors';
import { errorResponseSchema } from '../../schemas/common';
import { USER_ROLES } from '../../schemas/enums';

const loginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const meResponse = z.object({
  id: z.string().uuid(),
  email: z.string(),
  fullName: z.string(),
  role: z.enum(USER_ROLES),
});

export async function authRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();

  r.post(
    '/login',
    {
      config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
      schema: {
        tags: ['auth'],
        summary: 'Log in with email + password (sets httpOnly session cookie)',
        body: loginBody,
        response: { 200: meResponse, 401: errorResponseSchema, 429: errorResponseSchema },
      },
    },
    async (req, reply) => {
      const { email, password } = req.body;
      const user = await app
        .repo(User)
        .createQueryBuilder('u')
        .addSelect('u.passwordHash')
        .where('u.email = :email', { email })
        .getOne();

      if (!user || user.status !== 'ACTIVE') throw AppError.unauthorized('Invalid credentials');
      const ok = await verify(user.passwordHash, password).catch(() => false);
      if (!ok) throw AppError.unauthorized('Invalid credentials');

      app.setSessionCookie(reply, { id: user.id, email: user.email, role: user.role });
      return { id: user.id, email: user.email, fullName: user.fullName, role: user.role };
    },
  );

  r.get(
    '/me',
    {
      preHandler: app.authGuard,
      schema: {
        tags: ['auth'],
        summary: 'Current authenticated user',
        response: { 200: meResponse, 401: errorResponseSchema },
      },
    },
    async (req) => {
      const user = await app.repo(User).findOneBy({ id: req.authUser!.id });
      if (!user) throw AppError.unauthorized('Session user not found');
      return { id: user.id, email: user.email, fullName: user.fullName, role: user.role };
    },
  );

  r.post(
    '/logout',
    {
      preHandler: app.authGuard,
      schema: { tags: ['auth'], summary: 'Clear the session cookie', response: { 204: z.null() } },
    },
    async (_req, reply) => {
      app.clearSessionCookie(reply);
      return reply.status(204).send(null);
    },
  );
}
