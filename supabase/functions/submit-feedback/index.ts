import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface FeedbackPayload {
  type: "bug" | "feature" | "question" | "other";
  subject: string;
  message: string;
  screenshot_url?: string;
  page_url?: string;
  user_agent?: string;
  metadata?: Record<string, unknown>;
}

interface NPSPayload {
  score: number;
  comment?: string;
  trigger?: string;
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

    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    let userEmail: string | null = null;

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabaseClient.auth.getUser(token);
      userId = user?.id ?? null;
      userEmail = user?.email ?? null;
    }

    const url = new URL(req.url);
    const path = url.pathname.split("/").pop();

    if (req.method === "POST" && path === "feedback") {
      const payload: FeedbackPayload = await req.json();

      if (!payload.type || !payload.subject || !payload.message) {
        return new Response(
          JSON.stringify({ error: "Missing required fields" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const validTypes = ["bug", "feature", "question", "other"];
      if (!validTypes.includes(payload.type)) {
        return new Response(
          JSON.stringify({ error: "Invalid feedback type" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const { data: feedback, error: feedbackError } = await supabaseClient
        .from("feedback")
        .insert({
          user_id: userId,
          type: payload.type,
          subject: payload.subject.substring(0, 200),
          message: payload.message.substring(0, 5000),
          screenshot_url: payload.screenshot_url,
          page_url: payload.page_url,
          user_agent: payload.user_agent,
          metadata: payload.metadata || {},
        })
        .select()
        .single();

      if (feedbackError) {
        console.error("Feedback insert error:", feedbackError);
        return new Response(
          JSON.stringify({ error: "Failed to submit feedback" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (userEmail) {
        try {
          await supabaseClient.from("email_queue").insert({
            to_email: userEmail,
            subject: `Feedback Received: ${payload.subject}`,
            template: "feedback_confirmation",
            data: {
              feedback_id: feedback.id,
              type: payload.type,
              subject: payload.subject,
            },
          });
        } catch {
          // Email queue may not exist, skip silently
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          feedback_id: feedback.id,
          message: "Thank you for your feedback!",
        }),
        {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (req.method === "POST" && path === "nps") {
      if (!userId) {
        return new Response(
          JSON.stringify({ error: "Authentication required" }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const payload: NPSPayload = await req.json();

      if (payload.score === undefined || payload.score < 0 || payload.score > 10) {
        return new Response(
          JSON.stringify({ error: "Invalid NPS score (must be 0-10)" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const { data: nps, error: npsError } = await supabaseClient
        .from("nps_responses")
        .insert({
          user_id: userId,
          score: payload.score,
          comment: payload.comment?.substring(0, 1000),
          trigger: payload.trigger || "widget",
        })
        .select()
        .single();

      if (npsError) {
        console.error("NPS insert error:", npsError);
        return new Response(
          JSON.stringify({ error: "Failed to submit NPS response" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          nps_id: nps.id,
          message: "Thank you for your feedback!",
        }),
        {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (req.method === "GET" && path === "stats") {
      if (!userId) {
        return new Response(
          JSON.stringify({ error: "Authentication required" }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      if (profile?.role !== "admin") {
        return new Response(
          JSON.stringify({ error: "Admin access required" }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const { data: feedbackStats } = await supabaseClient
        .from("feedback")
        .select("status, type");

      const { data: npsStats } = await supabaseClient
        .from("nps_responses")
        .select("score");

      const stats = {
        feedback: {
          total: feedbackStats?.length || 0,
          byStatus: feedbackStats?.reduce((acc, f) => {
            acc[f.status] = (acc[f.status] || 0) + 1;
            return acc;
          }, {} as Record<string, number>) || {},
          byType: feedbackStats?.reduce((acc, f) => {
            acc[f.type] = (acc[f.type] || 0) + 1;
            return acc;
          }, {} as Record<string, number>) || {},
        },
        nps: {
          total: npsStats?.length || 0,
          average: npsStats?.length
            ? npsStats.reduce((sum, r) => sum + r.score, 0) / npsStats.length
            : 0,
          promoters: npsStats?.filter((r) => r.score >= 9).length || 0,
          passives: npsStats?.filter((r) => r.score >= 7 && r.score <= 8).length || 0,
          detractors: npsStats?.filter((r) => r.score <= 6).length || 0,
        },
      };

      const npsScore = stats.nps.total > 0
        ? Math.round(((stats.nps.promoters - stats.nps.detractors) / stats.nps.total) * 100)
        : 0;

      return new Response(
        JSON.stringify({ ...stats, nps: { ...stats.nps, score: npsScore } }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: "Not found" }),
      {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Feedback function error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
