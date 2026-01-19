'use client'

import { useState, useEffect, useMemo } from 'react'
import { Search, Plus, Check } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import { getAgentColor } from '@/lib/demo-engine'
import type { Agent } from '@/lib/supabase'

interface AddAgentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  availableAgents: Agent[]
  currentAgentIds: string[]
  onAddAgent: (agentId: string) => Promise<void>
  isLoading?: boolean
}

export function AddAgentDialog({
  open,
  onOpenChange,
  availableAgents,
  currentAgentIds,
  onAddAgent,
  isLoading = false,
}: AddAgentDialogProps) {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (!open) {
      setSearchQuery('')
      setSelectedAgentId(null)
    }
  }, [open])

  const filteredAgents = useMemo(() => {
    const available = availableAgents.filter(
      (agent) => !currentAgentIds.includes(agent.id)
    )

    if (!searchQuery.trim()) {
      return available
    }

    const query = searchQuery.toLowerCase()
    return available.filter(
      (agent) =>
        agent.name.toLowerCase().includes(query) ||
        agent.role?.toLowerCase().includes(query) ||
        agent.framework.toLowerCase().includes(query) ||
        agent.model?.toLowerCase().includes(query)
    )
  }, [availableAgents, currentAgentIds, searchQuery])

  const handleAddAgent = async () => {
    if (!selectedAgentId) return

    setAdding(true)
    try {
      await onAddAgent(selectedAgentId)

      const agent = availableAgents.find((a) => a.id === selectedAgentId)
      toast({
        title: 'Agent added',
        description: `${agent?.name} has been added to the swarm.`,
      })

      onOpenChange(false)
    } catch (error) {
      console.error('Error adding agent:', error)
      toast({
        title: 'Failed to add agent',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setAdding(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Agent to Swarm</DialogTitle>
          <DialogDescription>
            Select an agent to add to this swarm. Agents already in the swarm are hidden.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search agents by name, role, framework..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {filteredAgents.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-8">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  {searchQuery
                    ? 'No agents found matching your search'
                    : 'No available agents to add'}
                </p>
                {!searchQuery && currentAgentIds.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    All your agents are already in this swarm
                  </p>
                )}
              </div>
            </div>
          ) : (
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-2 pr-4">
                {filteredAgents.map((agent) => {
                  const isSelected = selectedAgentId === agent.id
                  return (
                    <button
                      key={agent.id}
                      onClick={() => setSelectedAgentId(agent.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50 hover:bg-muted/50'
                      }`}
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                        style={{ backgroundColor: getAgentColor(agent) }}
                      >
                        {agent.name[0]}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{agent.name}</p>
                          {isSelected && (
                            <Check className="w-4 h-4 text-primary shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {agent.role || 'No role specified'}
                        </p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {agent.framework}
                          </Badge>
                          {agent.model && (
                            <Badge variant="outline" className="text-xs">
                              {agent.model}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAddAgent}
            disabled={!selectedAgentId || adding || isLoading}
          >
            <Plus className="w-4 h-4 mr-2" />
            {adding ? 'Adding...' : 'Add Agent'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
