import 'reflect-metadata';
import { buildApp } from './app';
import { config } from './config';
import { startReminderCron } from './cron/reminders.cron';
import { ensureBucket, isStorageConfigured } from './lib/s3';

async function main() {
  const app = await buildApp();

  // Best-effort: create the media bucket locally (MinIO) if storage is configured.
  if (isStorageConfigured()) {
    await ensureBucket().catch((err) => app.log.warn({ err }, 'ensureBucket failed'));
  }

  // In-process scheduled jobs (contract reminders).
  startReminderCron(app);

  try {
    await app.listen({ port: config.PORT, host: config.HOST });
    app.log.info(`MADEM CRM API ready on http://${config.HOST}:${config.PORT} (docs: /docs)`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }

  for (const sig of ['SIGINT', 'SIGTERM'] as const) {
    process.on(sig, async () => {
      app.log.info(`${sig} received, shutting down`);
      await app.close();
      process.exit(0);
    });
  }
}

void main();
