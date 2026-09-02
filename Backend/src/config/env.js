const { z } = require('zod')

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(24, 'JWT_SECRET must be at least 24 characters'),
  GOOGLE_GENAI_API_KEY: z.string().min(1, 'GOOGLE_GENAI_API_KEY is required'),
  FRONTEND_ORIGIN: z.string().default('http://localhost:5173'),
  GEMINI_MODEL: z.string().default('gemini-3-flash-preview'),
  EMBEDDING_MODEL: z.string().default('gemini-embedding-001'),
})

const parsed = schema.safeParse(process.env)
if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors)
  throw new Error('Invalid environment configuration')
}

module.exports = parsed.data
