import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const WEBHOOK_TIMEOUT_MS = 30000;
const MAX_PAYLOAD_SIZE = 1024 * 1024;

interface WebhookEvent {
  id: string;
  user_id: string;
  event_type: string;
  resource_type: string;
  resource_id: string | null;
  payload: Record<string, unknown>;
  status: string;
  attempt_count: number;
  max_attempts: number;
  next_attempt_at: string;
  created_at: string;
}

interface Webhook {
  id: string;
  user_id: string;
  name: string;
  url: string;
  secret: string | null;
  events: string[];
  is_active: boolean;
}

interface DeliveryResult {
  webhook_id: string;
  success: boolean;
  status_code: number | null;
  response_body: string | null;
  error_message: string | null;
  duration_ms: number;
}

function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();

    const privatePatterns = [
      /^localhost$/i,
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^169\.254\./,
      /^0\./,
      /^::1$/,
      /^fc00:/i,
      /^fe80:/i,
      /\.local$/i,
      /\.internal$/i,
      /^metadata\./i,
      /^169\.254\.169\.254$/,
      /\.metadata\.google\.internal$/i,
      /^metadata\.google\.internal$/i,
    ];

    for (const pattern of privatePatterns) {
      if (pattern.test(hostname)) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

async function generateSignature(
  payload: string,
  secret: string
): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(payload);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
  const hashArray = Array.from(new Uint8Array(signature));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  return `sha256=${hashHex}`;
}

async function sendWebhook(
  webhook: Webhook,
  event: WebhookEvent
): Promise<DeliveryResult> {
  const startTime = Date.now();

  if (!isAllowedUrl(webhook.url)) {
    return {
      webhook_id: webhook.id,
      success: false,
      status_code: null,
      response_body: null,
      error_message: "Invalid or disallowed URL. Private IPs and metadata endpoints are blocked.",
      duration_ms: Date.now() - startTime,
    };
  }

  const webhookPayload = {
    id: crypto.randomUUID(),
    event: event.event_type,
    created_at: new Date().toISOString(),
    data: {
      resource_type: event.resource_type,
      resource_id: event.resource_id,
      ...event.payload,
    },
  };

  const payloadString = JSON.stringify(webhookPayload);

  if (payloadString.length > MAX_PAYLOAD_SIZE) {
    return {
      webhook_id: webhook.id,
      success: false,
      status_code: null,
      response_body: null,
      error_message: "Payload exceeds maximum size limit",
      duration_ms: Date.now() - startTime,
    };
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "HiveMind-Webhook/1.0",
    "X-Webhook-ID": webhook.id,
    "X-Event-Type": event.event_type,
    "X-Event-ID": event.id,
    "X-Delivery-Attempt": String(event.attempt_count),
  };

  if (webhook.secret) {
    const signature = await generateSignature(payloadString, webhook.secret);
    headers["X-Webhook-Signature"] = signature;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);

    const response = await fetch(webhook.url, {
      method: "POST",
      headers,
      body: payloadString,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    let responseBody: string | null = null;
    try {
      responseBody = await response.text();
      if (responseBody.length > 10000) {
        responseBody = responseBody.substring(0, 10000) + "... (truncated)";
      }
    } catch {
      responseBody = null;
    }

    const success = response.ok;

    return {
      webhook_id: webhook.id,
      success,
      status_code: response.status,
      response_body: responseBody,
      error_message: success ? null : `HTTP ${response.status}: ${response.statusText}`,
      duration_ms: Date.now() - startTime,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const isTimeout = errorMessage.includes("abort");

    return {
      webhook_id: webhook.id,
      success: false,
      status_code: null,
      response_body: null,
      error_message: isTimeout ? "Request timeout" : errorMessage,
      duration_ms: Date.now() - startTime,
    };
  }
}

async function processEvent(
  supabase: ReturnType<typeof createClient>,
  event: WebhookEvent
): Promise<{ success: boolean; deliveries: number }> {
  const { data: webhooks, error: webhooksError } = await supabase
    .from("webhooks")
    .select("*")
    .eq("user_id", event.user_id)
    .eq("is_active", true)
    .contains("events", [event.event_type]);

  if (webhooksError || !webhooks || webhooks.length === 0) {
    await supabase.rpc("mark_webhook_event_completed", { p_event_id: event.id });
    return { success: true, deliveries: 0 };
  }

  const deliveryPromises = webhooks.map((webhook) => sendWebhook(webhook, event));
  const results = await Promise.all(deliveryPromises);

  const deliveryInserts = results.map((result) => ({
    webhook_id: result.webhook_id,
    event_id: event.id,
    event_type: event.event_type,
    payload: event.payload,
    response_status: result.status_code,
    response_body: result.response_body,
    duration_ms: result.duration_ms,
    success: result.success,
    error_message: result.error_message,
    attempt_number: event.attempt_count,
  }));

  await supabase.from("webhook_deliveries").insert(deliveryInserts);

  const allSuccessful = results.every((r) => r.success);
  const anySuccessful = results.some((r) => r.success);

  if (allSuccessful) {
    await supabase.rpc("mark_webhook_event_completed", { p_event_id: event.id });
  } else if (!anySuccessful && event.attempt_count >= event.max_attempts) {
    await supabase.rpc("mark_webhook_event_failed", {
      p_event_id: event.id,
      p_retry: false,
    });
  } else if (!allSuccessful) {
    await supabase.rpc("mark_webhook_event_failed", {
      p_event_id: event.id,
      p_retry: true,
    });
  }

  return { success: allSuccessful, deliveries: results.length };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
      { auth: { persistSession: false } }
    );

    let mode = "process";
    let eventId: string | null = null;
    let limit = 50;

    if (req.method === "POST") {
      try {
        const body = await req.json();
        mode = body.mode || "process";
        eventId = body.event_id || null;
        limit = body.limit || 50;
      } catch {
      }
    }

    if (mode === "single" && eventId) {
      const { data: event, error: eventError } = await supabase
        .from("webhook_events")
        .select("*")
        .eq("id", eventId)
        .maybeSingle();

      if (eventError || !event) {
        return new Response(
          JSON.stringify({ success: false, error: "Event not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const locked = await supabase.rpc("mark_webhook_event_processing", {
        p_event_id: eventId,
      });

      if (!locked.data) {
        return new Response(
          JSON.stringify({ success: false, error: "Event already processing" }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const result = await processEvent(supabase, event);

      return new Response(
        JSON.stringify({
          success: true,
          event_id: eventId,
          ...result,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: events, error: eventsError } = await supabase.rpc(
      "get_pending_webhook_events",
      { p_limit: limit }
    );

    if (eventsError) {
      console.error("Error fetching events:", eventsError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to fetch pending events" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!events || events.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No pending events",
          processed: 0,
          deliveries: 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      total_deliveries: 0,
    };

    for (const event of events) {
      const locked = await supabase.rpc("mark_webhook_event_processing", {
        p_event_id: event.id,
      });

      if (!locked.data) {
        continue;
      }

      try {
        const result = await processEvent(supabase, event);
        results.processed++;
        results.total_deliveries += result.deliveries;

        if (result.success) {
          results.successful++;
        } else {
          results.failed++;
        }
      } catch (error) {
        console.error(`Error processing event ${event.id}:`, error);
        results.failed++;

        await supabase.rpc("mark_webhook_event_failed", {
          p_event_id: event.id,
          p_retry: true,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        ...results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in webhook-dispatcher:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});