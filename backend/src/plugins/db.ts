import fp from 'fastify-plugin';
import type { DataSource, EntityTarget, ObjectLiteral, Repository } from 'typeorm';
import { AppDataSource } from '../data-source';

declare module 'fastify' {
  interface FastifyInstance {
    db: DataSource;
    repo<T extends ObjectLiteral>(entity: EntityTarget<T>): Repository<T>;
  }
}

/** Initializes the TypeORM DataSource and exposes it on the Fastify instance. */
export default fp(async (app) => {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  app.decorate('db', AppDataSource);
  app.decorate('repo', function repo<T extends ObjectLiteral>(entity: EntityTarget<T>): Repository<T> {
    return AppDataSource.getRepository(entity);
  });

  app.addHook('onClose', async () => {
    if (AppDataSource.isInitialized) await AppDataSource.destroy();
  });
}, { name: 'db' });
