import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const TIMEOUTS = {
  DEFAULT: 30000,
  SHORT: 10000,
  LONG: 60000,
  WEBHOOK: 30000,
  AI_REQUEST: 120000,
  DATABASE: 15000,
} as const;

class TimeoutError extends Error {
  constructor(message: string, public readonly timeoutMs: number) {
    super(message);
    this.name = "TimeoutError";
  }
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage = "Operation timed out"): Promise<T> {
  let timeoutId: number | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new TimeoutError(errorMessage, timeoutMs));
    }, timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  }
}

function createPerformanceTracker() {
  const startTime = Date.now();
  const checkpoints: Array<{ name: string; time: number; duration_ms: number }> = [];
  let lastTime = startTime;
  return {
    checkpoint(name: string) {
      const now = Date.now();
      checkpoints.push({ name, time: now, duration_ms: now - lastTime });
      lastTime = now;
    },
    end() {
      const endTime = Date.now();
      return { start_time: startTime, end_time: endTime, duration_ms: endTime - startTime, checkpoints };
    },
  };
}

function logError(error: unknown, context: Record<string, unknown>) {
  const errorId = `err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  let message = "Unknown error";
  let name = "UnknownError";
  let httpStatus = 500;
  if (error instanceof TimeoutError) { message = error.message; name = "TimeoutError"; httpStatus = 504; }
  else if (error instanceof Error) { message = error.message; name = error.name; }
  else if (typeof error === "string") { message = error; }
  console.error(JSON.stringify({ level: "error", error_id: errorId, message, name, context }));
  return { error_id: errorId, message, name, http_status: httpStatus };
}

function logPerformance(functionName: string, metrics: ReturnType<ReturnType<typeof createPerformanceTracker>["end"]>, ctx?: Record<string, unknown>) {
  console.log(JSON.stringify({ level: "info", type: "performance", function_name: functionName, duration_ms: metrics.duration_ms, checkpoints: metrics.checkpoints, ...ctx }));
}

function handleOptionsRequest() {
  return new Response(null, { status: 200, headers: corsHeaders });
}

function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

interface ProviderConfig {
  endpoint: string;
  authHeader: string;
  authPrefix: string;
  extraHeaders?: Record<string, string>;
  buildRequest: (params: BuildRequestParams) => Record<string, unknown>;
  parseStream: (chunk: string, buffer: string) => { content: string; done: boolean; buffer: string };
  estimateTokens: (text: string) => number;
}

interface BuildRequestParams {
  model: string;
  systemPrompt: string;
  messages: Array<{ role: string; content: string }>;
  maxTokens: number;
  temperature: number;
}

interface RequestPayload {
  swarm_id: string;
  message: string;
  agent_id?: string;
  human_mode?: "observe" | "collaborate" | "direct";
  max_tokens?: number;
  temperature?: number;
}

interface AgentConfig {
  id: string;
  name: string;
  role: string | null;
  framework: string;
  model: string | null;
  system_prompt: string | null;
  settings: Record<string, unknown>;
  user_id: string;
}

interface ContextBlock {
  id: string;
  name: string;
  content: string;
  priority: string;
  shared: boolean;
}

interface Message {
  id: string;
  sender_type: string;
  sender_id: string | null;
  content: string;
  created_at: string;
}

interface UsageRecord {
  user_id: string;
  swarm_id: string;
  agent_id: string;
  provider: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  input_cost: number;
  output_cost: number;
  latency_ms: number;
  status: string;
  error_code?: string;
  error_message?: string;
  request_metadata: Record<string, unknown>;
}

const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "gpt-4o": { input: 0.0025, output: 0.01 },
  "gpt-4o-mini": { input: 0.00015, output: 0.0006 },
  "gpt-4-turbo": { input: 0.01, output: 0.03 },
  "gpt-3.5-turbo": { input: 0.0005, output: 0.0015 },
  "claude-sonnet-4-20250514": { input: 0.003, output: 0.015 },
  "claude-3-5-sonnet-20241022": { input: 0.003, output: 0.015 },
  "claude-3-opus-20240229": { input: 0.015, output: 0.075 },
  "claude-3-haiku-20240307": { input: 0.00025, output: 0.00125 },
  "gemini-1.5-pro": { input: 0.00125, output: 0.005 },
  "gemini-1.5-flash": { input: 0.000075, output: 0.0003 },
};

const DEFAULT_MODELS: Record<string, string> = {
  openai: "gpt-4o",
  anthropic: "claude-sonnet-4-20250514",
  google: "gemini-1.5-pro",
};

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

const PROVIDERS: Record<string, ProviderConfig> = {
  openai: {
    endpoint: "https://api.openai.com/v1/chat/completions",
    authHeader: "Authorization",
    authPrefix: "Bearer ",
    buildRequest: ({ model, systemPrompt, messages, maxTokens, temperature }) => ({
      model,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      stream: true,
      max_tokens: maxTokens,
      temperature,
    }),
    parseStream: (line: string, buffer: string) => {
      if (!line.startsWith("data: ")) return { content: "", done: false, buffer };
      const data = line.slice(6);
      if (data === "[DONE]") return { content: "", done: true, buffer: "" };
      try {
        const parsed = JSON.parse(data);
        const content = parsed.choices?.[0]?.delta?.content || "";
        return { content, done: false, buffer: "" };
      } catch { return { content: "", done: false, buffer }; }
    },
    estimateTokens,
  },
  anthropic: {
    endpoint: "https://api.anthropic.com/v1/messages",
    authHeader: "x-api-key",
    authPrefix: "",
    extraHeaders: { "anthropic-version": "2023-06-01" },
    buildRequest: ({ model, systemPrompt, messages, maxTokens, temperature }) => {
      const anthropicMessages = messages.filter((m) => m.role !== "system").map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      }));
      return { model, system: systemPrompt, messages: anthropicMessages, stream: true, max_tokens: maxTokens, temperature };
    },
    parseStream: (line: string, buffer: string) => {
      if (line.startsWith("event: ")) return { content: "", done: false, buffer };
      if (!line.startsWith("data: ")) return { content: "", done: false, buffer };
      const data = line.slice(6);
      try {
        const parsed = JSON.parse(data);
        if (parsed.type === "content_block_delta") return { content: parsed.delta?.text || "", done: false, buffer: "" };
        if (parsed.type === "message_stop") return { content: "", done: true, buffer: "" };
        return { content: "", done: false, buffer: "" };
      } catch { return { content: "", done: false, buffer }; }
    },
    estimateTokens,
  },
  google: {
    endpoint: "https://generativelanguage.googleapis.com/v1beta/models",
    authHeader: "x-goog-api-key",
    authPrefix: "",
    buildRequest: ({ model, systemPrompt, messages, maxTokens, temperature }) => {
      const contents = messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
      return { contents, systemInstruction: { parts: [{ text: systemPrompt }] }, generationConfig: { maxOutputTokens: maxTokens, temperature } };
    },
    parseStream: (line: string, buffer: string) => {
      if (!line.startsWith("data: ")) return { content: "", done: false, buffer };
      const data = line.slice(6);
      try {
        const parsed = JSON.parse(data);
        const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const done = parsed.candidates?.[0]?.finishReason === "STOP";
        return { content, done, buffer: "" };
      } catch { return { content: "", done: false, buffer }; }
    },
    estimateTokens,
  },
};

const HUMAN_MODE_INSTRUCTIONS = {
  collaborate: `\n## Human Interaction Mode: COLLABORATE\nThe human is providing suggestions and ideas. Consider their input thoughtfully but use your expertise to adapt or improve upon their suggestions.`,
  direct: `\n## Human Interaction Mode: DIRECT\nThe human is giving direct commands. Follow their instructions precisely and completely.`,
};

function buildSystemPrompt(agent: AgentConfig, contextBlocks: ContextBlock[], swarmTask: string | null, humanMode?: "observe" | "collaborate" | "direct"): string {
  let systemPrompt = agent.system_prompt || `You are ${agent.name}, an AI assistant.`;
  if (agent.role) systemPrompt += `\n\nYour role: ${agent.role}`;
  if (swarmTask) systemPrompt += `\n\n## Current Task\n${swarmTask}`;
  if (humanMode && humanMode !== "observe" && HUMAN_MODE_INSTRUCTIONS[humanMode]) systemPrompt += HUMAN_MODE_INSTRUCTIONS[humanMode];
  if (contextBlocks.length > 0) {
    systemPrompt += "\n\n## Shared Context";
    const sortedBlocks = [...contextBlocks].sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return (priorityOrder[a.priority as keyof typeof priorityOrder] || 3) - (priorityOrder[b.priority as keyof typeof priorityOrder] || 3);
    });
    for (const block of sortedBlocks) systemPrompt += `\n\n### ${block.name}\n${block.content}`;
  }
  systemPrompt += `\n\n## Response Guidelines\n- Be helpful and concise\n- Stay in character as ${agent.name}\n- Reference shared context when relevant`;
  return systemPrompt;
}

function buildConversationMessages(history: Message[], agentMap: Map<string, string>): Array<{ role: string; content: string }> {
  return history.slice(-20).map((msg) => {
    if (msg.sender_type === "human") return { role: "user", content: msg.content };
    else if (msg.sender_type === "agent") {
      const agentName = agentMap.get(msg.sender_id || "") || "Agent";
      return { role: "assistant", content: `[${agentName}]: ${msg.content}` };
    } else return { role: "user", content: `[System]: ${msg.content}` };
  });
}

function calculateCost(model: string, inputTokens: number, outputTokens: number): { inputCost: number; outputCost: number } {
  const pricing = MODEL_PRICING[model] || { input: 0.001, output: 0.002 };
  return { inputCost: (inputTokens / 1000) * pricing.input, outputCost: (outputTokens / 1000) * pricing.output };
}

async function logUsage(supabase: SupabaseClient, usage: UsageRecord): Promise<void> {
  try { await supabase.from("ai_usage").insert(usage); } catch (error) { console.error("Failed to log AI usage:", error); }
}

async function getApiKey(supabase: SupabaseClient, userId: string, provider: string): Promise<string | null> {
  const { data: integration } = await supabase.from("integrations").select("credentials").eq("user_id", userId).eq("provider", provider).maybeSingle();
  return (integration?.credentials as { api_key?: string })?.api_key || null;
}

function createStreamingResponse(provider: ProviderConfig, providerStream: ReadableStream, onComplete: (outputTokens: number, fullContent: string) => void): ReadableStream {
  let buffer = "";
  let fullContent = "";
  let outputTokens = 0;
  const transformer = new TransformStream({
    transform(chunk, controller) {
      const text = new TextDecoder().decode(chunk);
      buffer += text;
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (!line.trim() || line.startsWith(":")) continue;
        const result = provider.parseStream(line, buffer);
        buffer = result.buffer;
        if (result.content) {
          fullContent += result.content;
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content: result.content })}\n\n`));
        }
        if (result.done) {
          outputTokens = provider.estimateTokens(fullContent);
          controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
        }
      }
    },
    flush(controller) {
      if (buffer.trim()) {
        const result = provider.parseStream(buffer, "");
        if (result.content) {
          fullContent += result.content;
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content: result.content })}\n\n`));
        }
      }
      outputTokens = provider.estimateTokens(fullContent);
      controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
      onComplete(outputTokens, fullContent);
    },
  });
  return providerStream.pipeThrough(transformer);
}

async function callProvider(provider: ProviderConfig, providerName: string, apiKey: string, params: BuildRequestParams): Promise<ReadableStream> {
  const headers: Record<string, string> = { "Content-Type": "application/json", [provider.authHeader]: `${provider.authPrefix}${apiKey}`, ...provider.extraHeaders };
  let endpoint = provider.endpoint;
  if (providerName === "google") endpoint = `${provider.endpoint}/${params.model}:streamGenerateContent?alt=sse`;
  const response = await fetch(endpoint, { method: "POST", headers, body: JSON.stringify(provider.buildRequest(params)) });
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `${providerName} API error: ${response.status}`;
    try { const errorJson = JSON.parse(errorText); errorMessage = errorJson.error?.message || errorJson.message || errorMessage; } catch { errorMessage = errorText || errorMessage; }
    if (response.status === 429) throw new Error(`RATE_LIMIT: ${errorMessage}`);
    if (response.status === 401 || response.status === 403) throw new Error(`AUTH_ERROR: Invalid API key for ${providerName}`);
    if (response.status === 400) throw new Error(`BAD_REQUEST: ${errorMessage}`);
    throw new Error(errorMessage);
  }
  if (!response.body) throw new Error("No response body received");
  return response.body;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return handleOptionsRequest();
  const requestId = generateRequestId();
  const tracker = createPerformanceTracker();
  let usageRecord: Partial<UsageRecord> = {};
  const startTime = Date.now();
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Missing authorization header" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const supabase = createClient(Deno.env.get("SUPABASE_URL") || "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "", { auth: { persistSession: false } });
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return new Response(JSON.stringify({ error: "Invalid authentication" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const payload: RequestPayload = await req.json();
    const { swarm_id, message, agent_id, human_mode, max_tokens = 2048, temperature = 0.7 } = payload;
    if (!swarm_id || !message) return new Response(JSON.stringify({ error: "Missing swarm_id or message" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { data: swarm, error: swarmError } = await supabase.from("swarms").select(`*, swarm_agents (agent:agents (*))`).eq("id", swarm_id).maybeSingle();
    if (swarmError || !swarm) return new Response(JSON.stringify({ error: "Swarm not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const agents: AgentConfig[] = swarm.swarm_agents?.map((sa: { agent: AgentConfig }) => sa.agent) || [];
    if (agents.length === 0) return new Response(JSON.stringify({ error: "No agents in swarm" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    let selectedAgent: AgentConfig;
    if (agent_id) {
      const found = agents.find((a) => a.id === agent_id);
      if (!found) return new Response(JSON.stringify({ error: "Specified agent not in swarm" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      selectedAgent = found;
    } else selectedAgent = agents[Math.floor(Math.random() * agents.length)];
    const providerName = selectedAgent.framework.toLowerCase();
    const provider = PROVIDERS[providerName];
    if (!provider) return new Response(JSON.stringify({ error: `Unsupported AI provider: ${selectedAgent.framework}`, code: "UNSUPPORTED_PROVIDER" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const apiKey = await getApiKey(supabase, selectedAgent.user_id, providerName);
    if (!apiKey) return new Response(JSON.stringify({ error: `No API key configured for ${selectedAgent.framework}. Please add your API key in Settings > Integrations.`, code: "MISSING_API_KEY" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { data: contextBlocks } = await supabase.from("context_blocks").select("*").eq("swarm_id", swarm_id).eq("shared", true);
    const { data: recentMessages } = await supabase.from("messages").select("*").eq("swarm_id", swarm_id).order("created_at", { ascending: true }).limit(50);
    const agentMap = new Map<string, string>();
    for (const agent of agents) agentMap.set(agent.id, agent.name);
    const systemPrompt = buildSystemPrompt(selectedAgent, contextBlocks || [], swarm.task, human_mode);
    const conversationMessages = buildConversationMessages(recentMessages || [], agentMap);
    conversationMessages.push({ role: "user", content: message });
    const model = selectedAgent.model || DEFAULT_MODELS[providerName] || DEFAULT_MODELS.openai;
    const inputText = systemPrompt + conversationMessages.map(m => m.content).join(" ");
    const inputTokens = estimateTokens(inputText);
    usageRecord = { user_id: user.id, swarm_id, agent_id: selectedAgent.id, provider: providerName, model, input_tokens: inputTokens, output_tokens: 0, input_cost: 0, output_cost: 0, latency_ms: 0, status: "pending", request_metadata: { human_mode, max_tokens, temperature, message_count: conversationMessages.length } };
    tracker.checkpoint("pre_provider_call");
    const providerStream = await withTimeout(callProvider(provider, providerName, apiKey, { model, systemPrompt, messages: conversationMessages, maxTokens: max_tokens, temperature }), TIMEOUTS.AI_REQUEST, `AI provider ${providerName} request timed out`);
    tracker.checkpoint("provider_connected");
    const responseStream = createStreamingResponse(provider, providerStream, async (outputTokens: number) => {
      const latencyMs = Date.now() - startTime;
      const { inputCost, outputCost } = calculateCost(model, inputTokens, outputTokens);
      await logUsage(supabase, { ...usageRecord, output_tokens: outputTokens, input_cost: inputCost, output_cost: outputCost, latency_ms: latencyMs, status: "success" } as UsageRecord);
    });
    return new Response(responseStream, { headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive", "X-Agent-Id": selectedAgent.id, "X-Agent-Name": encodeURIComponent(selectedAgent.name), "X-Request-Id": requestId } });
  } catch (error) {
    const metrics = tracker.end();
    const structuredError = logError(error, { function_name: "ai-router", request_id: requestId, user_id: usageRecord.user_id, swarm_id: usageRecord.swarm_id, agent_id: usageRecord.agent_id, provider: usageRecord.provider, model: usageRecord.model });
    logPerformance("ai-router", metrics, { error: true, request_id: requestId });
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    let code = "INTERNAL_ERROR"; let status = 500; let userMessage = errorMessage;
    if (errorMessage.startsWith("RATE_LIMIT:")) { code = "RATE_LIMIT"; status = 429; userMessage = "Rate limit exceeded. Please wait and try again."; }
    else if (errorMessage.startsWith("AUTH_ERROR:")) { code = "AUTH_ERROR"; status = 401; userMessage = errorMessage.replace("AUTH_ERROR: ", ""); }
    else if (errorMessage.startsWith("BAD_REQUEST:")) { code = "BAD_REQUEST"; status = 400; userMessage = errorMessage.replace("BAD_REQUEST: ", ""); }
    const latencyMs = Date.now() - startTime;
    if (usageRecord.user_id) {
      const supabase = createClient(Deno.env.get("SUPABASE_URL") || "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "");
      await logUsage(supabase, { ...usageRecord, output_tokens: 0, input_cost: 0, output_cost: 0, latency_ms: latencyMs, status: "error", error_code: code, error_message: errorMessage } as UsageRecord);
    }
    return new Response(JSON.stringify({ error: userMessage, code }), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});