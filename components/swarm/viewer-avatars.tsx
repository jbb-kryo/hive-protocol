'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { SwarmPresenceUser } from '@/hooks/use-swarm-presence'

interface ViewerAvatarsProps {
  viewers: SwarmPresenceUser[]
  maxVisible?: number
  size?: 'sm' | 'md'
  className?: string
}

const sizeClasses = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
}

const ringClasses = {
  sm: 'ring-2',
  md: 'ring-2',
}

function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase()
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

function getAvatarColor(userId: string): string {
  const colors = [
    '#3B82F6',
    '#10B981',
    '#F59E0B',
    '#EF4444',
    '#8B5CF6',
    '#EC4899',
    '#06B6D4',
    '#84CC16',
  ]
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export function ViewerAvatars({
  viewers,
  maxVisible = 4,
  size = 'sm',
  className,
}: ViewerAvatarsProps) {
  if (viewers.length === 0) {
    return null
  }

  const visibleViewers = viewers.slice(0, maxVisible)
  const remainingCount = viewers.length - maxVisible

  return (
    <div className={cn('flex items-center', className)}>
      <div className="flex -space-x-2">
        {visibleViewers.map((viewer) => (
          <TooltipProvider key={viewer.user_id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar
                  className={cn(
                    sizeClasses[size],
                    ringClasses[size],
                    'ring-background cursor-default transition-transform hover:scale-110 hover:z-10',
                    !viewer.is_active && 'opacity-50'
                  )}
                >
                  {viewer.profile?.avatar_url ? (
                    <AvatarImage
                      src={viewer.profile.avatar_url}
                      alt={viewer.profile.full_name || 'User'}
                    />
                  ) : null}
                  <AvatarFallback
                    style={{ backgroundColor: getAvatarColor(viewer.user_id) }}
                    className="text-white font-medium"
                  >
                    {getInitials(viewer.profile?.full_name)}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'w-2 h-2 rounded-full',
                      viewer.is_active ? 'bg-emerald-500' : 'bg-slate-400'
                    )}
                  />
                  <span>{viewer.profile?.full_name || 'Anonymous'}</span>
                  <span className="text-muted-foreground text-xs">
                    {viewer.is_active ? 'viewing' : 'away'}
                  </span>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}

        {remainingCount > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar
                  className={cn(
                    sizeClasses[size],
                    ringClasses[size],
                    'ring-background cursor-default bg-muted'
                  )}
                >
                  <AvatarFallback className="bg-muted text-muted-foreground font-medium">
                    +{remainingCount}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <div className="space-y-1">
                  {viewers.slice(maxVisible).map((viewer) => (
                    <div key={viewer.user_id} className="flex items-center gap-2">
                      <span
                        className={cn(
                          'w-2 h-2 rounded-full',
                          viewer.is_active ? 'bg-emerald-500' : 'bg-slate-400'
                        )}
                      />
                      <span className="text-sm">
                        {viewer.profile?.full_name || 'Anonymous'}
                      </span>
                    </div>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {viewers.length > 0 && (
        <span className="ml-2 text-xs text-muted-foreground">
          {viewers.length === 1
            ? '1 viewer'
            : `${viewers.length} viewers`}
        </span>
      )}
    </div>
  )
}

interface ViewerCountBadgeProps {
  count: number
  activeCount: number
  className?: string
}

export function ViewerCountBadge({ count, activeCount, className }: ViewerCountBadgeProps) {
  if (count === 0) return null

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted text-xs text-muted-foreground',
              className
            )}
          >
            <span className="relative flex h-2 w-2">
              {activeCount > 0 && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span
                className={cn(
                  'relative inline-flex rounded-full h-2 w-2',
                  activeCount > 0 ? 'bg-emerald-500' : 'bg-slate-400'
                )}
              />
            </span>
            <span>{count}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {activeCount > 0
            ? `${activeCount} active viewer${activeCount !== 1 ? 's' : ''}`
            : 'No active viewers'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
