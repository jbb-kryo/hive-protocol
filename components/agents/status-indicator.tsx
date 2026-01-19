'use client'

import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { AgentStatus, ActivityType } from '@/hooks/use-agent-presence'

interface StatusIndicatorProps {
  status: AgentStatus
  activityType?: ActivityType
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  showTooltip?: boolean
  className?: string
}

const statusConfig: Record<AgentStatus, { color: string; label: string; bgColor: string }> = {
  online: {
    color: 'bg-emerald-500',
    bgColor: 'bg-emerald-500/20',
    label: 'Online',
  },
  busy: {
    color: 'bg-amber-500',
    bgColor: 'bg-amber-500/20',
    label: 'Busy',
  },
  idle: {
    color: 'bg-slate-400',
    bgColor: 'bg-slate-400/20',
    label: 'Idle',
  },
  offline: {
    color: 'bg-slate-600',
    bgColor: 'bg-slate-600/20',
    label: 'Offline',
  },
}

const activityLabels: Record<string, string> = {
  thinking: 'Thinking...',
  typing: 'Typing...',
  processing: 'Processing...',
  idle: 'Idle',
}

const sizeClasses = {
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
}

export function StatusIndicator({
  status,
  activityType,
  size = 'md',
  showLabel = false,
  showTooltip = true,
  className,
}: StatusIndicatorProps) {
  const config = statusConfig[status]
  const isAnimated = status === 'busy' || status === 'online'
  const activityLabel = activityType ? activityLabels[activityType] : null
  const displayLabel = status === 'busy' && activityLabel ? activityLabel : config.label

  const indicator = (
    <div className={cn('flex items-center gap-1.5', className)}>
      <span className="relative flex">
        {isAnimated && (
          <span
            className={cn(
              'absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping',
              config.color
            )}
          />
        )}
        <span
          className={cn(
            'relative inline-flex rounded-full',
            sizeClasses[size],
            config.color
          )}
        />
      </span>
      {showLabel && (
        <span className="text-xs text-muted-foreground">{displayLabel}</span>
      )}
    </div>
  )

  if (!showTooltip) {
    return indicator
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {indicator}
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>{displayLabel}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface StatusBadgeProps {
  status: AgentStatus
  activityType?: ActivityType
  className?: string
}

export function StatusBadge({ status, activityType, className }: StatusBadgeProps) {
  const config = statusConfig[status]
  const activityLabel = activityType ? activityLabels[activityType] : null
  const displayLabel = status === 'busy' && activityLabel ? activityLabel : config.label

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
        config.bgColor,
        status === 'online' && 'text-emerald-700 dark:text-emerald-400',
        status === 'busy' && 'text-amber-700 dark:text-amber-400',
        status === 'idle' && 'text-slate-600 dark:text-slate-400',
        status === 'offline' && 'text-slate-500 dark:text-slate-500',
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', config.color)} />
      {displayLabel}
    </span>
  )
}

interface ActivityIndicatorProps {
  activityType: ActivityType
  agentName?: string
  className?: string
}

export function ActivityIndicator({ activityType, agentName, className }: ActivityIndicatorProps) {
  if (!activityType || activityType === 'idle') {
    return null
  }

  return (
    <div className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}>
      <div className="flex gap-1">
        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span>
        {agentName ? `${agentName} is ` : ''}
        {activityType === 'thinking' && 'thinking...'}
        {activityType === 'typing' && 'typing...'}
        {activityType === 'processing' && 'processing...'}
      </span>
    </div>
  )
}
