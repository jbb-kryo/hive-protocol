'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell,
  BellOff,
  AlertCircle,
  ShieldCheck,
  ShieldOff,
  HelpCircle,
  Info,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import type { Swarm } from '@/lib/supabase'
import { useSwarm } from '@/hooks/use-swarm'
import { useToast } from '@/hooks/use-toast'

interface SwarmSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  swarm: Swarm
}

interface NotificationPreferences {
  enabled: boolean
  onNewMessage: boolean
  onAgentJoin: boolean
  onTaskComplete: boolean
  onError: boolean
}

interface VerificationPreferences {
  enabled: boolean
  showBadges: boolean
  showDetails: boolean
  autoVerify: boolean
  warnOnUnsigned: boolean
}

export function SwarmSettingsDialog({ open, onOpenChange, swarm }: SwarmSettingsDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { updateSwarm } = useSwarm()

  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState(swarm.name)
  const [task, setTask] = useState(swarm.task || '')
  const [status, setStatus] = useState<'active' | 'paused' | 'completed'>(
    swarm.status as 'active' | 'paused' | 'completed'
  )
  const [notifications, setNotifications] = useState<NotificationPreferences>(() => {
    const settings = swarm.settings as Record<string, unknown>
    return (settings?.notifications as NotificationPreferences) || {
      enabled: true,
      onNewMessage: true,
      onAgentJoin: true,
      onTaskComplete: true,
      onError: true,
    }
  })
  const [verification, setVerification] = useState<VerificationPreferences>(() => {
    const settings = swarm.settings as Record<string, unknown>
    return (settings?.verification as VerificationPreferences) || {
      enabled: true,
      showBadges: true,
      showDetails: false,
      autoVerify: false,
      warnOnUnsigned: false,
    }
  })
  const [showVerificationHelp, setShowVerificationHelp] = useState(false)

  useEffect(() => {
    setName(swarm.name)
    setTask(swarm.task || '')
    setStatus(swarm.status as 'active' | 'paused' | 'completed')
    const settings = swarm.settings as Record<string, unknown>
    setNotifications(
      (settings?.notifications as NotificationPreferences) || {
        enabled: true,
        onNewMessage: true,
        onAgentJoin: true,
        onTaskComplete: true,
        onError: true,
      }
    )
    setVerification(
      (settings?.verification as VerificationPreferences) || {
        enabled: true,
        showBadges: true,
        showDetails: false,
        autoVerify: false,
        warnOnUnsigned: false,
      }
    )
  }, [swarm])

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter a swarm name.',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      const settings = (swarm.settings as Record<string, unknown>) || {}
      await updateSwarm(swarm.id, {
        name: name.trim(),
        task: task.trim() || null,
        status,
        settings: {
          ...settings,
          notifications,
          verification,
        },
      })

      toast({
        title: 'Settings saved',
        description: 'Swarm settings have been updated successfully.',
      })
      onOpenChange(false)

      if (swarm.status !== status) {
        router.refresh()
      }
    } catch (error) {
      console.error('Error updating swarm settings:', error)
      toast({
        title: 'Save failed',
        description: error instanceof Error ? error.message : 'Failed to save settings.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleNotificationToggle = (key: keyof Omit<NotificationPreferences, 'enabled'>) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleVerificationToggle = (key: keyof Omit<VerificationPreferences, 'enabled'>) => {
    setVerification((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Swarm Settings</DialogTitle>
          <DialogDescription>
            Configure swarm details, security, and notification preferences.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="swarm-name">Name</Label>
              <Input
                id="swarm-name"
                placeholder="Enter swarm name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="swarm-task">Task Description</Label>
              <Textarea
                id="swarm-task"
                placeholder="Describe the swarm's task..."
                value={task}
                onChange={(e) => setTask(e.target.value)}
                rows={3}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="swarm-status">Status</Label>
              <Select
                value={status}
                onValueChange={(value: 'active' | 'paused' | 'completed') => setStatus(value)}
                disabled={isLoading}
              >
                <SelectTrigger id="swarm-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              {status !== swarm.status && (
                <Alert className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {status === 'paused'
                      ? 'Pausing will stop all agent activity in this swarm.'
                      : status === 'completed'
                        ? 'Marking as completed will archive this swarm.'
                        : 'Activating will resume agent activity in this swarm.'}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Label className="text-base">Message Verification</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => setShowVerificationHelp(!showVerificationHelp)}
                        >
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs">
                        <p>Learn more about message verification</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-sm text-muted-foreground">
                  Cryptographic verification of agent messages
                </p>
              </div>
              <Switch
                checked={verification.enabled}
                onCheckedChange={(checked) =>
                  setVerification((prev) => ({ ...prev, enabled: checked }))
                }
                disabled={isLoading}
              />
            </div>

            <Collapsible open={showVerificationHelp} onOpenChange={setShowVerificationHelp}>
              <CollapsibleContent>
                <Alert className="bg-muted/50">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    <strong>How Message Verification Works</strong>
                    <p className="mt-2">
                      Every message sent by an AI agent is automatically signed using HMAC-SHA256
                      cryptography. This creates a unique digital fingerprint of the message
                      content.
                    </p>
                    <p className="mt-2">
                      When you verify a message, the system recalculates this fingerprint and
                      compares it to the stored signature. If they match, you can be confident the
                      message is authentic and unmodified.
                    </p>
                    <p className="mt-2 text-muted-foreground">
                      <strong>Verification statuses:</strong>
                    </p>
                    <ul className="mt-1 space-y-1 text-muted-foreground">
                      <li>
                        <span className="text-emerald-600 dark:text-emerald-400">Verified</span> -
                        Message is authentic
                      </li>
                      <li>
                        <span className="text-blue-600 dark:text-blue-400">Signed</span> - Has
                        signature, not yet verified
                      </li>
                      <li>
                        <span className="text-red-600 dark:text-red-400">Tampered</span> - Content
                        may have been modified
                      </li>
                      <li>
                        <span className="text-amber-600 dark:text-amber-400">Invalid</span> -
                        Signature could not be verified
                      </li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </CollapsibleContent>
            </Collapsible>

            {verification.enabled ? (
              <div className="space-y-3 pl-4 border-l-2 border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                    <Label htmlFor="verify-badges" className="font-normal cursor-pointer">
                      Show verification badges
                    </Label>
                  </div>
                  <Switch
                    id="verify-badges"
                    checked={verification.showBadges}
                    onCheckedChange={() => handleVerificationToggle('showBadges')}
                    disabled={isLoading}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                    <Label htmlFor="verify-details" className="font-normal cursor-pointer">
                      Show detailed verification info
                    </Label>
                  </div>
                  <Switch
                    id="verify-details"
                    checked={verification.showDetails}
                    onCheckedChange={() => handleVerificationToggle('showDetails')}
                    disabled={isLoading}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <Label htmlFor="verify-auto" className="font-normal cursor-pointer">
                        Auto-verify new messages
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Automatically verify messages when loaded
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="verify-auto"
                    checked={verification.autoVerify}
                    onCheckedChange={() => handleVerificationToggle('autoVerify')}
                    disabled={isLoading}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <Label htmlFor="verify-warn" className="font-normal cursor-pointer">
                        Warn on unsigned messages
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Highlight messages without signatures
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="verify-warn"
                    checked={verification.warnOnUnsigned}
                    onCheckedChange={() => handleVerificationToggle('warnOnUnsigned')}
                    disabled={isLoading}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                <ShieldOff className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Message verification is disabled for this swarm
                </p>
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Manage notification preferences for this swarm
                </p>
              </div>
              <Switch
                checked={notifications.enabled}
                onCheckedChange={(checked) =>
                  setNotifications((prev) => ({ ...prev, enabled: checked }))
                }
                disabled={isLoading}
              />
            </div>

            {notifications.enabled ? (
              <div className="space-y-3 pl-4 border-l-2 border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-muted-foreground" />
                    <Label htmlFor="notify-message" className="font-normal cursor-pointer">
                      New messages
                    </Label>
                  </div>
                  <Switch
                    id="notify-message"
                    checked={notifications.onNewMessage}
                    onCheckedChange={() => handleNotificationToggle('onNewMessage')}
                    disabled={isLoading}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-muted-foreground" />
                    <Label htmlFor="notify-agent" className="font-normal cursor-pointer">
                      Agent joins swarm
                    </Label>
                  </div>
                  <Switch
                    id="notify-agent"
                    checked={notifications.onAgentJoin}
                    onCheckedChange={() => handleNotificationToggle('onAgentJoin')}
                    disabled={isLoading}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-muted-foreground" />
                    <Label htmlFor="notify-complete" className="font-normal cursor-pointer">
                      Task completed
                    </Label>
                  </div>
                  <Switch
                    id="notify-complete"
                    checked={notifications.onTaskComplete}
                    onCheckedChange={() => handleNotificationToggle('onTaskComplete')}
                    disabled={isLoading}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-muted-foreground" />
                    <Label htmlFor="notify-error" className="font-normal cursor-pointer">
                      Errors and warnings
                    </Label>
                  </div>
                  <Switch
                    id="notify-error"
                    checked={notifications.onError}
                    onCheckedChange={() => handleNotificationToggle('onError')}
                    disabled={isLoading}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                <BellOff className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Notifications are disabled for this swarm
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
