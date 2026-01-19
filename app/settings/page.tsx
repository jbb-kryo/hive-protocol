'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, Bell, Shield, CreditCard, Webhook, AlertCircle, Mail, Loader2, Palette, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LoadingButton } from '@/components/ui/loading-button'
import { PageTransition } from '@/components/ui/page-transition'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DemoBanner } from '@/components/dashboard/demo-banner'
import { WebhooksTab } from '@/components/settings/webhooks-tab'
import { AvatarUpload } from '@/components/settings/avatar-upload'
import { PasswordChangeForm } from '@/components/settings/password-change-form'
import { TwoFactorSection } from '@/components/settings/two-factor-section'
import { DeleteAccountDialog } from '@/components/settings/delete-account-dialog'
import { ThemeToggle } from '@/components/settings/theme-toggle'
import { BillingTab } from '@/components/settings/billing-tab'
import { useStore } from '@/store'
import { useProfile } from '@/hooks/use-profile'
import { useNotificationPreferences } from '@/hooks/use-notification-preferences'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'

export default function SettingsPage() {
  const router = useRouter()
  const { isDemo, user } = useStore()
  const { toast } = useToast()
  const { updateProfile, changeEmail, getCurrentEmail, uploadAvatar, loading: profileLoading } = useProfile()
  const {
    preferences: notificationPrefs,
    loading: notificationsLoading,
    saving: notificationsSaving,
    updatePreference
  } = useNotificationPreferences()

  const [isSaving, setIsSaving] = useState(false)
  const [currentEmail, setCurrentEmail] = useState('')
  const [emailPending, setEmailPending] = useState(false)
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
  })
  const [originalValues, setOriginalValues] = useState({
    fullName: '',
    email: '',
  })
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isRestartingOnboarding, setIsRestartingOnboarding] = useState(false)

  const handleRestartOnboarding = async () => {
    if (isDemo) {
      toast({
        title: 'Demo Mode',
        description: 'This feature is not available in demo mode.',
        variant: 'destructive',
      })
      return
    }

    setIsRestartingOnboarding(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated')
      }

      await supabase
        .from('profiles')
        .update({
          onboarding_complete: false,
          onboarding_completed_at: null,
          onboarding_current_step: 1,
          onboarding_progress: {},
        })
        .eq('id', session.user.id)

      toast({
        title: 'Onboarding Reset',
        description: 'You will now be redirected to the onboarding flow.',
      })

      router.push('/onboarding')
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to restart onboarding',
        variant: 'destructive',
      })
      setIsRestartingOnboarding(false)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      const email = await getCurrentEmail()
      if (email) {
        setCurrentEmail(email)
        setProfile((prev) => ({ ...prev, email }))
        setOriginalValues((prev) => ({ ...prev, email }))
      }
    }
    loadData()
  }, [getCurrentEmail])

  useEffect(() => {
    if (user) {
      const fullName = user.full_name || ''
      setProfile((prev) => ({ ...prev, fullName }))
      setOriginalValues((prev) => ({ ...prev, fullName }))
    }
  }, [user])

  const hasChanges = profile.fullName !== originalValues.fullName || profile.email !== originalValues.email
  const emailChanged = profile.email !== originalValues.email && profile.email !== ''

  const handleSaveProfile = async () => {
    if (isDemo) {
      toast({
        title: 'Demo Mode',
        description: 'Profile changes are not saved in demo mode.',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)

    try {
      if (profile.fullName !== originalValues.fullName) {
        await updateProfile({ full_name: profile.fullName || null })
      }

      if (emailChanged) {
        const result = await changeEmail(profile.email)

        if (result.success) {
          if (result.requiresVerification) {
            setEmailPending(true)
            toast({
              title: 'Verification Required',
              description: result.message,
            })
          } else {
            setOriginalValues((prev) => ({ ...prev, email: profile.email }))
          }
        } else {
          toast({
            title: 'Email Change Failed',
            description: result.message,
            variant: 'destructive',
          })
          setProfile((prev) => ({ ...prev, email: originalValues.email }))
          setIsSaving(false)
          return
        }
      }

      if (profile.fullName !== originalValues.fullName) {
        setOriginalValues((prev) => ({ ...prev, fullName: profile.fullName }))
      }

      toast({
        title: 'Profile Updated',
        description: emailChanged
          ? 'Your name has been saved. Check your email to confirm the address change.'
          : 'Your profile has been saved successfully.',
      })
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to save profile',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <PageTransition>
      <div className="p-4 lg:p-8 max-w-4xl">
        {isDemo && <DemoBanner />}

      <div className="mb-8">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="mb-6">
          <TabsTrigger value="profile" className="gap-2">
            <User className="w-4 h-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="w-4 h-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="w-4 h-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2">
            <CreditCard className="w-4 h-4" />
            Billing
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="gap-2">
            <Webhook className="w-4 h-4" />
            Webhooks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <AvatarUpload
                currentAvatarUrl={user?.avatar_url}
                fallbackInitial={profile.fullName?.[0] || user?.full_name?.[0] || 'U'}
                onUpload={async (blob) => {
                  if (isDemo) {
                    toast({
                      title: 'Demo Mode',
                      description: 'Avatar upload is not available in demo mode.',
                      variant: 'destructive',
                    })
                    return null
                  }
                  try {
                    const url = await uploadAvatar(blob)
                    toast({
                      title: 'Avatar Updated',
                      description: 'Your profile picture has been updated.',
                    })
                    return url
                  } catch (err) {
                    toast({
                      title: 'Upload Failed',
                      description: err instanceof Error ? err.message : 'Failed to upload avatar',
                      variant: 'destructive',
                    })
                    throw err
                  }
                }}
                disabled={isDemo || profileLoading}
              />

              {emailPending && (
                <Alert>
                  <Mail className="h-4 w-4" />
                  <AlertDescription>
                    A verification email has been sent. Please check your inbox to confirm your new email address.
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={profile.fullName}
                    onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    placeholder="you@example.com"
                  />
                  {emailChanged && (
                    <p className="text-xs text-amber-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Changing email requires verification
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <p className="text-sm text-muted-foreground">
                  {hasChanges ? 'You have unsaved changes' : 'All changes saved'}
                </p>
                <LoadingButton
                  onClick={handleSaveProfile}
                  disabled={profileLoading || !hasChanges}
                  loading={isSaving}
                >
                  Save Changes
                </LoadingButton>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Onboarding</CardTitle>
              <CardDescription>Re-run the initial setup wizard</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Restart Onboarding</p>
                  <p className="text-sm text-muted-foreground">
                    Go through the setup wizard again to reconfigure your workspace
                  </p>
                </div>
                <LoadingButton
                  variant="outline"
                  onClick={handleRestartOnboarding}
                  loading={isRestartingOnboarding}
                  disabled={isDemo}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Restart
                </LoadingButton>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <ThemeToggle />
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose what updates you want to receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {notificationsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {[
                    { key: 'email_notifications', label: 'Email Notifications', desc: 'Receive updates via email' },
                    { key: 'swarm_updates', label: 'Swarm Updates', desc: 'Get notified when swarms complete tasks' },
                    { key: 'agent_alerts', label: 'Agent Alerts', desc: 'Alerts when agents need attention' },
                    { key: 'weekly_digest', label: 'Weekly Digest', desc: 'Weekly summary of activity' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                      <Switch
                        checked={notificationPrefs[item.key as keyof typeof notificationPrefs]}
                        disabled={notificationsSaving}
                        onCheckedChange={async (checked) => {
                          const success = await updatePreference(
                            item.key as keyof typeof notificationPrefs,
                            checked
                          )
                          if (success) {
                            toast({
                              title: 'Preference Saved',
                              description: `${item.label} ${checked ? 'enabled' : 'disabled'}.`,
                            })
                          } else {
                            toast({
                              title: 'Error',
                              description: 'Failed to save preference. Please try again.',
                              variant: 'destructive',
                            })
                          }
                        }}
                      />
                    </div>
                  ))}
                  {notificationsSaving && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Saving...
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your account security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium mb-4">Change Password</h3>
                <PasswordChangeForm />
              </div>
              <hr className="border-border" />
              <TwoFactorSection />
              <hr className="border-border" />
              <div>
                <h3 className="font-medium mb-2 text-destructive">Danger Zone</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Permanently delete your account and all associated data
                </p>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (isDemo) {
                      toast({
                        title: 'Demo Mode',
                        description: 'Account deletion is not available in demo mode.',
                        variant: 'destructive',
                      })
                      return
                    }
                    setShowDeleteDialog(true)
                  }}
                >
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <BillingTab />
        </TabsContent>

        <TabsContent value="webhooks">
          <WebhooksTab />
        </TabsContent>
      </Tabs>

        <DeleteAccountDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
        />
      </div>
    </PageTransition>
  )
}
