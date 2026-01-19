'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  useAgentAnalytics,
  useAgentCosts,
  useAgentRecommendations,
  useSatisfactionRatings,
} from '@/hooks/use-agent-analytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Clock,
  CheckCircle,
  Star,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Zap,
  Target,
  BarChart3,
  ArrowLeft,
  ThumbsUp,
  MessageSquare,
  Lightbulb,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format, subDays } from 'date-fns';

interface Agent {
  id: string;
  name: string;
  system_prompt: string;
  model: string;
}

export default function AgentAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.id as string;

  const [agent, setAgent] = useState<Agent | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [dateRange, setDateRange] = useState({
    start: subDays(new Date(), 30),
    end: new Date(),
  });

  const { metrics, snapshots, summary, loading } = useAgentAnalytics(agentId, dateRange);
  const { costs, costByModel, costByProvider } = useAgentCosts(agentId, dateRange);
  const { recommendations, acknowledgeRecommendation, dismissRecommendation, markImplemented } =
    useAgentRecommendations(agentId);
  const { ratings, avgRating, ratingDistribution, recommendationRate } =
    useSatisfactionRatings(agentId);

  useEffect(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    setDateRange({
      start: subDays(new Date(), days),
      end: new Date(),
    });
  }, [timeRange]);

  useEffect(() => {
    const fetchAgent = async () => {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('id', agentId)
        .single();

      if (error) {
        console.error('Error fetching agent:', error);
        router.push('/agents');
        return;
      }

      setAgent(data);
    };

    fetchAgent();
  }, [agentId, router]);

  if (loading || !agent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
        <Skeleton className="h-12 w-64 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const chartData = snapshots.map((snapshot) => ({
    date: snapshot.snapshot_date,
    conversations: snapshot.total_conversations,
    successRate: snapshot.successful_conversations / Math.max(snapshot.total_conversations, 1) * 100,
    avgResponseTime: snapshot.avg_response_time_ms,
    cost: Number(snapshot.total_cost_usd),
    satisfaction: Number(snapshot.avg_satisfaction_rating),
  })).reverse();

  const costData = Object.entries(costByModel).map(([model, cost]) => ({
    name: model,
    value: cost,
  }));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Button
            variant="ghost"
            onClick={() => router.push('/agents')}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Agents
          </Button>

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">{agent.name} Analytics</h1>
              <p className="text-slate-600 dark:text-slate-400">
                Comprehensive performance insights and metrics
              </p>
            </div>
            <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCard
              title="Success Rate"
              value={`${summary?.successRate.toFixed(1)}%`}
              icon={CheckCircle}
              color="green"
              trend={summary?.successRate && summary.successRate > 90 ? 'up' : 'down'}
            />
            <MetricCard
              title="Avg Response Time"
              value={`${Math.round(summary?.avgResponseTime || 0)}ms`}
              icon={Clock}
              color="blue"
              trend={summary?.avgResponseTime && summary.avgResponseTime < 1000 ? 'up' : 'down'}
            />
            <MetricCard
              title="User Satisfaction"
              value={`${avgRating.toFixed(1)}/5.0`}
              icon={Star}
              color="yellow"
              trend={avgRating >= 4 ? 'up' : 'down'}
            />
            <MetricCard
              title="Total Cost"
              value={`$${summary?.totalCost.toFixed(2)}`}
              icon={DollarSign}
              color="purple"
              subtitle={`$${summary?.avgCostPerConversation.toFixed(4)}/conv`}
            />
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="costs">Costs</TabsTrigger>
              <TabsTrigger value="satisfaction">Satisfaction</TabsTrigger>
              <TabsTrigger value="recommendations">
                Recommendations
                {recommendations.filter((r) => r.status === 'pending').length > 0 && (
                  <Badge className="ml-2" variant="destructive">
                    {recommendations.filter((r) => r.status === 'pending').length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Conversations Over Time</CardTitle>
                    <CardDescription>Daily conversation volume and success rate</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(value) => format(new Date(value), 'MMM d')}
                        />
                        <YAxis />
                        <Tooltip
                          labelFormatter={(value) => format(new Date(value), 'MMM d, yyyy')}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="conversations"
                          stroke="#3b82f6"
                          name="Conversations"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Response Time Trend</CardTitle>
                    <CardDescription>Average response time in milliseconds</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(value) => format(new Date(value), 'MMM d')}
                        />
                        <YAxis />
                        <Tooltip
                          labelFormatter={(value) => format(new Date(value), 'MMM d, yyyy')}
                        />
                        <Line
                          type="monotone"
                          dataKey="avgResponseTime"
                          stroke="#10b981"
                          name="Response Time (ms)"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Total Conversations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{summary?.totalConversations}</div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                      {summary?.successRate.toFixed(1)}% success rate
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Tool Executions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{summary?.toolExecutions}</div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                      Across all conversations
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      Error Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{summary?.errorRate.toFixed(2)}%</div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                      {summary?.errorRate && summary.errorRate < 5 ? 'Excellent' : 'Needs improvement'}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Success Rate Over Time</CardTitle>
                  <CardDescription>Percentage of successful conversations</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(value) => format(new Date(value), 'MMM d')}
                      />
                      <YAxis />
                      <Tooltip
                        labelFormatter={(value) => format(new Date(value), 'MMM d, yyyy')}
                        formatter={(value: any) => [`${Number(value).toFixed(1)}%`, 'Success Rate']}
                      />
                      <Bar dataKey="successRate" fill="#10b981" name="Success Rate %" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Response Time Distribution</CardTitle>
                    <CardDescription>Recent conversations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {metrics.slice(0, 5).map((metric) => (
                        <div key={metric.id} className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="text-sm font-medium">
                              {format(new Date(metric.conversation_start), 'MMM d, h:mm a')}
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-400">
                              {metric.message_count} messages
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                metric.avg_response_time_ms < 1000
                                  ? 'default'
                                  : metric.avg_response_time_ms < 2000
                                  ? 'secondary'
                                  : 'destructive'
                              }
                            >
                              {metric.avg_response_time_ms}ms
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Token Usage</CardTitle>
                    <CardDescription>Total tokens consumed</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold mb-4">
                      {(summary?.totalTokens || 0).toLocaleString()}
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">
                          Per conversation
                        </span>
                        <span className="font-semibold">
                          {Math.round(
                            (summary?.totalTokens || 0) / Math.max(summary?.totalConversations || 1, 1)
                          ).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">
                          Estimated cost/1K tokens
                        </span>
                        <span className="font-semibold">
                          $
                          {(
                            ((summary?.totalCost || 0) / Math.max(summary?.totalTokens || 1, 1)) *
                            1000
                          ).toFixed(4)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="costs" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Cost Over Time</CardTitle>
                    <CardDescription>Daily spending</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(value) => format(new Date(value), 'MMM d')}
                        />
                        <YAxis />
                        <Tooltip
                          labelFormatter={(value) => format(new Date(value), 'MMM d, yyyy')}
                          formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Cost']}
                        />
                        <Bar dataKey="cost" fill="#8b5cf6" name="Daily Cost" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Cost by Model</CardTitle>
                    <CardDescription>Distribution across AI models</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={costData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) =>
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {costData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => `$${Number(value).toFixed(2)}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Cost Breakdown</CardTitle>
                  <CardDescription>Detailed cost analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(costByProvider).map(([provider, cost]) => (
                      <div key={provider} className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{provider}</div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            AI Provider
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">${cost.toFixed(2)}</div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            {((cost / (summary?.totalCost || 1)) * 100).toFixed(1)}% of total
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="satisfaction" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Satisfaction Over Time</CardTitle>
                    <CardDescription>Average user ratings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(value) => format(new Date(value), 'MMM d')}
                        />
                        <YAxis domain={[0, 5]} />
                        <Tooltip
                          labelFormatter={(value) => format(new Date(value), 'MMM d, yyyy')}
                          formatter={(value: any) => [
                            `${Number(value).toFixed(1)}/5.0`,
                            'Satisfaction',
                          ]}
                        />
                        <Line
                          type="monotone"
                          dataKey="satisfaction"
                          stroke="#f59e0b"
                          name="Avg Rating"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Rating Distribution</CardTitle>
                    <CardDescription>{ratings.length} total ratings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {ratingDistribution.map(({ stars, count, percentage }) => (
                        <div key={stars} className="flex items-center gap-4">
                          <div className="flex items-center gap-1 w-20">
                            <span className="font-medium">{stars}</span>
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          </div>
                          <div className="flex-1 h-6 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ duration: 0.5 }}
                              className="h-full bg-yellow-400"
                            />
                          </div>
                          <span className="text-sm w-12 text-right">{count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ThumbsUp className="h-5 w-5" />
                      Recommendation Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold mb-2">{recommendationRate.toFixed(1)}%</div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      of users would recommend this agent
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      Average Rating
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold mb-2">{avgRating.toFixed(1)}/5.0</div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Based on {ratings.length} ratings
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Feedback</CardTitle>
                  <CardDescription>Latest user comments</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {ratings
                      .filter((r) => r.feedback_text)
                      .slice(0, 5)
                      .map((rating) => (
                        <div key={rating.id} className="border-b pb-4 last:border-0">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < rating.rating
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-slate-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-slate-600 dark:text-slate-400">
                              {format(new Date(rating.created_at), 'MMM d, yyyy')}
                            </span>
                          </div>
                          <p className="text-sm">{rating.feedback_text}</p>
                          {rating.feedback_categories.length > 0 && (
                            <div className="flex gap-2 mt-2">
                              {rating.feedback_categories.map((category) => (
                                <Badge key={category} variant="secondary">
                                  {category}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    AI-Powered Recommendations
                  </CardTitle>
                  <CardDescription>
                    Suggestions to improve agent performance based on analytics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recommendations.length === 0 ? (
                      <div className="text-center py-8">
                        <Lightbulb className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                        <p className="text-slate-600 dark:text-slate-400">
                          No recommendations available yet. Keep using your agent to generate insights.
                        </p>
                      </div>
                    ) : (
                      recommendations.map((rec) => (
                        <Card key={rec.id} className={rec.priority === 'high' ? 'border-red-500' : ''}>
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge
                                    variant={
                                      rec.priority === 'high'
                                        ? 'destructive'
                                        : rec.priority === 'medium'
                                        ? 'default'
                                        : 'secondary'
                                    }
                                  >
                                    {rec.priority} priority
                                  </Badge>
                                  <Badge variant="outline">{rec.recommendation_type}</Badge>
                                  <Badge
                                    variant={
                                      rec.status === 'pending'
                                        ? 'secondary'
                                        : rec.status === 'acknowledged'
                                        ? 'default'
                                        : 'outline'
                                    }
                                  >
                                    {rec.status}
                                  </Badge>
                                </div>
                                <h4 className="font-semibold text-lg mb-2">{rec.title}</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                  {rec.description}
                                </p>
                                {rec.expected_improvement && (
                                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mt-2">
                                    <p className="text-sm text-green-800 dark:text-green-200">
                                      <strong>Expected improvement:</strong> {rec.expected_improvement}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                            {rec.status === 'pending' && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => acknowledgeRecommendation(rec.id)}
                                >
                                  Acknowledge
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => markImplemented(rec.id)}
                                >
                                  Mark Implemented
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => dismissRecommendation(rec.id)}
                                >
                                  Dismiss
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  icon: any;
  color: 'green' | 'blue' | 'yellow' | 'purple';
  trend?: 'up' | 'down';
  subtitle?: string;
}

function MetricCard({ title, value, icon: Icon, color, trend, subtitle }: MetricCardProps) {
  const colorClasses = {
    green: 'text-green-600 bg-green-100 dark:bg-green-900',
    blue: 'text-blue-600 bg-blue-100 dark:bg-blue-900',
    yellow: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900',
    purple: 'text-purple-600 bg-purple-100 dark:bg-purple-900',
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
          {trend && (
            <div className={trend === 'up' ? 'text-green-600' : 'text-red-600'}>
              {trend === 'up' ? (
                <TrendingUp className="h-5 w-5" />
              ) : (
                <TrendingDown className="h-5 w-5" />
              )}
            </div>
          )}
        </div>
        <div className="text-2xl font-bold mb-1">{value}</div>
        <div className="text-sm text-slate-600 dark:text-slate-400">{title}</div>
        {subtitle && (
          <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">{subtitle}</div>
        )}
      </CardContent>
    </Card>
  );
}
