import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { createLogger, logRequestStart } from "../_shared/logger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

type EventType = "message" | "request" | "ai_request" | "agent_create" | "swarm_create" | "tokens";

interface RateLimitRequest {
  event_type?: EventType;
  consume?: boolean;
  resource_id?: string;
}

interface RateLimitResult {
  allowed: boolean;
  reason: string | null;
  retry_after: number;
  event_type: string;
  usage: {
    messages_per_minute: number;
    messages_today: number;
    requests_per_minute: number;
    requests_today: number;
    tokens_today: number;
    agents_created_today: number;
    swarms_created_today: number;
  };
  limits: {
    plan: string;
    messages_per_minute: number;
    messages_per_day: number;
    requests_per_minute: number;
    requests_per_day: number;
    tokens_per_day: number;
    max_agents: number;
    max_swarms: number;
    agents_per_day: number;
    swarms_per_day: number;
  };
}

function buildRateLimitHeaders(
  result: RateLimitResult,
  retryAfter?: number
): Record<string, string> {
  const headers: Record<string, string> = {
    ...corsHeaders,
    "Content-Type": "application/json",
  };

  if (result.event_type === "message") {
    headers["X-RateLimit-Limit"] = String(result.limits.messages_per_minute);
    headers["X-RateLimit-Remaining"] = String(
      Math.max(0, result.limits.messages_per_minute - result.usage.messages_per_minute)
    );
    headers["X-RateLimit-Window"] = "60";
  } else if (result.event_type === "request" || result.event_type === "ai_request") {
    headers["X-RateLimit-Limit"] = String(result.limits.requests_per_minute);
    headers["X-RateLimit-Remaining"] = String(
      Math.max(0, result.limits.requests_per_minute - result.usage.requests_per_minute)
    );
    headers["X-RateLimit-Window"] = "60";
  } else if (result.event_type === "agent_create") {
    headers["X-RateLimit-Limit"] = String(result.limits.agents_per_day);
    headers["X-RateLimit-Remaining"] = String(
      Math.max(0, result.limits.agents_per_day - result.usage.agents_created_today)
    );
    headers["X-RateLimit-Window"] = "86400";
  } else if (result.event_type === "swarm_create") {
    headers["X-RateLimit-Limit"] = String(result.limits.swarms_per_day);
    headers["X-RateLimit-Remaining"] = String(
      Math.max(0, result.limits.swarms_per_day - result.usage.swarms_created_today)
    );
    headers["X-RateLimit-Window"] = "86400";
  }

  if (retryAfter !== undefined && retryAfter > 0) {
    headers["Retry-After"] = String(retryAfter);
    const resetTime = new Date(Date.now() + retryAfter * 1000);
    headers["X-RateLimit-Reset"] = resetTime.toISOString();
  }

  return headers;
}

Deno.serve(async (req: Request) => {
  const logger = createLogger("check-rate-limit", req);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  logRequestStart(logger);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_ANON_KEY") || "",
      {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let eventType: EventType = "request";
    let consume = false;
    let resourceId: string | null = null;

    if (req.method === "POST") {
      try {
        const body: RateLimitRequest = await req.json();
        eventType = body.event_type || "request";
        consume = body.consume || false;
        resourceId = body.resource_id || null;
      } catch {
      }
    } else if (req.method === "GET") {
      const url = new URL(req.url);
      eventType = (url.searchParams.get("event_type") as EventType) || "request";
      consume = url.searchParams.get("consume") === "true";
      resourceId = url.searchParams.get("resource_id");
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
      { auth: { persistSession: false } }
    );

    let result: RateLimitResult;

    if (consume) {
      const { data, error } = await adminClient.rpc("consume_rate_limit", {
        p_user_id: user.id,
        p_event_type: eventType,
        p_resource_id: resourceId,
      });

      if (error) {
        throw new Error(`Consume rate limit failed: ${error.message}`);
      }

      result = data as RateLimitResult;
    } else {
      const { data, error } = await adminClient.rpc("check_rate_limit_v2", {
        p_user_id: user.id,
        p_event_type: eventType,
      });

      if (error) {
        throw new Error(`Check rate limit failed: ${error.message}`);
      }

      result = data as RateLimitResult;
    }

    if (!result.allowed) {
      const retryAfter = result.retry_after || 60;

      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded",
          message: result.reason,
          retry_after: retryAfter,
          usage: result.usage,
          limits: result.limits,
        }),
        {
          status: 429,
          headers: buildRateLimitHeaders(result, retryAfter),
        }
      );
    }

    return new Response(
      JSON.stringify({
        allowed: true,
        event_type: result.event_type,
        usage: result.usage,
        limits: result.limits,
      }),
      {
        status: 200,
        headers: buildRateLimitHeaders(result),
      }
    );
  } catch (error) {
    logger.error("Rate limit check failed", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";

    return new Response(
      JSON.stringify({ error: errorMessage, request_id: logger.getRequestId() }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json", "X-Request-Id": logger.getRequestId() }
      }
    );
  }
});