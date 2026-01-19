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
    const { dataset_id } = await req.json();

    if (!dataset_id) {
      return new Response(
        JSON.stringify({ error: "Dataset ID is required" }),
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

    const { data: dataset, error: datasetError } = await supabaseClient
      .from("fine_tuning_datasets")
      .select("*")
      .eq("id", dataset_id)
      .single();

    if (datasetError || !dataset) {
      return new Response(
        JSON.stringify({ error: "Dataset not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    await supabaseClient
      .from("fine_tuning_datasets")
      .update({ status: "preparing" })
      .eq("id", dataset_id);

    const { data: agents } = await supabaseClient
      .from("agents")
      .select("id, name, system_prompt")
      .in("id", dataset.agent_ids || []);

    const agentMap = new Map(agents?.map(a => [a.id, a]) || []);

    let query = supabaseClient
      .from("agent_conversation_metrics")
      .select(`
        id,
        agent_id,
        swarm_id,
        conversation_start,
        satisfaction_rating,
        success_status
      `)
      .in("agent_id", dataset.agent_ids || []);

    if (dataset.date_range_start) {
      query = query.gte("conversation_start", dataset.date_range_start);
    }
    if (dataset.date_range_end) {
      query = query.lte("conversation_start", dataset.date_range_end);
    }

    if (dataset.filters?.success_only) {
      query = query.eq("success_status", "success");
    }

    if (dataset.filters?.min_satisfaction) {
      query = query.gte("satisfaction_rating", dataset.filters.min_satisfaction);
    }

    const { data: metrics, error: metricsError } = await query;

    if (metricsError) {
      await supabaseClient
        .from("fine_tuning_datasets")
        .update({ status: "error", error_message: metricsError.message })
        .eq("id", dataset_id);

      return new Response(
        JSON.stringify({ error: "Failed to fetch conversations" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const conversationIds = metrics?.map(m => m.id) || [];

    const { data: messages } = await supabaseClient
      .from("messages")
      .select("*")
      .in("swarm_id", metrics?.map(m => m.swarm_id) || [])
      .order("created_at", { ascending: true });

    const conversationMessages = new Map<string, unknown[]>();

    for (const metric of metrics || []) {
      const swarmMessages = messages?.filter(m => m.swarm_id === metric.swarm_id) || [];

      const formattedMessages = swarmMessages.map(m => ({
        role: m.sender_type === "agent" ? "assistant" : "user",
        content: m.content,
      }));

      if (formattedMessages.length >= 2) {
        conversationMessages.set(metric.id, formattedMessages);
      }
    }

    const trainingExamples: unknown[] = [];

    for (const [metricId, messages] of conversationMessages.entries()) {
      const metric = metrics?.find(m => m.id === metricId);
      const agent = metric ? agentMap.get(metric.agent_id) : null;

      await supabaseClient.from("fine_tuning_training_examples").insert({
        dataset_id: dataset_id,
        conversation_metric_id: metricId,
        messages: messages,
        system_prompt: agent?.system_prompt || "",
        quality_score: metric?.satisfaction_rating ? metric.satisfaction_rating / 5 : 1.0,
      });

      trainingExamples.push({
        messages: agent?.system_prompt
          ? [{ role: "system", content: agent.system_prompt }, ...messages]
          : messages,
      });
    }

    const jsonl = trainingExamples.map(ex => JSON.stringify(ex)).join("\n");
    const encoder = new TextEncoder();
    const fileBytes = encoder.encode(jsonl);

    await supabaseClient
      .from("fine_tuning_datasets")
      .update({
        status: "ready",
        total_examples: trainingExamples.length,
        file_size_bytes: fileBytes.length,
      })
      .eq("id", dataset_id);

    return new Response(
      JSON.stringify({
        success: true,
        examples: trainingExamples.length,
        size_bytes: fileBytes.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Generate training data error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
