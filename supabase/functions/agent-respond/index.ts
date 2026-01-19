import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";

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

function sanitizeMessageContent(content: string): string {
  if (!content) return '';
  let sanitized = content
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

function isValidUuid(str: string): boolean {
  if (!str) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
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

type HumanMode = "observe" | "collaborate" | "direct";

interface RequestPayload {
  swarm_id: string;
  message: string;
  agent_id?: string;
  human_mode?: HumanMode;
  conversation_history?: Message[];
  max_tokens?: number;
  temperature?: number;
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

const PROVIDER_ENDPOINTS: Record<string, string> = {
  openai: "https://api.openai.com/v1/chat/completions",
  anthropic: "https://api.anthropic.com/v1/messages",
  google: "https://generativelanguage.googleapis.com/v1beta/models",
};

const DEFAULT_MODELS: Record<string, string> = {
  openai: "gpt-4o",
  anthropic: "claude-sonnet-4-20250514",
  google: "gemini-1.5-pro",
};

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

const HUMAN_MODE_INSTRUCTIONS: Record<string, string> = {
  collaborate: `
## Human Interaction Mode: COLLABORATE
The human is providing suggestions and ideas. You should:
- Consider their input thoughtfully but use your expertise to adapt or improve upon their suggestions
- Feel free to respectfully disagree or propose alternatives if you have better ideas
- Explain your reasoning when you deviate from their suggestions
- Treat their input as collaborative brainstorming, not strict requirements`,

  direct: `
## Human Interaction Mode: DIRECT
The human is giving direct commands. You MUST:
- Follow their instructions precisely and completely
- Execute their requests without deviation unless they ask for alternatives
- If you cannot follow an instruction, explain why clearly
- Prioritize their explicit requirements over your own judgment
- Acknowledge and confirm understanding of their commands`,
};

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): { inputCost: number; outputCost: number } {
  const pricing = MODEL_PRICING[model] || { input: 0.001, output: 0.002 };
  return {
    inputCost: (inputTokens / 1000) * pricing.input,
    outputCost: (outputTokens / 1000) * pricing.output,
  };
}

async function logUsage(
  supabase: SupabaseClient,
  usage: UsageRecord
): Promise<void> {
  try {
    await supabase.from("ai_usage").insert(usage);
  } catch (error) {
    console.error("Failed to log AI usage:", error);
  }
}

function buildSystemPrompt(
  agent: AgentConfig,
  contextBlocks: ContextBlock[],
  swarmTask: string | null,
  humanMode?: HumanMode
): string {
  let systemPrompt = agent.system_prompt || `You are ${agent.name}, an AI assistant.`;

  if (agent.role) {
    systemPrompt += `\n\nYour role: ${agent.role}`;
  }

  if (swarmTask) {
    systemPrompt += `\n\n## Current Task\n${swarmTask}`;
  }

  if (humanMode && humanMode !== "observe" && HUMAN_MODE_INSTRUCTIONS[humanMode]) {
    systemPrompt += `\n${HUMAN_MODE_INSTRUCTIONS[humanMode]}`;
  }

  if (contextBlocks.length > 0) {
    systemPrompt += "\n\n## Shared Context";
    const sortedBlocks = [...contextBlocks].sort((a, b) => {
      const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      return (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
    });

    for (const block of sortedBlocks) {
      systemPrompt += `\n\n### ${block.name}\n${block.content}`;
    }
  }

  systemPrompt += `\n\n## Response Guidelines\n- Be helpful and concise\n- Stay in character as ${agent.name}\n- Reference shared context when relevant\n- Collaborate effectively with other agents and humans`;

  return systemPrompt;
}

function buildConversationMessages(
  history: Message[],
  agentMap: Map<string, string>
): Array<{ role: string; content: string }> {
  return history.slice(-20).map((msg) => {
    if (msg.sender_type === "human") {
      return { role: "user", content: msg.content };
    } else if (msg.sender_type === "agent") {
      const agentName = agentMap.get(msg.sender_id || "") || "Agent";
      return { role: "assistant", content: `[${agentName}]: ${msg.content}` };
    } else {
      return { role: "user", content: `[System]: ${msg.content}` };
    }
  });
}

async function callOpenAI(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>,
  userMessage: string,
  maxTokens: number,
  temperature: number
): Promise<ReadableStream> {
  const response = await fetch(PROVIDER_ENDPOINTS.openai, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
        { role: "user", content: userMessage },
      ],
      stream: true,
      max_tokens: maxTokens,
      temperature,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    if (response.status === 429) {
      throw new Error(`RATE_LIMIT: ${error}`);
    }
    if (response.status === 401) {
      throw new Error(`AUTH_ERROR: Invalid OpenAI API key`);
    }
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  return response.body!;
}

async function callAnthropic(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>,
  userMessage: string,
  maxTokens: number,
  temperature: number
): Promise<ReadableStream> {
  const anthropicMessages = [
    ...messages.filter((m) => m.role !== "system").map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    })),
    { role: "user", content: userMessage },
  ];

  const response = await fetch(PROVIDER_ENDPOINTS.anthropic, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      system: systemPrompt,
      messages: anthropicMessages,
      stream: true,
      max_tokens: maxTokens,
      temperature,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    if (response.status === 429) {
      throw new Error(`RATE_LIMIT: ${error}`);
    }
    if (response.status === 401) {
      throw new Error(`AUTH_ERROR: Invalid Anthropic API key`);
    }
    throw new Error(`Anthropic API error: ${response.status} - ${error}`);
  }

  return response.body!;
}

async function callGoogle(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>,
  userMessage: string,
  maxTokens: number,
  temperature: number
): Promise<ReadableStream> {
  const contents = [
    ...messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    { role: "user", parts: [{ text: userMessage }] },
  ];

  const endpoint = `${PROVIDER_ENDPOINTS.google}/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents,
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    if (response.status === 429) {
      throw new Error(`RATE_LIMIT: ${error}`);
    }
    if (response.status === 401 || response.status === 403) {
      throw new Error(`AUTH_ERROR: Invalid Google API key`);
    }
    throw new Error(`Google API error: ${response.status} - ${error}`);
  }

  return response.body!;
}

function createStreamTransformer(
  framework: string,
  onComplete: (outputTokens: number) => void
): TransformStream {
  let buffer = "";
  let fullContent = "";

  return new TransformStream({
    transform(chunk, controller) {
      const text = new TextDecoder().decode(chunk);
      buffer += text;

      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.trim() || line.startsWith(":")) continue;

        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") {
            controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
            continue;
          }

          try {
            const parsed = JSON.parse(data);
            let content = "";

            if (framework === "openai") {
              content = parsed.choices?.[0]?.delta?.content || "";
            } else if (framework === "anthropic") {
              if (parsed.type === "content_block_delta") {
                content = parsed.delta?.text || "";
              } else if (parsed.type === "message_stop") {
                controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
                continue;
              }
            } else if (framework === "google") {
              content = parsed.candidates?.[0]?.content?.parts?.[0]?.text || "";
              if (parsed.candidates?.[0]?.finishReason === "STOP") {
                if (content) {
                  fullContent += content;
                  controller.enqueue(
                    new TextEncoder().encode(`data: ${JSON.stringify({ content })}\n\n`)
                  );
                }
                controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
                continue;
              }
            }

            if (content) {
              fullContent += content;
              controller.enqueue(
                new TextEncoder().encode(`data: ${JSON.stringify({ content })}\n\n`)
              );
            }
          } catch {
          }
        } else if (framework === "anthropic" && line.startsWith("event: ")) {
          continue;
        }
      }
    },
    flush(controller) {
      if (buffer.trim()) {
        try {
          if (buffer.startsWith("data: ") && buffer.slice(6) !== "[DONE]") {
            const parsed = JSON.parse(buffer.slice(6));
            let content = "";
            if (framework === "openai") {
              content = parsed.choices?.[0]?.delta?.content || "";
            } else if (framework === "anthropic" && parsed.type === "content_block_delta") {
              content = parsed.delta?.text || "";
            } else if (framework === "google") {
              content = parsed.candidates?.[0]?.content?.parts?.[0]?.text || "";
            }
            if (content) {
              fullContent += content;
              controller.enqueue(
                new TextEncoder().encode(`data: ${JSON.stringify({ content })}\n\n`)
              );
            }
          }
        } catch {
        }
      }
      controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
      onComplete(estimateTokens(fullContent));
    },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const startTime = Date.now();
  let usageRecord: Partial<UsageRecord> = {};
  let supabase: SupabaseClient | null = null;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
      { auth: { persistSession: false } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload: RequestPayload = await req.json();
    const {
      swarm_id,
      message: rawMessage,
      agent_id,
      human_mode,
      max_tokens = 2048,
      temperature = 0.7,
    } = payload;

    if (!swarm_id || !rawMessage) {
      return new Response(
        JSON.stringify({ error: "Missing swarm_id or message" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!isValidUuid(swarm_id)) {
      return new Response(
        JSON.stringify({ error: "Invalid swarm_id format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (agent_id && !isValidUuid(agent_id)) {
      return new Response(
        JSON.stringify({ error: "Invalid agent_id format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const message = sanitizeMessageContent(rawMessage);
    if (!message || message.length === 0) {
      return new Response(
        JSON.stringify({ error: "Message cannot be empty after sanitization" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: swarm, error: swarmError } = await supabase
      .from("swarms")
      .select(`
        *,
        swarm_agents (
          agent:agents (*)
        )
      `)
      .eq("id", swarm_id)
      .maybeSingle();

    if (swarmError || !swarm) {
      return new Response(
        JSON.stringify({ error: "Swarm not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const agents: AgentConfig[] = swarm.swarm_agents?.map(
      (sa: { agent: AgentConfig }) => sa.agent
    ) || [];

    if (agents.length === 0) {
      return new Response(
        JSON.stringify({ error: "No agents in swarm" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let selectedAgent: AgentConfig;
    if (agent_id) {
      const found = agents.find((a) => a.id === agent_id);
      if (!found) {
        return new Response(
          JSON.stringify({ error: "Specified agent not in swarm" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      selectedAgent = found;
    } else {
      selectedAgent = agents[Math.floor(Math.random() * agents.length)];
    }

    const { data: contextBlocks } = await supabase
      .from("context_blocks")
      .select("*")
      .eq("swarm_id", swarm_id)
      .eq("shared", true);

    const { data: recentMessages } = await supabase
      .from("messages")
      .select("*")
      .eq("swarm_id", swarm_id)
      .order("created_at", { ascending: true })
      .limit(50);

    const { data: integration } = await supabase
      .from("integrations")
      .select("*")
      .eq("user_id", selectedAgent.user_id)
      .eq("provider", selectedAgent.framework.toLowerCase())
      .maybeSingle();

    const apiKey = (integration?.credentials as { api_key?: string })?.api_key;

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: `No API key configured for ${selectedAgent.framework}. Please add your API key in Settings > Integrations.`,
          code: "MISSING_API_KEY",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const agentMap = new Map<string, string>();
    for (const agent of agents) {
      agentMap.set(agent.id, agent.name);
    }

    const systemPrompt = buildSystemPrompt(
      selectedAgent,
      contextBlocks || [],
      swarm.task,
      human_mode
    );

    const conversationMessages = buildConversationMessages(
      recentMessages || [],
      agentMap
    );

    const framework = selectedAgent.framework.toLowerCase();
    const model = selectedAgent.model ||
      DEFAULT_MODELS[framework] ||
      DEFAULT_MODELS.openai;

    const inputText = systemPrompt + conversationMessages.map(m => m.content).join(" ") + message;
    const inputTokens = estimateTokens(inputText);

    usageRecord = {
      user_id: user.id,
      swarm_id,
      agent_id: selectedAgent.id,
      provider: framework,
      model,
      input_tokens: inputTokens,
      output_tokens: 0,
      input_cost: 0,
      output_cost: 0,
      latency_ms: 0,
      status: "pending",
      request_metadata: {
        human_mode,
        max_tokens,
        temperature,
        message_count: conversationMessages.length,
      },
    };

    let stream: ReadableStream;

    if (framework === "anthropic") {
      stream = await callAnthropic(apiKey, model, systemPrompt, conversationMessages, message, max_tokens, temperature);
    } else if (framework === "google") {
      stream = await callGoogle(apiKey, model, systemPrompt, conversationMessages, message, max_tokens, temperature);
    } else {
      stream = await callOpenAI(apiKey, model, systemPrompt, conversationMessages, message, max_tokens, temperature);
    }

    const transformedStream = stream.pipeThrough(
      createStreamTransformer(framework, async (outputTokens: number) => {
        const latencyMs = Date.now() - startTime;
        const { inputCost, outputCost } = calculateCost(model, inputTokens, outputTokens);

        if (supabase) {
          await logUsage(supabase, {
            ...usageRecord,
            output_tokens: outputTokens,
            input_cost: inputCost,
            output_cost: outputCost,
            latency_ms: latencyMs,
            status: "success",
          } as UsageRecord);
        }
      })
    );

    return new Response(transformedStream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Agent-Id": selectedAgent.id,
        "X-Agent-Name": encodeURIComponent(selectedAgent.name),
      },
    });
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    console.error("Error in agent-respond:", error);

    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    let code = "INTERNAL_ERROR";
    let status = 500;
    let userMessage = errorMessage;

    if (errorMessage.startsWith("RATE_LIMIT:")) {
      code = "RATE_LIMIT";
      status = 429;
      userMessage = "Rate limit exceeded. Please wait a moment and try again.";
    } else if (errorMessage.startsWith("AUTH_ERROR:")) {
      code = "AUTH_ERROR";
      status = 401;
      userMessage = errorMessage.replace("AUTH_ERROR: ", "");
    } else if (errorMessage.toLowerCase().includes("quota")) {
      code = "QUOTA_EXCEEDED";
      userMessage = "API quota exceeded. Please check your billing settings with your AI provider.";
    }

    if (usageRecord.user_id && supabase) {
      await logUsage(supabase, {
        ...usageRecord,
        output_tokens: 0,
        input_cost: 0,
        output_cost: 0,
        latency_ms: latencyMs,
        status: "error",
        error_code: code,
        error_message: errorMessage,
      } as UsageRecord);
    }

    return new Response(
      JSON.stringify({ error: userMessage, code }),
      {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});