export type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const CURRENT_LOG_LEVEL: LogLevel =
  (Deno.env.get("LOG_LEVEL") as LogLevel) || "info";

const SENSITIVE_KEYS = new Set([
  "password",
  "passwd",
  "secret",
  "token",
  "api_key",
  "apikey",
  "api-key",
  "authorization",
  "auth",
  "bearer",
  "credential",
  "credentials",
  "private_key",
  "privatekey",
  "access_token",
  "accesstoken",
  "refresh_token",
  "refreshtoken",
  "session",
  "cookie",
  "ssn",
  "social_security",
  "credit_card",
  "creditcard",
  "card_number",
  "cardnumber",
  "cvv",
  "cvc",
  "pin",
  "otp",
  "totp",
  "mfa_code",
  "backup_code",
  "recovery_code",
]);

const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
const PHONE_PATTERN = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;
const IP_PATTERN = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g;
const UUID_PATTERN =
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;
const JWT_PATTERN = /\beyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g;

export function sanitizeForLogging(value: unknown, depth = 0): unknown {
  if (depth > 10) return "[MAX_DEPTH_EXCEEDED]";

  if (value === null || value === undefined) return value;

  if (typeof value === "string") {
    let sanitized = value;
    sanitized = sanitized.replace(JWT_PATTERN, "[JWT_REDACTED]");
    sanitized = sanitized.replace(EMAIL_PATTERN, "[EMAIL_REDACTED]");
    sanitized = sanitized.replace(PHONE_PATTERN, "[PHONE_REDACTED]");

    if (sanitized.length > 1000) {
      sanitized = sanitized.substring(0, 1000) + "...[TRUNCATED]";
    }

    return sanitized;
  }

  if (Array.isArray(value)) {
    return value.slice(0, 100).map((item) => sanitizeForLogging(item, depth + 1));
  }

  if (typeof value === "object") {
    const sanitized: Record<string, unknown> = {};

    for (const [key, val] of Object.entries(value)) {
      const lowerKey = key.toLowerCase();

      if (SENSITIVE_KEYS.has(lowerKey)) {
        sanitized[key] = "[REDACTED]";
      } else if (
        lowerKey.includes("password") ||
        lowerKey.includes("secret") ||
        lowerKey.includes("token") ||
        lowerKey.includes("key") ||
        lowerKey.includes("auth")
      ) {
        sanitized[key] = "[REDACTED]";
      } else {
        sanitized[key] = sanitizeForLogging(val, depth + 1);
      }
    }

    return sanitized;
  }

  return value;
}

export interface LogContext {
  request_id: string;
  function_name: string;
  user_id?: string;
  method?: string;
  path?: string;
  [key: string]: unknown;
}

export interface LogEntry {
  level: LogLevel;
  timestamp: string;
  request_id: string;
  function_name: string;
  message: string;
  user_id?: string;
  method?: string;
  path?: string;
  duration_ms?: number;
  error_id?: string;
  error_name?: string;
  error_stack?: string;
  [key: string]: unknown;
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[CURRENT_LOG_LEVEL];
}

function formatLogEntry(entry: LogEntry): string {
  return JSON.stringify(entry);
}

export class Logger {
  private context: LogContext;
  private startTime: number;
  private checkpoints: Array<{ name: string; time: number; duration_ms: number }>;

  constructor(context: LogContext) {
    this.context = context;
    this.startTime = Date.now();
    this.checkpoints = [];
  }

  private createEntry(
    level: LogLevel,
    message: string,
    extra?: Record<string, unknown>
  ): LogEntry {
    const sanitizedExtra = extra
      ? (sanitizeForLogging(extra) as Record<string, unknown>)
      : {};

    return {
      level,
      timestamp: new Date().toISOString(),
      request_id: this.context.request_id,
      function_name: this.context.function_name,
      message,
      user_id: this.context.user_id,
      method: this.context.method,
      path: this.context.path,
      ...sanitizedExtra,
    };
  }

  debug(message: string, extra?: Record<string, unknown>): void {
    if (!shouldLog("debug")) return;
    console.log(formatLogEntry(this.createEntry("debug", message, extra)));
  }

  info(message: string, extra?: Record<string, unknown>): void {
    if (!shouldLog("info")) return;
    console.log(formatLogEntry(this.createEntry("info", message, extra)));
  }

  warn(message: string, extra?: Record<string, unknown>): void {
    if (!shouldLog("warn")) return;
    console.warn(formatLogEntry(this.createEntry("warn", message, extra)));
  }

  error(
    message: string,
    error?: unknown,
    extra?: Record<string, unknown>
  ): string {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    let errorName = "UnknownError";
    let errorStack: string | undefined;

    if (error instanceof Error) {
      errorName = error.name;
      errorStack = error.stack;
    }

    const entry = this.createEntry("error", message, {
      ...extra,
      error_id: errorId,
      error_name: errorName,
      error_message: error instanceof Error ? error.message : String(error),
      error_stack: errorStack,
    });

    console.error(formatLogEntry(entry));
    return errorId;
  }

  checkpoint(name: string): void {
    const now = Date.now();
    const lastTime =
      this.checkpoints.length > 0
        ? this.checkpoints[this.checkpoints.length - 1].time
        : this.startTime;

    this.checkpoints.push({
      name,
      time: now,
      duration_ms: now - lastTime,
    });
  }

  logPerformance(extra?: Record<string, unknown>): void {
    const endTime = Date.now();
    const duration = endTime - this.startTime;

    this.info("Request completed", {
      type: "performance",
      duration_ms: duration,
      checkpoints: this.checkpoints,
      ...extra,
    });
  }

  setUserId(userId: string): void {
    this.context.user_id = userId;
  }

  getRequestId(): string {
    return this.context.request_id;
  }
}

export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

export function createLogger(
  functionName: string,
  req?: Request
): Logger {
  const requestId = generateRequestId();

  let method: string | undefined;
  let path: string | undefined;

  if (req) {
    method = req.method;
    try {
      const url = new URL(req.url);
      path = url.pathname;
    } catch {
      path = undefined;
    }
  }

  return new Logger({
    request_id: requestId,
    function_name: functionName,
    method,
    path,
  });
}

export function logRequestStart(logger: Logger, extra?: Record<string, unknown>): void {
  logger.info("Request started", { type: "request_start", ...extra });
}

export function logRequestEnd(
  logger: Logger,
  statusCode: number,
  extra?: Record<string, unknown>
): void {
  logger.logPerformance({ type: "request_end", status_code: statusCode, ...extra });
}

export function createStructuredResponse(
  logger: Logger,
  data: unknown,
  status = 200
): Response {
  logRequestEnd(logger, status);

  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "X-Request-Id": logger.getRequestId(),
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, Authorization, X-Client-Info, Apikey",
    },
  });
}

export function createStructuredErrorResponse(
  logger: Logger,
  message: string,
  error: unknown,
  status = 500,
  extra?: Record<string, unknown>
): Response {
  const errorId = logger.error(message, error, extra);

  return new Response(
    JSON.stringify({
      error: message,
      error_id: errorId,
      request_id: logger.getRequestId(),
    }),
    {
      status,
      headers: {
        "Content-Type": "application/json",
        "X-Request-Id": logger.getRequestId(),
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type, Authorization, X-Client-Info, Apikey",
      },
    }
  );
}
