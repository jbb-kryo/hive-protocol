'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Hexagon } from 'lucide-react'
import { LoadingButton } from '@/components/ui/loading-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { TwoFactorVerifyDialog } from '@/components/auth/two-factor-verify-dialog'
import { signIn, checkTwoFactorEnabled } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showTwoFactor, setShowTwoFactor] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const { user } = await signIn(email, password)

      if (user) {
        const has2FA = await checkTwoFactorEnabled(user.id)
        if (has2FA) {
          setShowTwoFactor(true)
          setIsLoading(false)
          return
        }
      }

      router.push('/dashboard')
    } catch (err) {
      setError('Invalid email or password')
      setIsLoading(false)
    }
  }

  const handleTwoFactorVerified = () => {
    setShowTwoFactor(false)
    router.push('/dashboard')
  }

  const handleTwoFactorCancel = async () => {
    const { signOut } = await import('@/lib/auth')
    await signOut()
    setShowTwoFactor(false)
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
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>Sign in to your account to continue</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <LoadingButton type="submit" className="w-full" loading={isLoading}>
                Sign In
              </LoadingButton>
              <p className="text-sm text-muted-foreground text-center">
                Don't have an account?{' '}
                <Link href="/signup" className="text-primary hover:underline">
                  Sign up
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          New to HIVE?{' '}
          <Link href="/signup" className="text-primary hover:underline">
            Create a free account
          </Link>{' '}
          to get started
        </p>
      </motion.div>

      <TwoFactorVerifyDialog
        open={showTwoFactor}
        onOpenChange={setShowTwoFactor}
        onVerified={handleTwoFactorVerified}
        onCancel={handleTwoFactorCancel}
      />
    </div>
  )
}
