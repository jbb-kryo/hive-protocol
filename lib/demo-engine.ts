import type { Agent } from './supabase'

const AGENT_COLORS = [
  '#F5A623',
  '#10B981',
  '#3B82F6',
  '#8B5CF6',
  '#EC4899',
  '#14B8A6',
  '#F97316',
  '#06B6D4',
]

export function getAgentColor(agent: Agent): string {
  if (agent.settings?.color) {
    return agent.settings.color as string
  }

  const hash = agent.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return AGENT_COLORS[hash % AGENT_COLORS.length]
}

export function getAgentInitial(agent: Agent): string {
  return agent.name.charAt(0).toUpperCase()
}

export function formatAgentRole(role: string | null): string {
  return role || 'AI Agent'
}

export function getFrameworkDisplayName(framework: string | null): string {
  const frameworks: Record<string, string> = {
    anthropic: 'Anthropic Claude',
    openai: 'OpenAI GPT',
    google: 'Google Gemini',
    cohere: 'Cohere',
    mistral: 'Mistral AI',
    custom: 'Custom Model',
  }
  return frameworks[framework || 'anthropic'] || framework || 'Unknown'
}
