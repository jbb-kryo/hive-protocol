interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private maxSize: number;

  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.value;
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

export const cache = new MemoryCache(100);

export const CACHE_TTL = {
  SHORT: 30 * 1000,
  MEDIUM: 5 * 60 * 1000,
  LONG: 30 * 60 * 1000,
  HOUR: 60 * 60 * 1000,
} as const;

export async function withCache<T>(
  key: string,
  ttlMs: number,
  fn: () => Promise<T>
): Promise<T> {
  const cached = cache.get<T>(key);
  if (cached !== null) {
    return cached;
  }
  const result = await fn();
  cache.set(key, result, ttlMs);
  return result;
}

export const TIMEOUTS = {
  DEFAULT: 30000,
  SHORT: 10000,
  LONG: 60000,
  WEBHOOK: 30000,
  AI_REQUEST: 120000,
  DATABASE: 15000,
} as const;

export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage = "Operation timed out"
): Promise<T> {
  let timeoutId: number | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new TimeoutError(errorMessage, timeoutMs));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
}

export class TimeoutError extends Error {
  constructor(
    message: string,
    public readonly timeoutMs: number
  ) {
    super(message);
    this.name = "TimeoutError";
  }
}

export interface ErrorLogContext {
  function_name: string;
  user_id?: string;
  request_id?: string;
  path?: string;
  method?: string;
  [key: string]: unknown;
}

export interface StructuredError {
  error_id: string;
  timestamp: string;
  message: string;
  name: string;
  stack?: string;
  context: ErrorLogContext;
  is_timeout: boolean;
  is_validation: boolean;
  http_status: number;
}

export function createErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function logError(
  error: unknown,
  context: ErrorLogContext
): StructuredError {
  const errorId = createErrorId();
  const timestamp = new Date().toISOString();

  let message = "Unknown error";
  let name = "UnknownError";
  let stack: string | undefined;
  let isTimeout = false;
  let isValidation = false;
  let httpStatus = 500;

  if (error instanceof TimeoutError) {
    message = error.message;
    name = "TimeoutError";
    stack = error.stack;
    isTimeout = true;
    httpStatus = 504;
  } else if (error instanceof ValidationError) {
    message = error.message;
    name = "ValidationError";
    isValidation = true;
    httpStatus = 400;
  } else if (error instanceof AuthorizationError) {
    message = error.message;
    name = "AuthorizationError";
    httpStatus = error.statusCode;
  } else if (error instanceof Error) {
    message = error.message;
    name = error.name;
    stack = error.stack;
  } else if (typeof error === "string") {
    message = error;
  }

  const structuredError: StructuredError = {
    error_id: errorId,
    timestamp,
    message,
    name,
    stack,
    context,
    is_timeout: isTimeout,
    is_validation: isValidation,
    http_status: httpStatus,
  };

  console.error(
    JSON.stringify({
      level: "error",
      ...structuredError,
    })
  );

  return structuredError;
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field?: string
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

export class AuthorizationError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 401
  ) {
    super(message);
    this.name = "AuthorizationError";
  }
}

export class RateLimitError extends Error {
  constructor(
    message: string,
    public readonly retryAfter?: number
  ) {
    super(message);
    this.name = "RateLimitError";
  }
}

export interface PerformanceMetrics {
  start_time: number;
  end_time?: number;
  duration_ms?: number;
  checkpoints: Array<{ name: string; time: number; duration_ms: number }>;
}

export function createPerformanceTracker(): {
  checkpoint: (name: string) => void;
  end: () => PerformanceMetrics;
} {
  const metrics: PerformanceMetrics = {
    start_time: Date.now(),
    checkpoints: [],
  };
  let lastTime = metrics.start_time;

  return {
    checkpoint(name: string) {
      const now = Date.now();
      metrics.checkpoints.push({
        name,
        time: now,
        duration_ms: now - lastTime,
      });
      lastTime = now;
    },
    end() {
      metrics.end_time = Date.now();
      metrics.duration_ms = metrics.end_time - metrics.start_time;
      return metrics;
    },
  };
}

export function logPerformance(
  functionName: string,
  metrics: PerformanceMetrics,
  additionalContext?: Record<string, unknown>
): void {
  console.log(
    JSON.stringify({
      level: "info",
      type: "performance",
      function_name: functionName,
      duration_ms: metrics.duration_ms,
      checkpoints: metrics.checkpoints,
      ...additionalContext,
    })
  );
}

export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  retryableErrors?: string[];
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelayMs = 1000,
    maxDelayMs = 30000,
    backoffMultiplier = 2,
    retryableErrors = ["ECONNRESET", "ETIMEDOUT", "ENOTFOUND", "EAI_AGAIN"],
  } = options;

  let lastError: Error | undefined;
  let delay = initialDelayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      const isRetryable =
        retryableErrors.some((code) => lastError!.message.includes(code)) ||
        (error instanceof TimeoutError && attempt < maxAttempts);

      if (!isRetryable || attempt === maxAttempts) {
        throw lastError;
      }

      console.warn(
        JSON.stringify({
          level: "warn",
          type: "retry",
          attempt,
          max_attempts: maxAttempts,
          error: lastError.message,
          next_delay_ms: delay,
        })
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
      delay = Math.min(delay * backoffMultiplier, maxDelayMs);
    }
  }

  throw lastError;
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

export function createJsonResponse(
  data: unknown,
  status = 200,
  additionalHeaders?: Record<string, string>
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      ...additionalHeaders,
    },
  });
}

export function createErrorResponse(
  error: StructuredError,
  includeStack = false
): Response {
  const responseBody: Record<string, unknown> = {
    error: error.message,
    error_id: error.error_id,
  };

  if (includeStack && error.stack) {
    responseBody.stack = error.stack;
  }

  return createJsonResponse(responseBody, error.http_status);
}

export function handleOptionsRequest(): Response {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}
