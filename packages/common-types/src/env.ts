import { z } from 'zod';

const sharedSchema = z.object({
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  S3_ENDPOINT: z.string().url(),
  S3_BUCKET: z.string().min(1),
  S3_REGION: z.string().min(1),
  S3_ACCESS_KEY: z.string().min(1),
  S3_SECRET_KEY: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1),
  JWT_ACCESS_EXPIRY: z.string().min(1),
  JWT_REFRESH_EXPIRY: z.string().min(1),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_CALLBACK_URL: z.string().min(1),
  SENDGRID_API_KEY: z.string().min(1),
  API_URL: z.string().url(),
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXT_PUBLIC_GOOGLE_FONTS_API_KEY: z.string().min(1).optional(),
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(1),
});

const webSchema = sharedSchema.pick({
  DATABASE_URL: true,
  REDIS_URL: true,
  S3_ENDPOINT: true,
  S3_BUCKET: true,
  S3_REGION: true,
  S3_ACCESS_KEY: true,
  S3_SECRET_KEY: true,
  JWT_SECRET: true,
  JWT_REFRESH_SECRET: true,
  GOOGLE_CLIENT_ID: true,
  GOOGLE_CLIENT_SECRET: true,
  API_URL: true,
  NEXT_PUBLIC_API_URL: true,
  NEXTAUTH_URL: true,
  NEXTAUTH_SECRET: true,
});

const apiWorkerSchema = sharedSchema.omit({
  NEXTAUTH_URL: true,
  NEXTAUTH_SECRET: true,
  NEXT_PUBLIC_API_URL: true,
  NEXT_PUBLIC_GOOGLE_FONTS_API_KEY: true,
});

export type EnvTarget = 'web' | 'api' | 'worker';
export type SharedEnv = z.infer<typeof sharedSchema>;

export function validateEnv(target: EnvTarget): SharedEnv {
  const rawEnv = {
    DATABASE_URL: process.env.DATABASE_URL,
    REDIS_URL: process.env.REDIS_URL,
    S3_ENDPOINT: process.env.S3_ENDPOINT,
    S3_BUCKET: process.env.S3_BUCKET,
    S3_REGION: process.env.S3_REGION,
    S3_ACCESS_KEY: process.env.S3_ACCESS_KEY,
    S3_SECRET_KEY: process.env.S3_SECRET_KEY,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    JWT_ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY,
    JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL,
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
    API_URL: process.env.API_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_GOOGLE_FONTS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_FONTS_API_KEY,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  };

  const schema = target === 'web' ? webSchema : apiWorkerSchema;
  const result = schema.safeParse(rawEnv);

  if (!result.success) {
    const missingFields = result.error.issues.map((issue) => issue.path.join('.'));
    throw new Error(
      `Missing or invalid environment variables for ${target}: ${missingFields.join(', ')}`,
    );
  }

  return sharedSchema.parse({
    ...rawEnv,
    NEXTAUTH_URL: rawEnv.NEXTAUTH_URL ?? 'http://localhost:3000',
    NEXTAUTH_SECRET: rawEnv.NEXTAUTH_SECRET ?? 'development-only-secret',
    NEXT_PUBLIC_API_URL: rawEnv.NEXT_PUBLIC_API_URL ?? rawEnv.API_URL,
  });
}
