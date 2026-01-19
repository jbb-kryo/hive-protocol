import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const url = new URL(req.url);
    const token = url.pathname.split("/").pop();

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Missing webhook token" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: webhook, error: webhookError } = await supabaseClient
      .from("workflow_webhooks")
      .select("*, workflows(*)")
      .eq("token", token)
      .eq("is_active", true)
      .single();

    if (webhookError || !webhook) {
      return new Response(
        JSON.stringify({ error: "Invalid or inactive webhook" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (webhook.workflows.status !== "active") {
      return new Response(
        JSON.stringify({ error: "Workflow is not active" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let triggerData = {};
    if (req.method === "POST" || req.method === "PUT") {
      try {
        triggerData = await req.json();
      } catch {
        triggerData = {};
      }
    }

    const queryParams: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });

    const { data: execution, error: execError } = await supabaseClient
      .from("workflow_executions")
      .insert({
        workflow_id: webhook.workflow_id,
        status: "pending",
        trigger_type: "webhook",
        trigger_data: {
          body: triggerData,
          query: queryParams,
          method: req.method,
          headers: Object.fromEntries(req.headers.entries()),
        },
      })
      .select()
      .single();

    if (execError) {
      return new Response(
        JSON.stringify({ error: "Failed to create execution" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    await supabaseClient
      .from("workflow_webhooks")
      .update({ last_triggered_at: new Date().toISOString() })
      .eq("id", webhook.id);

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    fetch(`${supabaseUrl}/functions/v1/execute-workflow`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ execution_id: execution.id }),
    }).catch(console.error);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Workflow triggered",
        execution_id: execution.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Webhook error:", error);

    return new Response(
      JSON.stringify({ error: "Webhook processing failed" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});