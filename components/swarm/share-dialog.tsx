'use client'

import { useState, useEffect } from 'react'
import { Check, Copy, Globe, Lock, Mail, Users, Link2 } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'

interface SwarmShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  swarmId: string
  currentVisibility: 'private' | 'public'
  currentShareToken: string | null
  currentAllowGuestMessages: boolean
  isOwner: boolean
}

interface ShareAccess {
  id: string
  shared_with_user_id: string
  access_level: 'view' | 'edit'
  created_at: string
  user_email?: string
}

export function SwarmShareDialog({
  open,
  onOpenChange,
  swarmId,
  currentVisibility,
  currentShareToken,
  currentAllowGuestMessages,
  isOwner,
}: SwarmShareDialogProps) {
  const { toast } = useToast()

  const [isLoading, setIsLoading] = useState(false)
  const [visibility, setVisibility] = useState<'private' | 'public'>(currentVisibility)
  const [shareToken, setShareToken] = useState<string | null>(currentShareToken)
  const [allowGuestMessages, setAllowGuestMessages] = useState(currentAllowGuestMessages)
  const [copied, setCopied] = useState(false)
  const [shares, setShares] = useState<ShareAccess[]>([])
  const [inviteEmail, setInviteEmail] = useState('')

  useEffect(() => {
    setVisibility(currentVisibility)
    setShareToken(currentShareToken)
    setAllowGuestMessages(currentAllowGuestMessages)
  }, [currentVisibility, currentShareToken, currentAllowGuestMessages])

  useEffect(() => {
    if (open && isOwner) {
      loadShares()
    }
  }, [open, isOwner, swarmId])

  const loadShares = async () => {
    try {
      const { data, error } = await supabase
        .from('swarm_shares')
        .select('id, shared_with_user_id, access_level, created_at')
        .eq('swarm_id', swarmId)

      if (error) throw error

      if (data && data.length > 0) {
        const userIds = data.map((s) => s.shared_with_user_id).filter(Boolean)
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds)

        const { data: authUsers } = await supabase.auth.admin.listUsers()

        const sharesWithEmail = data.map((share) => ({
          ...share,
          user_email:
            authUsers?.users.find((u) => u.id === share.shared_with_user_id)?.email ||
            'Unknown user',
        }))

        setShares(sharesWithEmail)
      }
    } catch (error) {
      console.error('Error loading shares:', error)
    }
  }

  const generateShareLink = async () => {
    if (!isOwner) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase.rpc('generate_share_token')

      if (error) throw error

      const newToken = data as string

      const { error: updateError } = await supabase
        .from('swarms')
        .update({
          share_token: newToken,
          visibility: 'public',
        })
        .eq('id', swarmId)

      if (updateError) throw updateError

      setShareToken(newToken)
      setVisibility('public')

      toast({
        title: 'Share link generated',
        description: 'Anyone with the link can now view this swarm.',
      })
    } catch (error) {
      console.error('Error generating share link:', error)
      toast({
        title: 'Generation failed',
        description: error instanceof Error ? error.message : 'Failed to generate share link.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updateVisibility = async (newVisibility: 'private' | 'public') => {
    if (!isOwner) return

    setIsLoading(true)
    try {
      if (newVisibility === 'public' && !shareToken) {
        await generateShareLink()
        return
      }

      const { error } = await supabase
        .from('swarms')
        .update({ visibility: newVisibility })
        .eq('id', swarmId)

      if (error) throw error

      setVisibility(newVisibility)

      toast({
        title: 'Visibility updated',
        description: `Swarm is now ${newVisibility}.`,
      })
    } catch (error) {
      console.error('Error updating visibility:', error)
      toast({
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Failed to update visibility.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updateGuestMessages = async (enabled: boolean) => {
    if (!isOwner) return

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('swarms')
        .update({ allow_guest_messages: enabled })
        .eq('id', swarmId)

      if (error) throw error

      setAllowGuestMessages(enabled)

      toast({
        title: 'Settings updated',
        description: `Guest messages are now ${enabled ? 'enabled' : 'disabled'}.`,
      })
    } catch (error) {
      console.error('Error updating guest messages:', error)
      toast({
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Failed to update settings.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyShareLink = () => {
    if (!shareToken) return

    const shareUrl = `${window.location.origin}/swarms/${swarmId}?token=${shareToken}`
    navigator.clipboard.writeText(shareUrl)

    setCopied(true)
    toast({
      title: 'Link copied',
      description: 'Share link copied to clipboard.',
    })

    setTimeout(() => setCopied(false), 2000)
  }

  const revokeAccess = async (shareId: string) => {
    if (!isOwner) return

    try {
      const { error } = await supabase.from('swarm_shares').delete().eq('id', shareId)

      if (error) throw error

      setShares((prev) => prev.filter((s) => s.id !== shareId))

      toast({
        title: 'Access revoked',
        description: 'User access has been removed.',
      })
    } catch (error) {
      console.error('Error revoking access:', error)
      toast({
        title: 'Revoke failed',
        description: error instanceof Error ? error.message : 'Failed to revoke access.',
        variant: 'destructive',
      })
    }
  }

  const shareUrl = shareToken
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/swarms/${swarmId}?token=${shareToken}`
    : ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share Swarm</DialogTitle>
          <DialogDescription>
            {isOwner
              ? 'Manage who can access this swarm and what they can do.'
              : 'View sharing settings for this swarm.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Visibility</Label>
                <p className="text-sm text-muted-foreground">
                  {visibility === 'public'
                    ? 'Anyone with the link can view'
                    : 'Only invited people can access'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={visibility === 'public' ? 'default' : 'secondary'}>
                  {visibility === 'public' ? (
                    <>
                      <Globe className="w-3 h-3 mr-1" />
                      Public
                    </>
                  ) : (
                    <>
                      <Lock className="w-3 h-3 mr-1" />
                      Private
                    </>
                  )}
                </Badge>
                {isOwner && (
                  <Switch
                    checked={visibility === 'public'}
                    onCheckedChange={(checked) =>
                      updateVisibility(checked ? 'public' : 'private')
                    }
                    disabled={isLoading}
                  />
                )}
              </div>
            </div>

            {visibility === 'public' && shareToken && (
              <div className="space-y-2">
                <Label htmlFor="share-link">Share Link</Label>
                <div className="flex gap-2">
                  <Input
                    id="share-link"
                    value={shareUrl}
                    readOnly
                    className="flex-1 font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyShareLink}
                    disabled={isLoading}
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-success" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            {visibility === 'public' && !shareToken && isOwner && (
              <Button
                onClick={generateShareLink}
                disabled={isLoading}
                className="w-full"
                variant="outline"
              >
                <Link2 className="w-4 h-4 mr-2" />
                {isLoading ? 'Generating...' : 'Generate Share Link'}
              </Button>
            )}
          </div>

          {visibility === 'public' && (
            <>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow Guest Messages</Label>
                  <p className="text-sm text-muted-foreground">
                    Let viewers send messages to the swarm
                  </p>
                </div>
                {isOwner && (
                  <Switch
                    checked={allowGuestMessages}
                    onCheckedChange={updateGuestMessages}
                    disabled={isLoading}
                  />
                )}
              </div>
            </>
          )}

          {isOwner && shares.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <Label className="text-base">Shared With</Label>
                <div className="space-y-2">
                  {shares.map((share) => (
                    <div
                      key={share.id}
                      className="flex items-center justify-between p-3 border border-border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{share.user_email}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {share.access_level} access
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => revokeAccess(share.id)}
                        disabled={isLoading}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
