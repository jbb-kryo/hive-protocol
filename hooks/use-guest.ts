'use client'

import { useCallback, useEffect } from 'react'
import { useStore, type GuestPreferences } from '@/store'
import type { Agent, Swarm } from '@/lib/supabase'

const GUEST_STORAGE_KEY = 'hive_guest_data'
const GUEST_AGENTS_KEY = 'hive_guest_agents'
const GUEST_SWARMS_KEY = 'hive_guest_swarms'

interface GuestData {
  preferences: GuestPreferences
  agents: Agent[]
  swarms: Swarm[]
}

export function useGuest() {
  const {
    isGuest,
    setIsGuest,
    guestPreferences,
    setGuestPreferences,
    updateGuestPreferences,
    agents,
    setAgents,
    swarms,
    setSwarms,
    setIsDemo,
  } = useStore()

  const loadGuestData = useCallback(() => {
    if (typeof window === 'undefined') return null

    try {
      const stored = localStorage.getItem(GUEST_STORAGE_KEY)
      if (stored) {
        const data: GuestData = JSON.parse(stored)
        return data
      }
    } catch (e) {
      console.error('Failed to load guest data:', e)
    }
    return null
  }, [])

  const saveGuestData = useCallback(() => {
    if (typeof window === 'undefined') return

    try {
      const data: GuestData = {
        preferences: guestPreferences,
        agents: agents.filter(a => a.id.startsWith('guest_')),
        swarms: swarms.filter(s => s.id.startsWith('guest_')),
      }
      localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(data))
    } catch (e) {
      console.error('Failed to save guest data:', e)
    }
  }, [guestPreferences, agents, swarms])

  const initializeGuest = useCallback(async () => {
    const existingData = loadGuestData()

    if (existingData?.preferences?.onboardingComplete) {
      setGuestPreferences(existingData.preferences)
      if (existingData.agents?.length) {
        setAgents(existingData.agents)
      }
      if (existingData.swarms?.length) {
        setSwarms(existingData.swarms)
      }
      setIsGuest(true)
      setIsDemo(false)
      return { needsOnboarding: false }
    }

    setIsGuest(true)
    setIsDemo(false)
    setGuestPreferences({ createdAt: new Date().toISOString() })
    return { needsOnboarding: true }
  }, [loadGuestData, setGuestPreferences, setAgents, setSwarms, setIsGuest, setIsDemo])

  const createGuestAgent = useCallback((agentData: Omit<Agent, 'id' | 'user_id' | 'created_at'>) => {
    const agent: Agent = {
      ...agentData,
      id: `guest_agent_${Date.now()}`,
      user_id: 'guest',
      created_at: new Date().toISOString(),
    }
    setAgents([...agents, agent])
    return agent
  }, [agents, setAgents])

  const createGuestSwarm = useCallback((
    name: string,
    task: string,
    agentIds: string[]
  ) => {
    const swarmAgents = agents.filter(a => agentIds.includes(a.id))
    const swarm: Swarm = {
      id: `guest_swarm_${Date.now()}`,
      user_id: 'guest',
      name,
      task,
      status: 'active',
      settings: {},
      visibility: 'private',
      share_token: null,
      allow_guest_messages: false,
      created_at: new Date().toISOString(),
      agents: swarmAgents,
      message_count: 0,
    }
    setSwarms([...swarms, swarm])
    return swarm
  }, [agents, swarms, setSwarms])

  const completeGuestOnboarding = useCallback((preferences: Partial<GuestPreferences>) => {
    updateGuestPreferences({
      ...preferences,
      onboardingComplete: true,
    })
    setTimeout(saveGuestData, 100)
  }, [updateGuestPreferences, saveGuestData])

  const clearGuestData = useCallback(() => {
    if (typeof window === 'undefined') return

    localStorage.removeItem(GUEST_STORAGE_KEY)
    localStorage.removeItem(GUEST_AGENTS_KEY)
    localStorage.removeItem(GUEST_SWARMS_KEY)
    setIsGuest(false)
    setGuestPreferences({})
    setAgents([])
    setSwarms([])
  }, [setIsGuest, setGuestPreferences, setAgents, setSwarms])

  useEffect(() => {
    if (isGuest && guestPreferences.onboardingComplete) {
      saveGuestData()
    }
  }, [isGuest, guestPreferences, agents, swarms, saveGuestData])

  return {
    isGuest,
    guestPreferences,
    initializeGuest,
    createGuestAgent,
    createGuestSwarm,
    completeGuestOnboarding,
    clearGuestData,
    saveGuestData,
    loadGuestData,
  }
}
