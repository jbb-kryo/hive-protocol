import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface ContextBlock {
  id: string
  swarm_id: string
  name: string
  content: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  shared: boolean
  created_by: string | null
  created_at: string
}

export function useContext() {
  const [contextBlocks, setContextBlocks] = useState<ContextBlock[]>([])
  const [loading, setLoading] = useState(false)

  const fetchContextBlocks = useCallback(async (swarmId: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('context_blocks')
        .select('*')
        .eq('swarm_id', swarmId)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      setContextBlocks(data || [])
      return data || []
    } catch (error) {
      console.error('Error fetching context blocks:', error)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const createContextBlock = async (
    swarmId: string,
    block: Omit<ContextBlock, 'id' | 'swarm_id' | 'created_by' | 'created_at'>
  ) => {
    try {
      const { data, error } = await supabase
        .from('context_blocks')
        .insert([{
          swarm_id: swarmId,
          ...block,
        }])
        .select()
        .single()

      if (error) throw error

      setContextBlocks([data, ...contextBlocks])
      return data
    } catch (error) {
      console.error('Error creating context block:', error)
      throw error
    }
  }

  const updateContextBlock = async (
    id: string,
    updates: Partial<Omit<ContextBlock, 'id' | 'swarm_id' | 'created_by' | 'created_at'>>
  ) => {
    try {
      const { data, error } = await supabase
        .from('context_blocks')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      setContextBlocks(contextBlocks.map(block =>
        block.id === id ? data : block
      ))
      return data
    } catch (error) {
      console.error('Error updating context block:', error)
      throw error
    }
  }

  const deleteContextBlock = async (id: string) => {
    try {
      const { error } = await supabase
        .from('context_blocks')
        .delete()
        .eq('id', id)

      if (error) throw error

      setContextBlocks(contextBlocks.filter(block => block.id !== id))
    } catch (error) {
      console.error('Error deleting context block:', error)
      throw error
    }
  }

  const getContextBlockById = (id: string) => {
    return contextBlocks.find(block => block.id === id)
  }

  const getContextBlocksByPriority = (priority: ContextBlock['priority']) => {
    return contextBlocks.filter(block => block.priority === priority)
  }

  return {
    contextBlocks,
    loading,
    fetchContextBlocks,
    createContextBlock,
    updateContextBlock,
    deleteContextBlock,
    getContextBlockById,
    getContextBlocksByPriority,
  }
}
