import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  createLogger,
  logRequestStart,
  createStructuredResponse,
  createStructuredErrorResponse,
  type Logger,
} from "../_shared/logger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /data:\s*text\/html/gi,
  /vbscript:/gi,
];

const DANGEROUS_CODE_PATTERNS = [
  { pattern: /\beval\s*\(/gi, message: 'Use of eval() is not allowed' },
  { pattern: /\bFunction\s*\(/gi, message: 'Use of Function constructor is not allowed' },
  { pattern: /\bnew\s+Function\s*\(/gi, message: 'Use of new Function() is not allowed' },
  { pattern: /\bexecSync\s*\(/gi, message: 'Use of execSync is not allowed' },
  { pattern: /\bspawnSync\s*\(/gi, message: 'Use of spawnSync is not allowed' },
  { pattern: /\bchild_process/gi, message: 'Access to child_process is not allowed' },
  { pattern: /process\.env\[/gi, message: 'Dynamic env access is not allowed' },
  { pattern: /__proto__/gi, message: 'Prototype manipulation is not allowed' },
  { pattern: /\.constructor\s*\(/gi, message: 'Constructor access is restricted' },
  { pattern: /\bwith\s*\(/gi, message: 'Use of with statement is not allowed' },
  { pattern: /debugger;/gi, message: 'Debugger statements are not allowed' },
  { pattern: /rm\s+-rf/gi, message: 'Destructive shell commands are not allowed' },
  { pattern: /DROP\s+TABLE/gi, message: 'Destructive SQL commands are not allowed' },
];

interface SecurityValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

function validateCodeSecurity(code: string): SecurityValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const { pattern, message } of DANGEROUS_CODE_PATTERNS) {
    if (pattern.test(code)) {
      errors.push(message);
    }
  }

  if (/https?:\/\/[^\s'"]+/gi.test(code)) {
    warnings.push('Code contains hardcoded URLs - ensure they are from trusted sources');
  }

  if (/(['"])(?:sk-|api[_-]?key|secret|password|token)['"]\s*:/gi.test(code)) {
    warnings.push('Code may contain sensitive credential references');
  }

  if (/while\s*\(\s*true\s*\)/gi.test(code) || /for\s*\(\s*;\s*;\s*\)/gi.test(code)) {
    warnings.push('Code contains potential infinite loops');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

function sanitizeText(str: string, maxLength = 1000): string {
  if (!str) return '';
  let sanitized = str
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

function sanitizeName(name: string, maxLength = 100): string {
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

interface GenerateToolRequest {
  description: string;
  name?: string;
  category?: string;
  customCode?: string;
  previewOnly?: boolean;
}

function generateToolName(description: string): string {
  const words = description
    .replace(/[^a-zA-Z\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2)
    .slice(0, 3);

  if (words.length === 0) return 'Custom Tool';

  return words
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function cleanDescription(description: string): string {
  let cleaned = description.trim();
  if (cleaned.length > 200) {
    cleaned = cleaned.substring(0, 197) + '...';
  }
  return cleaned;
}

interface ExtractedInput {
  name: string;
  type: string;
  description: string;
  required: boolean;
  enum?: string[];
}

interface ConfigField {
  name: string;
  type: string;
  label: string;
  required: boolean;
  placeholder?: string;
}

function extractInputsFromDescription(description: string): { inputs: ExtractedInput[], configFields: ConfigField[] } {
  const inputs: ExtractedInput[] = [];
  const configFields: ConfigField[] = [];
  const lowerDesc = description.toLowerCase();

  const inputPatterns: Array<{ pattern: RegExp | string; input: ExtractedInput }> = [
    { pattern: /url|link|endpoint/i, input: { name: 'url', type: 'string', description: 'URL to process', required: true } },
    { pattern: /text|content|message|body/i, input: { name: 'content', type: 'string', description: 'Text content to process', required: true } },
    { pattern: /file|document|path/i, input: { name: 'file_path', type: 'string', description: 'Path to the file', required: true } },
    { pattern: /query|search|term/i, input: { name: 'query', type: 'string', description: 'Search query or term', required: true } },
    { pattern: /email|recipient|to/i, input: { name: 'recipient', type: 'string', description: 'Email recipient', required: true } },
    { pattern: /number|count|limit|amount/i, input: { name: 'count', type: 'number', description: 'Numeric value', required: false } },
    { pattern: /format|type|output/i, input: { name: 'format', type: 'string', description: 'Output format', required: false, enum: ['json', 'text', 'html', 'csv'] } },
  ];

  inputPatterns.forEach(({ pattern, input }) => {
    const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern, 'i');
    if (regex.test(lowerDesc)) {
      if (!inputs.some(i => i.name === input.name)) {
        inputs.push({ ...input });
      }
    }
  });

  if (inputs.length === 0) {
    inputs.push({
      name: 'input',
      type: 'string',
      description: 'Primary input for the tool',
      required: true,
    });
  }

  const configPatterns: Array<{ pattern: RegExp; field: ConfigField }> = [
    { pattern: /api[\s-_]?key/i, field: { name: 'api_key', type: 'password', label: 'API Key', required: true } },
    { pattern: /token|auth/i, field: { name: 'auth_token', type: 'password', label: 'Authentication Token', required: true } },
    { pattern: /webhook/i, field: { name: 'webhook_url', type: 'text', label: 'Webhook URL', required: true, placeholder: 'https://...' } },
    { pattern: /timeout/i, field: { name: 'timeout', type: 'number', label: 'Timeout (seconds)', required: false } },
  ];

  configPatterns.forEach(({ pattern, field }) => {
    if (pattern.test(lowerDesc)) {
      if (!configFields.some(f => f.name === field.name)) {
        configFields.push({ ...field });
      }
    }
  });

  return { inputs, configFields };
}

interface ExtractedOutput {
  name: string;
  type: string;
  description: string;
}

function extractOutputsFromDescription(description: string): ExtractedOutput[] {
  const outputs: ExtractedOutput[] = [];
  const lowerDesc = description.toLowerCase();

  outputs.push({
    name: 'success',
    type: 'boolean',
    description: 'Whether the operation completed successfully',
  });

  const outputPatterns: Array<{ pattern: RegExp; output: ExtractedOutput }> = [
    { pattern: /result|response|data/i, output: { name: 'result', type: 'object', description: 'The result data' } },
    { pattern: /list|items|array/i, output: { name: 'items', type: 'array', description: 'List of items' } },
    { pattern: /count|total|number/i, output: { name: 'count', type: 'number', description: 'Count or total' } },
    { pattern: /text|content|message/i, output: { name: 'content', type: 'string', description: 'Text content' } },
    { pattern: /url|link/i, output: { name: 'url', type: 'string', description: 'Generated URL' } },
    { pattern: /status|state/i, output: { name: 'status', type: 'string', description: 'Status or state' } },
  ];

  outputPatterns.forEach(({ pattern, output }) => {
    if (pattern.test(lowerDesc)) {
      if (!outputs.some(o => o.name === output.name)) {
        outputs.push({ ...output });
      }
    }
  });

  outputs.push({
    name: 'error',
    type: 'string',
    description: 'Error message if operation failed',
  });

  return outputs;
}

function mapTypeToTS(type: string): string {
  const typeMap: Record<string, string> = {
    'string': 'string',
    'number': 'number',
    'boolean': 'boolean',
    'array': 'unknown[]',
    'object': 'Record<string, unknown>',
  };
  return typeMap[type] || 'unknown';
}

function getDefaultValue(type: string): string {
  const defaults: Record<string, string> = {
    'string': "''",
    'number': '0',
    'boolean': 'false',
    'array': '[]',
    'object': '{}',
  };
  return defaults[type] || 'null';
}

function generateWrapperCode(
  toolName: string,
  inputs: ExtractedInput[],
  outputs: ExtractedOutput[],
  description: string
): string {
  const inputTypes = inputs.map(i => `  ${i.name}${i.required ? '' : '?'}: ${mapTypeToTS(i.type)};`).join('\n');
  const outputTypes = outputs.map(o => `  ${o.name}${o.name === 'error' ? '?' : ''}: ${mapTypeToTS(o.type)};`).join('\n');

  const outputDefaults = outputs
    .filter(o => !['success', 'error'].includes(o.name))
    .map(o => `      ${o.name}: ${getDefaultValue(o.type)},`)
    .join('\n');

  const code = `/**
 * ${toolName}
 * ${description}
 *
 * Auto-generated tool wrapper
 */

interface ToolInput {
${inputTypes}
}

interface ToolOutput {
${outputTypes}
}

interface ToolConfig {
  [key: string]: string | number | boolean | undefined;
}

export async function execute(
  input: ToolInput,
  config: ToolConfig
): Promise<ToolOutput> {
  try {
${inputs.filter(i => i.required).map(i => `    if (input.${i.name} === undefined || input.${i.name} === null) {
      throw new Error('Missing required input: ${i.name}');
    }`).join('\n')}

    // Tool execution started - input sanitized for security

    const result: ToolOutput = {
      success: true,
${outputDefaults}
    };

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return {
      success: false,
      error: errorMessage,
${outputs.filter(o => !['success', 'error'].includes(o.name)).map(o => `      ${o.name}: ${getDefaultValue(o.type)},`).join('\n')}
    };
  }
}
`;

  return code;
}

function generateToolFromDescription(
  description: string,
  suggestedName?: string,
  suggestedCategory?: string,
  customCode?: string
) {
  const lowerDesc = description.toLowerCase();

  const categoryKeywords: Record<string, string[]> = {
    'Data': ['data', 'database', 'query', 'sql', 'csv', 'json', 'parse', 'transform', 'convert', 'extract'],
    'Communication': ['email', 'message', 'notify', 'send', 'slack', 'discord', 'sms', 'alert'],
    'Development': ['code', 'compile', 'lint', 'test', 'debug', 'format', 'deploy', 'git', 'api'],
    'Research': ['search', 'fetch', 'scrape', 'browse', 'crawl', 'analyze', 'research'],
    'Productivity': ['schedule', 'calendar', 'task', 'reminder', 'organize', 'automate', 'workflow'],
    'Creative': ['image', 'video', 'audio', 'design', 'generate', 'create', 'render'],
    'Finance': ['payment', 'invoice', 'calculate', 'price', 'currency', 'transaction', 'billing'],
    'Security': ['encrypt', 'decrypt', 'hash', 'verify', 'authenticate', 'validate', 'secure'],
  };

  let detectedCategory = suggestedCategory || 'Custom';
  if (!suggestedCategory) {
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(kw => lowerDesc.includes(kw))) {
        detectedCategory = category;
        break;
      }
    }
  }

  const iconMap: Record<string, string> = {
    'Data': 'Database',
    'Communication': 'Mail',
    'Development': 'Code',
    'Research': 'Search',
    'Productivity': 'Calendar',
    'Creative': 'Palette',
    'Finance': 'DollarSign',
    'Security': 'Shield',
    'Custom': 'Wrench',
  };

  const toolName = suggestedName || generateToolName(description);
  const icon = iconMap[detectedCategory] || 'Wrench';

  const { inputs, configFields } = extractInputsFromDescription(description);
  const outputs = extractOutputsFromDescription(description);

  const inputSchema = {
    type: 'object',
    properties: {} as Record<string, unknown>,
    required: [] as string[],
  };

  inputs.forEach(input => {
    inputSchema.properties[input.name] = {
      type: input.type,
      description: input.description,
    };
    if (input.enum) {
      (inputSchema.properties[input.name] as Record<string, unknown>).enum = input.enum;
    }
    if (input.required) {
      inputSchema.required.push(input.name);
    }
  });

  const outputSchema = {
    type: 'object',
    properties: {} as Record<string, unknown>,
  };

  outputs.forEach(output => {
    outputSchema.properties[output.name] = {
      type: output.type,
      description: output.description,
    };
  });

  const wrapperCode = customCode || generateWrapperCode(toolName, inputs, outputs, description);
  const securityValidation = validateCodeSecurity(wrapperCode);

  return {
    name: toolName,
    description: cleanDescription(description),
    category: detectedCategory,
    icon,
    input_schema: inputSchema,
    output_schema: outputSchema,
    wrapper_code: wrapperCode,
    capabilities: {
      category: detectedCategory,
      requires_config: configFields.length > 0,
      config_fields: configFields,
    },
    validation: {
      security: securityValidation,
    },
  };
}

Deno.serve(async (req: Request) => {
  const logger = createLogger("generate-tool", req);

  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  logRequestStart(logger);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          error: 'Authentication required',
          message: 'Please sign in to generate tools'
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          message: 'Your session may have expired. Please sign in again.'
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: GenerateToolRequest = await req.json();

    const sanitizedDescription = sanitizeText(body.description || '', 2000);
    const sanitizedName = body.name ? sanitizeName(body.name, 100) : undefined;
    const sanitizedCategory = body.category ? sanitizeName(body.category, 50) : undefined;
    const customCode = body.customCode ? body.customCode : undefined;

    if (!sanitizedDescription || sanitizedDescription.length < 10) {
      return new Response(
        JSON.stringify({
          error: 'Invalid description',
          message: 'Please provide a detailed description of at least 10 characters explaining what your tool should do.'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const toolSchema = generateToolFromDescription(
      sanitizedDescription,
      sanitizedName,
      sanitizedCategory,
      customCode
    );

    if (!toolSchema.validation.security.isValid) {
      return new Response(
        JSON.stringify({
          error: 'Security validation failed',
          message: 'The generated code contains potentially dangerous patterns that are not allowed.',
          details: toolSchema.validation.security.errors,
          warnings: toolSchema.validation.security.warnings,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (body.previewOnly) {
      return new Response(
        JSON.stringify({
          success: true,
          preview: true,
          tool: {
            name: toolSchema.name,
            description: toolSchema.description,
            category: toolSchema.category,
            icon: toolSchema.icon,
            input_schema: toolSchema.input_schema,
            output_schema: toolSchema.output_schema,
            wrapper_code: toolSchema.wrapper_code,
            capabilities: toolSchema.capabilities,
          },
          validation: toolSchema.validation,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: tool, error: insertError } = await supabase
      .from('tools')
      .insert({
        name: toolSchema.name,
        description: toolSchema.description,
        capabilities: toolSchema.capabilities,
        input_schema: toolSchema.input_schema,
        output_schema: toolSchema.output_schema,
        wrapper_code: toolSchema.wrapper_code,
        icon: toolSchema.icon,
        category: toolSchema.category,
        is_custom: true,
        is_system: false,
        status: 'active',
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      logger.error('Tool insert failed', insertError, { code: insertError.code });

      let errorMessage = 'Failed to save the tool. Please try again.';
      if (insertError.code === '23505') {
        errorMessage = 'A tool with this name already exists. Please choose a different name.';
      }

      return new Response(
        JSON.stringify({
          error: 'Save failed',
          message: errorMessage,
          code: insertError.code,
          request_id: logger.getRequestId(),
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Request-Id': logger.getRequestId() } }
      );
    }

    const { error: userToolError } = await supabase
      .from('user_tools')
      .insert({
        user_id: user.id,
        tool_id: tool.id,
        is_enabled: true,
        configuration: {},
      });

    if (userToolError) {
      logger.warn('User tool insert failed', { error: userToolError.message, code: userToolError.code });
    }

    logger.info('Tool generated successfully', { tool_id: tool.id, tool_name: toolSchema.name });

    return new Response(
      JSON.stringify({
        success: true,
        tool,
        message: `Your custom tool "${toolSchema.name}" has been created successfully and is now available in your tools list.`,
        validation: {
          warnings: toolSchema.validation.security.warnings,
        },
        request_id: logger.getRequestId(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Request-Id': logger.getRequestId() } }
    );

  } catch (error) {
    let errorMessage = 'An unexpected error occurred. Please try again.';
    let status = 500;

    if (error instanceof SyntaxError) {
      errorMessage = 'Invalid request format. Please check your input and try again.';
      status = 400;
    }

    logger.error('Generate tool failed', error);

    return new Response(
      JSON.stringify({
        error: 'Internal error',
        message: errorMessage,
        request_id: logger.getRequestId(),
      }),
      { status, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Request-Id': logger.getRequestId() } }
    );
  }
});