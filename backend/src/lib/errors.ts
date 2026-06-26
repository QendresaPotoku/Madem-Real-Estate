import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { hasZodFastifySchemaValidationErrors, isResponseSerializationError } from 'fastify-type-provider-zod';

/** Application-level error with an HTTP status. */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code = 'app_error',
    public details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }

  static notFound(what = 'Resource') {
    return new AppError(404, `${what} not found`, 'not_found');
  }
  static badRequest(message: string, details?: unknown) {
    return new AppError(400, message, 'bad_request', details);
  }
  static unauthorized(message = 'Unauthorized') {
    return new AppError(401, message, 'unauthorized');
  }
  static forbidden(message = 'Forbidden') {
    return new AppError(403, message, 'forbidden');
  }
  static conflict(message: string, details?: unknown) {
    return new AppError(409, message, 'conflict', details);
  }
}

/** Map Postgres error codes to friendly HTTP responses. */
function mapPgError(err: { code?: string; detail?: string; constraint?: string }) {
  switch (err.code) {
    case '23505': // unique_violation
      return new AppError(409, 'A record with these values already exists', 'unique_violation', err.detail);
    case '23503': // foreign_key_violation
      return new AppError(409, 'This record is linked to other data and can’t be changed or deleted.', 'fk_violation', err.detail);
    case '23514': // check_violation
      return new AppError(400, `Constraint violated: ${err.constraint ?? 'check'}`, 'check_violation', err.detail);
    case '23502': // not_null_violation
      return new AppError(400, 'A required field is missing', 'not_null_violation', err.detail);
    default:
      return null;
  }
}

/** Central error handler → RFC-7807-ish JSON. */
export function errorHandler(error: FastifyError, request: FastifyRequest, reply: FastifyReply) {
  if (hasZodFastifySchemaValidationErrors(error)) {
    return reply.status(400).send({
      code: 'validation_error',
      message: 'Request validation failed',
      details: error.validation,
    });
  }
  if (isResponseSerializationError(error)) {
    request.log.error({ err: error }, 'response serialization error');
    return reply.status(500).send({ code: 'serialization_error', message: 'Internal response error' });
  }

  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      code: error.code,
      message: error.message,
      ...(error.details ? { details: error.details } : {}),
    });
  }

  const pg = mapPgError(error as unknown as { code?: string });
  if (pg) {
    return reply.status(pg.statusCode).send({ code: pg.code, message: pg.message });
  }

  if (typeof error.statusCode === 'number' && error.statusCode < 500) {
    return reply.status(error.statusCode).send({ code: error.code ?? 'error', message: error.message });
  }

  request.log.error({ err: error }, 'unhandled error');
  return reply.status(500).send({ code: 'internal_error', message: 'Internal server error' });
}
