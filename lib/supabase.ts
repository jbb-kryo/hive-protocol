import { createClient } from '@supabase/supabase-js'
import { env } from './env'

export const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export type Profile = {
  id: string
  full_name: string | null
  avatar_url: string | null
  plan: string
  onboarding_complete: boolean
  onboarding_completed_at?: string | null
  onboarding_current_step?: number
  onboarding_progress?: Record<string, unknown>
  role: string
  created_at: string
  updated_at?: string
  totp_enabled: boolean
  totp_verified_at?: string | null
  suspended?: boolean
  suspended_at?: string | null
  suspended_reason?: string | null
  suspended_by?: string | null
}

export type Agent = {
  id: string
  user_id: string
  name: string
  role: string | null
  framework: string
  model: string | null
  system_prompt: string | null
  settings: Record<string, unknown>
  source_template_id?: string | null
  source_template_version?: string | null
  created_at: string
}

export type Swarm = {
  id: string
  user_id: string
  name: string
  task: string | null
  status: string
  settings: Record<string, unknown>
  visibility: string
  share_token: string | null
  allow_guest_messages: boolean
  created_at: string
  agents?: Agent[]
  message_count?: number
}

export type SignatureStatus = 'unsigned' | 'signed' | 'verified' | 'invalid' | 'tampered'

export type Message = {
  id: string
  swarm_id: string
  sender_id: string | null
  sender_type: string
  content: string
  reasoning: string | null
  signature: string | null
  verified: boolean
  signature_status?: SignatureStatus
  signed_at?: string
  verification_error?: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export type Integration = {
  id: string
  user_id: string
  provider: string
  credentials: Record<string, unknown>
  settings: Record<string, unknown>
  created_at: string
}

export type ContextBlock = {
  id: string
  swarm_id: string
  name: string
  content: string
  priority: string
  shared: boolean
  created_by: string | null
  created_at: string
}
