'use client'

import { useState } from 'react'
import { Send, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/store'

interface BroadcastMessageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BroadcastMessageDialog({ open, onOpenChange }: BroadcastMessageDialogProps) {
  const { swarms } = useStore()
  const { toast } = useToast()
  const [message, setMessage] = useState('')
  const [selectedSwarms, setSelectedSwarms] = useState<string[]>([])
  const [isSending, setIsSending] = useState(false)

  const activeSwarms = swarms.filter((s) => s.status === 'active')

  const handleToggleSwarm = (swarmId: string) => {
    setSelectedSwarms((prev) =>
      prev.includes(swarmId) ? prev.filter((id) => id !== swarmId) : [...prev, swarmId]
    )
  }

  const handleSelectAll = () => {
    if (selectedSwarms.length === activeSwarms.length) {
      setSelectedSwarms([])
    } else {
      setSelectedSwarms(activeSwarms.map((s) => s.id))
    }
  }

  const handleBroadcast = async () => {
    if (!message.trim()) {
      toast({
        title: 'Message required',
        description: 'Please enter a message to broadcast.',
        variant: 'destructive',
      })
      return
    }

    if (selectedSwarms.length === 0) {
      toast({
        title: 'Select swarms',
        description: 'Please select at least one swarm to broadcast to.',
        variant: 'destructive',
      })
      return
    }

    setIsSending(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        throw new Error('Not authenticated')
      }

      const messagesToInsert = selectedSwarms.map((swarmId) => ({
        swarm_id: swarmId,
        sender_id: session.user.id,
        sender_type: 'human',
        content: message.trim(),
        metadata: {
          broadcast: true,
        },
      }))

      const { error } = await supabase.from('messages').insert(messagesToInsert)

      if (error) throw error

      toast({
        title: 'Broadcast sent',
        description: `Message sent to ${selectedSwarms.length} swarm${selectedSwarms.length > 1 ? 's' : ''}.`,
      })

      setMessage('')
      setSelectedSwarms([])
      onOpenChange(false)
    } catch (error) {
      console.error('Error broadcasting message:', error)
      toast({
        title: 'Broadcast failed',
        description: error instanceof Error ? error.message : 'Failed to send broadcast message.',
        variant: 'destructive',
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!isSending) {
      onOpenChange(newOpen)
      if (!newOpen) {
        setMessage('')
        setSelectedSwarms([])
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Broadcast Message</DialogTitle>
          <DialogDescription>
            Send a message to multiple swarms at once.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Enter your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              disabled={isSending}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Select Swarms</Label>
              {activeSwarms.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={isSending}
                >
                  {selectedSwarms.length === activeSwarms.length ? 'Deselect All' : 'Select All'}
                </Button>
              )}
            </div>

            {activeSwarms.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No active swarms available.
              </p>
            ) : (
              <div className="border rounded-md max-h-[200px] overflow-y-auto">
                <div className="p-3 space-y-3">
                  {activeSwarms.map((swarm) => (
                    <div key={swarm.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={swarm.id}
                        checked={selectedSwarms.includes(swarm.id)}
                        onCheckedChange={() => handleToggleSwarm(swarm.id)}
                        disabled={isSending}
                      />
                      <label
                        htmlFor={swarm.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                      >
                        {swarm.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isSending}>
            Cancel
          </Button>
          <Button onClick={handleBroadcast} disabled={isSending}>
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Broadcast
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
