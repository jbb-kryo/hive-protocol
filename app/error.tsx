'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, Home, RefreshCw, MessageSquare, Bug, Copy, Check, ArrowLeft, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { logError } from '@/lib/error-logger'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [errorId, setErrorId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const logAndCapture = async () => {
      const id = await logError(error, {
        errorBoundary: true,
        digest: error.digest,
      })
      setErrorId(id)
    }
    logAndCapture()
  }, [error])

  const handleCopyErrorId = async () => {
    const idToCopy = error.digest || errorId
    if (idToCopy) {
      await navigator.clipboard.writeText(idToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const displayErrorId = error.digest || errorId

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12 sm:py-16">
      <div className="w-full max-w-lg mx-auto text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-destructive/10 mb-6">
          <AlertTriangle className="h-10 w-10 text-destructive" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold mb-3">Something went wrong</h1>
        <p className="text-muted-foreground mb-6">
          We apologize for the inconvenience. An unexpected error occurred while processing your request.
        </p>

        {displayErrorId && (
          <div className="mb-6">
            <p className="text-xs text-muted-foreground mb-2">Error Reference</p>
            <div className="inline-flex items-center gap-2 bg-muted px-3 py-2 rounded-md">
              <code className="text-xs font-mono">{displayErrorId}</code>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={handleCopyErrorId}
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Include this ID when contacting support
            </p>
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-3 mb-8">
          <Button onClick={reset} size="lg" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          <Link href="/">
            <Button variant="outline" size="lg" className="gap-2">
              <Home className="h-4 w-4" />
              Go Home
            </Button>
          </Link>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 sm:p-6 text-left mb-6">
          <h3 className="text-sm font-medium mb-3">What you can try:</h3>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li className="flex items-start gap-2">
              <ArrowLeft className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Go back and try the action again</span>
            </li>
            <li className="flex items-start gap-2">
              <RefreshCw className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Refresh the page or clear your browser cache</span>
            </li>
            <li className="flex items-start gap-2">
              <BookOpen className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Check our documentation for guidance</span>
            </li>
          </ul>
        </div>

        <div className="pt-6 border-t">
          <p className="text-sm text-muted-foreground mb-4">
            If this problem persists, please let us know.
          </p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            <Link href="/contact" className="text-sm text-primary hover:underline flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4" />
              Contact Support
            </Link>
            <Link
              href={`/contact?subject=${encodeURIComponent('Error Report')}&message=${encodeURIComponent(`Error ID: ${displayErrorId || 'unknown'}\n\nPlease describe what you were doing when the error occurred:`)}`}
              className="text-sm text-primary hover:underline flex items-center gap-1.5"
            >
              <Bug className="h-4 w-4" />
              Report Issue
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
