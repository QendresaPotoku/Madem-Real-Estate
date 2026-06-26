import fp from 'fastify-plugin';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { config } from '../config';
import { AppError } from '../lib/errors';
import type { UserRole } from '../schemas/enums';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

declare module 'fastify' {
  interface FastifyInstance {
    authGuard: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    roleGuard: (roles: UserRole[]) => (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    setSessionCookie: (reply: FastifyReply, user: AuthUser) => void;
    clearSessionCookie: (reply: FastifyReply) => void;
  }
  interface FastifyRequest {
    authUser?: AuthUser;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: AuthUser;
    user: AuthUser;
  }
}

/** JWT-in-httpOnly-cookie auth: guards + cookie helpers. Single admin today, RBAC-ready. */
export default fp(async (app) => {
  await app.register(cookie, { secret: config.COOKIE_SECRET });
  await app.register(jwt, {
    secret: config.JWT_SECRET,
    cookie: { cookieName: config.COOKIE_NAME, signed: false },
    sign: { expiresIn: '7d' },
  });

  app.decorate('setSessionCookie', function setSessionCookie(reply: FastifyReply, user: AuthUser) {
    const token = app.jwt.sign(user);
    reply.setCookie(config.COOKIE_NAME, token, {
      httpOnly: true,
      secure: config.COOKIE_SECURE,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
  });

  app.decorate('clearSessionCookie', function clearSessionCookie(reply: FastifyReply) {
    reply.clearCookie(config.COOKIE_NAME, { path: '/' });
  });

  app.decorate('authGuard', async function authGuard(req: FastifyRequest) {
    try {
      const payload = await req.jwtVerify<AuthUser>();
      req.authUser = payload;
    } catch {
      throw AppError.unauthorized('Authentication required');
    }
  });

  app.decorate('roleGuard', function roleGuard(roles: UserRole[]) {
    return async function guard(req: FastifyRequest) {
      if (!req.authUser) throw AppError.unauthorized('Authentication required');
      if (!roles.includes(req.authUser.role)) throw AppError.forbidden('Insufficient permissions');
    };
  });
}, { name: 'auth', dependencies: [] });
