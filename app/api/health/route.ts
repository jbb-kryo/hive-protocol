import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const QUERY_TIMEOUT_MS = 5000
const VERSION = '1.0.0'

type ServiceStatus = {
  status: 'healthy' | 'unhealthy' | 'degraded'
  latency_ms?: number
  error?: string
}

type HealthResponse = {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: string
  services: {
    database: ServiceStatus
    auth: ServiceStatus
  }
  version: string
}

async function checkDatabase(): Promise<ServiceStatus> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return { status: 'unhealthy', error: 'Missing database configuration' }
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  const startTime = Date.now()

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), QUERY_TIMEOUT_MS)

    const { error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
      .abortSignal(controller.signal)

    clearTimeout(timeoutId)
    const latency = Date.now() - startTime

    if (error) {
      if (latency >= QUERY_TIMEOUT_MS) {
        return { status: 'degraded', latency_ms: latency, error: 'Query timeout' }
      }
      return { status: 'unhealthy', latency_ms: latency, error: error.message }
    }

    if (latency > 1000) {
      return { status: 'degraded', latency_ms: latency }
    }

    return { status: 'healthy', latency_ms: latency }
  } catch (err) {
    const latency = Date.now() - startTime
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'

    if (errorMessage.includes('aborted')) {
      return { status: 'degraded', latency_ms: latency, error: 'Query timeout' }
    }

    return { status: 'unhealthy', latency_ms: latency, error: errorMessage }
  }
}

async function checkAuth(): Promise<ServiceStatus> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return { status: 'unhealthy', error: 'Missing auth configuration' }
  }

  const startTime = Date.now()

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/health`, {
      headers: {
        'apikey': supabaseKey,
      },
      signal: AbortSignal.timeout(QUERY_TIMEOUT_MS),
    })

    const latency = Date.now() - startTime

    if (!response.ok) {
      return { status: 'unhealthy', latency_ms: latency, error: `Auth service returned ${response.status}` }
    }

    if (latency > 1000) {
      return { status: 'degraded', latency_ms: latency }
    }

    return { status: 'healthy', latency_ms: latency }
  } catch (err) {
    const latency = Date.now() - startTime
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    return { status: 'unhealthy', latency_ms: latency, error: errorMessage }
  }
}

function determineOverallStatus(services: HealthResponse['services']): HealthResponse['status'] {
  const statuses = Object.values(services).map(s => s.status)

  if (statuses.every(s => s === 'healthy')) {
    return 'healthy'
  }

  if (statuses.some(s => s === 'unhealthy')) {
    return 'unhealthy'
  }

  return 'degraded'
}

export async function GET() {
  const [database, auth] = await Promise.all([
    checkDatabase(),
    checkAuth(),
  ])

  const services = { database, auth }
  const overallStatus = determineOverallStatus(services)

  const response: HealthResponse = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    services,
    version: VERSION,
  }

  const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503

  return NextResponse.json(response, {
    status: statusCode,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  })
}
