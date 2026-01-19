import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL')
    .refine(
      (url) => !url.includes('placeholder'),
      'NEXT_PUBLIC_SUPABASE_URL cannot be a placeholder value'
    ),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(20, 'NEXT_PUBLIC_SUPABASE_ANON_KEY must be a valid Supabase anon key')
    .refine(
      (key) => !key.includes('placeholder'),
      'NEXT_PUBLIC_SUPABASE_ANON_KEY cannot be a placeholder value'
    ),
  NEXT_PUBLIC_SITE_URL: z
    .string()
    .url('NEXT_PUBLIC_SITE_URL must be a valid URL')
    .optional(),
})

export type Env = z.infer<typeof envSchema>

function validateEnv(): Env {
  const env = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  }

  const result = envSchema.safeParse(env)

  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n')

    throw new Error(
      `\n\nEnvironment validation failed:\n${errors}\n\n` +
      'Please check your .env file and ensure all required variables are set.\n' +
      'See .env.example for the required format.\n'
    )
  }

  return result.data
}

export const env = validateEnv()
