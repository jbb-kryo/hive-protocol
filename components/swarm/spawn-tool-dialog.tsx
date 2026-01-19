'use client'

import { useState } from 'react'
import { Wrench, Sparkles, Plus } from 'lucide-react'
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
import { useToast } from '@/hooks/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { Tool } from '@/hooks/use-tools'

interface SpawnToolDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  availableTools: Tool[]
  currentToolIds: string[]
  onCreateTool: (tool: Omit<Tool, 'id' | 'created_by' | 'created_at' | 'updated_at'>) => Promise<Tool>
  onAssignTool: (toolId: string) => Promise<void>
}

const SUGGESTED_TOOLS = [
  {
    name: 'Web Search',
    description: 'Search the web for real-time information and current events',
    capabilities: { type: 'web_search', maxResults: 10 },
  },
  {
    name: 'Code Executor',
    description: 'Execute code snippets in multiple programming languages',
    capabilities: { type: 'code_execution', languages: ['python', 'javascript', 'typescript'] },
  },
  {
    name: 'File Manager',
    description: 'Read, write, and manage files in the workspace',
    capabilities: { type: 'file_management', operations: ['read', 'write', 'delete', 'list'] },
  },
  {
    name: 'API Caller',
    description: 'Make HTTP requests to external APIs',
    capabilities: { type: 'api_client', methods: ['GET', 'POST', 'PUT', 'DELETE'] },
  },
  {
    name: 'Calculator',
    description: 'Perform mathematical calculations and data analysis',
    capabilities: { type: 'calculator', operations: ['basic', 'scientific', 'statistics'] },
  },
]

export function SpawnToolDialog({
  open,
  onOpenChange,
  availableTools,
  currentToolIds,
  onCreateTool,
  onAssignTool,
}: SpawnToolDialogProps) {
  const { toast } = useToast()
  const [creating, setCreating] = useState(false)
  const [assigning, setAssigning] = useState<string | null>(null)
  const [toolName, setToolName] = useState('')
  const [toolDescription, setToolDescription] = useState('')

  const handleCreateAndAssign = async () => {
    if (!toolName.trim() || !toolDescription.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please provide both a name and description for the tool.',
        variant: 'destructive',
      })
      return
    }

    setCreating(true)
    try {
      const newTool = await onCreateTool({
        name: toolName,
        description: toolDescription,
        capabilities: {},
      })

      await onAssignTool(newTool.id)

      toast({
        title: 'Tool spawned',
        description: `${toolName} has been created and added to the swarm.`,
      })

      setToolName('')
      setToolDescription('')
      onOpenChange(false)
    } catch (error) {
      console.error('Error creating tool:', error)
      toast({
        title: 'Failed to spawn tool',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setCreating(false)
    }
  }

  const handleCreateSuggested = async (suggested: typeof SUGGESTED_TOOLS[0]) => {
    setCreating(true)
    try {
      const newTool = await onCreateTool(suggested)
      await onAssignTool(newTool.id)

      toast({
        title: 'Tool spawned',
        description: `${suggested.name} has been added to the swarm.`,
      })

      onOpenChange(false)
    } catch (error) {
      console.error('Error creating suggested tool:', error)
      toast({
        title: 'Failed to spawn tool',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setCreating(false)
    }
  }

  const handleAssignExisting = async (toolId: string) => {
    setAssigning(toolId)
    try {
      await onAssignTool(toolId)

      const tool = availableTools.find(t => t.id === toolId)
      toast({
        title: 'Tool assigned',
        description: `${tool?.name} has been added to the swarm.`,
      })

      onOpenChange(false)
    } catch (error) {
      console.error('Error assigning tool:', error)
      toast({
        title: 'Failed to assign tool',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setAssigning(null)
    }
  }

  const existingTools = availableTools.filter(t => !currentToolIds.includes(t.id))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            Spawn Tool
          </DialogTitle>
          <DialogDescription>
            Add tools to enhance your swarm's capabilities. Create custom tools or use
            suggested templates.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="create">Create Custom</TabsTrigger>
            <TabsTrigger value="suggested">Suggested</TabsTrigger>
            <TabsTrigger value="existing">Existing Tools</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tool-name">Tool Name</Label>
                <Input
                  id="tool-name"
                  placeholder="e.g., Image Generator, Data Analyzer"
                  value={toolName}
                  onChange={(e) => setToolName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tool-description">Description</Label>
                <Textarea
                  id="tool-description"
                  placeholder="Describe what this tool does and what capabilities it provides..."
                  value={toolDescription}
                  onChange={(e) => setToolDescription(e.target.value)}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  The AI will understand the tool's capabilities from your description
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateAndAssign} disabled={creating}>
                {creating ? 'Creating...' : 'Create & Assign'}
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="suggested" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {SUGGESTED_TOOLS.map((tool, index) => (
                  <div
                    key={index}
                    className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Wrench className="w-4 h-4 text-primary shrink-0" />
                          <h4 className="font-medium">{tool.name}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {tool.description}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(tool.capabilities).slice(0, 3).map(([key, value]) => (
                            <Badge key={key} variant="secondary" className="text-xs">
                              {key}: {Array.isArray(value) ? value.length : value}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleCreateSuggested(tool)}
                        disabled={creating}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Spawn
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="existing" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              {existingTools.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <Wrench className="w-12 h-12 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No existing tools available. Create a custom tool or use a suggested template.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {existingTools.map((tool) => (
                    <div
                      key={tool.id}
                      className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Wrench className="w-4 h-4 text-primary shrink-0" />
                            <h4 className="font-medium">{tool.name}</h4>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {tool.description}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleAssignExisting(tool.id)}
                          disabled={assigning === tool.id}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          {assigning === tool.id ? 'Adding...' : 'Assign'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
