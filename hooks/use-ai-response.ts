'use client'

import { useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'

export interface ToolExecution {
  toolId: string
  toolName: string
  status: 'pending' | 'running' | 'success' | 'error'
  startedAt: Date
  completedAt?: Date
  executionTimeMs?: number
  input?: Record<string, unknown>
  output?: unknown
  error?: string
}

interface StreamingState {
  isStreaming: boolean
  content: string
  agentId: string | null
  agentName: string | null
  error: string | null
  errorCode: string | null
  toolExecution: ToolExecution | null
}

export type HumanMode = 'observe' | 'collaborate' | 'direct'

interface RequestAgentResponseOptions {
  swarmId: string
  message: string
  agentId?: string
  humanMode?: HumanMode
  onChunk?: (chunk: string, fullContent: string) => void
  onComplete?: (fullContent: string, agentId: string, agentName: string) => void
  onError?: (error: string, code: string | null) => void
  onToolStart?: (toolExecution: ToolExecution) => void
  onToolComplete?: (toolExecution: ToolExecution) => void
}

export function useAIResponse() {
  const [state, setState] = useState<StreamingState>({
    isStreaming: false,
    content: '',
    agentId: null,
    agentName: null,
    error: null,
    errorCode: null,
    toolExecution: null,
  })
  const abortControllerRef = useRef<AbortController | null>(null)
  const [recentToolExecutions, setRecentToolExecutions] = useState<ToolExecution[]>([])

  const requestAgentResponse = useCallback(async ({
    swarmId,
    message,
    agentId,
    humanMode,
    onChunk,
    onComplete,
    onError,
    onToolStart,
    onToolComplete,
  }: RequestAgentResponseOptions) => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = new AbortController()

    setState({
      isStreaming: true,
      content: '',
      agentId: null,
      agentName: null,
      error: null,
      errorCode: null,
      toolExecution: null,
    })

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        const error = 'Not authenticated'
        setState(prev => ({ ...prev, isStreaming: false, error, errorCode: 'AUTH_ERROR' }))
        onError?.(error, 'AUTH_ERROR')
        return
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const response = await fetch(`${supabaseUrl}/functions/v1/agent-respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          swarm_id: swarmId,
          message,
          agent_id: agentId,
          human_mode: humanMode,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        const errorMessage = errorData.error || `Request failed with status ${response.status}`
        const errorCode = errorData.code || null
        setState(prev => ({ ...prev, isStreaming: false, error: errorMessage, errorCode }))
        onError?.(errorMessage, errorCode)
        return
      }

      const respondingAgentId = response.headers.get('X-Agent-Id') || null
      const respondingAgentName = response.headers.get('X-Agent-Name')
        ? decodeURIComponent(response.headers.get('X-Agent-Name')!)
        : null

      setState(prev => ({
        ...prev,
        agentId: respondingAgentId,
        agentName: respondingAgentName,
      }))

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }

      const decoder = new TextDecoder()
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value, { stream: true })
        const lines = text.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              setState(prev => ({ ...prev, isStreaming: false }))
              onComplete?.(fullContent, respondingAgentId || '', respondingAgentName || 'Agent')
              return
            }

            try {
              const parsed = JSON.parse(data)
              if (parsed.content) {
                fullContent += parsed.content
                setState(prev => ({ ...prev, content: fullContent }))
                onChunk?.(parsed.content, fullContent)
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }

      setState(prev => ({ ...prev, isStreaming: false }))
      if (fullContent) {
        onComplete?.(fullContent, respondingAgentId || '', respondingAgentName || 'Agent')
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        setState(prev => ({ ...prev, isStreaming: false }))
        return
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to get agent response'
      setState(prev => ({
        ...prev,
        isStreaming: false,
        error: errorMessage,
        errorCode: 'NETWORK_ERROR',
      }))
      onError?.(errorMessage, 'NETWORK_ERROR')
    }
  }, [])

  const cancelResponse = useCallback(() => {
    abortControllerRef.current?.abort()
    setState(prev => ({ ...prev, isStreaming: false }))
  }, [])

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null, errorCode: null }))
  }, [])

  const executeTool = useCallback(async ({
    toolId,
    toolName,
    parameters,
    agentId,
    swarmId,
    onStart,
    onComplete,
    onError,
  }: {
    toolId: string
    toolName: string
    parameters: Record<string, unknown>
    agentId?: string
    swarmId?: string
    onStart?: (execution: ToolExecution) => void
    onComplete?: (execution: ToolExecution) => void
    onError?: (execution: ToolExecution) => void
  }) => {
    const execution: ToolExecution = {
      toolId,
      toolName,
      status: 'running',
      startedAt: new Date(),
      input: parameters,
    }

    setState(prev => ({ ...prev, toolExecution: execution }))
    onStart?.(execution)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('Not authenticated')
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const response = await fetch(`${supabaseUrl}/functions/v1/execute-tool`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          tool_id: toolId,
          parameters,
          agent_id: agentId,
          swarm_id: swarmId,
        }),
      })

      const result = await response.json()

      const completedExecution: ToolExecution = {
        ...execution,
        status: result.success ? 'success' : 'error',
        completedAt: new Date(),
        executionTimeMs: result.execution_time_ms,
        output: result.data,
        error: result.error,
      }

      setState(prev => ({ ...prev, toolExecution: completedExecution }))
      setRecentToolExecutions(prev => [completedExecution, ...prev.slice(0, 9)])

      if (result.success) {
        onComplete?.(completedExecution)
      } else {
        onError?.(completedExecution)
      }

      return completedExecution
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Tool execution failed'
      const errorExecution: ToolExecution = {
        ...execution,
        status: 'error',
        completedAt: new Date(),
        error: errorMessage,
      }

      setState(prev => ({ ...prev, toolExecution: errorExecution }))
      setRecentToolExecutions(prev => [errorExecution, ...prev.slice(0, 9)])
      onError?.(errorExecution)

      return errorExecution
    }
  }, [])

  const clearToolExecution = useCallback(() => {
    setState(prev => ({ ...prev, toolExecution: null }))
  }, [])

  return {
    ...state,
    recentToolExecutions,
    requestAgentResponse,
    cancelResponse,
    clearError,
    executeTool,
    clearToolExecution,
  }
}
