'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Hexagon, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [validToken, setValidToken] = useState<boolean | null>(null)

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setValidToken(!!session)
    }

    checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setValidToken(true)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error

      setSuccess(true)

      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An error occurred. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (validToken === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (validToken === false) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 relative">
        <div className="absolute inset-0 honeycomb-pattern opacity-20" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md relative z-10"
        >
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <Hexagon className="h-10 w-10 text-primary fill-primary/20" />
              <span className="font-bold text-2xl">HIVE</span>
            </Link>
          </div>

          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-16 w-16 text-destructive mb-4" />
              <h2 className="text-xl font-semibold mb-2">Invalid or Expired Link</h2>
              <p className="text-muted-foreground mb-6">
                This password reset link is invalid or has expired. Please request a new one.
              </p>
              <Button asChild>
                <Link href="/forgot-password">Request New Link</Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <div className="absolute inset-0 honeycomb-pattern opacity-20" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <Hexagon className="h-10 w-10 text-primary fill-primary/20" />
            <span className="font-bold text-2xl">HIVE</span>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Set new password</CardTitle>
            <CardDescription>
              {success
                ? "Your password has been reset successfully"
                : "Enter your new password below"}
            </CardDescription>
          </CardHeader>

          {success ? (
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Your password has been updated successfully.
                </p>
                <p className="text-sm text-muted-foreground">
                  Redirecting to login...
                </p>
              </div>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {error && (
                  <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Must be at least 8 characters
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    disabled={isLoading}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Reset Password
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </motion.div>
    </div>
  )
}
