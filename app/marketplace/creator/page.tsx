'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCreatorAnalytics, MarketplaceAgent } from '@/hooks/use-marketplace';
import { useStore } from '@/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  TrendingUp,
  Download,
  Eye,
  DollarSign,
  Star,
  Users,
  BarChart3,
  Plus,
  Edit,
  ArrowUpRight,
  ArrowDownRight,
  Lock,
  ArrowRight,
  Store,
  Package,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, subDays } from 'date-fns';

const ALLOWED_PLANS = ['pro', 'unlimited', 'enterprise'];

export default function CreatorAnalyticsPage() {
  const router = useRouter();
  const { user, isDemo } = useStore();
  const [myAgents, setMyAgents] = useState<MarketplaceAgent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  const userPlan = user?.plan || 'free';
  const hasAccess = isDemo || ALLOWED_PLANS.includes(userPlan);

  const { analytics, totalRevenue, loading: analyticsLoading } = useCreatorAnalytics(
    selectedAgent || ''
  );

  useEffect(() => {
    const fetchMyAgents = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        const { data, error } = await supabase
          .from('marketplace_agents')
          .select(`
            *,
            category:marketplace_categories(*)
          `)
          .eq('creator_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setMyAgents(data || []);
        if (data && data.length > 0) {
          setSelectedAgent(data[0].id);
        }
      } catch (error) {
        console.error('Error fetching agents:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyAgents();
  }, [router]);

  const selectedAgentData = myAgents.find((a) => a.id === selectedAgent);

  const getTimeRangeData = () => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    return analytics.slice(0, days).reverse();
  };

  const chartData = getTimeRangeData();

  const calculateChange = (metric: 'views' | 'installs' | 'purchases' | 'revenue') => {
    if (chartData.length < 2) return 0;
    const recent = chartData.slice(-7).reduce((sum, day) => sum + Number(day[metric]), 0);
    const previous = chartData.slice(-14, -7).reduce((sum, day) => sum + Number(day[metric]), 0);
    if (previous === 0) return recent > 0 ? 100 : 0;
    return ((recent - previous) / previous) * 100;
  };

  const totalMetrics = {
    views: chartData.reduce((sum, day) => sum + day.views, 0),
    installs: chartData.reduce((sum, day) => sum + day.installs, 0),
    purchases: chartData.reduce((sum, day) => sum + day.purchases, 0),
    revenue: chartData.reduce((sum, day) => sum + Number(day.revenue), 0),
  };

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-2xl mx-auto text-center py-16"
        >
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Upgrade to Access Creator Analytics</h1>
          <p className="text-lg text-muted-foreground mb-8">
            The Marketplace Creator Dashboard is available on Pro, Unlimited, and Enterprise plans.
            Publish agents, track performance, and monetize your creations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/pricing">
                View Plans
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/settings?tab=billing">
                Manage Subscription
              </Link>
            </Button>
          </div>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Store className="w-5 h-5 text-primary" />
                  Publish Agents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Share your AI agents with the community
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Track Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Monitor views, installs, and revenue
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  Earn Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Monetize your AI agent creations
                </p>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (myAgents.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-3xl font-bold mb-2">No Published Agents</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Publish your first agent to the marketplace to start tracking analytics
            </p>
            <Button onClick={() => router.push('/agents')}>
              Go to My Agents
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Creator Analytics</h1>
              <p className="text-slate-600 dark:text-slate-400">
                Track performance of your published agents
              </p>
            </div>
            <Button onClick={() => router.push('/agents')} className="gap-2">
              <Plus className="h-4 w-4" />
              Publish New Agent
            </Button>
          </div>

          <div className="flex items-center gap-4 mb-8">
            <Select value={selectedAgent || ''} onValueChange={setSelectedAgent}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Select an agent" />
              </SelectTrigger>
              <SelectContent>
                {myAgents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

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

            {selectedAgentData && (
              <Button variant="outline" className="gap-2">
                <Edit className="h-4 w-4" />
                Edit Agent
              </Button>
            )}
          </div>

          {selectedAgentData && (
            <Card className="mb-8">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-bold">{selectedAgentData.name}</h2>
                      {selectedAgentData.is_published ? (
                        <Badge variant="default">Published</Badge>
                      ) : (
                        <Badge variant="secondary">Draft</Badge>
                      )}
                      {selectedAgentData.is_featured && (
                        <Badge className="bg-yellow-500 text-black">Featured</Badge>
                      )}
                    </div>
                    <p className="text-slate-600 dark:text-slate-400">
                      {selectedAgentData.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 mb-1">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <span className="text-2xl font-bold">
                        {selectedAgentData.average_rating.toFixed(1)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {selectedAgentData.review_count} reviews
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCard
              title="Total Views"
              value={totalMetrics.views}
              change={calculateChange('views')}
              icon={Eye}
              color="blue"
            />
            <MetricCard
              title="Total Installs"
              value={totalMetrics.installs}
              change={calculateChange('installs')}
              icon={Download}
              color="green"
            />
            <MetricCard
              title="Total Purchases"
              value={totalMetrics.purchases}
              change={calculateChange('purchases')}
              icon={Users}
              color="purple"
            />
            <MetricCard
              title="Total Revenue"
              value={`$${totalMetrics.revenue.toFixed(2)}`}
              change={calculateChange('revenue')}
              icon={DollarSign}
              color="yellow"
            />
          </div>

          <Tabs defaultValue="overview" className="mb-8">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="engagement">Engagement</TabsTrigger>
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Views & Installs Over Time</CardTitle>
                  <CardDescription>
                    Track how your agent is being discovered and installed
                  </CardDescription>
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
                        dataKey="views"
                        stroke="#3b82f6"
                        name="Views"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="installs"
                        stroke="#10b981"
                        name="Installs"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="engagement" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Daily Engagement</CardTitle>
                  <CardDescription>
                    View detailed engagement metrics over time
                  </CardDescription>
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
                      />
                      <Legend />
                      <Bar dataKey="views" fill="#3b82f6" name="Views" />
                      <Bar dataKey="unique_viewers" fill="#8b5cf6" name="Unique Viewers" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="revenue" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue & Purchases</CardTitle>
                  <CardDescription>
                    Track your earnings over time
                  </CardDescription>
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
                        formatter={(value: any) => ['$' + Number(value).toFixed(2), 'Revenue']}
                      />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#f59e0b"
                        name="Revenue"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Conversion Rate</CardTitle>
                    <CardDescription>Views to installs ratio</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold mb-2">
                      {totalMetrics.views > 0
                        ? ((totalMetrics.installs / totalMetrics.views) * 100).toFixed(1)
                        : 0}%
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {totalMetrics.installs} installs from {totalMetrics.views} views
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Purchase Rate</CardTitle>
                    <CardDescription>Installs to purchases ratio</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold mb-2">
                      {totalMetrics.installs > 0
                        ? ((totalMetrics.purchases / totalMetrics.installs) * 100).toFixed(1)
                        : 0}%
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {totalMetrics.purchases} purchases from {totalMetrics.installs} installs
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          <Card>
            <CardHeader>
              <CardTitle>All Published Agents</CardTitle>
              <CardDescription>Overview of your marketplace portfolio</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {myAgents.map((agent) => (
                  <div
                    key={agent.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{agent.name}</h3>
                        {agent.is_featured && (
                          <Badge className="bg-yellow-500 text-black text-xs">Featured</Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {agent.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <div className="font-semibold">{agent.install_count}</div>
                        <div className="text-slate-600 dark:text-slate-400">Installs</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center gap-1 font-semibold">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          {agent.average_rating.toFixed(1)}
                        </div>
                        <div className="text-slate-600 dark:text-slate-400">Rating</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedAgent(agent.id)}
                      >
                        View Analytics
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: any;
  color: 'blue' | 'green' | 'purple' | 'yellow';
}

function MetricCard({ title, value, change, icon: Icon, color }: MetricCardProps) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100 dark:bg-blue-900',
    green: 'text-green-600 bg-green-100 dark:bg-green-900',
    purple: 'text-purple-600 bg-purple-100 dark:bg-purple-900',
    yellow: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900',
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
          {change !== 0 && (
            <div className={`flex items-center gap-1 text-sm ${
              change > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {change > 0 ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : (
                <ArrowDownRight className="h-4 w-4" />
              )}
              {Math.abs(change).toFixed(1)}%
            </div>
          )}
        </div>
        <div className="text-2xl font-bold mb-1">{value}</div>
        <div className="text-sm text-slate-600 dark:text-slate-400">{title}</div>
      </CardContent>
    </Card>
  );
}
