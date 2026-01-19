'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Bot, MessageSquare, Zap, Plus, Settings, Trash2 } from 'lucide-react'
import { formatRelativeTime } from '@/lib/activity-logger'
import { Activity } from '@/hooks/use-activity'

interface ActivityFeedProps {
  activities: Activity[]
  isLoading?: boolean
}

const activityIcons = {
  message_sent: MessageSquare,
  agent_joined: Bot,
  tool_spawned: Zap,
  swarm_created: Plus,
  swarm_deleted: Trash2,
  settings_updated: Settings,
}

const activityColors = {
  message_sent: 'bg-accent/10 text-accent',
  agent_joined: 'bg-success/10 text-success',
  tool_spawned: 'bg-warning/10 text-warning',
  swarm_created: 'bg-primary/10 text-primary',
  swarm_deleted: 'bg-destructive/10 text-destructive',
  settings_updated: 'bg-blue-500/10 text-blue-500',
}

export function ActivityFeed({ activities, isLoading }: ActivityFeedProps) {
  const [currentTime, setCurrentTime] = useState(Date.now())

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now())
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No recent activity</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {activities.map((activity, i) => {
        const Icon = activityIcons[activity.activity_type as keyof typeof activityIcons] || MessageSquare
        const colorClass = activityColors[activity.activity_type as keyof typeof activityColors] || 'bg-gray-500/10 text-gray-500'

        return (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-start gap-3"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colorClass} flex-shrink-0`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{activity.title}</p>
              {activity.description && (
                <p className="text-xs text-muted-foreground mt-0.5">{activity.description}</p>
              )}
              <div className="flex items-center gap-2 mt-1">
                {activity.metadata?.swarm_name && (
                  <span className="text-xs text-muted-foreground">
                    {activity.metadata.swarm_name}
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  {formatRelativeTime(activity.created_at)}
                </span>
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
