import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './use-auth'

export interface FineTuningDataset {
  id: string
  name: string
  description: string
  source_type: string
  agent_ids: string[]
  swarm_ids: string[]
  date_range_start: string | null
  date_range_end: string | null
  total_examples: number
  file_id: string | null
  file_size_bytes: number
  status: string
  error_message: string | null
  created_at: string
  updated_at: string
}

export interface FineTuningJob {
  id: string
  dataset_id: string | null
  name: string
  base_model: string
  hyperparameters: Record<string, unknown>
  openai_job_id: string | null
  status: string
  trained_tokens: number
  epochs: number
  estimated_cost_usd: number
  actual_cost_usd: number
  fine_tuned_model: string | null
  error_message: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface FineTunedModel {
  id: string
  fine_tuning_job_id: string | null
  name: string
  description: string
  openai_model_id: string
  base_model: string
  is_active: boolean
  total_usage_tokens: number
  total_usage_cost_usd: number
  performance_notes: string
  created_at: string
  updated_at: string
}

export function useFineTuning() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [datasets, setDatasets] = useState<FineTuningDataset[]>([])
  const [jobs, setJobs] = useState<FineTuningJob[]>([])
  const [models, setModels] = useState<FineTunedModel[]>([])

  const fetchDatasets = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('fine_tuning_datasets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setDatasets(data || [])
    } catch (error) {
      console.error('Error fetching datasets:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  const fetchJobs = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('fine_tuning_jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setJobs(data || [])
    } catch (error) {
      console.error('Error fetching jobs:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  const fetchModels = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('fine_tuned_models')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setModels(data || [])
    } catch (error) {
      console.error('Error fetching models:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  const createDataset = useCallback(
    async (dataset: {
      name: string
      description: string
      source_type: string
      agent_ids?: string[]
      swarm_ids?: string[]
      date_range_start?: string
      date_range_end?: string
      filters?: Record<string, unknown>
    }) => {
      if (!user?.id) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('fine_tuning_datasets')
        .insert({
          user_id: user.id,
          ...dataset,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    [user?.id]
  )

  const generateTrainingData = useCallback(
    async (datasetId: string) => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-training-data`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ dataset_id: datasetId }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate training data')
      }

      return await response.json()
    },
    []
  )

  const submitFineTuningJob = useCallback(
    async (job: {
      dataset_id: string
      name: string
      base_model: string
      hyperparameters?: Record<string, unknown>
    }) => {
      if (!user?.id) throw new Error('User not authenticated')

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/submit-fine-tuning`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify(job),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit fine-tuning job')
      }

      return await response.json()
    },
    [user?.id]
  )

  const checkJobStatus = useCallback(async (jobId: string) => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/check-fine-tuning-status`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ job_id: jobId }),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to check job status')
    }

    return await response.json()
  }, [])

  const cancelJob = useCallback(async (jobId: string) => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/cancel-fine-tuning`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ job_id: jobId }),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to cancel job')
    }

    return await response.json()
  }, [])

  const deleteDataset = useCallback(
    async (datasetId: string) => {
      const { error } = await supabase
        .from('fine_tuning_datasets')
        .delete()
        .eq('id', datasetId)

      if (error) throw error
    },
    []
  )

  const deleteJob = useCallback(
    async (jobId: string) => {
      const { error } = await supabase
        .from('fine_tuning_jobs')
        .delete()
        .eq('id', jobId)

      if (error) throw error
    },
    []
  )

  const toggleModelActive = useCallback(
    async (modelId: string, isActive: boolean) => {
      const { error } = await supabase
        .from('fine_tuned_models')
        .update({ is_active: isActive })
        .eq('id', modelId)

      if (error) throw error
    },
    []
  )

  const deleteModel = useCallback(
    async (modelId: string) => {
      const { error } = await supabase
        .from('fine_tuned_models')
        .delete()
        .eq('id', modelId)

      if (error) throw error
    },
    []
  )

  const estimateCost = useCallback(
    async (baseModel: string, totalTokens: number, epochs: number = 3) => {
      const { data, error } = await supabase.rpc('calculate_fine_tuning_cost', {
        p_base_model: baseModel,
        p_total_tokens: totalTokens,
        p_epochs: epochs,
      })

      if (error) throw error
      return data as number
    },
    []
  )

  const exportTrainingData = useCallback(
    async (datasetId: string, format: 'jsonl' | 'csv' = 'jsonl') => {
      const { data: examples, error } = await supabase
        .from('fine_tuning_training_examples')
        .select('messages, system_prompt')
        .eq('dataset_id', datasetId)

      if (error) throw error

      if (format === 'jsonl') {
        const jsonl = examples
          .map((ex) => {
            const messages = ex.system_prompt
              ? [{ role: 'system', content: ex.system_prompt }, ...(ex.messages as unknown[])]
              : (ex.messages as unknown[])
            return JSON.stringify({ messages })
          })
          .join('\n')

        const blob = new Blob([jsonl], { type: 'application/jsonl' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `training-data-${datasetId}.jsonl`
        a.click()
        URL.revokeObjectURL(url)
      }
    },
    []
  )

  return {
    loading,
    datasets,
    jobs,
    models,
    fetchDatasets,
    fetchJobs,
    fetchModels,
    createDataset,
    generateTrainingData,
    submitFineTuningJob,
    checkJobStatus,
    cancelJob,
    deleteDataset,
    deleteJob,
    toggleModelActive,
    deleteModel,
    estimateCost,
    exportTrainingData,
  }
}
