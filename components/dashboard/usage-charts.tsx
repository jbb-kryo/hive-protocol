'use client'

import { useMemo } from 'react'
import {
  AreaChart,
  Area,
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
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { DailyUsage, UsageByModel, UsageByAgent } from '@/hooks/use-detailed-usage'

const CHART_COLORS = [
  '#0ea5e9',
  '#22c55e',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
]

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toFixed(0)
}

function formatCurrency(num: number): string {
  if (num < 0.01) return `$${num.toFixed(4)}`
  if (num < 1) return `$${num.toFixed(3)}`
  return `$${num.toFixed(2)}`
}

interface UsageTrendChartProps {
  data: DailyUsage[]
  metric: 'tokens' | 'cost' | 'requests'
}

export function UsageTrendChart({ data, metric }: UsageTrendChartProps) {
  const chartData = useMemo(() => {
    return data.map((d) => ({
      date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      input: metric === 'tokens' ? d.input_tokens : metric === 'cost' ? d.total_cost * 0.6 : d.request_count * 0.6,
      output: metric === 'tokens' ? d.output_tokens : metric === 'cost' ? d.total_cost * 0.4 : d.request_count * 0.4,
      total: metric === 'tokens' ? d.total_tokens : metric === 'cost' ? d.total_cost : d.request_count,
    }))
  }, [data, metric])

  const getLabel = () => {
    switch (metric) {
      case 'tokens':
        return 'Tokens'
      case 'cost':
        return 'Cost'
      case 'requests':
        return 'Requests'
    }
  }

  const formatYAxis = (value: number) => {
    if (metric === 'cost') return formatCurrency(value)
    return formatNumber(value)
  }

  const formatTooltip = (value: number) => {
    if (metric === 'cost') return formatCurrency(value)
    return formatNumber(value)
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{getLabel()} Over Time</CardTitle>
        <CardDescription>
          {metric === 'tokens' && 'Input and output tokens used daily'}
          {metric === 'cost' && 'Estimated daily costs'}
          {metric === 'requests' && 'API requests per day'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorInput" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorOutput" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatYAxis}
                className="text-muted-foreground"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value: number) => [formatTooltip(value), '']}
              />
              <Legend />
              {metric === 'tokens' ? (
                <>
                  <Area
                    type="monotone"
                    dataKey="input"
                    name="Input"
                    stroke="#0ea5e9"
                    fill="url(#colorInput)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="output"
                    name="Output"
                    stroke="#22c55e"
                    fill="url(#colorOutput)"
                    strokeWidth={2}
                  />
                </>
              ) : (
                <Area
                  type="monotone"
                  dataKey="total"
                  name={getLabel()}
                  stroke="#0ea5e9"
                  fill="url(#colorInput)"
                  strokeWidth={2}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

interface ModelUsageChartProps {
  data: UsageByModel[]
  metric: 'tokens' | 'cost' | 'requests'
}

export function ModelUsageChart({ data, metric }: ModelUsageChartProps) {
  const chartData = useMemo(() => {
    return data.slice(0, 8).map((d) => ({
      name: d.model,
      value: metric === 'tokens' ? d.total_tokens : metric === 'cost' ? d.total_cost : d.total_requests,
    }))
  }, [data, metric])

  const total = useMemo(() => chartData.reduce((sum, d) => sum + d.value, 0), [chartData])

  const formatValue = (value: number) => {
    if (metric === 'cost') return formatCurrency(value)
    return formatNumber(value)
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Usage by Model</CardTitle>
        <CardDescription>
          {metric === 'tokens' && 'Token distribution across models'}
          {metric === 'cost' && 'Cost breakdown by model'}
          {metric === 'requests' && 'Request distribution'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [formatValue(value), '']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {chartData.map((item, index) => (
            <div key={item.name} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
              />
              <span className="truncate text-muted-foreground">{item.name}</span>
              <span className="ml-auto font-medium">
                {total > 0 ? `${((item.value / total) * 100).toFixed(1)}%` : '0%'}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

interface AgentUsageChartProps {
  data: UsageByAgent[]
  metric: 'tokens' | 'cost' | 'requests'
}

export function AgentUsageChart({ data, metric }: AgentUsageChartProps) {
  const chartData = useMemo(() => {
    return data.slice(0, 10).map((d) => ({
      name: d.agent_name.length > 15 ? d.agent_name.slice(0, 15) + '...' : d.agent_name,
      fullName: d.agent_name,
      value: metric === 'tokens' ? d.total_tokens : metric === 'cost' ? d.total_cost : d.total_requests,
    }))
  }, [data, metric])

  const formatValue = (value: number) => {
    if (metric === 'cost') return formatCurrency(value)
    return formatNumber(value)
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Usage by Agent</CardTitle>
        <CardDescription>
          {metric === 'tokens' && 'Token consumption per agent'}
          {metric === 'cost' && 'Cost per agent'}
          {metric === 'requests' && 'Requests per agent'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatValue}
                className="text-muted-foreground"
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={100}
                className="text-muted-foreground"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number, _, props) => [
                  formatValue(value),
                  props.payload.fullName,
                ]}
              />
              <Bar dataKey="value" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

interface TokenBreakdownChartProps {
  inputTokens: number
  outputTokens: number
}

export function TokenBreakdownChart({ inputTokens, outputTokens }: TokenBreakdownChartProps) {
  const data = [
    { name: 'Input Tokens', value: inputTokens },
    { name: 'Output Tokens', value: outputTokens },
  ]

  const total = inputTokens + outputTokens

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Token Breakdown</CardTitle>
        <CardDescription>Input vs output token usage</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-8">
          <div className="h-[150px] w-[150px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={2}
                  dataKey="value"
                >
                  <Cell fill="#0ea5e9" />
                  <Cell fill="#22c55e" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-sky-500" />
                <span className="text-sm text-muted-foreground">Input</span>
              </div>
              <div className="text-right">
                <p className="font-medium">{formatNumber(inputTokens)}</p>
                <p className="text-xs text-muted-foreground">
                  {total > 0 ? `${((inputTokens / total) * 100).toFixed(1)}%` : '0%'}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm text-muted-foreground">Output</span>
              </div>
              <div className="text-right">
                <p className="font-medium">{formatNumber(outputTokens)}</p>
                <p className="text-xs text-muted-foreground">
                  {total > 0 ? `${((outputTokens / total) * 100).toFixed(1)}%` : '0%'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface CostEstimateTableProps {
  data: UsageByModel[]
  modelCosts: Record<string, { input: number; output: number }>
}

export function CostEstimateTable({ data, modelCosts }: CostEstimateTableProps) {
  const enrichedData = useMemo(() => {
    return data.map((model) => {
      const costs = modelCosts[model.model] || { input: 0.001, output: 0.002 }
      const estimatedInputCost = (model.total_input_tokens / 1000) * costs.input
      const estimatedOutputCost = (model.total_output_tokens / 1000) * costs.output
      return {
        ...model,
        input_rate: costs.input,
        output_rate: costs.output,
        estimated_input_cost: estimatedInputCost,
        estimated_output_cost: estimatedOutputCost,
        estimated_total: estimatedInputCost + estimatedOutputCost,
      }
    })
  }, [data, modelCosts])

  const totalCost = useMemo(
    () => enrichedData.reduce((sum, d) => sum + d.estimated_total, 0),
    [enrichedData]
  )

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Cost Estimates by Model</CardTitle>
        <CardDescription>Based on current pricing rates per 1K tokens</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 font-medium text-muted-foreground">Model</th>
                <th className="text-right py-2 font-medium text-muted-foreground">Input Rate</th>
                <th className="text-right py-2 font-medium text-muted-foreground">Output Rate</th>
                <th className="text-right py-2 font-medium text-muted-foreground">Est. Cost</th>
              </tr>
            </thead>
            <tbody>
              {enrichedData.map((model) => (
                <tr key={model.model} className="border-b border-border/50">
                  <td className="py-2 font-medium">{model.model}</td>
                  <td className="py-2 text-right text-muted-foreground">
                    ${model.input_rate.toFixed(4)}
                  </td>
                  <td className="py-2 text-right text-muted-foreground">
                    ${model.output_rate.toFixed(4)}
                  </td>
                  <td className="py-2 text-right font-medium">
                    {formatCurrency(model.estimated_total)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border">
                <td colSpan={3} className="py-2 font-medium">
                  Total Estimated Cost
                </td>
                <td className="py-2 text-right font-bold text-lg">{formatCurrency(totalCost)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
