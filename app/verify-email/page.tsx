'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Hexagon, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams?.get('token')
      const type = searchParams?.get('type')

      if (type !== 'signup' || !token) {
        setStatus('error')
        setMessage('Invalid verification link. Please try again or request a new verification email.')
        return
      }

      try {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'signup',
        })

        if (error) {
          setStatus('error')
          setMessage(error.message || 'Failed to verify email. The link may have expired.')
        } else {
          setStatus('success')
          setMessage('Your email has been verified successfully!')
          setTimeout(() => {
            router.push('/onboarding')
          }, 2000)
        }
      } catch (err) {
        setStatus('error')
        setMessage('An unexpected error occurred. Please try again.')
      }
    }

    verifyEmail()
  }, [searchParams, router])

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
            <CardTitle className="flex items-center gap-2">
              {status === 'loading' && <Loader2 className="h-6 w-6 animate-spin" />}
              {status === 'success' && <CheckCircle2 className="h-6 w-6 text-green-600" />}
              {status === 'error' && <XCircle className="h-6 w-6 text-destructive" />}
              {status === 'loading' && 'Verifying your email...'}
              {status === 'success' && 'Email verified!'}
              {status === 'error' && 'Verification failed'}
            </CardTitle>
            <CardDescription>
              {status === 'loading' && 'Please wait while we verify your email address.'}
              {status === 'success' && 'You will be redirected to complete your profile.'}
              {status === 'error' && 'We encountered an issue verifying your email.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`p-4 rounded-lg ${
              status === 'loading' ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400' :
              status === 'success' ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400' :
              'bg-destructive/10 text-destructive'
            }`}>
              {message}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            {status === 'success' && (
              <Button onClick={() => router.push('/onboarding')} className="w-full">
                Continue to Dashboard
              </Button>
            )}
            {status === 'error' && (
              <>
                <Button onClick={() => router.push('/login')} className="w-full">
                  Go to Login
                </Button>
                <p className="text-sm text-muted-foreground text-center">
                  Need a new verification email?{' '}
                  <Link href="/resend-verification" className="text-primary hover:underline">
                    Resend verification
                  </Link>
                </p>
              </>
            )}
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}
