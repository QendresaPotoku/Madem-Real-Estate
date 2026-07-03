import 'reflect-metadata';
import { hash } from '@node-rs/argon2';
import { AppDataSource } from '../data-source';
import { config } from '../config';
import { User } from '../entities';

/**
 * Set the admin account's email + password to the current ADMIN_EMAIL /
 * ADMIN_PASSWORD env values. Unlike the seed (which only creates the admin when
 * missing), this always updates an existing admin, so it can rename the account
 * or recover a forgotten password.
 *
 * Run as a one-off Cloud Run job using the backend image:
 *   node dist/scripts/reset-admin-password.js
 * with ADMIN_EMAIL + ADMIN_PASSWORD (and DATABASE_URL) provided.
 */
async function main() {
  await AppDataSource.initialize();
  const userRepo = AppDataSource.getRepository(User);

  // Idempotent: target the account at the desired email if it already exists,
  // otherwise the existing admin (e.g. the original seeded one being renamed).
  let admin = await userRepo.findOne({ where: { email: config.ADMIN_EMAIL } });
  if (!admin) admin = await userRepo.findOne({ where: { role: 'ADMIN' } });

  if (!admin) {
    console.error('✗ no admin user found; run the seed first');
    process.exitCode = 1;
  } else {
    const previousEmail = admin.email;
    admin.email = config.ADMIN_EMAIL;
    admin.passwordHash = await hash(config.ADMIN_PASSWORD);
    admin.status = 'ACTIVE';
    await userRepo.save(admin);
    console.log(`✔ admin updated: ${previousEmail} -> ${config.ADMIN_EMAIL} (password reset)`);
  }

  await AppDataSource.destroy();
}

main().catch((err) => {
  console.error('❌ reset failed:', err);
  process.exit(1);
});
