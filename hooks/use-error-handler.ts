import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { logError, getUserFriendlyErrorMessage, withRetry } from '@/lib/error-logger'

interface UseErrorHandlerOptions {
  showToast?: boolean
  logToServer?: boolean
  retryable?: boolean
  maxRetries?: number
  onError?: (error: Error) => void
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const {
    showToast = true,
    logToServer = true,
    retryable = false,
    maxRetries = 3,
    onError,
  } = options

  const [error, setError] = useState<Error | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)

  const handleError = useCallback(
    (err: unknown, context?: Record<string, any>) => {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)

      const friendlyMessage = getUserFriendlyErrorMessage(error)

      if (showToast) {
        toast.error(friendlyMessage, {
          description: context?.description,
          duration: 5000,
        })
      }

      if (logToServer) {
        logError(error, context)
      }

      if (onError) {
        onError(error)
      }

      console.error('Error handled:', error, context)
    },
    [showToast, logToServer, onError]
  )

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const executeWithRetry = useCallback(
    async <T,>(fn: () => Promise<T>, customRetries?: number): Promise<T> => {
      if (!retryable) {
        try {
          return await fn()
        } catch (err) {
          handleError(err)
          throw err
        }
      }

      setIsRetrying(false)

      try {
        return await withRetry(fn, {
          maxRetries: customRetries ?? maxRetries,
          onRetry: (error, attempt) => {
            setIsRetrying(true)
            if (showToast && attempt === 1) {
              toast.info(`Retrying... (Attempt ${attempt})`, {
                duration: 2000,
              })
            }
          },
        })
      } catch (err) {
        handleError(err, { retriesExhausted: true })
        throw err
      } finally {
        setIsRetrying(false)
      }
    },
    [retryable, maxRetries, showToast, handleError]
  )

  return {
    error,
    handleError,
    clearError,
    executeWithRetry,
    isRetrying,
  }
}

export function useAsyncError() {
  const [, setError] = useState()

  return useCallback(
    (error: Error) => {
      setError(() => {
        throw error
      })
    },
    [setError]
  )
}
