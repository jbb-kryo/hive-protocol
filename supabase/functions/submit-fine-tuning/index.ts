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
    const { dataset_id, name, base_model, hyperparameters } = await req.json();

    if (!dataset_id || !name || !base_model) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
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

    const { data: dataset } = await supabaseClient
      .from("fine_tuning_datasets")
      .select("*")
      .eq("id", dataset_id)
      .eq("user_id", user.id)
      .single();

    if (!dataset) {
      return new Response(
        JSON.stringify({ error: "Dataset not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (dataset.status !== "ready") {
      return new Response(
        JSON.stringify({ error: "Dataset is not ready for training" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: examples } = await supabaseClient
      .from("fine_tuning_training_examples")
      .select("messages, system_prompt")
      .eq("dataset_id", dataset_id);

    if (!examples || examples.length < 10) {
      return new Response(
        JSON.stringify({ error: "Dataset must have at least 10 examples" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const trainingData = examples.map(ex => {
      const messages = ex.system_prompt
        ? [{ role: "system", content: ex.system_prompt }, ...(ex.messages as unknown[])]
        : (ex.messages as unknown[]);
      return { messages };
    });

    const jsonl = trainingData.map(d => JSON.stringify(d)).join("\n");

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

    const uploadResponse = await fetch("https://api.openai.com/v1/files", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
      },
      body: (() => {
        const formData = new FormData();
        const blob = new Blob([jsonl], { type: "application/jsonl" });
        formData.append("file", blob, "training_data.jsonl");
        formData.append("purpose", "fine-tune");
        return formData;
      })(),
    });

    if (!uploadResponse.ok) {
      const error = await uploadResponse.json();
      throw new Error(`File upload failed: ${JSON.stringify(error)}`);
    }

    const fileData = await uploadResponse.json();

    await supabaseClient
      .from("fine_tuning_datasets")
      .update({ file_id: fileData.id, status: "uploaded" })
      .eq("id", dataset_id);

    const fineTuneResponse = await fetch("https://api.openai.com/v1/fine_tuning/jobs", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        training_file: fileData.id,
        model: base_model,
        hyperparameters: hyperparameters || { n_epochs: 3 },
      }),
    });

    if (!fineTuneResponse.ok) {
      const error = await fineTuneResponse.json();
      throw new Error(`Fine-tuning submission failed: ${JSON.stringify(error)}`);
    }

    const jobData = await fineTuneResponse.json();

    const estimatedTokens = trainingData.length * 100 * (hyperparameters?.n_epochs || 3);
    const { data: costEstimate } = await supabaseClient.rpc("calculate_fine_tuning_cost", {
      p_base_model: base_model,
      p_total_tokens: estimatedTokens,
      p_epochs: hyperparameters?.n_epochs || 3,
    });

    const { data: job, error: jobError } = await supabaseClient
      .from("fine_tuning_jobs")
      .insert({
        user_id: user.id,
        dataset_id: dataset_id,
        name: name,
        base_model: base_model,
        hyperparameters: hyperparameters || { n_epochs: 3 },
        openai_job_id: jobData.id,
        status: jobData.status,
        estimated_cost_usd: costEstimate || 0,
      })
      .select()
      .single();

    if (jobError) {
      throw jobError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        job_id: job.id,
        openai_job_id: jobData.id,
        status: jobData.status,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Submit fine-tuning error:", error);
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
