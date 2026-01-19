# Error Handling

This document describes the comprehensive error handling system implemented in the HIVE Protocol application.

## Overview

The application includes a multi-layered error handling system that provides:

1. **Global Error Boundary** - Catches React errors and displays user-friendly error pages
2. **Error Logging Service** - Logs errors to the database for monitoring and analysis
3. **Retry Logic** - Automatically retries failed operations with exponential backoff
4. **User-Friendly Error Messages** - Converts technical errors into readable messages
5. **Toast Notifications** - Non-intrusive error notifications
6. **Admin Dashboard** - View and manage error logs

## Components

### ErrorBoundary

The `ErrorBoundary` component wraps the entire application and catches any unhandled React errors.

```tsx
import { ErrorBoundary } from '@/components/error-boundary'

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

**Features:**
- Displays a user-friendly error page when errors occur
- Logs errors to the database automatically
- Provides a "Try Again" button to reset the error state
- Shows detailed error information in development mode

### ErrorRetry

The `ErrorRetry` component provides inline error displays with retry functionality.

```tsx
import { ErrorRetry } from '@/components/error-retry'

<ErrorRetry
  error={error}
  onRetry={handleRetry}
  isRetrying={isRetrying}
  variant="card" // or "inline" or "alert"
  title="Failed to load data"
  description="We couldn't load the requested data."
/>
```

**Variants:**
- `card` - Full card layout with header and content
- `inline` - Compact inline display
- `alert` - Alert-style banner

## Hooks

### useErrorHandler

A custom hook that provides comprehensive error handling with toast notifications and logging.

```tsx
import { useErrorHandler } from '@/hooks/use-error-handler'

function MyComponent() {
  const { error, handleError, clearError, executeWithRetry, isRetrying } = useErrorHandler({
    showToast: true,
    logToServer: true,
    retryable: true,
    maxRetries: 3,
  })

  const loadData = async () => {
    try {
      const data = await executeWithRetry(async () => {
        const response = await fetch('/api/data')
        if (!response.ok) throw new Error('Failed to load')
        return response.json()
      })
      return data
    } catch (err) {
      handleError(err, { context: 'loading data' })
    }
  }

  return (
    <div>
      {error && <ErrorRetry error={error} onRetry={loadData} isRetrying={isRetrying} />}
    </div>
  )
}
```

**Options:**
- `showToast` - Display toast notifications for errors (default: true)
- `logToServer` - Log errors to the database (default: true)
- `retryable` - Enable retry logic (default: false)
- `maxRetries` - Maximum number of retry attempts (default: 3)
- `onError` - Custom error callback

## Error Logging

### Client-Side Logging

Errors are automatically logged to the database using the `logError` function:

```tsx
import { logError } from '@/lib/error-logger'

try {
  // Your code
} catch (error) {
  await logError(error, {
    componentStack: 'MyComponent',
    userId: user.id,
    additionalContext: 'custom data',
  })
}
```

### Error Log Schema

Error logs are stored in the `error_logs` table with the following structure:

- `id` - Unique identifier
- `user_id` - User who encountered the error
- `error_message` - Error message
- `error_stack` - Stack trace
- `error_name` - Error type
- `url` - URL where error occurred
- `user_agent` - Browser information
- `context` - Additional context (JSON)
- `created_at` - Timestamp
- `resolved` - Resolution status
- `resolved_at` - Resolution timestamp
- `resolved_by` - Admin who resolved
- `notes` - Resolution notes

## Retry Logic

The `withRetry` function provides automatic retry with exponential backoff:

```tsx
import { withRetry } from '@/lib/error-logger'

const result = await withRetry(
  async () => {
    // Your async operation
    return await fetchData()
  },
  {
    maxRetries: 3,
    delayMs: 1000,
    backoff: true, // Exponential backoff
    onRetry: (error, attempt) => {
      console.log(`Retry attempt ${attempt}:`, error)
    },
  }
)
```

**Backoff Strategy:**
- Attempt 1: 1000ms delay
- Attempt 2: 2000ms delay
- Attempt 3: 4000ms delay

## User-Friendly Error Messages

The `getUserFriendlyErrorMessage` function converts technical errors into readable messages:

```tsx
import { getUserFriendlyErrorMessage } from '@/lib/error-logger'

try {
  // Your code
} catch (error) {
  const friendlyMessage = getUserFriendlyErrorMessage(error)
  toast.error(friendlyMessage)
}
```

**Error Mappings:**
- "Failed to fetch" → "Network error. Please check your connection and try again."
- "Invalid credentials" → "Invalid email or password. Please try again."
- "Rate limit exceeded" → "Too many requests. Please wait a moment and try again."
- And many more...

## Admin Dashboard

Admins can view and manage error logs at `/admin/errors`:

**Features:**
- View all error logs
- Filter by status (all, unresolved, resolved)
- Search errors by message, type, or URL
- View error details including stack traces
- Mark errors as resolved with notes
- View top error types
- Real-time statistics

## Best Practices

1. **Always wrap async operations** in try-catch blocks
2. **Use error boundaries** for component-level error handling
3. **Provide context** when logging errors
4. **Show user-friendly messages** instead of technical details
5. **Enable retry logic** for network operations
6. **Monitor error logs** regularly through the admin dashboard
7. **Test error scenarios** during development

## Edge Function Error Handling

Edge functions include built-in error handling with proper HTTP status codes:

```typescript
try {
  // Your code
} catch (error) {
  return new Response(
    JSON.stringify({
      error: getUserFriendlyErrorMessage(error),
      code: 'INTERNAL_ERROR'
    }),
    {
      status: 500,
      headers: corsHeaders,
    }
  )
}
```

## Testing Error Handling

To test error handling in development:

1. Throw an error in a component to test the ErrorBoundary
2. Simulate network errors to test retry logic
3. Check the admin dashboard to verify error logging
4. Test toast notifications for different error types

## Security Considerations

- Error messages never expose sensitive information
- Stack traces are only visible in development mode
- Error logs require authentication to view
- Admin-only access to error management dashboard
