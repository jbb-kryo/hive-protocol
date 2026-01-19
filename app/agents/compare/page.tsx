'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAgentComparison } from '@/hooks/use-agent-analytics';
import { useAgents } from '@/hooks/use-agents';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Clock,
  CheckCircle,
  Star,
  DollarSign,
  MessageSquare,
  Zap,
  AlertCircle,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { subDays } from 'date-fns';

interface Agent {
  id: string;
  name: string;
  model: string;
}

export default function AgentComparePage() {
  const router = useRouter();
  const { agents: allAgents } = useAgents();

  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [dateRange, setDateRange] = useState({
    start: subDays(new Date(), 30),
    end: new Date(),
  });

  const { comparison, loading } = useAgentComparison(selectedAgentIds, dateRange);

  useEffect(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    setDateRange({
      start: subDays(new Date(), days),
      end: new Date(),
    });
  }, [timeRange]);

  const toggleAgent = (agentId: string) => {
    setSelectedAgentIds((prev) =>
      prev.includes(agentId) ? prev.filter((id) => id !== agentId) : [...prev, agentId]
    );
  };

  const getAgentName = (agentId: string) => {
    return allAgents.find((a) => a.id === agentId)?.name || 'Unknown Agent';
  };

  const getComparisonValue = (agentId: string, metric: string): number => {
    const data = comparison[agentId];
    if (!data) return 0;

    switch (metric) {
      case 'successRate':
        return data.successRate;
      case 'avgResponseTime':
        return data.avgResponseTime;
      case 'avgSatisfaction':
        return data.avgSatisfaction;
      case 'avgCostPerConversation':
        return data.avgCostPerConversation;
      case 'totalConversations':
        return data.totalConversations;
      case 'errorRate':
        return data.errorRate;
      default:
        return 0;
    }
  };

  const getBestValue = (metric: string, ascending = false): number => {
    if (selectedAgentIds.length === 0) return 0;

    const values = selectedAgentIds.map((id) => getComparisonValue(id, metric));
    return ascending ? Math.min(...values) : Math.max(...values);
  };

  const getWorstValue = (metric: string, ascending = false): number => {
    if (selectedAgentIds.length === 0) return 0;

    const values = selectedAgentIds.map((id) => getComparisonValue(id, metric));
    return ascending ? Math.max(...values) : Math.min(...values);
  };

  const getComparisonIndicator = (agentId: string, metric: string, ascending = false) => {
    const value = getComparisonValue(agentId, metric);
    const best = getBestValue(metric, ascending);
    const worst = getWorstValue(metric, ascending);

    if (value === best) {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    } else if (value === worst) {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    }
    return <Minus className="h-4 w-4 text-slate-400" />;
  };

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
              <h1 className="text-4xl font-bold mb-2">Compare Agents</h1>
              <p className="text-slate-600 dark:text-slate-400">
                Compare performance metrics across multiple agents
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

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Select Agents to Compare</CardTitle>
              <CardDescription>Choose 2-5 agents to compare their performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allAgents.map((agent) => (
                  <div
                    key={agent.id}
                    className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedAgentIds.includes(agent.id)
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                    onClick={() => toggleAgent(agent.id)}
                  >
                    <Checkbox checked={selectedAgentIds.includes(agent.id)} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{agent.name}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        {agent.model}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {selectedAgentIds.length > 5 && (
                <p className="text-sm text-red-600 mt-4">
                  Please select a maximum of 5 agents for comparison
                </p>
              )}
            </CardContent>
          </Card>

          {selectedAgentIds.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-2xl font-semibold mb-2">No Agents Selected</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Select at least 2 agents above to start comparing their performance
                </p>
              </CardContent>
            </Card>
          ) : selectedAgentIds.length === 1 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-2xl font-semibold mb-2">Select More Agents</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Select at least one more agent to enable comparison
                </p>
              </CardContent>
            </Card>
          ) : loading ? (
            <Card>
              <CardContent className="py-16 text-center">
                <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-400">Loading comparison data...</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Overview</CardTitle>
                  <CardDescription>Key metrics comparison</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-semibold">Metric</th>
                          {selectedAgentIds.map((agentId) => (
                            <th key={agentId} className="text-center py-3 px-4 font-semibold">
                              {getAgentName(agentId)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <MetricRow
                          label="Total Conversations"
                          icon={MessageSquare}
                          agentIds={selectedAgentIds}
                          getValue={(id) => comparison[id]?.totalConversations || 0}
                          format={(v) => v.toString()}
                          getIndicator={(id) => getComparisonIndicator(id, 'totalConversations')}
                        />
                        <MetricRow
                          label="Success Rate"
                          icon={CheckCircle}
                          agentIds={selectedAgentIds}
                          getValue={(id) => comparison[id]?.successRate || 0}
                          format={(v) => `${v.toFixed(1)}%`}
                          getIndicator={(id) => getComparisonIndicator(id, 'successRate')}
                          highlightBest
                        />
                        <MetricRow
                          label="Avg Response Time"
                          icon={Clock}
                          agentIds={selectedAgentIds}
                          getValue={(id) => comparison[id]?.avgResponseTime || 0}
                          format={(v) => `${Math.round(v)}ms`}
                          getIndicator={(id) => getComparisonIndicator(id, 'avgResponseTime', true)}
                          highlightBest
                          ascending
                        />
                        <MetricRow
                          label="User Satisfaction"
                          icon={Star}
                          agentIds={selectedAgentIds}
                          getValue={(id) => comparison[id]?.avgSatisfaction || 0}
                          format={(v) => `${v.toFixed(1)}/5.0`}
                          getIndicator={(id) => getComparisonIndicator(id, 'avgSatisfaction')}
                          highlightBest
                        />
                        <MetricRow
                          label="Cost per Conversation"
                          icon={DollarSign}
                          agentIds={selectedAgentIds}
                          getValue={(id) => comparison[id]?.avgCostPerConversation || 0}
                          format={(v) => `$${v.toFixed(4)}`}
                          getIndicator={(id) =>
                            getComparisonIndicator(id, 'avgCostPerConversation', true)
                          }
                          highlightBest
                          ascending
                        />
                        <MetricRow
                          label="Error Rate"
                          icon={AlertCircle}
                          agentIds={selectedAgentIds}
                          getValue={(id) => comparison[id]?.errorRate || 0}
                          format={(v) => `${v.toFixed(2)}%`}
                          getIndicator={(id) => getComparisonIndicator(id, 'errorRate', true)}
                          highlightBest
                          ascending
                        />
                        <MetricRow
                          label="Tool Executions"
                          icon={Zap}
                          agentIds={selectedAgentIds}
                          getValue={(id) => comparison[id]?.toolExecutions || 0}
                          format={(v) => v.toString()}
                          getIndicator={(id) => getComparisonIndicator(id, 'toolExecutions')}
                        />
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Winner Analysis</CardTitle>
                  <CardDescription>Best performing agent in each category</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <WinnerCard
                      title="Highest Success Rate"
                      agentId={
                        selectedAgentIds.reduce((best, id) =>
                          getComparisonValue(id, 'successRate') >
                          getComparisonValue(best, 'successRate')
                            ? id
                            : best
                        )
                      }
                      agentName={getAgentName(
                        selectedAgentIds.reduce((best, id) =>
                          getComparisonValue(id, 'successRate') >
                          getComparisonValue(best, 'successRate')
                            ? id
                            : best
                        )
                      )}
                      value={`${getBestValue('successRate').toFixed(1)}%`}
                      icon={CheckCircle}
                      color="green"
                    />
                    <WinnerCard
                      title="Fastest Response Time"
                      agentId={
                        selectedAgentIds.reduce((best, id) =>
                          getComparisonValue(id, 'avgResponseTime') <
                          getComparisonValue(best, 'avgResponseTime')
                            ? id
                            : best
                        )
                      }
                      agentName={getAgentName(
                        selectedAgentIds.reduce((best, id) =>
                          getComparisonValue(id, 'avgResponseTime') <
                          getComparisonValue(best, 'avgResponseTime')
                            ? id
                            : best
                        )
                      )}
                      value={`${Math.round(getBestValue('avgResponseTime', true))}ms`}
                      icon={Clock}
                      color="blue"
                    />
                    <WinnerCard
                      title="Best User Satisfaction"
                      agentId={
                        selectedAgentIds.reduce((best, id) =>
                          getComparisonValue(id, 'avgSatisfaction') >
                          getComparisonValue(best, 'avgSatisfaction')
                            ? id
                            : best
                        )
                      }
                      agentName={getAgentName(
                        selectedAgentIds.reduce((best, id) =>
                          getComparisonValue(id, 'avgSatisfaction') >
                          getComparisonValue(best, 'avgSatisfaction')
                            ? id
                            : best
                        )
                      )}
                      value={`${getBestValue('avgSatisfaction').toFixed(1)}/5.0`}
                      icon={Star}
                      color="yellow"
                    />
                    <WinnerCard
                      title="Most Cost Effective"
                      agentId={
                        selectedAgentIds.reduce((best, id) =>
                          getComparisonValue(id, 'avgCostPerConversation') <
                          getComparisonValue(best, 'avgCostPerConversation')
                            ? id
                            : best
                        )
                      }
                      agentName={getAgentName(
                        selectedAgentIds.reduce((best, id) =>
                          getComparisonValue(id, 'avgCostPerConversation') <
                          getComparisonValue(best, 'avgCostPerConversation')
                            ? id
                            : best
                        )
                      )}
                      value={`$${getBestValue('avgCostPerConversation', true).toFixed(4)}`}
                      icon={DollarSign}
                      color="purple"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

interface MetricRowProps {
  label: string;
  icon: any;
  agentIds: string[];
  getValue: (agentId: string) => number;
  format: (value: number) => string;
  getIndicator: (agentId: string) => React.ReactNode;
  highlightBest?: boolean;
  ascending?: boolean;
}

function MetricRow({
  label,
  icon: Icon,
  agentIds,
  getValue,
  format,
  getIndicator,
  highlightBest,
  ascending,
}: MetricRowProps) {
  const values = agentIds.map(getValue);
  const bestValue = ascending ? Math.min(...values) : Math.max(...values);

  return (
    <tr className="border-b hover:bg-slate-50 dark:hover:bg-slate-800">
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          <span className="font-medium">{label}</span>
        </div>
      </td>
      {agentIds.map((agentId) => {
        const value = getValue(agentId);
        const isBest = highlightBest && value === bestValue;
        return (
          <td key={agentId} className="py-3 px-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <span className={isBest ? 'font-bold text-green-600' : ''}>{format(value)}</span>
              {getIndicator(agentId)}
            </div>
          </td>
        );
      })}
    </tr>
  );
}

interface WinnerCardProps {
  title: string;
  agentId: string;
  agentName: string;
  value: string;
  icon: any;
  color: 'green' | 'blue' | 'yellow' | 'purple';
}

function WinnerCard({ title, agentName, value, icon: Icon, color }: WinnerCardProps) {
  const colorClasses = {
    green: 'text-green-600 bg-green-100 dark:bg-green-900',
    blue: 'text-blue-600 bg-blue-100 dark:bg-blue-900',
    yellow: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900',
    purple: 'text-purple-600 bg-purple-100 dark:bg-purple-900',
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3 mb-3">
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="font-semibold">{title}</div>
        </div>
        <div className="text-2xl font-bold mb-1">{agentName}</div>
        <div className="text-lg text-slate-600 dark:text-slate-400">{value}</div>
      </CardContent>
    </Card>
  );
}
