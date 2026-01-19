'use client'

import { useState, useCallback } from 'react'
import { useStore } from '@/store'
import { supabase } from '@/lib/supabase'
import type { Agent, Swarm } from '@/lib/supabase'

export function useDemo() {
  const { isDemo, setIsDemo, setAgents, setSwarms, messages, setMessages } = useStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const initializeDemo = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const { data: defaultAgents, error: agentsError } = await supabase
        .from('default_agents')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .limit(5)

      if (agentsError) {
        console.error('Error fetching default agents:', agentsError)
      }

      const agents: Agent[] = (defaultAgents || []).map((da) => ({
        id: `demo_${da.id}`,
        user_id: 'demo',
        name: da.name,
        role: da.role,
        framework: da.framework,
        model: da.model_id,
        system_prompt: da.system_prompt,
        settings: da.settings || {},
        created_at: da.created_at,
      }))

      const { data: tools, error: toolsError } = await supabase
        .from('tools')
        .select('*')
        .eq('is_system', true)
        .order('created_at', { ascending: true })
        .limit(10)

      if (toolsError) {
        console.error('Error fetching tools:', toolsError)
      }

      setAgents(agents)

      const demoSwarm: Swarm = {
        id: 'demo_swarm_live',
        user_id: 'demo',
        name: 'Live Demo Swarm',
        task: 'Experience the HIVE Protocol platform with real AI agent templates and tools',
        status: 'active',
        settings: {},
        visibility: 'private',
        share_token: null,
        allow_guest_messages: false,
        created_at: new Date().toISOString(),
        agents: agents,
        message_count: 0,
      }

      setSwarms([demoSwarm])
      setMessages([])
      setIsDemo(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to initialize demo'
      setError(message)
      console.error('Demo initialization error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [setAgents, setSwarms, setMessages, setIsDemo])

  const exitDemo = useCallback(() => {
    setIsDemo(false)
    setAgents([])
    setSwarms([])
    setMessages([])
  }, [setIsDemo, setAgents, setSwarms, setMessages])

  return {
    isDemo,
    isLoading,
    error,
    initializeDemo,
    exitDemo,
    messages,
  }
}
