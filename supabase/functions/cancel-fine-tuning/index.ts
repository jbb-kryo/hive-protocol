import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

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
    const { job_id } = await req.json();

    if (!job_id) {
      return new Response(
        JSON.stringify({ error: "Job ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    const { data: { user } } = await supabaseClient.auth.getUser(token || "");

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: job } = await supabaseClient
      .from("fine_tuning_jobs")
      .select("*")
      .eq("id", job_id)
      .eq("user_id", user.id)
      .single();

    if (!job) {
      return new Response(
        JSON.stringify({ error: "Job not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!["queued", "running", "validating_files"].includes(job.status)) {
      return new Response(
        JSON.stringify({ error: "Job cannot be cancelled in current state" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const cancelResponse = await fetch(
      `https://api.openai.com/v1/fine_tuning/jobs/${job.openai_job_id}/cancel`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openaiApiKey}`,
        },
      }
    );

    if (!cancelResponse.ok) {
      const error = await cancelResponse.json();
      throw new Error(`Cancellation failed: ${JSON.stringify(error)}`);
    }

    const jobData = await cancelResponse.json();

    await supabaseClient
      .from("fine_tuning_jobs")
      .update({
        status: "cancelled",
        completed_at: new Date().toISOString(),
      })
      .eq("id", job_id);

    return new Response(
      JSON.stringify({
        success: true,
        status: jobData.status,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Cancel fine-tuning error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
