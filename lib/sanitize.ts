import { z } from 'zod'

const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
}

const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /data:\s*text\/html/gi,
  /vbscript:/gi,
  /expression\s*\(/gi,
  /url\s*\(\s*['"]?\s*javascript:/gi,
]

const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|EXEC|UNION|DECLARE)\b)/gi,
  /('|"|;|--|\/\*|\*\/|@@|@)/g,
  /(\bOR\b|\bAND\b)\s+[\w'"=]+/gi,
  /\b(CHAR|NCHAR|VARCHAR|NVARCHAR)\s*\(/gi,
  /\b(WAITFOR|DELAY|BENCHMARK)\b/gi,
]

export function escapeHtml(str: string): string {
  if (!str) return ''
  return str.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char] || char)
}

export function stripHtml(str: string): string {
  if (!str) return ''
  return str
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
}

export function sanitizeText(str: string): string {
  if (!str) return ''

  let sanitized = str

  for (const pattern of DANGEROUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '')
  }

  sanitized = sanitized
    .replace(/\0/g, '')
    .replace(/\x00/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')

  return sanitized.trim()
}

export function sanitizeMessageContent(content: string): string {
  if (!content) return ''

  let sanitized = content

  sanitized = sanitized
    .replace(/\0/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')

  for (const pattern of DANGEROUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '')
  }

  sanitized = sanitized.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  const lines = sanitized.split('\n')
  if (lines.length > 500) {
    sanitized = lines.slice(0, 500).join('\n')
  }

  if (sanitized.length > 50000) {
    sanitized = sanitized.substring(0, 50000)
  }

  return sanitized.trim()
}

export function sanitizeAgentName(name: string): string {
  if (!name) return ''

  let sanitized = name
    .replace(/[<>"'`&;]/g, '')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim()

  if (sanitized.length > 100) {
    sanitized = sanitized.substring(0, 100)
  }

  return sanitized
}

export function sanitizeAgentPrompt(prompt: string): string {
  if (!prompt) return ''

  let sanitized = prompt
    .replace(/\0/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')

  for (const pattern of DANGEROUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '')
  }

  if (sanitized.length > 100000) {
    sanitized = sanitized.substring(0, 100000)
  }

  return sanitized.trim()
}

export function sanitizeSwarmName(name: string): string {
  return sanitizeAgentName(name)
}

export function containsSqlInjection(str: string): boolean {
  if (!str) return false

  return SQL_INJECTION_PATTERNS.some((pattern) => pattern.test(str))
}

export function sanitizeForSql(str: string): string {
  if (!str) return ''

  return str
    .replace(/'/g, "''")
    .replace(/\\/g, '\\\\')
    .replace(/\0/g, '')
}

export function sanitizeFilename(filename: string): string {
  if (!filename) return ''

  let sanitized = filename
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/\.{2,}/g, '.')
    .replace(/^\.+/, '')
    .replace(/\.+$/, '')

  const parts = sanitized.split('.')
  if (parts.length > 2) {
    const ext = parts.pop()
    sanitized = parts.join('_') + '.' + ext
  }

  if (sanitized.length > 255) {
    const ext = sanitized.split('.').pop() || ''
    const maxNameLength = 255 - ext.length - 1
    sanitized = sanitized.substring(0, maxNameLength) + '.' + ext
  }

  return sanitized
}

export function sanitizeUrl(url: string): string | null {
  if (!url) return null

  try {
    const parsed = new URL(url)

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null
    }

    if (parsed.username || parsed.password) {
      return null
    }

    return parsed.toString()
  } catch {
    return null
  }
}

export function sanitizeEmail(email: string): string {
  if (!email) return ''

  return email
    .toLowerCase()
    .trim()
    .replace(/[<>"'`&;]/g, '')
}

export function sanitizeJson(str: string): string {
  if (!str) return ''

  try {
    const parsed = JSON.parse(str)
    return JSON.stringify(parsed)
  } catch {
    return '{}'
  }
}

export const messageContentSchema = z
  .string()
  .min(1, 'Message cannot be empty')
  .max(50000, 'Message is too long')
  .transform(sanitizeMessageContent)

export const agentNameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(100, 'Name is too long')
  .transform(sanitizeAgentName)
  .refine((val) => val.length >= 1, 'Name cannot be empty after sanitization')

export const agentPromptSchema = z
  .string()
  .min(1, 'System prompt is required')
  .max(100000, 'System prompt is too long')
  .transform(sanitizeAgentPrompt)
  .refine((val) => val.length >= 1, 'Prompt cannot be empty after sanitization')

export const swarmNameSchema = z
  .string()
  .min(1, 'Swarm name is required')
  .max(100, 'Swarm name is too long')
  .transform(sanitizeSwarmName)
  .refine((val) => val.length >= 1, 'Name cannot be empty after sanitization')

export const swarmDescriptionSchema = z
  .string()
  .max(1000, 'Description is too long')
  .transform(sanitizeText)
  .optional()

export const emailSchema = z
  .string()
  .email('Invalid email address')
  .transform(sanitizeEmail)

export const urlSchema = z
  .string()
  .transform(sanitizeUrl)
  .refine((val) => val !== null, 'Invalid URL')

export const toolNameSchema = z
  .string()
  .min(1, 'Tool name is required')
  .max(100, 'Tool name is too long')
  .regex(/^[a-zA-Z][a-zA-Z0-9_-]*$/, 'Tool name must start with a letter and contain only letters, numbers, underscores, and hyphens')

export const toolDescriptionSchema = z
  .string()
  .max(1000, 'Description is too long')
  .transform(sanitizeText)

export const webhookUrlSchema = z
  .string()
  .url('Invalid webhook URL')
  .refine((url) => {
    try {
      const parsed = new URL(url)
      return ['http:', 'https:'].includes(parsed.protocol)
    } catch {
      return false
    }
  }, 'Webhook URL must use HTTP or HTTPS')

export const createAgentSchema = z.object({
  name: agentNameSchema,
  role: z.string().max(100).transform(sanitizeText).optional(),
  systemPrompt: agentPromptSchema,
  model: z.string().max(100).optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().max(100000).optional(),
})

export const createSwarmSchema = z.object({
  name: swarmNameSchema,
  description: swarmDescriptionSchema,
  context: z.string().max(50000).transform(sanitizeText).optional(),
})

export const createToolSchema = z.object({
  name: toolNameSchema,
  description: toolDescriptionSchema,
  endpoint: webhookUrlSchema.optional(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).optional(),
  parameters: z.string().max(10000).optional(),
})

export const sendMessageSchema = z.object({
  content: messageContentSchema,
  swarmId: z.string().uuid('Invalid swarm ID'),
})

export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data }
  }

  return {
    success: false,
    errors: result.error.errors.map((e) => e.message),
  }
}

export function isXssSafe(str: string): boolean {
  if (!str) return true

  return !DANGEROUS_PATTERNS.some((pattern) => pattern.test(str))
}

export function isSqlSafe(str: string): boolean {
  if (!str) return true

  return !containsSqlInjection(str)
}

export function renderSafeText(content: string): string {
  return escapeHtml(sanitizeText(content))
}

export { z }
