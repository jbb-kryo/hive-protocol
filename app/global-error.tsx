'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, RefreshCw, Home, Copy, Check, MessageSquare } from 'lucide-react'

function generateErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [errorId] = useState(() => error.digest || generateErrorId())
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const isProduction = process.env.NODE_ENV === 'production'
    const logEntry = {
      level: 'error',
      timestamp: new Date().toISOString(),
      error_id: errorId,
      message: 'Critical application error',
      error_name: error.name,
      error_message: error.message,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    }

    if (isProduction) {
      console.error(JSON.stringify(logEntry))
    } else {
      console.error('[CRITICAL] Global error:', logEntry)
    }
  }, [error, errorId])

  const handleCopyErrorId = async () => {
    try {
      await navigator.clipboard.writeText(errorId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const input = document.createElement('input')
      input.value = errorId
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Critical Error - HIVE</title>
        <style>{`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #fafafa;
            color: #171717;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
          }
          @media (prefers-color-scheme: dark) {
            body {
              background-color: #0a0a0a;
              color: #fafafa;
            }
            .card {
              background-color: #171717;
              border-color: #262626;
            }
            .muted {
              color: #a3a3a3;
            }
            .error-id-box {
              background-color: #262626;
            }
            .suggestions {
              background-color: #171717;
              border-color: #262626;
            }
            .border-top {
              border-color: #262626;
            }
          }
          .card {
            max-width: 28rem;
            width: 100%;
            text-align: center;
            background: white;
            border: 1px solid #e5e5e5;
            border-radius: 0.75rem;
            padding: 2rem;
          }
          .icon-wrapper {
            width: 5rem;
            height: 5rem;
            border-radius: 50%;
            background-color: #fef2f2;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1.5rem;
          }
          .icon {
            width: 2.5rem;
            height: 2.5rem;
            color: #dc2626;
          }
          h1 {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 0.75rem;
          }
          .muted {
            color: #737373;
            font-size: 0.875rem;
            line-height: 1.5;
          }
          .error-id-section {
            margin: 1.5rem 0;
          }
          .error-id-label {
            font-size: 0.75rem;
            color: #737373;
            margin-bottom: 0.5rem;
          }
          .error-id-box {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            background-color: #f5f5f5;
            padding: 0.5rem 0.75rem;
            border-radius: 0.375rem;
          }
          .error-id-code {
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 0.75rem;
          }
          .copy-btn {
            background: none;
            border: none;
            cursor: pointer;
            padding: 0.25rem;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #737373;
            transition: color 0.2s;
          }
          .copy-btn:hover {
            color: #171717;
          }
          .copy-btn svg {
            width: 0.875rem;
            height: 0.875rem;
          }
          .copy-success {
            color: #16a34a;
          }
          .error-id-hint {
            font-size: 0.75rem;
            color: #737373;
            margin-top: 0.5rem;
          }
          .buttons {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 0.75rem;
            margin: 1.5rem 0;
          }
          .btn {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 1.25rem;
            border-radius: 0.5rem;
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            text-decoration: none;
          }
          .btn-primary {
            background-color: #171717;
            color: white;
            border: none;
          }
          .btn-primary:hover {
            background-color: #262626;
          }
          .btn-outline {
            background-color: transparent;
            color: #171717;
            border: 1px solid #e5e5e5;
          }
          .btn-outline:hover {
            background-color: #f5f5f5;
          }
          @media (prefers-color-scheme: dark) {
            .btn-primary {
              background-color: #fafafa;
              color: #0a0a0a;
            }
            .btn-primary:hover {
              background-color: #e5e5e5;
            }
            .btn-outline {
              color: #fafafa;
              border-color: #404040;
            }
            .btn-outline:hover {
              background-color: #262626;
            }
            .icon-wrapper {
              background-color: rgba(220, 38, 38, 0.1);
            }
            .copy-btn:hover {
              color: #fafafa;
            }
          }
          .btn svg {
            width: 1rem;
            height: 1rem;
          }
          .suggestions {
            background-color: #fafafa;
            border: 1px solid #e5e5e5;
            border-radius: 0.5rem;
            padding: 1rem;
            text-align: left;
            margin-bottom: 1.5rem;
          }
          .suggestions h3 {
            font-size: 0.875rem;
            font-weight: 500;
            margin-bottom: 0.75rem;
          }
          .suggestions ul {
            list-style: none;
            font-size: 0.875rem;
            color: #737373;
          }
          .suggestions li {
            margin-bottom: 0.5rem;
            padding-left: 1.25rem;
            position: relative;
          }
          .suggestions li::before {
            content: "\\2022";
            position: absolute;
            left: 0;
            color: #a3a3a3;
          }
          .border-top {
            border-top: 1px solid #e5e5e5;
            padding-top: 1.5rem;
          }
          .support-link {
            display: inline-flex;
            align-items: center;
            gap: 0.375rem;
            color: #2563eb;
            text-decoration: none;
            font-size: 0.875rem;
          }
          .support-link:hover {
            text-decoration: underline;
          }
          .support-link svg {
            width: 1rem;
            height: 1rem;
          }
        `}</style>
      </head>
      <body>
        <main className="card">
          <div className="icon-wrapper">
            <AlertTriangle className="icon" />
          </div>

          <h1>Critical Error</h1>
          <p className="muted">
            A critical error occurred that prevented the application from loading. We apologize for the inconvenience.
          </p>

          <div className="error-id-section">
            <p className="error-id-label">Error Reference</p>
            <div className="error-id-box">
              <code className="error-id-code">{errorId}</code>
              <button
                className={`copy-btn ${copied ? 'copy-success' : ''}`}
                onClick={handleCopyErrorId}
                type="button"
                aria-label="Copy error ID"
              >
                {copied ? <Check /> : <Copy />}
              </button>
            </div>
            <p className="error-id-hint">Include this ID when contacting support</p>
          </div>

          <div className="buttons">
            <button onClick={reset} className="btn btn-primary" type="button">
              <RefreshCw />
              Try Again
            </button>
            <a href="/" className="btn btn-outline">
              <Home />
              Go Home
            </a>
          </div>

          <div className="suggestions">
            <h3>What you can try:</h3>
            <ul>
              <li>Refresh the page or try again</li>
              <li>Clear your browser cache and cookies</li>
              <li>Try using a different browser</li>
              <li>Check if the issue persists in an incognito window</li>
            </ul>
          </div>

          <div className="border-top">
            <p className="muted" style={{ marginBottom: '0.75rem' }}>
              If this continues, please contact our support team.
            </p>
            <a href="/contact" className="support-link">
              <MessageSquare />
              Contact Support
            </a>
          </div>
        </main>
      </body>
    </html>
  )
}
