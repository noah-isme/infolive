import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_LIVEKIT_URL: z.string().url(),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL wajib diisi'),
  LIVEKIT_API_KEY: z.string().min(1, 'LIVEKIT_API_KEY wajib diisi'),
  LIVEKIT_API_SECRET: z.string().min(1, 'LIVEKIT_API_SECRET wajib diisi'),
  TURN_URL: z.string().min(1, 'TURN_URL wajib diisi'),
  AUTH_JWT_SECRET: z.string().min(32, 'AUTH_JWT_SECRET minimal 32 karakter'),
  SESSION_COOKIE_NAME: z.string().default('kelas_live_session'),
  SESSION_COOKIE_SECRET: z.string().min(16, 'SESSION_COOKIE_SECRET minimal 16 karakter'),
  RATE_LIMIT_TOKEN: z.string().min(8, 'RATE_LIMIT_TOKEN minimal 8 karakter'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (cachedEnv) {
    return cachedEnv;
  }

  const result = envSchema.safeParse({
    ...process.env,
  });

  if (!result.success) {
    console.error('❌ Validasi environment gagal:', result.error.flatten().fieldErrors);
    throw new Error('Environment variables invalid.');
  }

  cachedEnv = result.data;
  return cachedEnv;
}
