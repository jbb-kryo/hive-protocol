import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/store'

export type SearchResultType = 'swarm' | 'agent' | 'message'

export interface SearchResult {
  id: string
  type: SearchResultType
  title: string
  description?: string
  url: string
  metadata?: {
    swarmId?: string
    swarmName?: string
    agentName?: string
    timestamp?: string
  }
}

export interface SearchResults {
  swarms: SearchResult[]
  agents: SearchResult[]
  messages: SearchResult[]
  total: number
}

export function useGlobalSearch(query: string, enabled = true) {
  const { user } = useStore()
  const [results, setResults] = useState<SearchResults>({
    swarms: [],
    agents: [],
    messages: [],
    total: 0,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || !user || !enabled) {
      setResults({ swarms: [], agents: [], messages: [], total: 0 })
      return
    }

    setLoading(true)
    setError(null)

    try {
      const searchPattern = `%${searchQuery.toLowerCase()}%`

      const [swarmsData, agentsData, messagesData] = await Promise.all([
        supabase
          .from('swarms')
          .select('id, name, task, status, created_at')
          .eq('owner_id', user.id)
          .or(`name.ilike.${searchPattern},task.ilike.${searchPattern}`)
          .order('created_at', { ascending: false })
          .limit(10),

        supabase
          .from('agents')
          .select('id, name, role, capabilities, swarm_id, swarms(name)')
          .eq('swarms.owner_id', user.id)
          .or(`name.ilike.${searchPattern},role.ilike.${searchPattern}`)
          .order('created_at', { ascending: false })
          .limit(10),

        supabase
          .from('messages')
          .select(`
            id,
            content,
            created_at,
            agent_id,
            swarm_id,
            agents(name),
            swarms(name)
          `)
          .eq('swarms.owner_id', user.id)
          .ilike('content', searchPattern)
          .order('created_at', { ascending: false })
          .limit(15),
      ])

      const swarmResults: SearchResult[] = (swarmsData.data || []).map((swarm) => ({
        id: swarm.id,
        type: 'swarm' as SearchResultType,
        title: swarm.name,
        description: swarm.task || 'No task description',
        url: `/swarms/${swarm.id}`,
        metadata: {
          timestamp: swarm.created_at,
        },
      }))

      const agentResults: SearchResult[] = (agentsData.data || []).map((agent: any) => ({
        id: agent.id,
        type: 'agent' as SearchResultType,
        title: agent.name,
        description: agent.role,
        url: `/swarms/${agent.swarm_id}`,
        metadata: {
          swarmId: agent.swarm_id,
          swarmName: agent.swarms?.name,
        },
      }))

      const messageResults: SearchResult[] = (messagesData.data || []).map((message: any) => ({
        id: message.id,
        type: 'message' as SearchResultType,
        title: message.content.substring(0, 100) + (message.content.length > 100 ? '...' : ''),
        description: `From ${message.agents?.name || 'Unknown'} in ${message.swarms?.name || 'Unknown'}`,
        url: `/swarms/${message.swarm_id}?message=${message.id}`,
        metadata: {
          swarmId: message.swarm_id,
          swarmName: message.swarms?.name,
          agentName: message.agents?.name,
          timestamp: message.created_at,
        },
      }))

      const newResults = {
        swarms: swarmResults,
        agents: agentResults,
        messages: messageResults,
        total: swarmResults.length + agentResults.length + messageResults.length,
      }

      setResults(newResults)
    } catch (err) {
      console.error('Search error:', err)
      setError('Failed to search. Please try again.')
      setResults({ swarms: [], agents: [], messages: [], total: 0 })
    } finally {
      setLoading(false)
    }
  }, [user, enabled])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      search(query)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query, search])

  return {
    results,
    loading,
    error,
    hasResults: results.total > 0,
  }
}
