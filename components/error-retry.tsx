'use client'

import { ReactNode } from 'react'
import { AlertCircle, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ErrorRetryProps {
  error: Error | null
  onRetry: () => void
  isRetrying?: boolean
  variant?: 'inline' | 'card' | 'alert'
  title?: string
  description?: string
  children?: ReactNode
}

export function ErrorRetry({
  error,
  onRetry,
  isRetrying = false,
  variant = 'card',
  title = 'Something went wrong',
  description,
  children,
}: ErrorRetryProps) {
  if (!error) {
    return <>{children}</>
  }

  const errorMessage = description || error.message || 'An unexpected error occurred'

  if (variant === 'alert') {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between gap-4">
          <span>{errorMessage}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            disabled={isRetrying}
          >
            <RefreshCcw className={`w-4 h-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Retrying...' : 'Retry'}
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg border border-destructive/30 bg-destructive/5">
        <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{errorMessage}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          disabled={isRetrying}
        >
          <RefreshCcw className={`w-4 h-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
          {isRetrying ? 'Retrying...' : 'Retry'}
        </Button>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
        <CardDescription>{errorMessage}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={onRetry} disabled={isRetrying}>
          <RefreshCcw className={`w-4 h-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
          {isRetrying ? 'Retrying...' : 'Try Again'}
        </Button>
      </CardContent>
    </Card>
  )
}

interface ErrorFallbackProps {
  error: Error
  resetError: () => void
}

export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <ErrorRetry
        error={error}
        onRetry={resetError}
        title="Failed to load content"
        description="We encountered an error while loading this section."
      />
    </div>
  )
}
