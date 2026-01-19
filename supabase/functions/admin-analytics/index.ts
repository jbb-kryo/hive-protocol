import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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

function getDateRange(period: string): { start: Date; end: Date; interval: string } {
  const end = new Date();
  const start = new Date();
  let interval = 'day';
  
  switch (period) {
    case 'week':
      start.setDate(end.getDate() - 7);
      interval = 'day';
      break;
    case 'month':
      start.setDate(end.getDate() - 30);
      interval = 'day';
      break;
    case 'quarter':
      start.setDate(end.getDate() - 90);
      interval = 'week';
      break;
    case 'year':
      start.setFullYear(end.getFullYear() - 1);
      interval = 'month';
      break;
    default:
      start.setDate(end.getDate() - 30);
  }
  
  return { start, end, interval };
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function generateDateSeries(start: Date, end: Date, interval: string): string[] {
  const dates: string[] = [];
  const current = new Date(start);
  
  while (current <= end) {
    dates.push(formatDate(current));
    if (interval === 'day') {
      current.setDate(current.getDate() + 1);
    } else if (interval === 'week') {
      current.setDate(current.getDate() + 7);
    } else {
      current.setMonth(current.getMonth() + 1);
    }
  }
  
  return dates;
}

async function getMessagesOverTime(period: string) {
  const client = getAdminClient();
  const { start, end } = getDateRange(period);
  
  const { data: messages } = await client
    .from("messages")
    .select("created_at")
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString());
  
  const dateCounts: Record<string, number> = {};
  const dates = generateDateSeries(start, end, 'day');
  dates.forEach(d => dateCounts[d] = 0);
  
  messages?.forEach((msg) => {
    const date = formatDate(new Date(msg.created_at));
    if (dateCounts[date] !== undefined) {
      dateCounts[date]++;
    }
  });
  
  return Object.entries(dateCounts).map(([date, count]) => ({ date, count }));
}

async function getUserGrowth(period: string) {
  const client = getAdminClient();
  const { start, end } = getDateRange(period);
  
  const { data: profiles } = await client
    .from("profiles")
    .select("created_at")
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString());
  
  const dateCounts: Record<string, number> = {};
  const dates = generateDateSeries(start, end, 'day');
  dates.forEach(d => dateCounts[d] = 0);
  
  profiles?.forEach((p) => {
    const date = formatDate(new Date(p.created_at));
    if (dateCounts[date] !== undefined) {
      dateCounts[date]++;
    }
  });
  
  let cumulative = 0;
  const { data: existingCount } = await client
    .from("profiles")
    .select("id", { count: "exact" })
    .lt("created_at", start.toISOString());
  
  cumulative = existingCount?.length || 0;
  
  return Object.entries(dateCounts).map(([date, count]) => {
    cumulative += count;
    return { date, new_users: count, total_users: cumulative };
  });
}

async function getActiveUsers() {
  const client = getAdminClient();
  const now = new Date();
  
  const dayAgo = new Date(now);
  dayAgo.setDate(dayAgo.getDate() - 1);
  
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const monthAgo = new Date(now);
  monthAgo.setDate(monthAgo.getDate() - 30);
  
  const { data: dailyMessages } = await client
    .from("messages")
    .select("user_id")
    .gte("created_at", dayAgo.toISOString())
    .not("user_id", "is", null);
  
  const { data: weeklyMessages } = await client
    .from("messages")
    .select("user_id")
    .gte("created_at", weekAgo.toISOString())
    .not("user_id", "is", null);
  
  const { data: monthlyMessages } = await client
    .from("messages")
    .select("user_id")
    .gte("created_at", monthAgo.toISOString())
    .not("user_id", "is", null);
  
  const dau = new Set(dailyMessages?.map(m => m.user_id) || []).size;
  const wau = new Set(weeklyMessages?.map(m => m.user_id) || []).size;
  const mau = new Set(monthlyMessages?.map(m => m.user_id) || []).size;
  
  const { count: totalUsers } = await client
    .from("profiles")
    .select("id", { count: "exact" });
  
  return {
    dau,
    wau,
    mau,
    total_users: totalUsers || 0,
    dau_percentage: totalUsers ? Math.round((dau / totalUsers) * 100) : 0,
    wau_percentage: totalUsers ? Math.round((wau / totalUsers) * 100) : 0,
    mau_percentage: totalUsers ? Math.round((mau / totalUsers) * 100) : 0,
  };
}

async function getFrameworkUsage() {
  const client = getAdminClient();
  
  const { data: agents } = await client
    .from("agents")
    .select("framework");
  
  const frameworkCounts: Record<string, number> = {};
  
  agents?.forEach((agent) => {
    const fw = agent.framework || 'custom';
    frameworkCounts[fw] = (frameworkCounts[fw] || 0) + 1;
  });
  
  const total = agents?.length || 0;
  
  return Object.entries(frameworkCounts)
    .map(([framework, count]) => ({
      framework,
      count,
      percentage: total ? Math.round((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

async function getTopSwarms(limit: number = 10) {
  const client = getAdminClient();
  
  const { data: swarms } = await client
    .from("swarms")
    .select("id, name, user_id, created_at, profiles!swarms_user_id_fkey(full_name)");
  
  if (!swarms || swarms.length === 0) return [];
  
  const swarmIds = swarms.map(s => s.id);
  
  const { data: messages } = await client
    .from("messages")
    .select("swarm_id, created_at")
    .in("swarm_id", swarmIds);
  
  const { data: agents } = await client
    .from("swarm_agents")
    .select("swarm_id")
    .in("swarm_id", swarmIds);
  
  const messageCounts: Record<string, number> = {};
  const recentActivity: Record<string, string> = {};
  const agentCounts: Record<string, number> = {};
  
  messages?.forEach((m) => {
    messageCounts[m.swarm_id] = (messageCounts[m.swarm_id] || 0) + 1;
    if (!recentActivity[m.swarm_id] || m.created_at > recentActivity[m.swarm_id]) {
      recentActivity[m.swarm_id] = m.created_at;
    }
  });
  
  agents?.forEach((a) => {
    agentCounts[a.swarm_id] = (agentCounts[a.swarm_id] || 0) + 1;
  });
  
  return swarms
    .map((swarm) => ({
      id: swarm.id,
      name: swarm.name,
      owner_name: (swarm.profiles as any)?.full_name || 'Unknown',
      message_count: messageCounts[swarm.id] || 0,
      agent_count: agentCounts[swarm.id] || 0,
      last_activity: recentActivity[swarm.id] || swarm.created_at,
    }))
    .sort((a, b) => b.message_count - a.message_count)
    .slice(0, limit);
}

async function getPlanDistribution() {
  const client = getAdminClient();
  
  const { data: profiles } = await client
    .from("profiles")
    .select("plan");
  
  const planCounts: Record<string, number> = { free: 0, pro: 0, enterprise: 0 };
  
  profiles?.forEach((p) => {
    const plan = p.plan || 'free';
    planCounts[plan] = (planCounts[plan] || 0) + 1;
  });
  
  const total = profiles?.length || 0;
  
  return Object.entries(planCounts).map(([plan, count]) => ({
    plan,
    count,
    percentage: total ? Math.round((count / total) * 100) : 0,
  }));
}

async function getOverviewStats() {
  const client = getAdminClient();
  const now = new Date();
  const dayAgo = new Date(now);
  dayAgo.setDate(dayAgo.getDate() - 1);
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const [users, swarms, agents, messages, todayMessages, weekMessages] = await Promise.all([
    client.from("profiles").select("id", { count: "exact" }),
    client.from("swarms").select("id", { count: "exact" }),
    client.from("agents").select("id", { count: "exact" }),
    client.from("messages").select("id", { count: "exact" }),
    client.from("messages").select("id", { count: "exact" }).gte("created_at", dayAgo.toISOString()),
    client.from("messages").select("id", { count: "exact" }).gte("created_at", weekAgo.toISOString()),
  ]);
  
  return {
    total_users: users.count || 0,
    total_swarms: swarms.count || 0,
    total_agents: agents.count || 0,
    total_messages: messages.count || 0,
    messages_today: todayMessages.count || 0,
    messages_this_week: weekMessages.count || 0,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    await verifyAdmin(req);
    const url = new URL(req.url);
    const metric = url.searchParams.get("metric") || "overview";
    const period = url.searchParams.get("period") || "month";

    let result: unknown;

    switch (metric) {
      case "overview":
        result = await getOverviewStats();
        break;
      case "messages":
        result = await getMessagesOverTime(period);
        break;
      case "user-growth":
        result = await getUserGrowth(period);
        break;
      case "active-users":
        result = await getActiveUsers();
        break;
      case "framework-usage":
        result = await getFrameworkUsage();
        break;
      case "top-swarms":
        result = await getTopSwarms(parseInt(url.searchParams.get("limit") || "10"));
        break;
      case "plan-distribution":
        result = await getPlanDistribution();
        break;
      default:
        throw new Error(`Unknown metric: ${metric}`);
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