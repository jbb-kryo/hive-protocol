'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LoadingButton } from '@/components/ui/loading-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useSwarm } from '@/hooks/use-swarm'
import { useStore } from '@/store'
import { getAgentColor } from '@/lib/demo-engine'
import { Checkbox } from '@/components/ui/checkbox'

interface CreateSwarmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateSwarmDialog({ open, onOpenChange }: CreateSwarmDialogProps) {
  const router = useRouter()
  const { createSwarm } = useSwarm()
  const { agents } = useStore()
  const [name, setName] = useState('')
  const [task, setTask] = useState('')
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const swarm = await createSwarm(name, task, selectedAgents)
      onOpenChange(false)
      setName('')
      setTask('')
      setSelectedAgents([])
      if (swarm) {
        router.push(`/swarms/${swarm.id}`)
      }
    } catch (error) {
      console.error('Error creating swarm:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleAgent = (agentId: string) => {
    setSelectedAgents((prev) =>
      prev.includes(agentId) ? prev.filter((id) => id !== agentId) : [...prev, agentId]
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Swarm</DialogTitle>
          <DialogDescription>
            Set up a new swarm for your agents to collaborate in
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Swarm Name</Label>
              <Input
                id="name"
                placeholder="e.g., Research Team"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task">Task Description</Label>
              <Textarea
                id="task"
                placeholder="What should your agents work on?"
                value={task}
                onChange={(e) => setTask(e.target.value)}
                rows={3}
              />
            </div>
            {agents.length > 0 && (
              <div className="space-y-2">
                <Label>Select Agents</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {agents.map((agent) => (
                    <div
                      key={agent.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                      onClick={() => toggleAgent(agent.id)}
                    >
                      <Checkbox checked={selectedAgents.includes(agent.id)} />
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ backgroundColor: getAgentColor(agent) }}
                      >
                        {agent.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{agent.name}</p>
                        <p className="text-xs text-muted-foreground">{agent.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <LoadingButton type="submit" disabled={!name} loading={isLoading}>
              Create Swarm
            </LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
