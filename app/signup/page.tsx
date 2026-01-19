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
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { signUp } from '@/lib/auth'

export default function SignUpPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [tosAccepted, setTosAccepted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [emailVerificationEnabled] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!tosAccepted) {
      setError('You must accept the Terms of Service and Privacy Policy to create an account')
      return
    }

    setIsLoading(true)

    try {
      const data = await signUp(email, password, name, emailVerificationEnabled, tosAccepted)

      if (emailVerificationEnabled && data.user && !data.user.email_confirmed_at) {
        setSuccess('Account created! Please check your email to verify your account.')
      } else {
        router.push('/onboarding')
      }
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
            <CardTitle>Create your account</CardTitle>
            <CardDescription>Get started with HIVE Protocol for free</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 text-sm text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-950 rounded-lg">
                  {success}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
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
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
                <p className="text-xs text-muted-foreground">
                  Must be at least 8 characters
                </p>
              </div>
              <div className="flex items-start space-x-3 pt-2">
                <Checkbox
                  id="tos"
                  checked={tosAccepted}
                  onCheckedChange={(checked) => setTosAccepted(checked === true)}
                  className="mt-0.5"
                />
                <Label htmlFor="tos" className="text-sm font-normal leading-relaxed cursor-pointer">
                  I agree to the{' '}
                  <Link href="/terms" className="text-primary hover:underline" target="_blank">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-primary hover:underline" target="_blank">
                    Privacy Policy
                  </Link>
                </Label>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <LoadingButton type="submit" className="w-full" loading={isLoading}>
                Create Account
              </LoadingButton>
              <p className="text-sm text-muted-foreground text-center">
                Already have an account?{' '}
                <Link href="/login" className="text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>

      </motion.div>
    </div>
  )
}
