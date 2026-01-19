import { supabase } from './supabase'

export interface DashboardStats {
  activeSwarms: number
  agents: number
  messagesToday: number
  integrations: number
  trends: {
    swarms?: number
    agents?: number
    messages?: number
  }
}

export async function calculateDashboardStats(): Promise<DashboardStats | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return null
    }

    const userId = session.user.id

    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfYesterday = new Date(startOfToday)
    startOfYesterday.setDate(startOfYesterday.getDate() - 1)

    const [
      activeSwarms,
      totalAgents,
      messagesToday,
      messagesYesterday,
      integrations,
    ] = await Promise.all([
      countActiveSwarms(userId),
      countAgents(userId),
      countMessagesInRange(userId, startOfToday.toISOString(), now.toISOString()),
      countMessagesInRange(userId, startOfYesterday.toISOString(), startOfToday.toISOString()),
      countIntegrations(userId),
    ])

    const messagesTrend = calculatePercentageChange(messagesYesterday, messagesToday)

    return {
      activeSwarms,
      agents: totalAgents,
      messagesToday,
      integrations,
      trends: {
        messages: messagesTrend,
      },
    }
  } catch (error) {
    console.error('Error calculating dashboard stats:', error)
    return null
  }
}

async function countActiveSwarms(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('swarms')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'active')

  if (error) {
    console.error('Error counting active swarms:', error)
    return 0
  }

  return count || 0
}

async function countAgents(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('agents')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (error) {
    console.error('Error counting agents:', error)
    return 0
  }

  return count || 0
}

async function countMessagesInRange(
  userId: string,
  startDate: string,
  endDate: string
): Promise<number> {
  const { count, error } = await supabase
    .from('messages')
    .select('*, swarms!inner(user_id)', { count: 'exact', head: true })
    .eq('swarms.user_id', userId)
    .gte('created_at', startDate)
    .lt('created_at', endDate)

  if (error) {
    console.error('Error counting messages:', error)
    return 0
  }

  return count || 0
}

async function countIntegrations(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('integrations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (error) {
    console.error('Error counting integrations:', error)
    return 0
  }

  return count || 0
}

function calculatePercentageChange(oldValue: number, newValue: number): number | undefined {
  if (oldValue === 0 && newValue === 0) {
    return undefined
  }

  if (oldValue === 0) {
    return 100
  }

  const change = ((newValue - oldValue) / oldValue) * 100
  return Math.round(change)
}
