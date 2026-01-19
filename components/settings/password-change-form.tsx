'use client'

import { useState, useMemo } from 'react'
import { Eye, EyeOff, Loader2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { useStore } from '@/store'

interface PasswordRequirement {
  label: string
  test: (password: string) => boolean
}

const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'Contains uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'Contains lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'Contains a number', test: (p) => /\d/.test(p) },
  { label: 'Contains special character', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
]

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  const passedRequirements = PASSWORD_REQUIREMENTS.filter((req) => req.test(password)).length
  const score = (passedRequirements / PASSWORD_REQUIREMENTS.length) * 100

  if (score === 0) return { score: 0, label: '', color: '' }
  if (score <= 20) return { score, label: 'Very Weak', color: 'bg-red-500' }
  if (score <= 40) return { score, label: 'Weak', color: 'bg-orange-500' }
  if (score <= 60) return { score, label: 'Fair', color: 'bg-yellow-500' }
  if (score <= 80) return { score, label: 'Good', color: 'bg-blue-500' }
  return { score, label: 'Strong', color: 'bg-green-500' }
}

export function PasswordChangeForm() {
  const { isDemo } = useStore()
  const { toast } = useToast()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const passwordStrength = useMemo(() => getPasswordStrength(newPassword), [newPassword])
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0
  const allRequirementsMet = PASSWORD_REQUIREMENTS.every((req) => req.test(newPassword))

  const canSubmit =
    currentPassword.length > 0 &&
    allRequirementsMet &&
    passwordsMatch &&
    !isSubmitting

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isDemo) {
      toast({
        title: 'Demo Mode',
        description: 'Password changes are not available in demo mode.',
        variant: 'destructive',
      })
      return
    }

    if (!canSubmit) return

    setIsSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) {
        throw new Error('Unable to verify current user')
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      })

      if (signInError) {
        setError('Current password is incorrect')
        setIsSubmitting(false)
        return
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) {
        throw updateError
      }

      setSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')

      toast({
        title: 'Password Updated',
        description: 'Your password has been changed successfully.',
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update password'
      setError(message)
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setError(null)
    setSuccess(false)
  }

  if (success) {
    return (
      <div className="space-y-4">
        <Alert className="border-green-500/50 bg-green-500/10">
          <Check className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-700 dark:text-green-400">
            Your password has been updated successfully.
          </AlertDescription>
        </Alert>
        <Button variant="outline" onClick={resetForm}>
          Change Password Again
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="current-password">Current Password</Label>
        <div className="relative">
          <Input
            id="current-password"
            type={showCurrentPassword ? 'text' : 'password'}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter your current password"
            disabled={isSubmitting}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
          >
            {showCurrentPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="new-password">New Password</Label>
        <div className="relative">
          <Input
            id="new-password"
            type={showNewPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter your new password"
            disabled={isSubmitting}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
            onClick={() => setShowNewPassword(!showNewPassword)}
          >
            {showNewPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>

        {newPassword.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Password strength</span>
                <span
                  className={
                    passwordStrength.score <= 40
                      ? 'text-red-500'
                      : passwordStrength.score <= 60
                      ? 'text-yellow-500'
                      : 'text-green-500'
                  }
                >
                  {passwordStrength.label}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${passwordStrength.score}%` }}
                />
              </div>
            </div>

            <div className="space-y-1">
              {PASSWORD_REQUIREMENTS.map((req, index) => {
                const passed = req.test(newPassword)
                return (
                  <div
                    key={index}
                    className={`flex items-center gap-2 text-xs ${
                      passed ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
                    }`}
                  >
                    {passed ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                    {req.label}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirm New Password</Label>
        <div className="relative">
          <Input
            id="confirm-password"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your new password"
            disabled={isSubmitting}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
        {confirmPassword.length > 0 && !passwordsMatch && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <X className="h-3 w-3" />
            Passwords do not match
          </p>
        )}
        {passwordsMatch && (
          <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
            <Check className="h-3 w-3" />
            Passwords match
          </p>
        )}
      </div>

      <Button type="submit" disabled={!canSubmit || isDemo}>
        {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Update Password
      </Button>
    </form>
  )
}
