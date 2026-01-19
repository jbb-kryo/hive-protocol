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

    const statusResponse = await fetch(
      `https://api.openai.com/v1/fine_tuning/jobs/${job.openai_job_id}`,
      {
        headers: {
          "Authorization": `Bearer ${openaiApiKey}`,
        },
      }
    );

    if (!statusResponse.ok) {
      const error = await statusResponse.json();
      throw new Error(`Status check failed: ${JSON.stringify(error)}`);
    }

    const jobData = await statusResponse.json();

    const updates: Record<string, unknown> = {
      status: jobData.status,
    };

    if (jobData.trained_tokens) {
      updates.trained_tokens = jobData.trained_tokens;
    }

    if (jobData.hyperparameters?.n_epochs) {
      const completedEpochs = jobData.trained_tokens
        ? Math.floor(jobData.trained_tokens / (job.trained_tokens || 1))
        : 0;
      updates.epochs = Math.min(completedEpochs, jobData.hyperparameters.n_epochs);
    }

    if (jobData.fine_tuned_model) {
      updates.fine_tuned_model = jobData.fine_tuned_model;
    }

    if (jobData.error) {
      updates.error_message = JSON.stringify(jobData.error);
    }

    if (jobData.status === "succeeded") {
      updates.completed_at = new Date().toISOString();

      if (jobData.fine_tuned_model) {
        await supabaseClient.from("fine_tuned_models").insert({
          user_id: user.id,
          fine_tuning_job_id: job.id,
          name: job.name,
          description: `Fine-tuned ${job.base_model}`,
          openai_model_id: jobData.fine_tuned_model,
          base_model: job.base_model,
          is_active: true,
        });
      }
    } else if (jobData.status === "failed" || jobData.status === "cancelled") {
      updates.completed_at = new Date().toISOString();
    } else if (jobData.status === "running" && !job.started_at) {
      updates.started_at = new Date().toISOString();
    }

    await supabaseClient
      .from("fine_tuning_jobs")
      .update(updates)
      .eq("id", job_id);

    return new Response(
      JSON.stringify({
        success: true,
        status: jobData.status,
        trained_tokens: jobData.trained_tokens,
        fine_tuned_model: jobData.fine_tuned_model,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Check fine-tuning status error:", error);
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
