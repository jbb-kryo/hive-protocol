import { create } from 'zustand'
import type { Profile, Agent, Swarm, Message } from '@/lib/supabase'

export interface GuestPreferences {
  useCase?: string
  framework?: string
  onboardingComplete?: boolean
  createdAt?: string
}

interface AppState {
  user: Profile | null
  setUser: (user: Profile | null) => void

  isGuest: boolean
  setIsGuest: (isGuest: boolean) => void

  guestPreferences: GuestPreferences
  setGuestPreferences: (prefs: GuestPreferences) => void
  updateGuestPreferences: (prefs: Partial<GuestPreferences>) => void

  agents: Agent[]
  setAgents: (agents: Agent[]) => void
  addAgent: (agent: Agent) => void
  updateAgent: (id: string, updates: Partial<Agent>) => void
  removeAgent: (id: string) => void

  swarms: Swarm[]
  setSwarms: (swarms: Swarm[]) => void
  addSwarm: (swarm: Swarm) => void
  updateSwarm: (id: string, updates: Partial<Swarm>) => void
  removeSwarm: (id: string) => void

  currentSwarm: Swarm | null
  setCurrentSwarm: (swarm: Swarm | null) => void

  messages: Message[]
  setMessages: (messages: Message[]) => void
  addMessage: (message: Message) => void

  isDemo: boolean
  setIsDemo: (isDemo: boolean) => void

  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export const useStore = create<AppState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),

  isGuest: false,
  setIsGuest: (isGuest) => set({ isGuest }),

  guestPreferences: {},
  setGuestPreferences: (prefs) => set({ guestPreferences: prefs }),
  updateGuestPreferences: (prefs) =>
    set((state) => ({ guestPreferences: { ...state.guestPreferences, ...prefs } })),

  agents: [],
  setAgents: (agents) => set({ agents }),
  addAgent: (agent) => set((state) => ({ agents: [...state.agents, agent] })),
  updateAgent: (id, updates) =>
    set((state) => ({
      agents: state.agents.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    })),
  removeAgent: (id) =>
    set((state) => ({ agents: state.agents.filter((a) => a.id !== id) })),

  swarms: [],
  setSwarms: (swarms) => set({ swarms }),
  addSwarm: (swarm) => set((state) => ({ swarms: [...state.swarms, swarm] })),
  updateSwarm: (id, updates) =>
    set((state) => ({
      swarms: state.swarms.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    })),
  removeSwarm: (id) =>
    set((state) => ({ swarms: state.swarms.filter((s) => s.id !== id) })),

  currentSwarm: null,
  setCurrentSwarm: (swarm) => set({ currentSwarm: swarm }),

  messages: [],
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  isDemo: false,
  setIsDemo: (isDemo) => set({ isDemo }),

  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}))
