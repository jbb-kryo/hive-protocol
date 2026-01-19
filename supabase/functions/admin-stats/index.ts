import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const CACHE_TTL = {
  SHORT: 30 * 1000,
  MEDIUM: 5 * 60 * 1000,
  LONG: 30 * 60 * 1000,
} as const;

const TIMEOUTS = {
  DATABASE: 15000,
} as const;

interface CacheEntry<T> { value: T; expiresAt: number; }
class MemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) { this.cache.delete(key); return null; }
    return entry.value;
  }
  set<T>(key: string, value: T, ttlMs: number): void {
    if (this.cache.size >= 100) { const firstKey = this.cache.keys().next().value; if (firstKey) this.cache.delete(firstKey); }
    this.cache.set(key, { value, expiresAt: Date.now() + ttlMs });
  }
}
const cache = new MemoryCache();

async function withCache<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const cached = cache.get<T>(key);
  if (cached !== null) return cached;
  const result = await fn();
  cache.set(key, result, ttlMs);
  return result;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage = "Operation timed out"): Promise<T> {
  let timeoutId: number | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
  });
  try { return await Promise.race([promise, timeoutPromise]); } finally { if (timeoutId !== undefined) clearTimeout(timeoutId); }
}

function logError(error: unknown, context: Record<string, unknown>) {
  const errorId = `err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  let message = "Unknown error"; let httpStatus = 500;
  if (error instanceof Error) { message = error.message; } else if (typeof error === "string") { message = error; }
  console.error(JSON.stringify({ level: "error", error_id: errorId, message, context }));
  return { error_id: errorId, message, http_status: httpStatus };
}

function handleOptionsRequest() {
  return new Response(null, { status: 200, headers: corsHeaders });
}

function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

async function verifyAdmin(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) throw new Error("Missing authorization header");
  const supabaseClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", { global: { headers: { Authorization: authHeader } } });
  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
  if (userError || !user) throw new Error("Unauthorized");
  const { data: profile } = await supabaseClient.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!profile || profile.role !== "admin") throw new Error("Admin access required");
  return user;
}

function getAdminClient() {
  return createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return handleOptionsRequest();
  const requestId = generateRequestId();
  try {
    await verifyAdmin(req);
    const adminClient = getAdminClient();
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "all";
    const noCache = url.searchParams.get("no_cache") === "true";
    let result: Record<string, unknown> = {};
    if (action === "all" || action === "stats") {
      const cacheKey = "admin_stats_platform";
      const stats = noCache
        ? await withTimeout(adminClient.rpc("get_platform_stats"), TIMEOUTS.DATABASE, "Stats query timed out")
        : await withCache(cacheKey, CACHE_TTL.SHORT, async () => {
            const { data, error } = await withTimeout(adminClient.rpc("get_platform_stats"), TIMEOUTS.DATABASE, "Stats query timed out");
            if (error) throw error;
            return data;
          });
      if (!noCache) { result.stats = stats; } else { const { data, error } = stats as { data: unknown; error: unknown }; if (error) throw error; result.stats = data; }
    }
    if (action === "all" || action === "growth") {
      const cacheKey = "admin_stats_growth";
      const growth = noCache
        ? await withTimeout(adminClient.rpc("get_user_growth_data", { months_back: 6 }), TIMEOUTS.DATABASE, "Growth query timed out")
        : await withCache(cacheKey, CACHE_TTL.MEDIUM, async () => {
            const { data, error } = await withTimeout(adminClient.rpc("get_user_growth_data", { months_back: 6 }), TIMEOUTS.DATABASE, "Growth query timed out");
            if (error) throw error;
            return data;
          });
      if (!noCache) { result.userGrowth = growth; } else { const { data, error } = growth as { data: unknown; error: unknown }; if (error) throw error; result.userGrowth = data; }
    }
    if (action === "all" || action === "frameworks") {
      const cacheKey = "admin_stats_frameworks";
      const frameworks = noCache
        ? await withTimeout(adminClient.rpc("get_framework_usage"), TIMEOUTS.DATABASE, "Frameworks query timed out")
        : await withCache(cacheKey, CACHE_TTL.MEDIUM, async () => {
            const { data, error } = await withTimeout(adminClient.rpc("get_framework_usage"), TIMEOUTS.DATABASE, "Frameworks query timed out");
            if (error) throw error;
            return data;
          });
      if (!noCache) { result.frameworkUsage = frameworks; } else { const { data, error } = frameworks as { data: unknown; error: unknown }; if (error) throw error; result.frameworkUsage = data; }
    }
    if (action === "all" || action === "recent") {
      const { data: recent, error: recentError } = await withTimeout(adminClient.rpc("get_recent_signups", { limit_count: 10 }), TIMEOUTS.DATABASE, "Recent signups query timed out");
      if (recentError) throw recentError;
      result.recentSignups = recent;
    }
    if (action === "all" || action === "messages") {
      const cacheKey = "admin_stats_messages";
      const messages = noCache
        ? await withTimeout(adminClient.rpc("get_daily_message_stats", { days_back: 30 }), TIMEOUTS.DATABASE, "Messages query timed out")
        : await withCache(cacheKey, CACHE_TTL.SHORT, async () => {
            const { data, error } = await withTimeout(adminClient.rpc("get_daily_message_stats", { days_back: 30 }), TIMEOUTS.DATABASE, "Messages query timed out");
            if (error) throw error;
            return data;
          });
      if (!noCache) { result.dailyMessages = messages; } else { const { data, error } = messages as { data: unknown; error: unknown }; if (error) throw error; result.dailyMessages = data; }
    }
    if (action === "all" || action === "plans") {
      const cacheKey = "admin_stats_plans";
      const plans = noCache
        ? await withTimeout(adminClient.rpc("get_plan_distribution"), TIMEOUTS.DATABASE, "Plans query timed out")
        : await withCache(cacheKey, CACHE_TTL.MEDIUM, async () => {
            const { data, error } = await withTimeout(adminClient.rpc("get_plan_distribution"), TIMEOUTS.DATABASE, "Plans query timed out");
            if (error) throw error;
            return data;
          });
      if (!noCache) { result.planDistribution = plans; } else { const { data, error } = plans as { data: unknown; error: unknown }; if (error) throw error; result.planDistribution = data; }
    }
    return new Response(JSON.stringify(result), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json", "X-Request-Id": requestId, "Cache-Control": noCache ? "no-store" : "max-age=30" } });
  } catch (error) {
    const structuredError = logError(error, { function_name: "admin-stats", request_id: requestId });
    const status = structuredError.message.includes("Unauthorized") ? 401 : structuredError.message.includes("Admin access required") ? 403 : 500;
    return new Response(JSON.stringify({ error: structuredError.message, error_id: structuredError.error_id }), { status, headers: { ...corsHeaders, "Content-Type": "application/json", "X-Request-Id": requestId } });
  }
});