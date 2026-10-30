/**
 * © Joan Mora — Proprietary. See LICENSE.
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const envSchema = z.object({
  MONGODB_URI: z.string().min(1),
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES: z.string().default('2h'),
  DATA_ENCRYPTION_KEY: z
    .string()
    .length(64)
    .regex(/^[0-9a-fA-F]+$/, 'DATA_ENCRYPTION_KEY must be 64 hex chars (32 bytes)'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
  // Dev fallback only when missing — still require real values for crypto ops
  console.warn('Using development fallbacks for missing env vars. Set a proper .env before production.');
}

const fallback = {
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/directorio_casas',
  PORT: Number(process.env.PORT) || 4000,
  NODE_ENV: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  JWT_SECRET:
    process.env.JWT_SECRET ||
    'dev_only_jwt_secret_change_me_32chars_minimum_ok',
  JWT_EXPIRES: process.env.JWT_EXPIRES || '2h',
  DATA_ENCRYPTION_KEY:
    process.env.DATA_ENCRYPTION_KEY ||
    '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
};

export const config = parsed.success ? parsed.data : fallback;
