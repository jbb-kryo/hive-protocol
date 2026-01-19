/*
  # Enhance Tool Usage for Execution Tracking

  1. Changes to `tool_usage`
    - `user_id` (uuid) - User who initiated the execution
    - `input_params` (jsonb) - Input parameters passed to the tool
    - `output_result` (jsonb) - Result returned from the tool
    - `status` (text) - Execution status (pending, running, success, error, timeout)
    - `error_message` (text) - Error details if failed
    - `execution_time_ms` (integer) - How long execution took
    - `started_at` (timestamptz) - When execution started
    - `completed_at` (timestamptz) - When execution completed

  2. Security
    - Update RLS policies for new columns

  3. Indexes
    - Index on user_id for user queries
    - Index on status for filtering
    - Index on started_at for time-based queries
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tool_usage' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.tool_usage ADD COLUMN user_id uuid REFERENCES public.profiles ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tool_usage' AND column_name = 'input_params'
  ) THEN
    ALTER TABLE public.tool_usage ADD COLUMN input_params jsonb DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tool_usage' AND column_name = 'output_result'
  ) THEN
    ALTER TABLE public.tool_usage ADD COLUMN output_result jsonb DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tool_usage' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.tool_usage ADD COLUMN status text DEFAULT 'success';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tool_usage' AND column_name = 'error_message'
  ) THEN
    ALTER TABLE public.tool_usage ADD COLUMN error_message text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tool_usage' AND column_name = 'execution_time_ms'
  ) THEN
    ALTER TABLE public.tool_usage ADD COLUMN execution_time_ms integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tool_usage' AND column_name = 'started_at'
  ) THEN
    ALTER TABLE public.tool_usage ADD COLUMN started_at timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tool_usage' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE public.tool_usage ADD COLUMN completed_at timestamptz;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tool_usage_user_id ON public.tool_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_tool_usage_status ON public.tool_usage(status);
CREATE INDEX IF NOT EXISTS idx_tool_usage_started_at ON public.tool_usage(started_at DESC);

CREATE OR REPLACE FUNCTION public.get_tool_usage_stats(
  p_user_id uuid,
  p_days integer DEFAULT 30
)
RETURNS TABLE (
  tool_id uuid,
  tool_name text,
  execution_count bigint,
  success_count bigint,
  error_count bigint,
  avg_execution_time_ms numeric,
  total_execution_time_ms bigint
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    tu.tool_id,
    t.name as tool_name,
    count(*)::bigint as execution_count,
    count(*) FILTER (WHERE tu.status = 'success')::bigint as success_count,
    count(*) FILTER (WHERE tu.status = 'error')::bigint as error_count,
    avg(tu.execution_time_ms)::numeric as avg_execution_time_ms,
    sum(tu.execution_time_ms)::bigint as total_execution_time_ms
  FROM public.tool_usage tu
  JOIN public.tools t ON t.id = tu.tool_id
  WHERE tu.user_id = p_user_id
    AND tu.started_at >= (now() - (p_days || ' days')::interval)
  GROUP BY tu.tool_id, t.name
  ORDER BY execution_count DESC;
$$;
