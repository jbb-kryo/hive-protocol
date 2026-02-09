'use client'

import { useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'

export interface TestConversation {
  id: string
  template_id: string | null
  default_agent_id: string | null
  tester_id: string
  template_version: string
  parameter_values: Record<string, unknown>
  resolved_config: Record<string, unknown>
  status: 'active' | 'completed' | 'archived'
  notes: string | null
  created_at: string
  completed_at: string | null
}

export interface TestMessage {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  response_time_ms: number | null
  metadata: Record<string, unknown>
  created_at: string
}

export interface SandboxConfig {
  name: string
  system_prompt: string | null
  framework: string
  role: string | null
  template_id?: string | null
  default_agent_id?: string | null
  template_version?: string
  parameter_values?: Record<string, unknown>
  resolved_config?: Record<string, unknown>
}

export function useTemplateSandbox() {
  const [conversation, setConversation] = useState<TestConversation | null>(null)
  const [messages, setMessages] = useState<TestMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const startConversation = useCallback(async (config: SandboxConfig) => {
    setLoading(true)
    setError(null)
    setMessages([])

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error: insertError } = await supabase
        .from('template_test_conversations')
        .insert({
          template_id: config.template_id || null,
          default_agent_id: config.default_agent_id || null,
          tester_id: user.id,
          template_version: config.template_version || '1.0.0',
          parameter_values: config.parameter_values || {},
          resolved_config: config.resolved_config || {
            name: config.name,
            system_prompt: config.system_prompt,
            framework: config.framework,
            role: config.role,
          },
          status: 'active',
        })
        .select()
        .single()

      if (insertError) throw insertError

      setConversation(data)
      return data as TestConversation
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to start test'
      setError(msg)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const sendMessage = useCallback(async (
    content: string,
    config: SandboxConfig
  ) => {
    if (!conversation) return
    setSending(true)
    setError(null)

    const userMsg: TestMessage = {
      id: `temp_user_${Date.now()}`,
      conversation_id: conversation.id,
      role: 'user',
      content,
      response_time_ms: null,
      metadata: {},
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg])

    try {
      const { data: savedUserMsg, error: userMsgError } = await supabase
        .from('template_test_messages')
        .insert({
          conversation_id: conversation.id,
          role: 'user',
          content,
        })
        .select()
        .single()

      if (userMsgError) throw userMsgError

      setMessages(prev =>
        prev.map(m => m.id === userMsg.id ? (savedUserMsg as TestMessage) : m)
      )

      const startTime = Date.now()

      abortRef.current = new AbortController()

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No session')

      const conversationHistory = [
        ...messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        { role: 'user' as const, content },
      ]

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/agent-respond`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            messages: conversationHistory,
            system_prompt: config.system_prompt || '',
            framework: config.framework || 'anthropic',
            is_test: true,
          }),
          signal: abortRef.current.signal,
        }
      )

      const responseTime = Date.now() - startTime

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || `Response failed: ${response.status}`)
      }

      const data = await response.json()
      const assistantContent = data.response || data.content || data.message || 'No response generated'

      const { data: savedAssistantMsg, error: assistantMsgError } = await supabase
        .from('template_test_messages')
        .insert({
          conversation_id: conversation.id,
          role: 'assistant',
          content: assistantContent,
          response_time_ms: responseTime,
          metadata: {
            model: data.model || config.framework,
            tokens: data.usage || null,
            is_test: true,
          },
        })
        .select()
        .single()

      if (assistantMsgError) throw assistantMsgError

      setMessages(prev => [...prev, savedAssistantMsg as TestMessage])
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return

      const msg = err instanceof Error ? err.message : 'Failed to get response'
      setError(msg)

      const errorMsg: TestMessage = {
        id: `temp_error_${Date.now()}`,
        conversation_id: conversation.id,
        role: 'assistant',
        content: `Error: ${msg}`,
        response_time_ms: null,
        metadata: { is_error: true },
        created_at: new Date().toISOString(),
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setSending(false)
      abortRef.current = null
    }
  }, [conversation, messages])

  const endConversation = useCallback(async (notes?: string) => {
    if (!conversation) return

    try {
      await supabase
        .from('template_test_conversations')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          notes: notes || null,
        })
        .eq('id', conversation.id)

      setConversation(null)
      setMessages([])
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to end conversation'
      setError(msg)
    }
  }, [conversation])

  const cancelResponse = useCallback(() => {
    abortRef.current?.abort()
    setSending(false)
  }, [])

  const loadConversation = useCallback(async (conversationId: string) => {
    setLoading(true)
    setError(null)

    try {
      const { data: conv, error: convError } = await supabase
        .from('template_test_conversations')
        .select('*')
        .eq('id', conversationId)
        .maybeSingle()

      if (convError) throw convError
      if (!conv) throw new Error('Conversation not found')

      const { data: msgs, error: msgsError } = await supabase
        .from('template_test_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (msgsError) throw msgsError

      setConversation(conv as TestConversation)
      setMessages((msgs || []) as TestMessage[])
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load conversation'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchTestHistory = useCallback(async (
    templateId?: string,
    defaultAgentId?: string
  ): Promise<TestConversation[]> => {
    try {
      let query = supabase
        .from('template_test_conversations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

      if (templateId) {
        query = query.eq('template_id', templateId)
      }
      if (defaultAgentId) {
        query = query.eq('default_agent_id', defaultAgentId)
      }

      const { data, error: fetchError } = await query
      if (fetchError) throw fetchError

      return (data || []) as TestConversation[]
    } catch {
      return []
    }
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  return {
    conversation,
    messages,
    loading,
    sending,
    error,
    startConversation,
    sendMessage,
    endConversation,
    cancelResponse,
    loadConversation,
    fetchTestHistory,
    clearMessages,
  }
}
