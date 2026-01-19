import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface WorkflowNode {
  id: string;
  workflow_id: string;
  node_type: string;
  action_type: string;
  label: string;
  config: any;
}

interface WorkflowEdge {
  id: string;
  source_node_id: string;
  target_node_id: string;
  source_handle: string;
}

function safeEvaluateCondition(condition: string, context: Record<string, any>): boolean {
  if (!condition || typeof condition !== 'string') {
    return false;
  }

  const sanitized = condition.trim().toLowerCase();
  
  if (sanitized === 'true') return true;
  if (sanitized === 'false') return false;

  const comparisonMatch = condition.match(/^([\w.]+)\s*(===|==|!==|!=|>=|<=|>|<)\s*(.+)$/);
  
  if (comparisonMatch) {
    const [, leftPath, operator, rightValue] = comparisonMatch;
    
    const getNestedValue = (obj: any, path: string): any => {
      const parts = path.split('.');
      let current = obj;
      for (const part of parts) {
        if (current === null || current === undefined) return undefined;
        current = current[part];
      }
      return current;
    };
    
    const leftValue = getNestedValue(context, leftPath.trim());
    let rightVal: any = rightValue.trim();
    
    if (rightVal === 'true') rightVal = true;
    else if (rightVal === 'false') rightVal = false;
    else if (rightVal === 'null') rightVal = null;
    else if (rightVal === 'undefined') rightVal = undefined;
    else if (/^['"].*['"]$/.test(rightVal)) {
      rightVal = rightVal.slice(1, -1);
    } else if (!isNaN(Number(rightVal))) {
      rightVal = Number(rightVal);
    }
    
    switch (operator) {
      case '===':
      case '==':
        return leftValue === rightVal || leftValue == rightVal;
      case '!==':
      case '!=':
        return leftValue !== rightVal;
      case '>':
        return Number(leftValue) > Number(rightVal);
      case '<':
        return Number(leftValue) < Number(rightVal);
      case '>=':
        return Number(leftValue) >= Number(rightVal);
      case '<=':
        return Number(leftValue) <= Number(rightVal);
      default:
        return false;
    }
  }

  return false;
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

    const { execution_id } = await req.json();

    if (!execution_id || typeof execution_id !== 'string') {
      return new Response(
        JSON.stringify({ error: "Invalid execution_id" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(execution_id)) {
      return new Response(
        JSON.stringify({ error: "Invalid execution_id format" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: execution, error: execError } = await supabaseClient
      .from("workflow_executions")
      .select("*, workflows(*)")
      .eq("id", execution_id)
      .single();

    if (execError || !execution) {
      return new Response(
        JSON.stringify({ error: "Execution not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    await supabaseClient
      .from("workflow_executions")
      .update({
        status: "running",
        started_at: new Date().toISOString(),
      })
      .eq("id", execution_id);

    const { data: nodes } = await supabaseClient
      .from("workflow_nodes")
      .select("*")
      .eq("workflow_id", execution.workflow_id);

    const { data: edges } = await supabaseClient
      .from("workflow_edges")
      .select("*")
      .eq("workflow_id", execution.workflow_id);

    const startNode = nodes?.find((n: WorkflowNode) => n.node_type === "trigger");
    if (!startNode) {
      await supabaseClient
        .from("workflow_executions")
        .update({
          status: "failed",
          error_message: "No trigger node found",
          completed_at: new Date().toISOString(),
        })
        .eq("id", execution_id);

      return new Response(
        JSON.stringify({ error: "No trigger node found" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const startTime = Date.now();
    let currentNodeId = startNode.id;
    let context: Record<string, any> = { trigger_data: execution.trigger_data };
    const executedSteps: any[] = [];
    const maxSteps = 100;

    while (currentNodeId && executedSteps.length < maxSteps) {
      const currentNode = nodes?.find((n: WorkflowNode) => n.id === currentNodeId);
      if (!currentNode) break;

      const stepStart = Date.now();
      let stepStatus = "completed";
      let stepOutput: any = {};
      let stepError = "";

      try {
        switch (currentNode.node_type) {
          case "trigger":
            stepOutput = { triggered: true, data: context.trigger_data };
            break;

          case "action":
            switch (currentNode.action_type) {
              case "send_message":
                stepOutput = {
                  message_sent: true,
                  message: String(currentNode.config?.message || "Hello").slice(0, 10000),
                };
                break;
              case "run_agent":
                const agentId = currentNode.config?.agent_id;
                if (agentId && uuidRegex.test(agentId)) {
                  stepOutput = {
                    agent_started: true,
                    agent_id: agentId,
                  };
                } else {
                  stepError = "Invalid agent_id";
                  stepStatus = "failed";
                }
                break;
              case "send_email":
                stepOutput = {
                  email_sent: true,
                  to: String(currentNode.config?.to || "").slice(0, 255),
                  subject: String(currentNode.config?.subject || "").slice(0, 500),
                };
                break;
              case "webhook":
                const webhookUrl = currentNode.config?.url;
                if (webhookUrl && isAllowedUrl(webhookUrl)) {
                  try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 30000);
                    
                    const response = await fetch(webhookUrl, {
                      method: currentNode.config.method || "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        workflow_id: execution.workflow_id,
                        execution_id: execution_id,
                        data: context.trigger_data,
                      }),
                      signal: controller.signal,
                    });
                    
                    clearTimeout(timeoutId);
                    stepOutput = {
                      webhook_called: true,
                      status: response.status,
                    };
                  } catch (e) {
                    stepError = "Webhook request failed";
                    stepStatus = "failed";
                  }
                } else {
                  stepError = "Invalid or disallowed webhook URL";
                  stepStatus = "failed";
                }
                break;
              case "wait":
                const delay = Math.min(Math.max(0, Number(currentNode.config?.delay) || 1000), 60000);
                await new Promise((resolve) => setTimeout(resolve, delay));
                stepOutput = { waited: true, delay };
                break;
            }
            break;

          case "condition":
            const condition = String(currentNode.config?.condition || "false");
            const result = safeEvaluateCondition(condition, context);
            stepOutput = { condition, result };
            context.condition_result = result;
            break;

          case "delay":
            const delaySeconds = Math.min(Math.max(0, Number(currentNode.config?.delay) || 1), 300);
            await new Promise((resolve) =>
              setTimeout(resolve, delaySeconds * 1000)
            );
            stepOutput = { delayed: true, seconds: delaySeconds };
            break;

          case "end":
            stepOutput = { workflow_ended: true };
            break;
        }
      } catch (error) {
        stepStatus = "failed";
        stepError = "Step execution failed";
      }

      await supabaseClient.from("workflow_execution_steps").insert({
        execution_id,
        node_id: currentNode.id,
        status: stepStatus,
        input_data: { keys: Object.keys(context) },
        output_data: stepOutput,
        error_message: stepError,
        started_at: new Date(stepStart).toISOString(),
        completed_at: new Date().toISOString(),
      });

      executedSteps.push({
        node_id: currentNode.id,
        status: stepStatus,
        output: stepOutput,
      });

      if (stepStatus === "failed" || currentNode.node_type === "end") {
        break;
      }

      context = { ...context, [currentNode.id]: stepOutput };

      let nextEdge: WorkflowEdge | undefined;
      if (currentNode.node_type === "condition") {
        const handle = context.condition_result ? "true" : "false";
        nextEdge = edges?.find(
          (e: WorkflowEdge) =>
            e.source_node_id === currentNodeId &&
            (e.source_handle === handle || e.source_handle === "default")
        );
      } else {
        nextEdge = edges?.find(
          (e: WorkflowEdge) => e.source_node_id === currentNodeId
        );
      }

      currentNodeId = nextEdge?.target_node_id || "";
    }

    const duration = Date.now() - startTime;
    const hasFailure = executedSteps.some((s) => s.status === "failed");

    await supabaseClient
      .from("workflow_executions")
      .update({
        status: hasFailure ? "failed" : "completed",
        completed_at: new Date().toISOString(),
        duration_ms: duration,
      })
      .eq("id", execution_id);

    return new Response(
      JSON.stringify({
        success: !hasFailure,
        execution_id,
        duration_ms: duration,
        steps_executed: executedSteps.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Workflow execution failed" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});