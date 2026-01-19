import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface StoreCredentialsRequest {
  integration_id: string;
  credentials: Record<string, string>;
}

interface UseCredentialRequest {
  integration_id: string;
  credential_key: string;
  target_url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

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

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
      { auth: { persistSession: false } }
    );

    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    const action = pathParts[pathParts.length - 1];

    if (req.method === "POST" && action === "store") {
      const body: StoreCredentialsRequest = await req.json();

      if (!body.integration_id || !body.credentials) {
        return new Response(
          JSON.stringify({ error: "integration_id and credentials required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: integration } = await supabase
        .from("user_integrations")
        .select("id, user_id")
        .eq("id", body.integration_id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!integration) {
        return new Response(
          JSON.stringify({ error: "Integration not found or access denied" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: maskedCredentials, error: storeError } = await adminClient.rpc(
        "store_integration_credentials",
        {
          p_integration_id: body.integration_id,
          p_credentials: body.credentials,
        }
      );

      if (storeError) {
        console.error("Store credentials error:", storeError);
        return new Response(
          JSON.stringify({ error: "Failed to store credentials" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ masked_credentials: maskedCredentials }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (req.method === "GET" && action === "masked") {
      const integrationId = url.searchParams.get("integration_id");

      if (!integrationId) {
        return new Response(
          JSON.stringify({ error: "integration_id required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: integration } = await supabase
        .from("user_integrations")
        .select("id")
        .eq("id", integrationId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!integration) {
        return new Response(
          JSON.stringify({ error: "Integration not found or access denied" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: masked, error: fetchError } = await adminClient.rpc(
        "get_integration_masked_credentials",
        { p_integration_id: integrationId }
      );

      if (fetchError) {
        console.error("Fetch masked credentials error:", fetchError);
        return new Response(
          JSON.stringify({ error: "Failed to fetch credentials" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ credentials: masked }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (req.method === "POST" && action === "proxy") {
      const body: UseCredentialRequest = await req.json();

      if (!body.integration_id || !body.credential_key || !body.target_url) {
        return new Response(
          JSON.stringify({ error: "integration_id, credential_key, and target_url required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: integration } = await supabase
        .from("user_integrations")
        .select("id")
        .eq("id", body.integration_id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!integration) {
        return new Response(
          JSON.stringify({ error: "Integration not found or access denied" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: decryptedKey, error: decryptError } = await adminClient.rpc(
        "decrypt_integration_credential",
        {
          p_integration_id: body.integration_id,
          p_key_name: body.credential_key,
        }
      );

      if (decryptError || !decryptedKey) {
        console.error("Decrypt error:", decryptError);
        return new Response(
          JSON.stringify({ error: "Failed to retrieve credential" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const proxyHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        ...body.headers,
      };

      if (body.credential_key === "api_key") {
        proxyHeaders["Authorization"] = `Bearer ${decryptedKey}`;
      } else if (body.credential_key === "x_api_key") {
        proxyHeaders["X-API-Key"] = decryptedKey;
      }

      try {
        const proxyResponse = await fetch(body.target_url, {
          method: body.method || "GET",
          headers: proxyHeaders,
          body: body.body ? JSON.stringify(body.body) : undefined,
        });

        const responseData = await proxyResponse.json();

        await adminClient
          .from("user_integrations")
          .update({ last_used_at: new Date().toISOString() })
          .eq("id", body.integration_id);

        return new Response(
          JSON.stringify({
            status: proxyResponse.status,
            data: responseData,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (proxyError) {
        console.error("Proxy request error:", proxyError);
        return new Response(
          JSON.stringify({ error: "Failed to make proxy request" }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (req.method === "DELETE" && action === "delete") {
      const integrationId = url.searchParams.get("integration_id");

      if (!integrationId) {
        return new Response(
          JSON.stringify({ error: "integration_id required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: integration } = await supabase
        .from("user_integrations")
        .select("id")
        .eq("id", integrationId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!integration) {
        return new Response(
          JSON.stringify({ error: "Integration not found or access denied" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error: deleteError } = await adminClient.rpc(
        "delete_integration_credentials",
        { p_integration_id: integrationId }
      );

      if (deleteError) {
        console.error("Delete credentials error:", deleteError);
        return new Response(
          JSON.stringify({ error: "Failed to delete credentials" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use /store, /masked, /proxy, or /delete" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in secure-credentials:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});