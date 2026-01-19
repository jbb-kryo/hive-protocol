import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { createHmac } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function generateSignature(payload: string, secret: string): string {
  const hmac = createHmac('sha256', secret);
  hmac.update(payload);
  return hmac.digest('hex');
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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { webhook_id, url, secret, event_type, payload } = await req.json();

    if (!url || !event_type || !payload) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!isAllowedUrl(url)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or disallowed URL. Private IPs and metadata endpoints are blocked.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payloadString = JSON.stringify(payload);
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = generateSignature(`${timestamp}.${payloadString}`, secret);

    const startTime = Date.now();
    let responseStatus: number | null = null;
    let responseBody: string | null = null;
    let success = false;
    let errorMessage: string | null = null;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': `t=${timestamp},v1=${signature}`,
          'X-Webhook-Event': event_type,
          'X-Webhook-ID': webhook_id || 'test',
        },
        body: payloadString,
      });

      responseStatus = response.status;
      responseBody = await response.text();
      
      if (responseBody.length > 1000) {
        responseBody = responseBody.substring(0, 1000) + '... (truncated)';
      }

      success = response.ok;
      if (!success) {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : 'Network error';
    }

    const durationMs = Date.now() - startTime;

    if (webhook_id) {
      const serviceClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      await serviceClient.from('webhook_deliveries').insert({
        webhook_id,
        event_type,
        payload,
        response_status: responseStatus,
        response_body: responseBody,
        duration_ms: durationMs,
        success,
        error_message: errorMessage,
      });
    }

    return new Response(
      JSON.stringify({
        success,
        response_status: responseStatus,
        response_body: responseBody,
        duration_ms: durationMs,
        error: errorMessage,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});