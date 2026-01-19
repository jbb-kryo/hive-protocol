import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const EXECUTION_TIMEOUT_MS = 30000;

interface RequestPayload {
  tool_id: string;
  parameters: Record<string, unknown>;
  agent_id?: string;
  swarm_id?: string;
}

interface Tool {
  id: string;
  name: string;
  description: string;
  capabilities: Record<string, unknown>;
  input_schema: Record<string, unknown>;
  output_schema: Record<string, unknown>;
  wrapper_code: string | null;
  category: string;
  status: string;
  is_system: boolean;
  is_custom: boolean;
  created_by: string | null;
}

interface ToolExecutionResult {
  success: boolean;
  data?: unknown;
  error?: string;
  execution_time_ms: number;
}

interface UsageRecord {
  tool_id: string;
  user_id: string;
  agent_id: string | null;
  swarm_id: string | null;
  action_type: string;
  input_params: Record<string, unknown>;
  output_result: unknown;
  status: string;
  error_message: string | null;
  execution_time_ms: number;
  started_at: string;
  completed_at: string;
  metadata: Record<string, unknown>;
}

function validateParameters(
  params: Record<string, unknown>,
  schema: Record<string, unknown>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const properties = (schema.properties || {}) as Record<string, { type: string }>;
  const required = (schema.required || []) as string[];

  for (const field of required) {
    if (params[field] === undefined || params[field] === null) {
      errors.push(`Missing required parameter: ${field}`);
    }
  }

  for (const [key, value] of Object.entries(params)) {
    const propSchema = properties[key];
    if (propSchema && propSchema.type) {
      const actualType = Array.isArray(value) ? "array" : typeof value;
      if (propSchema.type !== actualType && !(propSchema.type === "number" && actualType === "number")) {
        errors.push(`Parameter '${key}' should be of type ${propSchema.type}, got ${actualType}`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

async function executeWebSearch(params: Record<string, unknown>): Promise<ToolExecutionResult> {
  const startTime = Date.now();
  const query = params.query as string;
  const maxResults = (params.max_results as number) || 5;

  if (!query) {
    return {
      success: false,
      error: "Query parameter is required for web search",
      execution_time_ms: Date.now() - startTime,
    };
  }

  try {
    const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(searchUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "HiveMind-Agent/1.0" },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Search API returned ${response.status}`);
    }

    const data = await response.json();
    
    const results = [];
    
    if (data.AbstractText) {
      results.push({
        title: data.Heading || "Summary",
        snippet: data.AbstractText,
        url: data.AbstractURL || "",
        source: data.AbstractSource || "DuckDuckGo",
      });
    }

    if (data.RelatedTopics) {
      for (const topic of data.RelatedTopics.slice(0, maxResults - results.length)) {
        if (topic.Text && topic.FirstURL) {
          results.push({
            title: topic.Text.split(" - ")[0] || topic.Text.substring(0, 50),
            snippet: topic.Text,
            url: topic.FirstURL,
            source: "DuckDuckGo",
          });
        }
      }
    }

    return {
      success: true,
      data: {
        query,
        results: results.slice(0, maxResults),
        total_results: results.length,
      },
      execution_time_ms: Date.now() - startTime,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: `Web search failed: ${errorMessage}`,
      execution_time_ms: Date.now() - startTime,
    };
  }
}

async function executeHttpRequest(params: Record<string, unknown>): Promise<ToolExecutionResult> {
  const startTime = Date.now();
  const url = params.url as string;
  const method = (params.method as string) || "GET";
  const headers = (params.headers as Record<string, string>) || {};
  const body = params.body;

  if (!url) {
    return {
      success: false,
      error: "URL parameter is required",
      execution_time_ms: Date.now() - startTime,
    };
  }

  try {
    const parsedUrl = new URL(url);
    const blockedHosts = ["localhost", "127.0.0.1", "0.0.0.0", "::1"];
    if (blockedHosts.includes(parsedUrl.hostname)) {
      return {
        success: false,
        error: "Access to localhost is not allowed",
        execution_time_ms: Date.now() - startTime,
      };
    }
  } catch {
    return {
      success: false,
      error: "Invalid URL provided",
      execution_time_ms: Date.now() - startTime,
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const fetchOptions: RequestInit = {
      method: method.toUpperCase(),
      headers: {
        "User-Agent": "HiveMind-Agent/1.0",
        ...headers,
      },
      signal: controller.signal,
    };

    if (body && ["POST", "PUT", "PATCH"].includes(method.toUpperCase())) {
      fetchOptions.body = typeof body === "string" ? body : JSON.stringify(body);
      if (!headers["Content-Type"]) {
        (fetchOptions.headers as Record<string, string>)["Content-Type"] = "application/json";
      }
    }

    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);

    const contentType = response.headers.get("content-type") || "";
    let responseData;

    if (contentType.includes("application/json")) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
      if (responseData.length > 10000) {
        responseData = responseData.substring(0, 10000) + "... (truncated)";
      }
    }

    return {
      success: response.ok,
      data: {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseData,
      },
      execution_time_ms: Date.now() - startTime,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: `HTTP request failed: ${errorMessage}`,
      execution_time_ms: Date.now() - startTime,
    };
  }
}

function executeJsonTransform(params: Record<string, unknown>): ToolExecutionResult {
  const startTime = Date.now();
  const input = params.input;
  const operation = params.operation as string;
  const path = params.path as string;

  if (!input) {
    return {
      success: false,
      error: "Input parameter is required",
      execution_time_ms: Date.now() - startTime,
    };
  }

  try {
    let data = typeof input === "string" ? JSON.parse(input) : input;
    let result;

    switch (operation) {
      case "extract":
        if (!path) {
          return {
            success: false,
            error: "Path parameter is required for extract operation",
            execution_time_ms: Date.now() - startTime,
          };
        }
        result = path.split(".").reduce((obj, key) => obj?.[key], data);
        break;

      case "keys":
        result = Object.keys(data);
        break;

      case "values":
        result = Object.values(data);
        break;

      case "flatten":
        if (Array.isArray(data)) {
          result = data.flat(params.depth as number || 1);
        } else {
          result = data;
        }
        break;

      case "filter":
        if (Array.isArray(data) && params.condition) {
          const condition = params.condition as { field: string; operator: string; value: unknown };
          result = data.filter((item) => {
            const fieldValue = item[condition.field];
            switch (condition.operator) {
              case "eq": return fieldValue === condition.value;
              case "ne": return fieldValue !== condition.value;
              case "gt": return fieldValue > (condition.value as number);
              case "lt": return fieldValue < (condition.value as number);
              case "contains": return String(fieldValue).includes(String(condition.value));
              default: return true;
            }
          });
        } else {
          result = data;
        }
        break;

      case "count":
        result = Array.isArray(data) ? data.length : Object.keys(data).length;
        break;

      default:
        result = data;
    }

    return {
      success: true,
      data: result,
      execution_time_ms: Date.now() - startTime,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: `JSON transform failed: ${errorMessage}`,
      execution_time_ms: Date.now() - startTime,
    };
  }
}

function executeTextProcess(params: Record<string, unknown>): ToolExecutionResult {
  const startTime = Date.now();
  const text = params.text as string;
  const operation = params.operation as string;

  if (!text) {
    return {
      success: false,
      error: "Text parameter is required",
      execution_time_ms: Date.now() - startTime,
    };
  }

  try {
    let result: unknown;

    switch (operation) {
      case "word_count":
        result = {
          words: text.split(/\s+/).filter(Boolean).length,
          characters: text.length,
          characters_no_spaces: text.replace(/\s/g, "").length,
          lines: text.split("\n").length,
        };
        break;

      case "extract_urls":
        const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/g;
        result = text.match(urlRegex) || [];
        break;

      case "extract_emails":
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        result = text.match(emailRegex) || [];
        break;

      case "summarize":
        const sentences = text.split(/[.!?]+/).filter(Boolean);
        const maxSentences = (params.max_sentences as number) || 3;
        result = sentences.slice(0, maxSentences).join(". ") + ".";
        break;

      case "split":
        const delimiter = (params.delimiter as string) || "\n";
        result = text.split(delimiter).filter(Boolean);
        break;

      case "replace":
        const pattern = params.pattern as string;
        const replacement = (params.replacement as string) || "";
        if (pattern) {
          result = text.replace(new RegExp(pattern, "g"), replacement);
        } else {
          result = text;
        }
        break;

      case "trim":
        result = text.trim();
        break;

      case "lowercase":
        result = text.toLowerCase();
        break;

      case "uppercase":
        result = text.toUpperCase();
        break;

      default:
        result = text;
    }

    return {
      success: true,
      data: result,
      execution_time_ms: Date.now() - startTime,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: `Text processing failed: ${errorMessage}`,
      execution_time_ms: Date.now() - startTime,
    };
  }
}

function executeMathCalculate(params: Record<string, unknown>): ToolExecutionResult {
  const startTime = Date.now();
  const operation = params.operation as string;
  const values = params.values as number[];

  if (!operation) {
    return {
      success: false,
      error: "Operation parameter is required",
      execution_time_ms: Date.now() - startTime,
    };
  }

  try {
    let result: number;

    switch (operation) {
      case "sum":
        if (!Array.isArray(values)) {
          return { success: false, error: "Values must be an array", execution_time_ms: Date.now() - startTime };
        }
        result = values.reduce((a, b) => a + b, 0);
        break;

      case "average":
        if (!Array.isArray(values) || values.length === 0) {
          return { success: false, error: "Values must be a non-empty array", execution_time_ms: Date.now() - startTime };
        }
        result = values.reduce((a, b) => a + b, 0) / values.length;
        break;

      case "min":
        if (!Array.isArray(values)) {
          return { success: false, error: "Values must be an array", execution_time_ms: Date.now() - startTime };
        }
        result = Math.min(...values);
        break;

      case "max":
        if (!Array.isArray(values)) {
          return { success: false, error: "Values must be an array", execution_time_ms: Date.now() - startTime };
        }
        result = Math.max(...values);
        break;

      case "multiply":
        if (!Array.isArray(values)) {
          return { success: false, error: "Values must be an array", execution_time_ms: Date.now() - startTime };
        }
        result = values.reduce((a, b) => a * b, 1);
        break;

      case "round":
        const num = params.value as number;
        const decimals = (params.decimals as number) || 0;
        result = Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
        break;

      case "percentage":
        const part = params.part as number;
        const total = params.total as number;
        if (total === 0) {
          return { success: false, error: "Total cannot be zero", execution_time_ms: Date.now() - startTime };
        }
        result = (part / total) * 100;
        break;

      default:
        return { success: false, error: `Unknown operation: ${operation}`, execution_time_ms: Date.now() - startTime };
    }

    return {
      success: true,
      data: { result, operation },
      execution_time_ms: Date.now() - startTime,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: `Math calculation failed: ${errorMessage}`,
      execution_time_ms: Date.now() - startTime,
    };
  }
}

function executeDatetime(params: Record<string, unknown>): ToolExecutionResult {
  const startTime = Date.now();
  const operation = params.operation as string;

  try {
    let result: unknown;

    switch (operation) {
      case "now":
        const now = new Date();
        result = {
          iso: now.toISOString(),
          unix: Math.floor(now.getTime() / 1000),
          formatted: now.toLocaleString(),
        };
        break;

      case "parse":
        const dateStr = params.date as string;
        if (!dateStr) {
          return { success: false, error: "Date parameter is required", execution_time_ms: Date.now() - startTime };
        }
        const parsed = new Date(dateStr);
        if (isNaN(parsed.getTime())) {
          return { success: false, error: "Invalid date format", execution_time_ms: Date.now() - startTime };
        }
        result = {
          iso: parsed.toISOString(),
          unix: Math.floor(parsed.getTime() / 1000),
          formatted: parsed.toLocaleString(),
        };
        break;

      case "diff":
        const date1 = new Date(params.date1 as string);
        const date2 = new Date(params.date2 as string);
        if (isNaN(date1.getTime()) || isNaN(date2.getTime())) {
          return { success: false, error: "Invalid date format", execution_time_ms: Date.now() - startTime };
        }
        const diffMs = Math.abs(date2.getTime() - date1.getTime());
        result = {
          milliseconds: diffMs,
          seconds: Math.floor(diffMs / 1000),
          minutes: Math.floor(diffMs / (1000 * 60)),
          hours: Math.floor(diffMs / (1000 * 60 * 60)),
          days: Math.floor(diffMs / (1000 * 60 * 60 * 24)),
        };
        break;

      case "add":
        const baseDate = new Date(params.date as string || Date.now());
        const amount = params.amount as number;
        const unit = params.unit as string;
        if (isNaN(baseDate.getTime())) {
          return { success: false, error: "Invalid date format", execution_time_ms: Date.now() - startTime };
        }
        switch (unit) {
          case "days":
            baseDate.setDate(baseDate.getDate() + amount);
            break;
          case "hours":
            baseDate.setHours(baseDate.getHours() + amount);
            break;
          case "minutes":
            baseDate.setMinutes(baseDate.getMinutes() + amount);
            break;
          case "months":
            baseDate.setMonth(baseDate.getMonth() + amount);
            break;
          case "years":
            baseDate.setFullYear(baseDate.getFullYear() + amount);
            break;
        }
        result = {
          iso: baseDate.toISOString(),
          unix: Math.floor(baseDate.getTime() / 1000),
          formatted: baseDate.toLocaleString(),
        };
        break;

      default:
        return { success: false, error: `Unknown operation: ${operation}`, execution_time_ms: Date.now() - startTime };
    }

    return {
      success: true,
      data: result,
      execution_time_ms: Date.now() - startTime,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: `Datetime operation failed: ${errorMessage}`,
      execution_time_ms: Date.now() - startTime,
    };
  }
}

async function executeCustomTool(
  tool: Tool,
  params: Record<string, unknown>
): Promise<ToolExecutionResult> {
  const startTime = Date.now();

  if (!tool.wrapper_code) {
    return {
      success: false,
      error: "Custom tool has no wrapper code defined",
      execution_time_ms: Date.now() - startTime,
    };
  }

  try {
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    const wrappedCode = `
      const params = arguments[0];
      ${tool.wrapper_code}
    `;
    const fn = new AsyncFunction(wrappedCode);
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Execution timeout")), EXECUTION_TIMEOUT_MS);
    });

    const result = await Promise.race([fn(params), timeoutPromise]);

    return {
      success: true,
      data: result,
      execution_time_ms: Date.now() - startTime,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const isTimeout = errorMessage === "Execution timeout";
    return {
      success: false,
      error: isTimeout ? "Tool execution timed out" : `Custom tool execution failed: ${errorMessage}`,
      execution_time_ms: Date.now() - startTime,
    };
  }
}

async function executeTool(
  tool: Tool,
  params: Record<string, unknown>
): Promise<ToolExecutionResult> {
  const category = tool.category?.toLowerCase() || "";
  const name = tool.name?.toLowerCase() || "";

  if (tool.is_custom && tool.wrapper_code) {
    return executeCustomTool(tool, params);
  }

  if (category === "search" || name.includes("search") || name.includes("web")) {
    return executeWebSearch(params);
  }

  if (category === "http" || name.includes("http") || name.includes("api") || name.includes("request")) {
    return executeHttpRequest(params);
  }

  if (category === "json" || name.includes("json") || name.includes("transform")) {
    return executeJsonTransform(params);
  }

  if (category === "text" || name.includes("text") || name.includes("string")) {
    return executeTextProcess(params);
  }

  if (category === "math" || name.includes("math") || name.includes("calculate")) {
    return executeMathCalculate(params);
  }

  if (category === "datetime" || name.includes("date") || name.includes("time")) {
    return executeDatetime(params);
  }

  return {
    success: false,
    error: `Unknown tool type: ${tool.category || tool.name}. Tool execution not implemented.`,
    execution_time_ms: 0,
  };
}

async function logToolUsage(
  supabase: SupabaseClient,
  usage: UsageRecord
): Promise<void> {
  try {
    await supabase.from("tool_usage").insert(usage);
  } catch (error) {
    console.error("Failed to log tool usage:", error);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const startTime = new Date();

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
      { auth: { persistSession: false } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload: RequestPayload = await req.json();
    const { tool_id, parameters, agent_id, swarm_id } = payload;

    if (!tool_id) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing tool_id parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: tool, error: toolError } = await supabase
      .from("tools")
      .select("*")
      .eq("id", tool_id)
      .maybeSingle();

    if (toolError || !tool) {
      return new Response(
        JSON.stringify({ success: false, error: "Tool not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (tool.status !== "active") {
      return new Response(
        JSON.stringify({ success: false, error: "Tool is not active" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (agent_id) {
      const { data: agentTool } = await supabase
        .from("agent_tools")
        .select("enabled")
        .eq("agent_id", agent_id)
        .eq("tool_id", tool_id)
        .maybeSingle();

      if (!agentTool) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Agent does not have access to this tool",
            code: "PERMISSION_DENIED",
          }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!agentTool.enabled) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Tool is disabled for this agent",
            code: "TOOL_DISABLED",
          }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      const { data: userTool } = await supabase
        .from("user_tools")
        .select("enabled")
        .eq("user_id", user.id)
        .eq("tool_id", tool_id)
        .maybeSingle();

      if (!tool.is_system && !userTool) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "User does not have access to this tool",
            code: "PERMISSION_DENIED",
          }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (userTool && !userTool.enabled) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Tool is disabled for this user",
            code: "TOOL_DISABLED",
          }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (tool.input_schema && Object.keys(tool.input_schema).length > 0) {
      const validation = validateParameters(parameters || {}, tool.input_schema);
      if (!validation.valid) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Invalid parameters",
            details: validation.errors,
            code: "VALIDATION_ERROR",
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const result = await executeTool(tool, parameters || {});
    const completedAt = new Date();

    await logToolUsage(supabase, {
      tool_id,
      user_id: user.id,
      agent_id: agent_id || null,
      swarm_id: swarm_id || null,
      action_type: "execute",
      input_params: parameters || {},
      output_result: result.success ? result.data : { error: result.error },
      status: result.success ? "success" : "error",
      error_message: result.success ? null : (result.error || null),
      execution_time_ms: result.execution_time_ms,
      started_at: startTime.toISOString(),
      completed_at: completedAt.toISOString(),
      metadata: {
        tool_name: tool.name,
        tool_category: tool.category,
      },
    });

    return new Response(
      JSON.stringify({
        success: result.success,
        data: result.data,
        error: result.error,
        execution_time_ms: result.execution_time_ms,
        tool: {
          id: tool.id,
          name: tool.name,
          category: tool.category,
        },
      }),
      {
        status: result.success ? 200 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in execute-tool:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        code: "INTERNAL_ERROR",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});