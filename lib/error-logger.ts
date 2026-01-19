import { supabase } from '@/lib/supabase'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const CURRENT_LOG_LEVEL: LogLevel =
  (process.env.NEXT_PUBLIC_LOG_LEVEL as LogLevel) || 'warn'

const IS_PRODUCTION = process.env.NODE_ENV === 'production'

const SENSITIVE_KEYS = new Set([
  'password',
  'passwd',
  'secret',
  'token',
  'api_key',
  'apikey',
  'authorization',
  'auth',
  'bearer',
  'credential',
  'credentials',
  'private_key',
  'access_token',
  'refresh_token',
  'session',
  'cookie',
  'ssn',
  'credit_card',
  'cvv',
  'pin',
  'otp',
])

function sanitizeForLogging(value: unknown, depth = 0): unknown {
  if (depth > 5) return '[MAX_DEPTH]'
  if (value === null || value === undefined) return value

  if (typeof value === 'string') {
    if (value.length > 500) {
      return value.substring(0, 500) + '...[TRUNCATED]'
    }
    return value
  }

  if (Array.isArray(value)) {
    return value.slice(0, 20).map((item) => sanitizeForLogging(item, depth + 1))
  }

  if (typeof value === 'object') {
    const sanitized: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(value)) {
      const lowerKey = key.toLowerCase()
      if (SENSITIVE_KEYS.has(lowerKey) ||
          lowerKey.includes('password') ||
          lowerKey.includes('secret') ||
          lowerKey.includes('token') ||
          lowerKey.includes('key')) {
        sanitized[key] = '[REDACTED]'
      } else {
        sanitized[key] = sanitizeForLogging(val, depth + 1)
      }
    }
    return sanitized
  }

  return value
}

function generateRequestId(): string {
  return `client_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[CURRENT_LOG_LEVEL]
}

interface ErrorContext {
  componentStack?: string
  errorBoundary?: boolean
  userId?: string
  url?: string
  userAgent?: string
  requestId?: string
  [key: string]: unknown
}

interface StructuredLog {
  level: LogLevel
  timestamp: string
  request_id: string
  message: string
  error_name?: string
  error_message?: string
  error_stack?: string
  url?: string
  user_agent?: string
  context?: Record<string, unknown>
}

function createStructuredLog(
  level: LogLevel,
  message: string,
  error?: Error | null,
  context?: ErrorContext
): StructuredLog {
  const requestId = context?.requestId || generateRequestId()

  const log: StructuredLog = {
    level,
    timestamp: new Date().toISOString(),
    request_id: requestId,
    message,
    url: typeof window !== 'undefined' ? window.location.href : context?.url,
    user_agent: typeof window !== 'undefined' ? navigator.userAgent : context?.userAgent,
  }

  if (error) {
    log.error_name = error.name
    log.error_message = error.message
    if (!IS_PRODUCTION) {
      log.error_stack = error.stack
    }
  }

  if (context) {
    const { componentStack, errorBoundary, userId, url, userAgent, requestId: _, ...rest } = context
    log.context = sanitizeForLogging({
      componentStack,
      errorBoundary,
      ...rest,
    }) as Record<string, unknown>
  }

  return log
}

function outputLog(log: StructuredLog): void {
  if (IS_PRODUCTION) {
    const logLine = JSON.stringify(log)
    switch (log.level) {
      case 'error':
        console.error(logLine)
        break
      case 'warn':
        console.warn(logLine)
        break
      case 'info':
        console.info(logLine)
        break
      case 'debug':
        console.debug(logLine)
        break
    }
  } else {
    switch (log.level) {
      case 'error':
        console.error(`[${log.level.toUpperCase()}] ${log.message}`, log)
        break
      case 'warn':
        console.warn(`[${log.level.toUpperCase()}] ${log.message}`, log)
        break
      case 'info':
        console.info(`[${log.level.toUpperCase()}] ${log.message}`, log)
        break
      case 'debug':
        console.debug(`[${log.level.toUpperCase()}] ${log.message}`, log)
        break
    }
  }
}

export function logDebug(message: string, context?: Record<string, unknown>): void {
  if (!shouldLog('debug')) return
  const log = createStructuredLog('debug', message, null, context)
  outputLog(log)
}

export function logInfo(message: string, context?: Record<string, unknown>): void {
  if (!shouldLog('info')) return
  const log = createStructuredLog('info', message, null, context)
  outputLog(log)
}

export function logWarn(message: string, context?: Record<string, unknown>): void {
  if (!shouldLog('warn')) return
  const log = createStructuredLog('warn', message, null, context)
  outputLog(log)
}

export async function logError(
  error: Error,
  context: ErrorContext = {}
): Promise<string> {
  const requestId = context.requestId || generateRequestId()
  const log = createStructuredLog('error', error.message, error, { ...context, requestId })

  outputLog(log)

  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      await supabase.from('error_logs').insert({
        user_id: user.id,
        error_message: error.message,
        error_stack: IS_PRODUCTION ? null : error.stack,
        error_name: error.name,
        url: log.url,
        user_agent: log.user_agent,
        context: sanitizeForLogging(context) as Record<string, unknown>,
        request_id: requestId,
      })
    }
  } catch (loggingError) {
    if (!IS_PRODUCTION) {
      console.error('Failed to persist error log:', loggingError)
    }
  }

  return requestId
}

export function createErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message)
  }

  return 'An unexpected error occurred'
}

export function getUserFriendlyErrorMessage(error: unknown): string {
  const message = createErrorMessage(error)

  const errorMap: Record<string, string> = {
    'Failed to fetch': 'Network error. Please check your connection and try again.',
    'Network request failed': 'Unable to connect. Please check your internet connection.',
    'Invalid credentials': 'Invalid email or password. Please try again.',
    'User already registered': 'An account with this email already exists.',
    'Email not confirmed': 'Please verify your email address before signing in.',
    'Invalid token': 'Your session has expired. Please sign in again.',
    'Unauthorized': 'You do not have permission to perform this action.',
    'Not found': 'The requested resource was not found.',
    'Rate limit exceeded': 'Too many requests. Please wait a moment and try again.',
  }

  for (const [key, friendlyMessage] of Object.entries(errorMap)) {
    if (message.toLowerCase().includes(key.toLowerCase())) {
      return friendlyMessage
    }
  }

  return message || 'Something went wrong. Please try again.'
}

export class RetryableError extends Error {
  public retryable: boolean
  public statusCode?: number
  public requestId?: string

  constructor(message: string, retryable = true, statusCode?: number) {
    super(message)
    this.name = 'RetryableError'
    this.retryable = retryable
    this.statusCode = statusCode
    this.requestId = generateRequestId()
  }
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number
    delayMs?: number
    backoff?: boolean
    onRetry?: (error: Error, attempt: number) => void
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    delayMs = 1000,
    backoff = true,
    onRetry,
  } = options

  let lastError: Error

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (attempt < maxRetries) {
        const isRetryable = error instanceof RetryableError
          ? error.retryable
          : true

        if (!isRetryable) {
          throw lastError
        }

        if (onRetry) {
          onRetry(lastError, attempt + 1)
        }

        if (!IS_PRODUCTION) {
          logWarn(`Retry attempt ${attempt + 1}/${maxRetries}`, {
            error: lastError.message,
          })
        }

        const delay = backoff ? delayMs * Math.pow(2, attempt) : delayMs
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError!
}

export function createPerformanceTracker(operationName: string) {
  const startTime = performance.now()
  const checkpoints: Array<{ name: string; time: number; duration_ms: number }> = []
  let lastTime = startTime

  return {
    checkpoint(name: string) {
      const now = performance.now()
      checkpoints.push({
        name,
        time: now,
        duration_ms: Math.round(now - lastTime),
      })
      lastTime = now
    },
    end() {
      const endTime = performance.now()
      const duration = Math.round(endTime - startTime)

      if (!IS_PRODUCTION && shouldLog('debug')) {
        logDebug(`Performance: ${operationName}`, {
          duration_ms: duration,
          checkpoints,
        })
      }

      return {
        operation: operationName,
        duration_ms: duration,
        checkpoints,
      }
    },
  }
}
