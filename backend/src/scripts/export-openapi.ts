import 'reflect-metadata';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildApp } from '../app';

/**
 * Builds the app and writes its OpenAPI spec to `openapi.json` (repo root of backend).
 * The frontends run `openapi-typescript` against this file to generate their client.
 */
async function main() {
  const app = await buildApp();
  await app.ready();
  const spec = app.swagger() as { paths?: Record<string, unknown> };

  // Normalize Fastify's prefix trailing slashes (`/api/contacts/` → `/api/contacts`)
  // so the generated client uses clean paths. Fastify matches both at runtime.
  if (spec.paths) {
    const normalized: Record<string, unknown> = {};
    for (const [path, item] of Object.entries(spec.paths)) {
      const clean = path.length > 1 && path.endsWith('/') ? path.replace(/\/+$/, '') : path;
      normalized[clean] = item;
    }
    spec.paths = normalized;
  }

  const outPath = resolve(process.cwd(), 'openapi.json');
  writeFileSync(outPath, JSON.stringify(spec, null, 2));
  // eslint-disable-next-line no-console
  console.log(`✔ OpenAPI spec written to ${outPath} (${Object.keys((spec as { paths?: object }).paths ?? {}).length} paths)`);
  await app.close();
  process.exit(0);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('❌ openapi export failed:', err);
  process.exit(1);
});
