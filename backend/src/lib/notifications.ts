import type { EntityManager } from 'typeorm';
import { Notification } from '../entities';

export interface NotifyInput {
  userId: string;
  type: string;
  title: string;
  body?: string | null;
  linkPath?: string | null;
}

/**
 * Persist a single in-app notification. The one sink every producer (cron now,
 * automation engine later) calls. Pass a transaction's EntityManager so the
 * notification commits atomically with whatever triggered it.
 */
export async function notify(manager: EntityManager, input: NotifyInput): Promise<Notification> {
  const repo = manager.getRepository(Notification);
  return repo.save(
    repo.create({
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      linkPath: input.linkPath ?? null,
    }),
  );
}
