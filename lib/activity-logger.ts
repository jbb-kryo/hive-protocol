import { supabase } from './supabase'

export type ActivityType =
  | 'swarm_created'
  | 'swarm_updated'
  | 'agent_joined'
  | 'agent_added'
  | 'agent_removed'
  | 'message_sent'
  | 'tool_spawned'
  | 'swarm_deleted'
  | 'settings_updated'

export interface ActivityMetadata {
  swarm_id?: string
  swarm_name?: string
  agent_name?: string
  tool_name?: string
  message_preview?: string
  [key: string]: any
}

export interface LogActivityParams {
  type: ActivityType
  title: string
  description?: string
  metadata?: ActivityMetadata
}

export async function logActivity({
  type,
  title,
  description,
  metadata = {}
}: LogActivityParams): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return false
    }

    const { error } = await supabase
      .from('activity_log')
      .insert({
        user_id: session.user.id,
        activity_type: type,
        title,
        description,
        metadata
      })

    if (error) {
      console.error('Failed to log activity:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error logging activity:', error)
    return false
  }
}

export async function getRecentActivities(limit: number = 10) {
  try {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return []
    }

    const { data, error } = await supabase
      .from('activity_log')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Failed to fetch activities:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching activities:', error)
    return []
  }
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date()
  const past = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'Just now'
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours}h ago`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `${diffInDays}d ago`
  }

  const diffInWeeks = Math.floor(diffInDays / 7)
  if (diffInWeeks < 4) {
    return `${diffInWeeks}w ago`
  }

  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) {
    return `${diffInMonths}mo ago`
  }

  const diffInYears = Math.floor(diffInDays / 365)
  return `${diffInYears}y ago`
}
