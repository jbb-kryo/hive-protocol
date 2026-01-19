'use client'

import { useState } from 'react'
import { Trash2, AlertTriangle } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import type { Agent } from '@/lib/supabase'
import { getAgentColor } from '@/lib/demo-engine'

interface RemoveAgentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  agent: Agent | null
  onRemoveAgent: (agentId: string) => Promise<void>
  isLastAgent: boolean
}

export function RemoveAgentDialog({
  open,
  onOpenChange,
  agent,
  onRemoveAgent,
  isLastAgent,
}: RemoveAgentDialogProps) {
  const { toast } = useToast()
  const [removing, setRemoving] = useState(false)

  const handleRemove = async () => {
    if (!agent || isLastAgent) return

    setRemoving(true)
    try {
      await onRemoveAgent(agent.id)

      toast({
        title: 'Agent removed',
        description: `${agent.name} has been removed from the swarm.`,
      })

      onOpenChange(false)
    } catch (error) {
      console.error('Error removing agent:', error)
      toast({
        title: 'Failed to remove agent',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setRemoving(false)
    }
  }

  if (!agent) return null

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {isLastAgent ? (
              <>
                <AlertTriangle className="w-5 h-5 text-warning" />
                Cannot Remove Last Agent
              </>
            ) : (
              <>
                <Trash2 className="w-5 h-5 text-destructive" />
                Remove Agent from Swarm
              </>
            )}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              {isLastAgent ? (
                <p>
                  A swarm must have at least one agent. Please add another agent before
                  removing this one.
                </p>
              ) : (
                <>
                  <p>
                    Are you sure you want to remove <strong>{agent.name}</strong> from this
                    swarm?
                  </p>
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                      style={{ backgroundColor: getAgentColor(agent) }}
                    >
                      {agent.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{agent.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {agent.role || 'No role specified'}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    This agent will no longer participate in this swarm's conversations. The
                    agent itself will not be deleted and can be re-added later.
                  </p>
                </>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            {isLastAgent ? 'Close' : 'Cancel'}
          </AlertDialogCancel>
          {!isLastAgent && (
            <AlertDialogAction
              onClick={handleRemove}
              disabled={removing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removing ? 'Removing...' : 'Remove Agent'}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
