'use client'

import { format } from 'date-fns'
import { ShieldCheck, ShieldX, Clock, User, Bot, Hash, FileJson } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { Message } from '@/lib/supabase'
import { useStore } from '@/store'

interface MessageMetadataDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  message: Message | null
}

export function MessageMetadataDialog({ open, onOpenChange, message }: MessageMetadataDialogProps) {
  const { agents } = useStore()

  if (!message) return null

  const agent = message.sender_id ? agents.find(a => a.id === message.sender_id) : null
  const agentName = (message.metadata as { agent_name?: string })?.agent_name || agent?.name || 'Agent'
  const isHuman = message.sender_type === 'human'
  const isAgent = message.sender_type === 'agent'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Message Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-md">
                {isHuman ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium">Sender</p>
                <p className="text-sm text-muted-foreground">
                  {isHuman ? 'You (Human)' : agentName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-md">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-medium">Timestamp</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(message.created_at), 'PPpp')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-md">
                {message.verified ? (
                  <ShieldCheck className="w-4 h-4 text-success" />
                ) : (
                  <ShieldX className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium">Verification Status</p>
                <div className="flex items-center gap-2">
                  {message.verified ? (
                    <Badge variant="default" className="bg-success/20 text-success hover:bg-success/30">
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      Not Verified
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-md">
                <Hash className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-medium">Message ID</p>
                <p className="text-xs text-muted-foreground font-mono break-all">
                  {message.id}
                </p>
              </div>
            </div>

            {message.signature && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-md">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">Signature</p>
                  <p className="text-xs text-muted-foreground font-mono truncate">
                    {message.signature}
                  </p>
                </div>
              </div>
            )}
          </div>

          {message.metadata && Object.keys(message.metadata).length > 0 && (
            <>
              <Separator />
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileJson className="w-4 h-4" />
                  <p className="text-sm font-medium">Metadata</p>
                </div>
                <ScrollArea className="h-32">
                  <pre className="text-xs bg-muted p-3 rounded-md overflow-auto">
                    {JSON.stringify(message.metadata, null, 2)}
                  </pre>
                </ScrollArea>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
