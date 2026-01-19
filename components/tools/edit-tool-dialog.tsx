'use client'

import { useState, useEffect } from 'react'
import { Loader2, Save, Code, History, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { supabase } from '@/lib/supabase'
import { type Tool } from '@/hooks/use-tools'

interface EditToolDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tool: Tool | null
  onSave: (tool: Tool) => void
}

interface ToolVersion {
  id: string
  tool_id: string
  version: number
  name: string
  description: string
  input_schema: Record<string, any>
  output_schema: Record<string, any>
  wrapper_code: string
  capabilities: Record<string, any>
  created_at: string
  created_by: string
}

const CATEGORIES = [
  { value: 'Data', label: 'Data Processing' },
  { value: 'Communication', label: 'Communication' },
  { value: 'Development', label: 'Development' },
  { value: 'Research', label: 'Research' },
  { value: 'Productivity', label: 'Productivity' },
  { value: 'Creative', label: 'Creative' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Security', label: 'Security' },
  { value: 'Custom', label: 'Custom' },
]

export function EditToolDialog({ open, onOpenChange, tool, onSave }: EditToolDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [inputSchema, setInputSchema] = useState('')
  const [outputSchema, setOutputSchema] = useState('')
  const [wrapperCode, setWrapperCode] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [versions, setVersions] = useState<ToolVersion[]>([])
  const [loadingVersions, setLoadingVersions] = useState(false)
  const [showVersions, setShowVersions] = useState(false)

  useEffect(() => {
    if (tool && open) {
      setName(tool.name)
      setDescription(tool.description)
      setCategory(tool.category || 'Custom')
      setInputSchema(JSON.stringify(tool.input_schema || {}, null, 2))
      setOutputSchema(JSON.stringify(tool.output_schema || {}, null, 2))
      setWrapperCode(tool.wrapper_code || '')
      setError('')
      fetchVersions()
    }
  }, [tool, open])

  const fetchVersions = async () => {
    if (!tool) return
    setLoadingVersions(true)
    try {
      const { data, error } = await supabase
        .from('tool_versions')
        .select('*')
        .eq('tool_id', tool.id)
        .order('version', { ascending: false })

      if (error) throw error
      setVersions(data || [])
    } catch (err) {
      console.error('Error fetching versions:', err)
    } finally {
      setLoadingVersions(false)
    }
  }

  const validateJson = (str: string): boolean => {
    try {
      JSON.parse(str)
      return true
    } catch {
      return false
    }
  }

  const handleSave = async () => {
    if (!tool) return

    if (!name.trim()) {
      setError('Tool name is required')
      return
    }

    if (!validateJson(inputSchema)) {
      setError('Invalid input schema JSON')
      return
    }

    if (!validateJson(outputSchema)) {
      setError('Invalid output schema JSON')
      return
    }

    setSaving(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const currentVersion = tool.version || 1
      const newVersion = currentVersion + 1

      const { error: versionError } = await supabase
        .from('tool_versions')
        .insert({
          tool_id: tool.id,
          version: currentVersion,
          name: tool.name,
          description: tool.description,
          input_schema: tool.input_schema,
          output_schema: tool.output_schema,
          wrapper_code: tool.wrapper_code,
          capabilities: tool.capabilities,
          created_by: user.id,
        })

      if (versionError) {
        console.error('Version save error:', versionError)
      }

      const updates = {
        name: name.trim(),
        description: description.trim(),
        category,
        input_schema: JSON.parse(inputSchema),
        output_schema: JSON.parse(outputSchema),
        wrapper_code: wrapperCode,
        version: newVersion,
        capabilities: {
          ...tool.capabilities,
          category,
        },
      }

      const { data, error: updateError } = await supabase
        .from('tools')
        .update(updates)
        .eq('id', tool.id)
        .select()
        .single()

      if (updateError) throw updateError

      onSave(data)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save tool')
    } finally {
      setSaving(false)
    }
  }

  const handleRestoreVersion = async (version: ToolVersion) => {
    setName(version.name)
    setDescription(version.description)
    setInputSchema(JSON.stringify(version.input_schema || {}, null, 2))
    setOutputSchema(JSON.stringify(version.output_schema || {}, null, 2))
    setWrapperCode(version.wrapper_code || '')
    setCategory(version.capabilities?.category || 'Custom')
  }

  if (!tool) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Edit Custom Tool
            {tool.version && (
              <Badge variant="outline" className="ml-2">v{tool.version}</Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Modify your custom tool configuration and code.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="schema">Schema</TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 pr-4">
            <TabsContent value="general" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tool Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Custom Tool"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What does this tool do?"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Collapsible open={showVersions} onOpenChange={setShowVersions}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <History className="w-4 h-4" />
                      Version History ({versions.length})
                    </span>
                    {showVersions ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  {loadingVersions ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  ) : versions.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No previous versions
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {versions.map((version) => (
                        <div
                          key={version.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                        >
                          <div>
                            <p className="text-sm font-medium">Version {version.version}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(version.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRestoreVersion(version)}
                          >
                            Restore
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            </TabsContent>

            <TabsContent value="schema" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="inputSchema">Input Schema (JSON)</Label>
                <Textarea
                  id="inputSchema"
                  value={inputSchema}
                  onChange={(e) => setInputSchema(e.target.value)}
                  placeholder='{"type": "object", "properties": {}}'
                  rows={8}
                  className="font-mono text-sm"
                />
                {inputSchema && !validateJson(inputSchema) && (
                  <p className="text-xs text-destructive">Invalid JSON</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="outputSchema">Output Schema (JSON)</Label>
                <Textarea
                  id="outputSchema"
                  value={outputSchema}
                  onChange={(e) => setOutputSchema(e.target.value)}
                  placeholder='{"type": "object", "properties": {}}'
                  rows={8}
                  className="font-mono text-sm"
                />
                {outputSchema && !validateJson(outputSchema) && (
                  <p className="text-xs text-destructive">Invalid JSON</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="code" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="wrapperCode" className="flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  Wrapper Code (TypeScript)
                </Label>
                <Textarea
                  id="wrapperCode"
                  value={wrapperCode}
                  onChange={(e) => setWrapperCode(e.target.value)}
                  placeholder="// Tool implementation code"
                  rows={20}
                  className="font-mono text-sm"
                />
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
            {error}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
