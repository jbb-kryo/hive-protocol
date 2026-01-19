import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function verifyAdmin(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) throw new Error("Missing authorization header");

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
  if (userError || !user) throw new Error("Unauthorized");

  const { data: profile } = await supabaseClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") throw new Error("Admin access required");
  return user;
}

function getAdminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );
}

async function listModels() {
  const client = getAdminClient();
  const { data, error } = await client
    .from("ai_models")
    .select("*")
    .order("provider")
    .order("name");
  if (error) throw error;
  return data;
}

async function createModel(model: Record<string, unknown>) {
  const client = getAdminClient();
  const { data, error } = await client
    .from("ai_models")
    .insert(model)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function updateModel(id: string, updates: Record<string, unknown>) {
  const client = getAdminClient();
  const { data, error } = await client
    .from("ai_models")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deleteModel(id: string) {
  const client = getAdminClient();
  const { error } = await client.from("ai_models").delete().eq("id", id);
  if (error) throw error;
  return { success: true };
}

async function listApiKeys() {
  const client = getAdminClient();
  const { data, error } = await client
    .from("model_api_keys")
    .select("id, provider, key_name, is_active, usage_count, last_used_at, created_at")
    .order("provider");
  if (error) throw error;
  return data;
}

async function createApiKey(keyData: { provider: string; key_name: string; encrypted_key: string }) {
  const client = getAdminClient();
  const { data, error } = await client
    .from("model_api_keys")
    .insert(keyData)
    .select("id, provider, key_name, is_active, created_at")
    .single();
  if (error) throw error;
  return data;
}

async function updateApiKey(id: string, updates: Record<string, unknown>) {
  const client = getAdminClient();
  const { data, error } = await client
    .from("model_api_keys")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id, provider, key_name, is_active, usage_count, last_used_at")
    .single();
  if (error) throw error;
  return data;
}

async function deleteApiKey(id: string) {
  const client = getAdminClient();
  const { error } = await client.from("model_api_keys").delete().eq("id", id);
  if (error) throw error;
  return { success: true };
}

async function listRateLimits() {
  const client = getAdminClient();
  const { data, error } = await client
    .from("plan_rate_limits")
    .select("*, ai_models(name, provider)")
    .order("plan");
  if (error) throw error;
  return data;
}

async function upsertRateLimit(limitData: Record<string, unknown>) {
  const client = getAdminClient();
  const { data, error } = await client
    .from("plan_rate_limits")
    .upsert(limitData, { onConflict: "plan,model_id" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function listDefaultAgents() {
  const client = getAdminClient();
  const { data, error } = await client
    .from("default_agents")
    .select("*, ai_models(name, provider)")
    .order("sort_order");
  if (error) throw error;
  return data;
}

async function createDefaultAgent(agent: Record<string, unknown>) {
  const client = getAdminClient();
  const { data, error } = await client
    .from("default_agents")
    .insert(agent)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function updateDefaultAgent(id: string, updates: Record<string, unknown>) {
  const client = getAdminClient();
  const { data, error } = await client
    .from("default_agents")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deleteDefaultAgent(id: string) {
  const client = getAdminClient();
  const { error } = await client.from("default_agents").delete().eq("id", id);
  if (error) throw error;
  return { success: true };
}

async function listAllAgents(params: { page?: number; limit?: number; search?: string; userId?: string }) {
  const client = getAdminClient();
  const { page = 1, limit = 20, search, userId } = params;
  const offset = (page - 1) * limit;

  let query = client
    .from("agents")
    .select("*, profiles!agents_user_id_fkey(full_name, email:id)", { count: "exact" });

  if (search) query = query.ilike("name", `%${search}%`);
  if (userId) query = query.eq("user_id", userId);

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  const userIds = [...new Set(data?.map((a) => a.user_id) || [])];
  const { data: { users: authUsers } } = await client.auth.admin.listUsers();
  const emailMap = new Map(authUsers?.map((u) => [u.id, u.email]) || []);

  const enrichedData = data?.map((agent) => ({
    ...agent,
    owner_email: emailMap.get(agent.user_id) || null,
    owner_name: agent.profiles?.full_name || null,
  }));

  return {
    agents: enrichedData,
    pagination: { page, limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) },
  };
}

async function updateAgent(id: string, updates: Record<string, unknown>) {
  const client = getAdminClient();
  const { data, error } = await client
    .from("agents")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deleteAgent(id: string) {
  const client = getAdminClient();
  await client.from("swarm_agents").delete().eq("agent_id", id);
  await client.from("agent_tools").delete().eq("agent_id", id);
  const { error } = await client.from("agents").delete().eq("id", id);
  if (error) throw error;
  return { success: true };
}

async function duplicateAgent(id: string, newOwnerId?: string) {
  const client = getAdminClient();
  const { data: original, error: fetchError } = await client
    .from("agents")
    .select("*")
    .eq("id", id)
    .single();
  if (fetchError) throw fetchError;

  const { id: _, created_at, ...agentData } = original;
  const newAgent = {
    ...agentData,
    name: `${original.name} (Copy)`,
    user_id: newOwnerId || original.user_id,
  };

  const { data, error } = await client.from("agents").insert(newAgent).select().single();
  if (error) throw error;
  return data;
}

async function transferAgent(id: string, newOwnerId: string) {
  const client = getAdminClient();
  await client.from("swarm_agents").delete().eq("agent_id", id);
  const { data, error } = await client
    .from("agents")
    .update({ user_id: newOwnerId })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function listAllSwarms(params: { page?: number; limit?: number; search?: string; userId?: string; status?: string }) {
  const client = getAdminClient();
  const { page = 1, limit = 20, search, userId, status } = params;
  const offset = (page - 1) * limit;

  let query = client
    .from("swarms")
    .select("*, profiles!swarms_user_id_fkey(full_name)", { count: "exact" });

  if (search) query = query.ilike("name", `%${search}%`);
  if (userId) query = query.eq("user_id", userId);
  if (status) query = query.eq("status", status);

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  const swarmIds = data?.map((s) => s.id) || [];
  const userIds = [...new Set(data?.map((s) => s.user_id) || [])];

  const [agentCounts, messageCounts, authUsers] = await Promise.all([
    client.from("swarm_agents").select("swarm_id").in("swarm_id", swarmIds),
    client.from("messages").select("swarm_id").in("swarm_id", swarmIds),
    client.auth.admin.listUsers(),
  ]);

  const agentCountMap = new Map<string, number>();
  const messageCountMap = new Map<string, number>();
  const emailMap = new Map(authUsers.data?.users?.map((u) => [u.id, u.email]) || []);

  agentCounts.data?.forEach((a) => {
    agentCountMap.set(a.swarm_id, (agentCountMap.get(a.swarm_id) || 0) + 1);
  });
  messageCounts.data?.forEach((m) => {
    messageCountMap.set(m.swarm_id, (messageCountMap.get(m.swarm_id) || 0) + 1);
  });

  const enrichedData = data?.map((swarm) => ({
    ...swarm,
    owner_email: emailMap.get(swarm.user_id) || null,
    owner_name: swarm.profiles?.full_name || null,
    agent_count: agentCountMap.get(swarm.id) || 0,
    message_count: messageCountMap.get(swarm.id) || 0,
  }));

  return {
    swarms: enrichedData,
    pagination: { page, limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) },
  };
}

async function updateSwarm(id: string, updates: Record<string, unknown>) {
  const client = getAdminClient();
  const { data, error } = await client
    .from("swarms")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deleteSwarm(id: string) {
  const client = getAdminClient();
  await client.from("messages").delete().eq("swarm_id", id);
  await client.from("swarm_agents").delete().eq("swarm_id", id);
  await client.from("context_blocks").delete().eq("swarm_id", id);
  await client.from("swarm_tools").delete().eq("swarm_id", id);
  await client.from("swarm_shares").delete().eq("swarm_id", id);
  const { error } = await client.from("swarms").delete().eq("id", id);
  if (error) throw error;
  return { success: true };
}

async function duplicateSwarm(id: string, newOwnerId?: string) {
  const client = getAdminClient();
  const { data: original, error: fetchError } = await client
    .from("swarms")
    .select("*")
    .eq("id", id)
    .single();
  if (fetchError) throw fetchError;

  const { id: _, created_at, share_token, ...swarmData } = original;
  const newSwarm = {
    ...swarmData,
    name: `${original.name} (Copy)`,
    user_id: newOwnerId || original.user_id,
    share_token: null,
  };

  const { data, error } = await client.from("swarms").insert(newSwarm).select().single();
  if (error) throw error;
  return data;
}

async function transferSwarm(id: string, newOwnerId: string) {
  const client = getAdminClient();
  const { data, error } = await client
    .from("swarms")
    .update({ user_id: newOwnerId })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function getStats() {
  const client = getAdminClient();
  const [models, agents, swarms, defaultAgents] = await Promise.all([
    client.from("ai_models").select("id", { count: "exact" }),
    client.from("agents").select("id", { count: "exact" }),
    client.from("swarms").select("id", { count: "exact" }),
    client.from("default_agents").select("id", { count: "exact" }),
  ]);

  return {
    total_models: models.count || 0,
    total_agents: agents.count || 0,
    total_swarms: swarms.count || 0,
    total_default_agents: defaultAgents.count || 0,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    await verifyAdmin(req);
    const url = new URL(req.url);
    const resource = url.searchParams.get("resource") || "models";
    const action = url.searchParams.get("action") || "list";

    let result: unknown;

    if (resource === "stats") {
      result = await getStats();
    } else if (resource === "models") {
      switch (action) {
        case "list": result = await listModels(); break;
        case "create": result = await createModel(await req.json()); break;
        case "update": result = await updateModel(url.searchParams.get("id")!, await req.json()); break;
        case "delete": result = await deleteModel(url.searchParams.get("id")!); break;
        default: throw new Error(`Unknown action: ${action}`);
      }
    } else if (resource === "api-keys") {
      switch (action) {
        case "list": result = await listApiKeys(); break;
        case "create": result = await createApiKey(await req.json()); break;
        case "update": result = await updateApiKey(url.searchParams.get("id")!, await req.json()); break;
        case "delete": result = await deleteApiKey(url.searchParams.get("id")!); break;
        default: throw new Error(`Unknown action: ${action}`);
      }
    } else if (resource === "rate-limits") {
      switch (action) {
        case "list": result = await listRateLimits(); break;
        case "upsert": result = await upsertRateLimit(await req.json()); break;
        default: throw new Error(`Unknown action: ${action}`);
      }
    } else if (resource === "default-agents") {
      switch (action) {
        case "list": result = await listDefaultAgents(); break;
        case "create": result = await createDefaultAgent(await req.json()); break;
        case "update": result = await updateDefaultAgent(url.searchParams.get("id")!, await req.json()); break;
        case "delete": result = await deleteDefaultAgent(url.searchParams.get("id")!); break;
        default: throw new Error(`Unknown action: ${action}`);
      }
    } else if (resource === "agents") {
      switch (action) {
        case "list": result = await listAllAgents({
          page: parseInt(url.searchParams.get("page") || "1"),
          limit: parseInt(url.searchParams.get("limit") || "20"),
          search: url.searchParams.get("search") || undefined,
          userId: url.searchParams.get("userId") || undefined,
        }); break;
        case "update": result = await updateAgent(url.searchParams.get("id")!, await req.json()); break;
        case "delete": result = await deleteAgent(url.searchParams.get("id")!); break;
        case "duplicate": {
          const body = await req.json();
          result = await duplicateAgent(url.searchParams.get("id")!, body.newOwnerId);
          break;
        }
        case "transfer": {
          const body = await req.json();
          result = await transferAgent(url.searchParams.get("id")!, body.newOwnerId);
          break;
        }
        default: throw new Error(`Unknown action: ${action}`);
      }
    } else if (resource === "swarms") {
      switch (action) {
        case "list": result = await listAllSwarms({
          page: parseInt(url.searchParams.get("page") || "1"),
          limit: parseInt(url.searchParams.get("limit") || "20"),
          search: url.searchParams.get("search") || undefined,
          userId: url.searchParams.get("userId") || undefined,
          status: url.searchParams.get("status") || undefined,
        }); break;
        case "update": result = await updateSwarm(url.searchParams.get("id")!, await req.json()); break;
        case "delete": result = await deleteSwarm(url.searchParams.get("id")!); break;
        case "duplicate": {
          const body = await req.json();
          result = await duplicateSwarm(url.searchParams.get("id")!, body.newOwnerId);
          break;
        }
        case "transfer": {
          const body = await req.json();
          result = await transferSwarm(url.searchParams.get("id")!, body.newOwnerId);
          break;
        }
        default: throw new Error(`Unknown action: ${action}`);
      }
    } else {
      throw new Error(`Unknown resource: ${resource}`);
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.includes("Unauthorized") ? 401 :
                   message.includes("Admin access required") ? 403 : 500;
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});