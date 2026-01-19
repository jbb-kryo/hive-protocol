'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { MessageSquare, Clock, MoreVertical, Edit, Archive, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import type { Swarm, Agent } from '@/lib/supabase'
import { formatDistanceToNow } from 'date-fns'
import { getAgentColor } from '@/lib/demo-engine'
import { useSwarm } from '@/hooks/use-swarm'
import { useToast } from '@/hooks/use-toast'

interface SwarmCardProps {
  swarm: Swarm
}

export function SwarmCard({ swarm }: SwarmCardProps) {
  const agents = swarm.agents || []
  const router = useRouter()
  const { toast } = useToast()
  const { updateSwarm, deleteSwarm } = useSwarm()

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [editName, setEditName] = useState(swarm.name)
  const [editTask, setEditTask] = useState(swarm.task || '')

  const handleEdit = async () => {
    if (!editName.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter a swarm name.',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      await updateSwarm(swarm.id, {
        name: editName.trim(),
        task: editTask.trim() || null,
      })

      toast({
        title: 'Swarm updated',
        description: 'Swarm has been updated successfully.',
      })
      setEditOpen(false)
    } catch (error) {
      console.error('Error updating swarm:', error)
      toast({
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Failed to update swarm.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleArchive = async () => {
    setIsLoading(true)
    try {
      const newStatus = swarm.status === 'active' ? 'archived' : 'active'
      await updateSwarm(swarm.id, { status: newStatus })

      toast({
        title: swarm.status === 'active' ? 'Swarm archived' : 'Swarm activated',
        description: `Swarm has been ${newStatus === 'active' ? 'activated' : 'archived'} successfully.`,
      })
    } catch (error) {
      console.error('Error archiving swarm:', error)
      toast({
        title: 'Action failed',
        description: error instanceof Error ? error.message : 'Failed to update swarm status.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    setIsLoading(true)
    try {
      await deleteSwarm(swarm.id)

      toast({
        title: 'Swarm deleted',
        description: 'Swarm has been deleted successfully.',
      })
      setDeleteOpen(false)
    } catch (error) {
      console.error('Error deleting swarm:', error)
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Failed to delete swarm.',
        variant: 'destructive',
      })
      setIsLoading(false)
    }
  }

  const handleCardClick = (e: React.MouseEvent) => {
    router.push(`/swarms/${swarm.id}`)
  }

  return (
    <>
      <motion.div whileHover={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}>
        <Card className="group hover:border-primary/50 transition-colors cursor-pointer relative" onClick={handleCardClick}>
          {swarm.status === 'active' && (
            <div className="absolute top-4 right-12">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-success" />
              </span>
            </div>
          )}
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0 pr-2">
                <h3 className="font-semibold group-hover:text-primary transition-colors">
                  {swarm.name}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {swarm.task || 'No task description'}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation()
                    setEditName(swarm.name)
                    setEditTask(swarm.task || '')
                    setEditOpen(true)
                  }}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation()
                    handleArchive()
                  }}>
                    <Archive className="mr-2 h-4 w-4" />
                    {swarm.status === 'active' ? 'Archive' : 'Activate'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteOpen(true)
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex -space-x-2">
                {agents.slice(0, 4).map((agent: Agent) => (
                  <div
                    key={agent.id}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 border-background"
                    style={{ backgroundColor: getAgentColor(agent) }}
                    title={agent.name}
                  >
                    {agent.name[0]}
                  </div>
                ))}
                {agents.length > 4 && (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                    +{agents.length - 4}
                  </div>
                )}
              </div>
              <Badge
                variant={swarm.status === 'active' ? 'default' : 'secondary'}
                className={swarm.status === 'active' ? 'bg-success' : ''}
              >
                {swarm.status}
              </Badge>
            </div>

            <div className="flex gap-4 mt-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4" />
                {swarm.message_count || 0}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatDistanceToNow(new Date(swarm.created_at), { addSuffix: true })}
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Swarm</DialogTitle>
            <DialogDescription>
              Update the swarm name and task description.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                placeholder="Enter swarm name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-task">Task (optional)</Label>
              <Textarea
                id="edit-task"
                placeholder="Describe the swarm's task..."
                value={editTask}
                onChange={(e) => setEditTask(e.target.value)}
                rows={3}
                disabled={isLoading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Swarm</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{swarm.name}"? This action cannot be undone and will
              permanently delete all messages and data associated with this swarm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isLoading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isLoading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
