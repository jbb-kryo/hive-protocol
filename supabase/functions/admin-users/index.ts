import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  plan?: string;
  role?: string;
  suspended?: boolean;
  sortBy?: string;
  sortOrder?: string;
}

interface UpdateUserParams {
  userId: string;
  plan?: string;
  role?: string;
  suspended?: boolean;
  suspendedReason?: string;
}

interface AuditLogEntry {
  admin_user_id: string;
  action: string;
  target_type: string;
  target_id: string;
  details: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
}

async function logAdminAction(entry: AuditLogEntry) {
  const adminClient = getAdminClient();

  try {
    await adminClient.from("admin_audit_log").insert({
      admin_user_id: entry.admin_user_id,
      action: entry.action,
      target_type: entry.target_type,
      target_id: entry.target_id,
      details: entry.details,
      ip_address: entry.ip_address || null,
      user_agent: entry.user_agent || null,
    });
  } catch (error) {
    console.error("Failed to log admin action:", error);
  }
}

function getClientInfo(req: Request): { ipAddress?: string; userAgent?: string } {
  const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
                    req.headers.get("x-real-ip") ||
                    undefined;
  const userAgent = req.headers.get("user-agent") || undefined;
  return { ipAddress, userAgent };
}

async function verifyAdmin(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    throw new Error("Missing authorization header");
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
  if (userError || !user) {
    throw new Error("Unauthorized");
  }

  const { data: profile, error: profileError } = await supabaseClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile || profile.role !== "admin") {
    throw new Error("Admin access required");
  }

  return user;
}

function getAdminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );
}

async function listUsers(params: UserListParams) {
  const adminClient = getAdminClient();
  const {
    page = 1,
    limit = 20,
    search = "",
    plan,
    role,
    suspended,
    sortBy = "created_at",
    sortOrder = "desc",
  } = params;

  const offset = (page - 1) * limit;

  let query = adminClient
    .from("profiles")
    .select(`
      id,
      full_name,
      avatar_url,
      plan,
      role,
      suspended,
      suspended_at,
      suspended_reason,
      onboarding_complete,
      totp_enabled,
      created_at,
      updated_at
    `, { count: "exact" });

  if (search) {
    const sanitizedSearch = search
      .replace(/[%_\\]/g, '\\$&')
      .replace(/['"`';()]/g, '');
    query = query.ilike('full_name', `%${sanitizedSearch}%`);
  }

  if (plan) {
    query = query.eq("plan", plan);
  }

  if (role) {
    query = query.eq("role", role);
  }

  if (suspended !== undefined) {
    query = query.eq("suspended", suspended);
  }

  const ascending = sortOrder === "asc";
  query = query.order(sortBy, { ascending });
  query = query.range(offset, offset + limit - 1);

  const { data: profiles, error: profilesError, count } = await query;

  if (profilesError) throw profilesError;

  const userIds = profiles?.map((p) => p.id) || [];
  
  let usersWithEmail = profiles || [];
  
  if (userIds.length > 0) {
    const { data: { users: authUsers }, error: authError } = await adminClient.auth.admin.listUsers();
    
    if (!authError && authUsers) {
      const emailMap = new Map(authUsers.map((u) => [u.id, u.email]));
      usersWithEmail = profiles?.map((p) => ({
        ...p,
        email: emailMap.get(p.id) || null,
      })) || [];
    }
  }

  const { data: agentCounts } = await adminClient
    .from("agents")
    .select("user_id")
    .in("user_id", userIds);

  const { data: swarmCounts } = await adminClient
    .from("swarms")
    .select("user_id")
    .in("user_id", userIds);

  const agentCountMap = new Map<string, number>();
  const swarmCountMap = new Map<string, number>();

  agentCounts?.forEach((a) => {
    agentCountMap.set(a.user_id, (agentCountMap.get(a.user_id) || 0) + 1);
  });

  swarmCounts?.forEach((s) => {
    swarmCountMap.set(s.user_id, (swarmCountMap.get(s.user_id) || 0) + 1);
  });

  const enrichedUsers = usersWithEmail.map((user) => ({
    ...user,
    agent_count: agentCountMap.get(user.id) || 0,
    swarm_count: swarmCountMap.get(user.id) || 0,
  }));

  return {
    users: enrichedUsers,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  };
}

async function getUserDetails(userId: string) {
  const adminClient = getAdminClient();

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) throw profileError;
  if (!profile) throw new Error("User not found");

  const { data: { users: authUsers } } = await adminClient.auth.admin.listUsers();
  const authUser = authUsers?.find((u) => u.id === userId);

  const { data: agents } = await adminClient
    .from("agents")
    .select("id, name, framework, model, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const { data: swarms } = await adminClient
    .from("swarms")
    .select("id, name, status, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const { data: activity } = await adminClient
    .from("activity_log")
    .select("id, activity_type, title, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  return {
    ...profile,
    email: authUser?.email || null,
    email_confirmed_at: authUser?.email_confirmed_at || null,
    last_sign_in_at: authUser?.last_sign_in_at || null,
    agents: agents || [],
    swarms: swarms || [],
    recent_activity: activity || [],
  };
}

async function updateUser(
  adminUserId: string,
  params: UpdateUserParams,
  clientInfo: { ipAddress?: string; userAgent?: string }
) {
  const adminClient = getAdminClient();
  const { userId, plan, role, suspended, suspendedReason } = params;

  const { data: existingProfile } = await adminClient
    .from("profiles")
    .select("plan, role, suspended")
    .eq("id", userId)
    .maybeSingle();

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  const changes: Record<string, { from: unknown; to: unknown }> = {};

  if (plan !== undefined && plan !== existingProfile?.plan) {
    updates.plan = plan;
    changes.plan = { from: existingProfile?.plan, to: plan };
  }

  if (role !== undefined && role !== existingProfile?.role) {
    updates.role = role;
    changes.role = { from: existingProfile?.role, to: role };
  }

  if (suspended !== undefined) {
    updates.suspended = suspended;
    if (suspended) {
      updates.suspended_at = new Date().toISOString();
      updates.suspended_by = adminUserId;
      updates.suspended_reason = suspendedReason || null;
      if (!existingProfile?.suspended) {
        changes.suspended = { from: false, to: true };
      }
    } else {
      updates.suspended_at = null;
      updates.suspended_by = null;
      updates.suspended_reason = null;
      if (existingProfile?.suspended) {
        changes.suspended = { from: true, to: false };
      }
    }
  }

  const { data, error } = await adminClient
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("User not found");

  let action = "user.update";
  if (changes.suspended) {
    action = suspended ? "user.suspend" : "user.unsuspend";
  } else if (changes.role) {
    action = "user.role_change";
  } else if (changes.plan) {
    action = "user.plan_change";
  }

  await logAdminAction({
    admin_user_id: adminUserId,
    action,
    target_type: "user",
    target_id: userId,
    details: {
      changes,
      suspended_reason: suspendedReason || null,
    },
    ip_address: clientInfo.ipAddress,
    user_agent: clientInfo.userAgent,
  });

  return data;
}

async function deleteUser(
  adminUserId: string,
  userId: string,
  clientInfo: { ipAddress?: string; userAgent?: string }
) {
  const adminClient = getAdminClient();

  const { data: profile } = await adminClient
    .from("profiles")
    .select("role, full_name")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.role === "admin") {
    throw new Error("Cannot delete admin users");
  }

  const { error } = await adminClient.auth.admin.deleteUser(userId);
  if (error) throw error;

  await logAdminAction({
    admin_user_id: adminUserId,
    action: "user.delete",
    target_type: "user",
    target_id: userId,
    details: {
      deleted_user_name: profile?.full_name || "Unknown",
    },
    ip_address: clientInfo.ipAddress,
    user_agent: clientInfo.userAgent,
  });

  return { success: true };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const adminUser = await verifyAdmin(req);
    const clientInfo = getClientInfo(req);
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "list";

    let result: unknown;

    switch (action) {
      case "list": {
        const params: UserListParams = {
          page: parseInt(url.searchParams.get("page") || "1"),
          limit: parseInt(url.searchParams.get("limit") || "20"),
          search: url.searchParams.get("search") || "",
          plan: url.searchParams.get("plan") || undefined,
          role: url.searchParams.get("role") || undefined,
          suspended: url.searchParams.get("suspended") === "true" ? true :
                     url.searchParams.get("suspended") === "false" ? false : undefined,
          sortBy: url.searchParams.get("sortBy") || "created_at",
          sortOrder: url.searchParams.get("sortOrder") || "desc",
        };
        result = await listUsers(params);
        break;
      }

      case "details": {
        const userId = url.searchParams.get("userId");
        if (!userId) throw new Error("userId is required");
        result = await getUserDetails(userId);
        break;
      }

      case "update": {
        if (req.method !== "POST") throw new Error("POST method required");
        const body = await req.json();
        result = await updateUser(adminUser.id, body, clientInfo);
        break;
      }

      case "delete": {
        if (req.method !== "POST") throw new Error("POST method required");
        const body = await req.json();
        if (!body.userId) throw new Error("userId is required");
        result = await deleteUser(adminUser.id, body.userId, clientInfo);
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.includes("Unauthorized") ? 401 :
                   message.includes("Admin access required") ? 403 :
                   message.includes("not found") ? 404 : 500;

    return new Response(
      JSON.stringify({ error: message }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});