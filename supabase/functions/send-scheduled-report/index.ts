import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ScheduledReport {
  id: string;
  user_id: string;
  name: string;
  report_type: string;
  frequency: string;
  email_recipients: string[];
  include_charts: boolean;
  date_range_days: number;
}

interface ReportData {
  totalConversations: number;
  successRate: number;
  avgResponseTime: number;
  totalCost: number;
  avgSatisfaction: number;
  agentPerformance: Array<{
    agent_name: string;
    total_conversations: number;
    success_rate: number;
    total_cost: number;
  }>;
  dailyTrend: Array<{
    date: string;
    conversations: number;
    cost: number;
  }>;
}

async function generateReportData(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  dateRangeDays: number
): Promise<ReportData> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - dateRangeDays);

  const { data: agents } = await supabase
    .from("agents")
    .select("id, name")
    .eq("user_id", userId);

  const agentIds = agents?.map((a) => a.id) || [];

  if (agentIds.length === 0) {
    return {
      totalConversations: 0,
      successRate: 0,
      avgResponseTime: 0,
      totalCost: 0,
      avgSatisfaction: 0,
      agentPerformance: [],
      dailyTrend: [],
    };
  }

  const { data: metrics } = await supabase
    .from("agent_conversation_metrics")
    .select("*")
    .in("agent_id", agentIds)
    .gte("conversation_start", startDate.toISOString());

  let totalConversations = 0;
  let successfulConversations = 0;
  let totalResponseTime = 0;
  let totalCost = 0;
  let satisfactionSum = 0;
  let satisfactionCount = 0;

  const agentStats: Record<string, { name: string; conversations: number; successful: number; cost: number }> = {};
  const dailyStats: Record<string, { conversations: number; cost: number }> = {};

  if (metrics) {
    metrics.forEach((m) => {
      totalConversations++;
      if (m.success_status === "success") successfulConversations++;
      totalResponseTime += m.avg_response_time_ms || 0;
      totalCost += parseFloat(m.total_cost_usd) || 0;

      if (m.satisfaction_rating) {
        satisfactionSum += m.satisfaction_rating;
        satisfactionCount++;
      }

      const agent = agents?.find((a) => a.id === m.agent_id);
      if (agent) {
        if (!agentStats[m.agent_id]) {
          agentStats[m.agent_id] = { name: agent.name, conversations: 0, successful: 0, cost: 0 };
        }
        agentStats[m.agent_id].conversations++;
        if (m.success_status === "success") agentStats[m.agent_id].successful++;
        agentStats[m.agent_id].cost += parseFloat(m.total_cost_usd) || 0;
      }

      const date = new Date(m.conversation_start).toISOString().split("T")[0];
      if (!dailyStats[date]) {
        dailyStats[date] = { conversations: 0, cost: 0 };
      }
      dailyStats[date].conversations++;
      dailyStats[date].cost += parseFloat(m.total_cost_usd) || 0;
    });
  }

  return {
    totalConversations,
    successRate: totalConversations > 0 ? (successfulConversations / totalConversations) * 100 : 0,
    avgResponseTime: totalConversations > 0 ? totalResponseTime / totalConversations : 0,
    totalCost,
    avgSatisfaction: satisfactionCount > 0 ? satisfactionSum / satisfactionCount : 0,
    agentPerformance: Object.values(agentStats).map((a) => ({
      agent_name: a.name,
      total_conversations: a.conversations,
      success_rate: a.conversations > 0 ? (a.successful / a.conversations) * 100 : 0,
      total_cost: a.cost,
    })),
    dailyTrend: Object.entries(dailyStats).map(([date, data]) => ({
      date,
      conversations: data.conversations,
      cost: data.cost,
    })).sort((a, b) => a.date.localeCompare(b.date)),
  };
}

function generateEmailHTML(report: ScheduledReport, data: ReportData): string {
  const formatCurrency = (num: number) => `$${num.toFixed(2)}`;
  const formatNumber = (num: number) => num.toLocaleString();
  const formatPercent = (num: number) => `${num.toFixed(1)}%`;
  const formatDuration = (ms: number) => ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${report.name}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0066cc, #004499); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .header p { margin: 10px 0 0; opacity: 0.9; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
    .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 30px; }
    .stat-card { background: white; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .stat-value { font-size: 28px; font-weight: bold; color: #0066cc; }
    .stat-label { font-size: 12px; color: #666; text-transform: uppercase; margin-top: 5px; }
    .section { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .section h2 { margin: 0 0 15px; font-size: 16px; color: #333; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #eee; }
    th { font-weight: 600; color: #666; font-size: 12px; text-transform: uppercase; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
    .footer a { color: #0066cc; text-decoration: none; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${report.name}</h1>
    <p>Analytics Report - Last ${report.date_range_days} Days</p>
  </div>
  <div class="content">
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${formatNumber(data.totalConversations)}</div>
        <div class="stat-label">Total Conversations</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${formatPercent(data.successRate)}</div>
        <div class="stat-label">Success Rate</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${formatDuration(data.avgResponseTime)}</div>
        <div class="stat-label">Avg Response Time</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${formatCurrency(data.totalCost)}</div>
        <div class="stat-label">Total Cost</div>
      </div>
    </div>

    ${data.agentPerformance.length > 0 ? `
    <div class="section">
      <h2>Agent Performance</h2>
      <table>
        <thead>
          <tr>
            <th>Agent</th>
            <th>Conversations</th>
            <th>Success Rate</th>
            <th>Cost</th>
          </tr>
        </thead>
        <tbody>
          ${data.agentPerformance.map(agent => `
          <tr>
            <td>${agent.agent_name}</td>
            <td>${formatNumber(agent.total_conversations)}</td>
            <td>${formatPercent(agent.success_rate)}</td>
            <td>${formatCurrency(agent.total_cost)}</td>
          </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}

    <div class="section">
      <h2>Summary</h2>
      <p>This report covers the period from ${new Date(Date.now() - report.date_range_days * 24 * 60 * 60 * 1000).toLocaleDateString()} to ${new Date().toLocaleDateString()}.</p>
      ${data.avgSatisfaction > 0 ? `<p>Average user satisfaction rating: ${data.avgSatisfaction.toFixed(1)}/5</p>` : ''}
    </div>

    <div class="footer">
      <p>This is an automated report from HIVE Analytics.</p>
      <p><a href="https://hive-protocol.online/dashboard/analytics">View full analytics dashboard</a></p>
    </div>
  </div>
</body>
</html>
  `.trim();
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

    const now = new Date();

    const { data: dueReports, error: fetchError } = await supabaseClient
      .from("scheduled_reports")
      .select("*")
      .eq("is_active", true)
      .or(`next_scheduled_at.lte.${now.toISOString()},next_scheduled_at.is.null`);

    if (fetchError) {
      console.error("Error fetching reports:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch scheduled reports" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const results: Array<{ report_id: string; status: string; error?: string }> = [];

    for (const report of dueReports || []) {
      try {
        const reportData = await generateReportData(
          supabaseClient,
          report.user_id,
          report.date_range_days
        );

        const emailHTML = generateEmailHTML(report, reportData);

        console.log(`Generated report for ${report.name}, sending to ${report.email_recipients.length} recipients`);

        let nextScheduledAt: Date;
        switch (report.frequency) {
          case "daily":
            nextScheduledAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            break;
          case "weekly":
            nextScheduledAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            break;
          case "monthly":
            nextScheduledAt = new Date(now);
            nextScheduledAt.setMonth(nextScheduledAt.getMonth() + 1);
            break;
          default:
            nextScheduledAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        }

        await supabaseClient
          .from("scheduled_reports")
          .update({
            last_sent_at: now.toISOString(),
            next_scheduled_at: nextScheduledAt.toISOString(),
          })
          .eq("id", report.id);

        await supabaseClient.from("report_history").insert({
          scheduled_report_id: report.id,
          user_id: report.user_id,
          sent_at: now.toISOString(),
          status: "success",
          recipients_count: report.email_recipients.length,
          report_data: reportData,
        });

        results.push({ report_id: report.id, status: "success" });
      } catch (error) {
        console.error(`Error processing report ${report.id}:`, error);

        await supabaseClient.from("report_history").insert({
          scheduled_report_id: report.id,
          user_id: report.user_id,
          sent_at: now.toISOString(),
          status: "failed",
          error_message: error instanceof Error ? error.message : "Unknown error",
          recipients_count: 0,
          report_data: {},
        });

        results.push({
          report_id: report.id,
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Scheduled report function error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
