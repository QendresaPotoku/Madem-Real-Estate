import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default('0.0.0.0'),

  // Not .url(): Cloud SQL socket DSNs (postgresql://u:p@/db?host=/cloudsql/...) are
  // valid Postgres connection strings but not valid WHATWG URLs.
  DATABASE_URL: z.string().min(1),

  JWT_SECRET: z.string().min(16),
  COOKIE_SECRET: z.string().min(16),
  // Shared secret guarding POST /internal/run-reminders (called by Cloud Scheduler
  // so the service can scale to zero instead of running an always-on cron). When
  // unset, the endpoint is disabled and the in-process hourly cron is the fallback.
  CRON_SECRET: z.string().optional(),
  COOKIE_NAME: z.string().default('madem_session'),
  COOKIE_SECURE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),

  CORS_ORIGINS: z
    .string()
    .default('http://localhost:3000,http://localhost:5173')
    .transform((v) => v.split(',').map((s) => s.trim()).filter(Boolean)),

  ADMIN_EMAIL: z.string().email().default('admin@madem.local'),
  ADMIN_PASSWORD: z.string().min(8).default('admin12345'),
  ADMIN_NAME: z.string().default('MADEM Admin'),

  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default('auto'),
  S3_BUCKET: z.string().optional(),
  // Optional separate private bucket for `documents/*`. Falls back to S3_BUCKET
  // when unset (single-bucket local dev). In prod this is a non-public bucket so
  // property documents are never world-readable, only via presigned GET.
  S3_DOCS_BUCKET: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_PUBLIC_URL: z.string().optional(),

  // Google Gemini - powers automatic sq → en/de listing translation.
  // Auth modes (the translation service picks based on what's set):
  //   • Service account → set GOOGLE_APPLICATION_CREDENTIALS (path to the JSON key).
  //     Calls the Generative Language API with a Bearer token by default, or Vertex
  //     AI when GEMINI_USE_VERTEX=true.
  //   • API key → set GEMINI_API_KEY (used only when no service account is configured).
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-2.0-flash'),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),
  GOOGLE_CLOUD_PROJECT: z.string().optional(),
  GEMINI_USE_VERTEX: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  GCP_LOCATION: z.string().default('us-central1'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('❌ Invalid environment configuration:');
  // eslint-disable-next-line no-console
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = parsed.data;
export type Config = typeof config;
