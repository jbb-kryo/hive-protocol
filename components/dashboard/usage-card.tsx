'use client'

import { motion } from 'framer-motion'
import { Activity, MessageSquare, Cpu, Coins, TrendingUp, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { UsageStats } from '@/hooks/use-usage'

interface UsageCardProps {
  stats: UsageStats | null
  isLoading?: boolean
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

function getProgressColor(percentage: number): string {
  if (percentage >= 90) return 'bg-red-500'
  if (percentage >= 75) return 'bg-amber-500'
  return 'bg-emerald-500'
}

function UsageBar({
  label,
  current,
  limit,
  percentage,
  icon: Icon
}: {
  label: string
  current: number
  limit: number
  percentage: number
  icon: React.ElementType
}) {
  const isNearLimit = percentage >= 75
  const isAtLimit = percentage >= 90

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">{label}</span>
          {isAtLimit && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Approaching daily limit</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <span className={`text-xs ${isNearLimit ? 'text-amber-500' : 'text-muted-foreground'}`}>
          {formatNumber(current)} / {formatNumber(limit)}
        </span>
      </div>
      <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
        <motion.div
          className={`absolute inset-y-0 left-0 rounded-full ${getProgressColor(percentage)}`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(percentage, 100)}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

export function UsageCard({ stats, isLoading }: UsageCardProps) {
  if (isLoading || !stats) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Usage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-muted rounded animate-pulse" />
              <div className="h-2 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  const planColors: Record<string, string> = {
    free: 'bg-slate-500',
    pro: 'bg-blue-500',
    enterprise: 'bg-amber-500'
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Today&apos;s Usage
          </CardTitle>
          <Badge
            variant="secondary"
            className={`${planColors[stats.limits.plan] || 'bg-slate-500'} text-white`}
          >
            {stats.limits.plan.charAt(0).toUpperCase() + stats.limits.plan.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <UsageBar
          label="Messages"
          current={stats.today.messages}
          limit={stats.limits.messages_per_day}
          percentage={stats.percentages.messages}
          icon={MessageSquare}
        />
        <UsageBar
          label="API Requests"
          current={stats.today.requests}
          limit={stats.limits.requests_per_day}
          percentage={stats.percentages.requests}
          icon={TrendingUp}
        />
        <UsageBar
          label="Tokens"
          current={stats.today.tokens}
          limit={stats.limits.tokens_per_day}
          percentage={stats.percentages.tokens}
          icon={Cpu}
        />

        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              <Coins className="w-4 h-4" />
              Est. Cost Today
            </span>
            <span className="font-medium">${stats.today.cost.toFixed(4)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold">{stats.current.agents}</p>
            <p className="text-xs text-muted-foreground">of {stats.limits.max_agents} agents</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{stats.current.swarms}</p>
            <p className="text-xs text-muted-foreground">of {stats.limits.max_swarms} swarms</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
