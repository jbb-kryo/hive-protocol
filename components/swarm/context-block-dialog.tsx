'use client'

import { useState, useEffect } from 'react'
import { FileText, Link as LinkIcon, Type, AlertCircle } from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import type { ContextBlock } from '@/hooks/use-context'

interface ContextBlockDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingBlock?: ContextBlock | null
  onSave: (block: Omit<ContextBlock, 'id' | 'swarm_id' | 'created_by' | 'created_at'>) => Promise<void>
  mode: 'add' | 'edit'
}

const PRIORITY_CONFIG = {
  critical: {
    label: 'Critical',
    description: 'Always included in agent context',
    color: 'destructive' as const,
  },
  high: {
    label: 'High',
    description: 'Included when available',
    color: 'default' as const,
  },
  medium: {
    label: 'Medium',
    description: 'Included for relevant tasks',
    color: 'secondary' as const,
  },
  low: {
    label: 'Low',
    description: 'Included when space permits',
    color: 'outline' as const,
  },
}

export function ContextBlockDialog({
  open,
  onOpenChange,
  existingBlock,
  onSave,
  mode,
}: ContextBlockDialogProps) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [contextType, setContextType] = useState<'text' | 'link'>('text')
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [priority, setPriority] = useState<ContextBlock['priority']>('medium')
  const [shared, setShared] = useState(true)

  useEffect(() => {
    if (existingBlock) {
      setName(existingBlock.name)
      setContent(existingBlock.content)
      setPriority(existingBlock.priority)
      setShared(existingBlock.shared)

      if (existingBlock.content.startsWith('http://') || existingBlock.content.startsWith('https://')) {
        setContextType('link')
      } else {
        setContextType('text')
      }
    } else {
      setName('')
      setContent('')
      setPriority('medium')
      setShared(true)
      setContextType('text')
    }
  }, [existingBlock, open])

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: 'Name required',
        description: 'Please provide a name for this context block.',
        variant: 'destructive',
      })
      return
    }

    if (!content.trim()) {
      toast({
        title: 'Content required',
        description: 'Please provide content for this context block.',
        variant: 'destructive',
      })
      return
    }

    if (contextType === 'link') {
      try {
        new URL(content)
      } catch {
        toast({
          title: 'Invalid URL',
          description: 'Please provide a valid URL.',
          variant: 'destructive',
        })
        return
      }
    }

    setSaving(true)
    try {
      await onSave({
        name: name.trim(),
        content: content.trim(),
        priority,
        shared,
      })

      toast({
        title: mode === 'add' ? 'Context block added' : 'Context block updated',
        description: `${name} has been ${mode === 'add' ? 'added to' : 'updated in'} the shared context.`,
      })

      onOpenChange(false)
    } catch (error) {
      console.error('Error saving context block:', error)
      toast({
        title: `Failed to ${mode} context block`,
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? 'Add Context Block' : 'Edit Context Block'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'add'
              ? 'Add information that all agents in the swarm can reference.'
              : 'Update the shared context block.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="context-name">Name</Label>
            <Input
              id="context-name"
              placeholder="e.g., Project Requirements, API Documentation"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <Tabs value={contextType} onValueChange={(v) => setContextType(v as 'text' | 'link')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="text" className="flex items-center gap-2">
                <Type className="w-4 h-4" />
                Text Content
              </TabsTrigger>
              <TabsTrigger value="link" className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                Link/URL
              </TabsTrigger>
            </TabsList>

            <TabsContent value="text" className="space-y-2 mt-4">
              <Label htmlFor="context-text">Content</Label>
              <Textarea
                id="context-text"
                placeholder="Enter the text content that agents should have access to..."
                value={contextType === 'text' ? content : ''}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                This content will be available to all agents in the swarm
              </p>
            </TabsContent>

            <TabsContent value="link" className="space-y-2 mt-4">
              <Label htmlFor="context-link">URL</Label>
              <Input
                id="context-link"
                type="url"
                placeholder="https://example.com/documentation"
                value={contextType === 'link' ? content : ''}
                onChange={(e) => setContent(e.target.value)}
              />
              <p className="text-xs text-muted-foreground flex items-start gap-1">
                <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                Agents will be able to reference this URL when needed
              </p>
            </TabsContent>
          </Tabs>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as ContextBlock['priority'])}>
              <SelectTrigger id="priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PRIORITY_CONFIG).reverse().map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <Badge variant={config.color} className="text-xs">
                        {config.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {config.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="shared">Shared with all agents</Label>
              <p className="text-xs text-muted-foreground">
                When enabled, all agents can access this context
              </p>
            </div>
            <Switch
              id="shared"
              checked={shared}
              onCheckedChange={setShared}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : mode === 'add' ? 'Add Context' : 'Update Context'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
