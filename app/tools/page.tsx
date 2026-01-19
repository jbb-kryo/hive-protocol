'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Search,
  Globe,
  Terminal,
  FileText,
  Database,
  Mail,
  Calendar,
  Image,
  Sparkles,
  Plus,
  Loader2,
  Settings,
  Power,
  Pencil,
  Trash2,
  Play,
  MoreVertical,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState } from '@/components/ui/empty-state'
import { DemoBanner } from '@/components/dashboard/demo-banner'
import { ToolConfigDialog } from '@/components/tools/tool-config-dialog'
import { GenerateToolDialog } from '@/components/tools/generate-tool-dialog'
import { EditToolDialog } from '@/components/tools/edit-tool-dialog'
import { DeleteToolDialog } from '@/components/tools/delete-tool-dialog'
import { TestToolDialog } from '@/components/tools/test-tool-dialog'
import { useStore } from '@/store'
import { useTools, type Tool } from '@/hooks/use-tools'

const toolIcons: Record<string, any> = {
  'Web Search': Search,
  'Web Browser': Globe,
  'Code Executor': Terminal,
  'File Operations': FileText,
  'Database Query': Database,
  'Email Sender': Mail,
  'Calendar Manager': Calendar,
  'Image Generator': Image,
}

const iconNameMap: Record<string, any> = {
  'Search': Search,
  'Globe': Globe,
  'Code': Terminal,
  'FileText': FileText,
  'Database': Database,
  'Mail': Mail,
  'Calendar': Calendar,
  'Image': Image,
  'Palette': Image,
  'DollarSign': Database,
  'Shield': Terminal,
  'Wrench': Sparkles,
}

const categories = ['All', 'Research', 'Development', 'Data', 'Communication', 'Productivity', 'Creative', 'Finance', 'Security', 'Custom']

export default function ToolsPage() {
  const { isDemo } = useStore()
  const {
    tools,
    loading,
    userTools,
    userToolsLoading,
    toggleUserTool,
    configureUserTool,
    getUserToolStatus,
    fetchTools,
    fetchUserTools,
    deleteTool,
  } = useTools()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [togglingTools, setTogglingTools] = useState<Set<string>>(new Set())
  const [configDialogOpen, setConfigDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [testDialogOpen, setTestDialogOpen] = useState(false)
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null)
  const [activeTab, setActiveTab] = useState('all')

  const customTools = tools.filter((tool) => tool.is_custom === true)
  const builtInTools = tools.filter((tool) => tool.is_custom !== true)

  const getToolCategory = (tool: Tool): string => {
    return tool.category || tool.capabilities?.category || 'Other'
  }

  const requiresConfig = (tool: Tool): boolean => {
    return tool.capabilities?.requires_config === true
  }

  const isToolEnabled = (toolId: string): boolean => {
    const status = getUserToolStatus(toolId)
    return status?.enabled ?? false
  }

  const getToolConfig = (toolId: string): Record<string, any> => {
    const status = getUserToolStatus(toolId)
    return status?.configuration ?? {}
  }

  const filterTools = (toolList: Tool[]) => {
    return toolList.filter((tool) => {
      const matchesSearch = tool.name.toLowerCase().includes(search.toLowerCase()) ||
        tool.description.toLowerCase().includes(search.toLowerCase())
      const toolCategory = getToolCategory(tool)
      const matchesCategory = category === 'All' || toolCategory === category
      return matchesSearch && matchesCategory
    })
  }

  const filteredBuiltInTools = filterTools(builtInTools)
  const filteredCustomTools = filterTools(customTools)
  const filteredAllTools = filterTools(tools)

  const handleToggleTool = async (tool: Tool) => {
    if (togglingTools.has(tool.id)) return

    const currentlyEnabled = isToolEnabled(tool.id)

    if (!currentlyEnabled && requiresConfig(tool)) {
      setSelectedTool(tool)
      setConfigDialogOpen(true)
      return
    }

    setTogglingTools((prev) => new Set(prev).add(tool.id))
    try {
      await toggleUserTool(tool.id, !currentlyEnabled)
    } finally {
      setTogglingTools((prev) => {
        const next = new Set(prev)
        next.delete(tool.id)
        return next
      })
    }
  }

  const handleConfigureTool = (tool: Tool) => {
    setSelectedTool(tool)
    setConfigDialogOpen(true)
  }

  const handleEditTool = (tool: Tool) => {
    setSelectedTool(tool)
    setEditDialogOpen(true)
  }

  const handleDeleteTool = (tool: Tool) => {
    setSelectedTool(tool)
    setDeleteDialogOpen(true)
  }

  const handleTestTool = (tool: Tool) => {
    setSelectedTool(tool)
    setTestDialogOpen(true)
  }

  const handleSaveConfig = async (config: Record<string, any>) => {
    if (!selectedTool) return
    await configureUserTool(selectedTool.id, config)
  }

  const handleToolSaved = (updatedTool: Tool) => {
    fetchTools()
  }

  const handleToolDeleted = () => {
    fetchTools()
    fetchUserTools()
  }

  const handleToolGenerated = () => {
    fetchTools()
    fetchUserTools()
  }

  const getIcon = (tool: Tool) => {
    if (toolIcons[tool.name]) return toolIcons[tool.name]
    if (tool.icon && iconNameMap[tool.icon]) return iconNameMap[tool.icon]
    return Sparkles
  }

  const renderToolCard = (tool: Tool, index: number, isCustom: boolean = false) => {
    const Icon = getIcon(tool)
    const enabled = isToolEnabled(tool.id)
    const toggling = togglingTools.has(tool.id)
    const needsConfig = requiresConfig(tool)
    const toolCategory = getToolCategory(tool)

    return (
      <motion.div
        key={tool.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
      >
        <Card className={enabled ? '' : 'opacity-60'}>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isCustom ? 'bg-amber-500/10' : 'bg-primary/10'
                }`}>
                  <Icon className={`w-5 h-5 ${isCustom ? 'text-amber-500' : 'text-primary'}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{tool.name}</CardTitle>
                    {isCustom && tool.version && (
                      <Badge variant="outline" className="text-xs">v{tool.version}</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {toolCategory}
                    </Badge>
                    {isCustom && (
                      <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/20">
                        Custom
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isCustom && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleTestTool(tool)}>
                        <Play className="w-4 h-4 mr-2" />
                        Test Tool
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditTool(tool)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit Tool
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDeleteTool(tool)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Tool
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                {toggling ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Switch
                    checked={enabled}
                    onCheckedChange={() => handleToggleTool(tool)}
                    aria-label={`Toggle ${tool.name}`}
                  />
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="line-clamp-2">{tool.description}</CardDescription>
            <div className="flex gap-2 mt-4">
              {needsConfig && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleConfigureTool(tool)}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Configure
                </Button>
              )}
              {isCustom && (
                <Button
                  variant="outline"
                  size="sm"
                  className={needsConfig ? '' : 'flex-1'}
                  onClick={() => handleTestTool(tool)}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Test
                </Button>
              )}
              <Button
                variant={enabled ? 'outline' : 'default'}
                size="sm"
                className={!needsConfig && !isCustom ? 'w-full' : 'flex-1'}
                onClick={() => handleToggleTool(tool)}
                disabled={toggling}
              >
                {toggling ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Power className="w-4 h-4 mr-2" />
                )}
                {enabled ? 'Disable' : 'Enable'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  if (loading || userToolsLoading) {
    return (
      <div className="p-4 lg:p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8">
      {isDemo && <DemoBanner />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Agent Tools and Capabilities</h1>
          <p className="text-muted-foreground">Extend your AI agents' capabilities with custom tools</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Sparkles className="w-4 h-4 mr-2" />
          Generate Tool
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search tools..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.slice(0, 6).map((cat) => (
            <Button
              key={cat}
              variant={category === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCategory(cat)}
            >
              {cat}
            </Button>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                More
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {categories.slice(6).map((cat) => (
                <DropdownMenuItem
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={category === cat ? 'bg-accent' : ''}
                >
                  {cat}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">
            All Tools ({filteredAllTools.length})
          </TabsTrigger>
          <TabsTrigger value="builtin">
            Built-in ({filteredBuiltInTools.length})
          </TabsTrigger>
          <TabsTrigger value="custom">
            Custom ({filteredCustomTools.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {filteredCustomTools.length > 0 && (
            <>
              <div className="mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  Your Custom Tools
                </h2>
                <p className="text-sm text-muted-foreground">Tools you have created</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
                {filteredCustomTools.map((tool, i) => renderToolCard(tool, i, true))}
              </div>
            </>
          )}

          {filteredBuiltInTools.length > 0 && (
            <>
              <div className="mb-4">
                <h2 className="text-lg font-semibold">Built-in Tools</h2>
                <p className="text-sm text-muted-foreground">Pre-configured tools ready to use</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredBuiltInTools.map((tool, i) => renderToolCard(tool, i, false))}
              </div>
            </>
          )}

          {filteredAllTools.length === 0 && (
            <EmptyState
              icon={Search}
              title="No tools found"
              description="Try adjusting your search or filters to find what you're looking for."
              action={{
                label: 'Clear Search',
                onClick: () => setSearch(''),
                variant: 'outline',
              }}
              variant="card"
            />
          )}
        </TabsContent>

        <TabsContent value="builtin">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredBuiltInTools.map((tool, i) => renderToolCard(tool, i, false))}
          </div>
          {filteredBuiltInTools.length === 0 && (
            <EmptyState
              icon={Search}
              title="No built-in tools found"
              description="Try adjusting your search to find built-in tools."
              action={{
                label: 'Clear Search',
                onClick: () => setSearch(''),
                variant: 'outline',
              }}
              variant="card"
            />
          )}
        </TabsContent>

        <TabsContent value="custom">
          {filteredCustomTools.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredCustomTools.map((tool, i) => renderToolCard(tool, i, true))}
            </div>
          ) : (
            <EmptyState
              icon={Sparkles}
              title="Create your first custom tool"
              description="Describe what you need in plain English and let AI generate a custom tool for your agents."
              action={{
                label: 'Create Custom Tool',
                onClick: () => setCreateDialogOpen(true),
              }}
              variant="card"
            />
          )}
        </TabsContent>
      </Tabs>

      {activeTab !== 'custom' && (
        <Card className="mt-8">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Sparkles className="w-16 h-16 text-primary mb-4" />
            <h2 className="text-xl font-semibold mb-2">Auto-Generate Tools</h2>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Describe what you need in plain English, and HIVE will create a custom tool for your agents
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Custom Tool
            </Button>
          </CardContent>
        </Card>
      )}

      <GenerateToolDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onToolGenerated={handleToolGenerated}
      />

      <ToolConfigDialog
        open={configDialogOpen}
        onOpenChange={setConfigDialogOpen}
        tool={selectedTool}
        existingConfig={selectedTool ? getToolConfig(selectedTool.id) : {}}
        onSave={handleSaveConfig}
      />

      <EditToolDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        tool={selectedTool}
        onSave={handleToolSaved}
      />

      <DeleteToolDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        tool={selectedTool}
        onDeleted={handleToolDeleted}
      />

      <TestToolDialog
        open={testDialogOpen}
        onOpenChange={setTestDialogOpen}
        tool={selectedTool}
      />
    </div>
  )
}
