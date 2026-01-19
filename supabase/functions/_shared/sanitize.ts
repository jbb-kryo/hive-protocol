const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /data:\s*text\/html/gi,
  /vbscript:/gi,
  /expression\s*\(/gi,
  /url\s*\(\s*['"]?\s*javascript:/gi,
];

export function escapeHtml(str: string): string {
  if (!str) return '';
  return str.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char] || char);
}

export function sanitizeText(str: string): string {
  if (!str) return '';

  let sanitized = str;

  for (const pattern of DANGEROUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }

  sanitized = sanitized
    .replace(/\0/g, '')
    .replace(/\x00/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  return sanitized.trim();
}

export function sanitizeMessageContent(content: string): string {
  if (!content) return '';

  let sanitized = content;

  sanitized = sanitized
    .replace(/\0/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  for (const pattern of DANGEROUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }

  sanitized = sanitized.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  const lines = sanitized.split('\n');
  if (lines.length > 500) {
    sanitized = lines.slice(0, 500).join('\n');
  }

  if (sanitized.length > 50000) {
    sanitized = sanitized.substring(0, 50000);
  }

  return sanitized.trim();
}

export function sanitizeName(name: string, maxLength = 100): string {
  if (!name) return '';

  let sanitized = name
    .replace(/[<>"'`&;]/g, '')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim();

  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

export function sanitizePrompt(prompt: string, maxLength = 100000): string {
  if (!prompt) return '';

  let sanitized = prompt
    .replace(/\0/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  for (const pattern of DANGEROUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }

  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized.trim();
}

export function sanitizeEmail(email: string): string {
  if (!email) return '';

  return email
    .toLowerCase()
    .trim()
    .replace(/[<>"'`&;]/g, '');
}

export function sanitizeUrl(url: string): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }

    if (parsed.username || parsed.password) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

export function isValidUuid(str: string): boolean {
  if (!str) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

export function sanitizeJsonString(str: string): string {
  if (!str) return '{}';

  try {
    const parsed = JSON.parse(str);
    return JSON.stringify(parsed);
  } catch {
    return '{}';
  }
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult<T> {
  valid: boolean;
  data?: T;
  errors?: ValidationError[];
}

export function validateRequired(
  value: unknown,
  field: string
): ValidationError | null {
  if (value === null || value === undefined || value === '') {
    return { field, message: `${field} is required` };
  }
  return null;
}

export function validateMaxLength(
  value: string,
  field: string,
  maxLength: number
): ValidationError | null {
  if (value && value.length > maxLength) {
    return { field, message: `${field} must be ${maxLength} characters or less` };
  }
  return null;
}

export function validateMinLength(
  value: string,
  field: string,
  minLength: number
): ValidationError | null {
  if (value && value.length < minLength) {
    return { field, message: `${field} must be at least ${minLength} characters` };
  }
  return null;
}

export function validateUuid(value: string, field: string): ValidationError | null {
  if (value && !isValidUuid(value)) {
    return { field, message: `${field} must be a valid UUID` };
  }
  return null;
}

export function validateEmail(value: string, field: string): ValidationError | null {
  if (!value) return null;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    return { field, message: `${field} must be a valid email address` };
  }
  return null;
}

export function validateUrl(value: string, field: string): ValidationError | null {
  if (!value) return null;

  const sanitized = sanitizeUrl(value);
  if (!sanitized) {
    return { field, message: `${field} must be a valid HTTP or HTTPS URL` };
  }
  return null;
}

export function validateNumber(
  value: unknown,
  field: string,
  options?: { min?: number; max?: number; integer?: boolean }
): ValidationError | null {
  if (value === null || value === undefined) return null;

  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (typeof num !== 'number' || isNaN(num)) {
    return { field, message: `${field} must be a number` };
  }

  if (options?.integer && !Number.isInteger(num)) {
    return { field, message: `${field} must be an integer` };
  }

  if (options?.min !== undefined && num < options.min) {
    return { field, message: `${field} must be at least ${options.min}` };
  }

  if (options?.max !== undefined && num > options.max) {
    return { field, message: `${field} must be at most ${options.max}` };
  }

  return null;
}

export function validateEnum<T extends string>(
  value: unknown,
  field: string,
  allowedValues: readonly T[]
): ValidationError | null {
  if (!value) return null;

  if (!allowedValues.includes(value as T)) {
    return {
      field,
      message: `${field} must be one of: ${allowedValues.join(', ')}`,
    };
  }
  return null;
}

export function collectErrors(
  ...errors: (ValidationError | null)[]
): ValidationError[] {
  return errors.filter((e): e is ValidationError => e !== null);
}

export interface MessageInput {
  content: string;
  swarm_id: string;
  sender_type?: string;
  metadata?: Record<string, unknown>;
}

export function validateMessageInput(input: unknown): ValidationResult<MessageInput> {
  if (!input || typeof input !== 'object') {
    return { valid: false, errors: [{ field: 'body', message: 'Invalid request body' }] };
  }

  const data = input as Record<string, unknown>;

  const errors = collectErrors(
    validateRequired(data.content, 'content'),
    validateRequired(data.swarm_id, 'swarm_id'),
    validateMaxLength(String(data.content || ''), 'content', 50000),
    validateMinLength(String(data.content || ''), 'content', 1),
    validateUuid(String(data.swarm_id || ''), 'swarm_id')
  );

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      content: sanitizeMessageContent(String(data.content)),
      swarm_id: String(data.swarm_id),
      sender_type: data.sender_type ? sanitizeName(String(data.sender_type), 50) : 'human',
      metadata: data.metadata as Record<string, unknown> | undefined,
    },
  };
}

export interface AgentInput {
  name: string;
  role?: string;
  system_prompt: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

export function validateAgentInput(input: unknown): ValidationResult<AgentInput> {
  if (!input || typeof input !== 'object') {
    return { valid: false, errors: [{ field: 'body', message: 'Invalid request body' }] };
  }

  const data = input as Record<string, unknown>;

  const errors = collectErrors(
    validateRequired(data.name, 'name'),
    validateRequired(data.system_prompt, 'system_prompt'),
    validateMaxLength(String(data.name || ''), 'name', 100),
    validateMinLength(String(data.name || ''), 'name', 1),
    validateMaxLength(String(data.system_prompt || ''), 'system_prompt', 100000),
    validateMaxLength(String(data.role || ''), 'role', 100),
    validateNumber(data.temperature, 'temperature', { min: 0, max: 2 }),
    validateNumber(data.max_tokens, 'max_tokens', { min: 1, max: 100000, integer: true })
  );

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      name: sanitizeName(String(data.name)),
      role: data.role ? sanitizeName(String(data.role), 100) : undefined,
      system_prompt: sanitizePrompt(String(data.system_prompt)),
      model: data.model ? sanitizeName(String(data.model), 100) : undefined,
      temperature: data.temperature !== undefined ? Number(data.temperature) : undefined,
      max_tokens: data.max_tokens !== undefined ? Number(data.max_tokens) : undefined,
    },
  };
}

export interface SwarmInput {
  name: string;
  description?: string;
  context?: string;
}

export function validateSwarmInput(input: unknown): ValidationResult<SwarmInput> {
  if (!input || typeof input !== 'object') {
    return { valid: false, errors: [{ field: 'body', message: 'Invalid request body' }] };
  }

  const data = input as Record<string, unknown>;

  const errors = collectErrors(
    validateRequired(data.name, 'name'),
    validateMaxLength(String(data.name || ''), 'name', 100),
    validateMinLength(String(data.name || ''), 'name', 1),
    validateMaxLength(String(data.description || ''), 'description', 1000),
    validateMaxLength(String(data.context || ''), 'context', 50000)
  );

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      name: sanitizeName(String(data.name)),
      description: data.description ? sanitizeText(String(data.description)) : undefined,
      context: data.context ? sanitizeText(String(data.context)) : undefined,
    },
  };
}

export interface ToolInput {
  name: string;
  description?: string;
  endpoint?: string;
  method?: string;
  parameters?: string;
}

export function validateToolInput(input: unknown): ValidationResult<ToolInput> {
  if (!input || typeof input !== 'object') {
    return { valid: false, errors: [{ field: 'body', message: 'Invalid request body' }] };
  }

  const data = input as Record<string, unknown>;

  const toolNameRegex = /^[a-zA-Z][a-zA-Z0-9_-]*$/;
  const name = String(data.name || '');

  const errors = collectErrors(
    validateRequired(data.name, 'name'),
    validateMaxLength(name, 'name', 100),
    !toolNameRegex.test(name)
      ? { field: 'name', message: 'Tool name must start with a letter and contain only letters, numbers, underscores, and hyphens' }
      : null,
    validateMaxLength(String(data.description || ''), 'description', 1000),
    data.endpoint ? validateUrl(String(data.endpoint), 'endpoint') : null,
    data.method
      ? validateEnum(data.method, 'method', ['GET', 'POST', 'PUT', 'DELETE'] as const)
      : null
  );

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      name: sanitizeName(name),
      description: data.description ? sanitizeText(String(data.description)) : undefined,
      endpoint: data.endpoint ? sanitizeUrl(String(data.endpoint)) || undefined : undefined,
      method: data.method ? String(data.method) : undefined,
      parameters: data.parameters ? sanitizeJsonString(String(data.parameters)) : undefined,
    },
  };
}
