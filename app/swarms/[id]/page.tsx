'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Settings,
  Share,
  Plus,
  Send,
  Eye,
  Users,
  Zap,
  Sparkles,
  ChevronDown,
  X,
  Wrench,
  FileText,
  Edit,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { EmptyState } from '@/components/ui/empty-state'
import { MessageBubble } from '@/components/swarm/message-bubble'
import { TypingIndicator } from '@/components/swarm/typing-indicator'
import { SwarmSettingsDialog } from '@/components/swarm/settings-dialog'
import { SwarmShareDialog } from '@/components/swarm/share-dialog'
import { AddAgentDialog } from '@/components/swarm/add-agent-dialog'
import { RemoveAgentDialog } from '@/components/swarm/remove-agent-dialog'
import { SpawnToolDialog } from '@/components/swarm/spawn-tool-dialog'
import { ContextBlockDialog } from '@/components/swarm/context-block-dialog'
import { DeleteContextDialog } from '@/components/swarm/delete-context-dialog'
import { MessageMetadataDialog } from '@/components/swarm/message-metadata-dialog'
import { FlagMessageDialog } from '@/components/swarm/flag-message-dialog'
import { ToolExecutionIndicator, ToolExecutionList } from '@/components/swarm/tool-execution-indicator'
import { useSwarm } from '@/hooks/use-swarm'
import { useSwarmStatusSubscription, type ConnectionStatus } from '@/hooks/use-swarm-realtime'
import { useStore } from '@/store'
import { useDemo } from '@/hooks/use-demo'
import { useTools } from '@/hooks/use-tools'
import { useContext } from '@/hooks/use-context'
import type { ContextBlock } from '@/hooks/use-context'
import { useAIResponse } from '@/hooks/use-ai-response'
import { getAgentColor } from '@/lib/demo-engine'
import type { Agent, Message } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAgents } from '@/hooks/use-agents'
import { useAgentPresence } from '@/hooks/use-agent-presence'
import { useSwarmPresence } from '@/hooks/use-swarm-presence'
import { StatusIndicator, ActivityIndicator } from '@/components/agents/status-indicator'
import { ViewerAvatars } from '@/components/swarm/viewer-avatars'
import { cn } from '@/lib/utils'
import { Wifi, WifiOff } from 'lucide-react'

type HumanMode = 'observe' | 'collaborate' | 'direct'

const modeConfig = {
  observe: {
    icon: Eye,
    label: 'Observe',
    desc: 'Watch agents work without sending messages',
    color: 'bg-muted text-muted-foreground',
    borderColor: 'border-muted',
    placeholder: 'You are in observation mode - switch modes to send messages',
  },
  collaborate: {
    icon: Users,
    label: 'Collaborate',
    desc: 'Share suggestions that agents can consider and adapt',
    color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    borderColor: 'border-blue-500/30',
    placeholder: 'Share a suggestion or idea...',
  },
  direct: {
    icon: Zap,
    label: 'Direct',
    desc: 'Give commands that agents must follow precisely',
    color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    borderColor: 'border-amber-500/30',
    placeholder: 'Enter a command...',
  },
}

export default function SwarmPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const swarmId = params.id as string
  const shareToken = searchParams.get('token')
  const { currentSwarm, messages, setMessages, sendMessage, fetchSwarm, checkOwnership, addAgentToSwarm, removeAgentFromSwarm } = useSwarm(swarmId)
  const { isDemo, agents, addMessage } = useStore()
  const { agents: allAgents, fetchAgents } = useAgents()
  const { initializeDemo } = useDemo()

  const { connectionStatus, reconnect: reconnectRealtime } = useSwarmStatusSubscription(
    !isDemo && swarmId && !swarmId.startsWith('demo') ? swarmId : undefined,
    {
      onStatusChange: (oldStatus, newStatus) => {
        console.log(`Swarm status changed: ${oldStatus} -> ${newStatus}`)
      },
      onAgentChange: () => {
        if (swarmId) fetchSwarm(swarmId)
      },
      showNotifications: true,
    }
  )
  const { tools, createTool, fetchSwarmTools, assignToolToSwarm, removeToolFromSwarm, logToolUsage } = useTools()
  const { contextBlocks, fetchContextBlocks, createContextBlock, updateContextBlock, deleteContextBlock } = useContext()
  const { getAgentStatus, setAgentThinking, setAgentTyping, setAgentIdle } = useAgentPresence()
  const { otherViewers, activeViewers, totalViewers } = useSwarmPresence(isDemo ? undefined : swarmId)
  const {
    isStreaming,
    content: streamingContent,
    agentId: streamingAgentId,
    agentName: streamingAgentName,
    error: aiError,
    errorCode: aiErrorCode,
    toolExecution,
    recentToolExecutions,
    requestAgentResponse,
    cancelResponse,
    clearError,
    executeTool,
    clearToolExecution,
  } = useAIResponse()

  const [input, setInput] = useState('')
  const [humanMode, setHumanMode] = useState<HumanMode>('collaborate')
  const [isTyping, setIsTyping] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [addAgentOpen, setAddAgentOpen] = useState(false)
  const [removeAgentOpen, setRemoveAgentOpen] = useState(false)
  const [agentToRemove, setAgentToRemove] = useState<Agent | null>(null)
  const [spawnToolOpen, setSpawnToolOpen] = useState(false)
  const [swarmTools, setSwarmTools] = useState<any[]>([])
  const [contextDialogOpen, setContextDialogOpen] = useState(false)
  const [contextDialogMode, setContextDialogMode] = useState<'add' | 'edit'>('add')
  const [editingContext, setEditingContext] = useState<ContextBlock | null>(null)
  const [deleteContextOpen, setDeleteContextOpen] = useState(false)
  const [contextToDelete, setContextToDelete] = useState<ContextBlock | null>(null)
  const [isOwner, setIsOwner] = useState(true)
  const [isReadOnly, setIsReadOnly] = useState(false)
  const [metadataDialogOpen, setMetadataDialogOpen] = useState(false)
  const [flagDialogOpen, setFlagDialogOpen] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [regeneratingMessageId, setRegeneratingMessageId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const swarm = currentSwarm

  const swarmAgents = swarm?.agents || agents.slice(0, 3)

  const verificationSettings = (() => {
    const settings = swarm?.settings as Record<string, unknown> | undefined
    const verification = settings?.verification as {
      enabled?: boolean
      showBadges?: boolean
      showDetails?: boolean
      autoVerify?: boolean
      warnOnUnsigned?: boolean
    } | undefined
    return {
      enabled: verification?.enabled ?? true,
      showBadges: verification?.showBadges ?? true,
      showDetails: verification?.showDetails ?? false,
      autoVerify: verification?.autoVerify ?? false,
      warnOnUnsigned: verification?.warnOnUnsigned ?? false,
    }
  })()

  useEffect(() => {
    if (!isDemo) {
      fetchAgents()
    }
  }, [isDemo, fetchAgents])

  useEffect(() => {
    if (!isDemo && swarmId && !swarmId.startsWith('demo')) {
      fetchSwarmTools(swarmId).then(setSwarmTools)
      fetchContextBlocks(swarmId)
    }
  }, [isDemo, swarmId, fetchSwarmTools, fetchContextBlocks])

  useEffect(() => {
    if (isDemo && swarmId.startsWith('demo')) {
      setIsOwner(true)
      setIsReadOnly(false)
    } else if (shareToken) {
      fetchSwarm(swarmId, shareToken)
      checkOwnership(swarmId).then(owner => {
        setIsOwner(owner)
        setIsReadOnly(!owner)
      })
    } else {
      checkOwnership(swarmId).then(owner => {
        setIsOwner(owner)
        setIsReadOnly(!owner && !swarm?.allow_guest_messages)
      })
    }
  }, [isDemo, swarmId, shareToken, setMessages, fetchSwarm, checkOwnership, fetchAgents, swarm?.allow_guest_messages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])


  const handleSend = async () => {
    if (!input.trim() || humanMode === 'observe' || isReadOnly) return

    const messageContent = input.trim()
    setInput('')
    clearError()

    await sendMessage(messageContent)

    if (!isDemo && swarm && swarmAgents.length > 0) {
      setIsTyping(true)
      const respondingAgent = swarmAgents[0]
      if (respondingAgent) {
        setAgentThinking(respondingAgent.id, swarm.id)
      }
      requestAgentResponse({
        swarmId: swarm.id,
        message: messageContent,
        humanMode,
        onComplete: async (content, agentId, agentName) => {
          setIsTyping(false)
          if (agentId) {
            setAgentIdle(agentId)
          }
          const { data, error } = await supabase
            .from('messages')
            .insert({
              swarm_id: swarm.id,
              sender_id: agentId,
              sender_type: 'agent',
              content,
              metadata: { agent_name: agentName },
            })
            .select()
            .single()

          if (!error && data) {
            addMessage(data)
          }
        },
        onError: () => {
          setIsTyping(false)
          if (respondingAgent) {
            setAgentIdle(respondingAgent.id)
          }
        },
      })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleAddAgent = async (agentId: string) => {
    if (!swarm) return
    await addAgentToSwarm(swarm.id, agentId)
  }

  const handleRemoveAgent = async (agentId: string) => {
    if (!swarm) return
    await removeAgentFromSwarm(swarm.id, agentId)
  }

  const openRemoveDialog = (agent: Agent) => {
    setAgentToRemove(agent)
    setRemoveAgentOpen(true)
  }

  const handleCreateTool = async (tool: any) => {
    const newTool = await createTool(tool)
    return newTool
  }

  const handleAssignTool = async (toolId: string) => {
    if (!swarm) return
    await assignToolToSwarm(swarm.id, toolId)
    const updatedTools = await fetchSwarmTools(swarm.id)
    setSwarmTools(updatedTools)
    await logToolUsage(toolId, swarm.id, 'assigned')
  }

  const handleRemoveTool = async (toolId: string) => {
    if (!swarm) return
    await removeToolFromSwarm(swarm.id, toolId)
    const updatedTools = await fetchSwarmTools(swarm.id)
    setSwarmTools(updatedTools)
    await logToolUsage(toolId, swarm.id, 'removed')
  }

  const handleAddContext = () => {
    setContextDialogMode('add')
    setEditingContext(null)
    setContextDialogOpen(true)
  }

  const handleEditContext = (block: ContextBlock) => {
    setContextDialogMode('edit')
    setEditingContext(block)
    setContextDialogOpen(true)
  }

  const handleSaveContext = async (block: Omit<ContextBlock, 'id' | 'swarm_id' | 'created_by' | 'created_at'>) => {
    if (!swarm) return

    if (contextDialogMode === 'edit' && editingContext) {
      await updateContextBlock(editingContext.id, block)
    } else {
      await createContextBlock(swarm.id, block)
    }

    await fetchContextBlocks(swarm.id)
  }

  const handleDeleteContextClick = (block: ContextBlock) => {
    setContextToDelete(block)
    setDeleteContextOpen(true)
  }

  const handleDeleteContext = async (id: string) => {
    await deleteContextBlock(id)
    if (swarm) {
      await fetchContextBlocks(swarm.id)
    }
  }

  const getPriorityColor = (priority: ContextBlock['priority']) => {
    switch (priority) {
      case 'critical':
        return 'destructive'
      case 'high':
        return 'default'
      case 'medium':
        return 'secondary'
      case 'low':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  const handleViewMetadata = (message: Message) => {
    setSelectedMessage(message)
    setMetadataDialogOpen(true)
  }

  const handleFlagMessage = (message: Message) => {
    setSelectedMessage(message)
    setFlagDialogOpen(true)
  }

  const handleRegenerateMessage = async (message: Message) => {
    if (!swarm || isDemo || !message.sender_id) return

    setRegeneratingMessageId(message.id)
    clearError()

    const messageIndex = messages.findIndex(m => m.id === message.id)
    const previousMessages = messages.slice(0, messageIndex)
    const lastHumanMessage = [...previousMessages].reverse().find(m => m.sender_type === 'human')

    if (!lastHumanMessage) {
      setRegeneratingMessageId(null)
      return
    }

    setIsTyping(true)
    requestAgentResponse({
      swarmId: swarm.id,
      message: lastHumanMessage.content,
      agentId: message.sender_id,
      onComplete: async (content, agentId, agentName) => {
        setIsTyping(false)
        setRegeneratingMessageId(null)

        const { data, error } = await supabase
          .from('messages')
          .insert({
            swarm_id: swarm.id,
            sender_id: agentId,
            sender_type: 'agent',
            content,
            metadata: { agent_name: agentName, regenerated_from: message.id },
          })
          .select()
          .single()

        if (!error && data) {
          addMessage(data)
        }
      },
      onError: () => {
        setIsTyping(false)
        setRegeneratingMessageId(null)
      },
    })
  }

  const availableAgents = allAgents
  const currentAgentIds = swarmAgents.map((a: Agent) => a.id)
  const isLastAgent = swarmAgents.length === 1
  const currentToolIds = swarmTools.map((t: any) => t.id)

  if (!swarm) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading swarm...</p>
      </div>
    )
  }

  const typingAgent = streamingAgentId
    ? swarmAgents.find((a: Agent) => a.id === streamingAgentId) || swarmAgents[0]
    : swarmAgents[Math.floor(Math.random() * swarmAgents.length)]

  const displayAgentName = streamingAgentName || typingAgent?.name || 'Agent'

  return (
    <>
      {swarm && (
        <>
          <SwarmSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} swarm={swarm} />
          <SwarmShareDialog
            open={shareOpen}
            onOpenChange={setShareOpen}
            swarmId={swarm.id}
            currentVisibility={swarm.visibility as 'private' | 'public'}
            currentShareToken={swarm.share_token}
            currentAllowGuestMessages={swarm.allow_guest_messages}
            isOwner={isOwner}
          />
          <AddAgentDialog
            open={addAgentOpen}
            onOpenChange={setAddAgentOpen}
            availableAgents={availableAgents}
            currentAgentIds={currentAgentIds}
            onAddAgent={handleAddAgent}
          />
          <RemoveAgentDialog
            open={removeAgentOpen}
            onOpenChange={setRemoveAgentOpen}
            agent={agentToRemove}
            onRemoveAgent={handleRemoveAgent}
            isLastAgent={isLastAgent}
          />
          <SpawnToolDialog
            open={spawnToolOpen}
            onOpenChange={setSpawnToolOpen}
            availableTools={tools}
            currentToolIds={currentToolIds}
            onCreateTool={handleCreateTool}
            onAssignTool={handleAssignTool}
          />
          <ContextBlockDialog
            open={contextDialogOpen}
            onOpenChange={setContextDialogOpen}
            existingBlock={editingContext}
            onSave={handleSaveContext}
            mode={contextDialogMode}
          />
          <DeleteContextDialog
            open={deleteContextOpen}
            onOpenChange={setDeleteContextOpen}
            contextBlock={contextToDelete}
            onDelete={handleDeleteContext}
          />
          <MessageMetadataDialog
            open={metadataDialogOpen}
            onOpenChange={setMetadataDialogOpen}
            message={selectedMessage}
          />
          <FlagMessageDialog
            open={flagDialogOpen}
            onOpenChange={setFlagDialogOpen}
            message={selectedMessage}
          />
        </>
      )}

      <div className="flex flex-col h-full">
        {isReadOnly && (
          <Alert className="m-4 mb-0">
            <Eye className="h-4 w-4" />
            <AlertDescription>
              You are viewing this swarm in read-only mode. You cannot send messages or modify settings.
            </AlertDescription>
          </Alert>
        )}
        {!isOwner && swarm?.allow_guest_messages && (
          <Alert className="m-4 mb-0">
            <Users className="h-4 w-4" />
            <AlertDescription>
              You have guest access to this swarm. You can send messages but cannot modify settings.
            </AlertDescription>
          </Alert>
        )}
        <header className="border-b border-border p-3 sm:p-4 flex items-center justify-between shrink-0 gap-2">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          <div className="min-w-0 flex-1">
            <h1 className="font-semibold text-sm sm:text-base truncate">{swarm.name}</h1>
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">{swarm.task}</p>
          </div>
          {!isDemo && otherViewers.length > 0 && (
            <div className="hidden md:block border-l border-border pl-4 ml-2">
              <ViewerAvatars
                viewers={otherViewers}
                maxVisible={3}
                size="sm"
              />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="outline" size="sm">
                <Users className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Agents</span>
                <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                  {swarmAgents.length}
                </Badge>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 p-0">
              <div className="h-full overflow-y-auto">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle>Swarm Details</SheetTitle>
                </SheetHeader>
                <div className="p-4 border-b border-border">
                  <h3 className="text-sm font-medium mb-3">Agents ({swarmAgents.length})</h3>
                  <div className="space-y-2">
                    {swarmAgents.map((agent: Agent) => {
                      const agentStatus = getAgentStatus(agent.id)
                      const isThisAgentTyping = streamingAgentId === agent.id && isStreaming
                      return (
                        <div key={agent.id} className="flex items-center gap-2 group">
                          <div className="relative">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                              style={{ backgroundColor: getAgentColor(agent) }}
                            >
                              {agent.name[0]}
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 bg-background rounded-full p-0.5">
                              <StatusIndicator
                                status={isThisAgentTyping ? 'busy' : agentStatus.status}
                                activityType={isThisAgentTyping ? 'typing' : agentStatus.activityType}
                                size="sm"
                                showTooltip={true}
                              />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{agent.name}</p>
                            {isThisAgentTyping ? (
                              <p className="text-xs text-amber-500 truncate">Typing...</p>
                            ) : agentStatus.status === 'busy' && agentStatus.activityType === 'thinking' ? (
                              <p className="text-xs text-amber-500 truncate">Thinking...</p>
                            ) : (
                              <p className="text-xs text-muted-foreground truncate">{agent.role}</p>
                            )}
                          </div>
                          {isOwner && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 shrink-0"
                              onClick={() => openRemoveDialog(agent)}
                              disabled={isReadOnly}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      )
                    })}
                    {isOwner && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setAddAgentOpen(true)}
                        disabled={isReadOnly}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Agent
                      </Button>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium">Shared Context</h3>
                    {isOwner && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={handleAddContext}
                        disabled={isReadOnly}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {swarm?.task && (
                      <Card className="bg-muted/50">
                        <CardContent className="p-3">
                          <p className="text-xs font-medium">Task Objective</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {swarm.task}
                          </p>
                        </CardContent>
                      </Card>
                    )}
                    {contextBlocks.length === 0 && !swarm?.task ? (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        No context blocks yet
                      </p>
                    ) : (
                      contextBlocks.map((block) => (
                        <Card key={block.id} className="bg-muted/50">
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <FileText className="w-3 h-3 text-primary shrink-0" />
                                <p className="text-xs font-medium truncate">{block.name}</p>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <Badge variant={getPriorityColor(block.priority)} className="text-xs h-4 px-1">
                                  {block.priority}
                                </Badge>
                                {isOwner && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-5 w-5 p-0"
                                      onClick={() => handleEditContext(block)}
                                      disabled={isReadOnly}
                                    >
                                      <Edit className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-5 w-5 p-0"
                                      onClick={() => handleDeleteContextClick(block)}
                                      disabled={isReadOnly}
                                    >
                                      <Trash2 className="w-3 h-3 text-destructive" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground break-all">
                              {block.content.length > 100
                                ? `${block.content.substring(0, 100)}...`
                                : block.content}
                            </p>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          {!isDemo && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'h-7 px-2 gap-1.5 hidden sm:flex',
                      connectionStatus === 'connected' && 'text-emerald-500',
                      connectionStatus === 'connecting' && 'text-amber-500',
                      (connectionStatus === 'disconnected' || connectionStatus === 'error') && 'text-red-500'
                    )}
                    onClick={connectionStatus !== 'connected' ? reconnectRealtime : undefined}
                  >
                    {connectionStatus === 'connected' ? (
                      <Wifi className="w-3.5 h-3.5" />
                    ) : (
                      <WifiOff className="w-3.5 h-3.5" />
                    )}
                    <span className="text-xs">
                      {connectionStatus === 'connected' && 'Live'}
                      {connectionStatus === 'connecting' && 'Connecting...'}
                      {connectionStatus === 'disconnected' && 'Offline'}
                      {connectionStatus === 'error' && 'Reconnect'}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {connectionStatus === 'connected' && 'Real-time updates active'}
                  {connectionStatus === 'connecting' && 'Establishing connection...'}
                  {connectionStatus === 'disconnected' && 'Click to reconnect'}
                  {connectionStatus === 'error' && 'Connection failed - click to retry'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <Badge
            variant={swarm.status === 'active' ? 'default' : 'secondary'}
            className={cn(swarm.status === 'active' ? 'bg-success' : '', 'hidden sm:inline-flex')}
          >
            {swarm.status}
          </Badge>
          {isOwner && (
            <>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setSettingsOpen(true)}>
                      <Settings className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Settings</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="h-8 w-8 hidden sm:flex" onClick={() => setShareOpen(true)}>
                      <Share className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Share</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-2 max-w-3xl mx-auto">
              {messages.length === 0 && !isStreaming && !isTyping ? (
                <EmptyState
                  icon={Sparkles}
                  title="Start the conversation"
                  description={
                    currentSwarm?.agents && currentSwarm.agents.length > 0
                      ? humanMode === 'observe'
                        ? "Switch to Collaborate or Direct mode to start the conversation."
                        : "Send a message to begin collaborating with your AI agents."
                      : "Add agents to this swarm to start collaborating."
                  }
                  action={
                    currentSwarm?.agents && currentSwarm.agents.length === 0 && !isReadOnly
                      ? {
                          label: 'Add Agents',
                          onClick: () => setAddAgentOpen(true),
                        }
                      : undefined
                  }
                />
              ) : (
                <>
                  {messages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      onRegenerate={!isDemo && !isReadOnly ? handleRegenerateMessage : undefined}
                      onFlag={!isDemo ? handleFlagMessage : undefined}
                      onViewMetadata={handleViewMetadata}
                      isRegenerating={regeneratingMessageId === message.id}
                      verificationEnabled={verificationSettings.enabled && verificationSettings.showBadges}
                      showSignatureDetails={verificationSettings.showDetails}
                    />
                  ))}
                  <AnimatePresence>
                    {(isTyping || isStreaming) && typingAgent && (
                      <TypingIndicator
                        agentName={displayAgentName}
                        agentColor={getAgentColor(typingAgent)}
                        streamingContent={isStreaming ? streamingContent : undefined}
                      />
                    )}
                  </AnimatePresence>
                  <AnimatePresence>
                    {toolExecution && toolExecution.status === 'running' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="my-2"
                      >
                        <ToolExecutionIndicator
                          execution={toolExecution}
                          onDismiss={clearToolExecution}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {aiError && (
                    <Alert variant="destructive" className="mt-4">
                      <AlertDescription className="flex items-center justify-between">
                        <span>{aiError}</span>
                        <Button variant="ghost" size="sm" onClick={clearError}>
                          <X className="w-4 h-4" />
                        </Button>
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="border-t border-border p-4 shrink-0">
            <div className="max-w-3xl mx-auto space-y-3">
              {!isReadOnly && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground mr-1">Mode:</span>
                  {(Object.entries(modeConfig) as [HumanMode, typeof modeConfig.observe][]).map(([mode, config]) => {
                    const isActive = humanMode === mode
                    const ModeIcon = config.icon
                    return (
                      <TooltipProvider key={mode}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setHumanMode(mode)}
                              className={cn(
                                'h-8 px-3 transition-all',
                                isActive ? config.color : 'hover:bg-muted'
                              )}
                            >
                              <ModeIcon className="w-3.5 h-3.5 mr-1.5" />
                              {config.label}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[200px]">
                            <p>{config.desc}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )
                  })}
                </div>
              )}

              <div className={cn(
                'flex gap-2 p-2 rounded-lg border transition-colors',
                humanMode === 'observe'
                  ? 'bg-muted/50 border-muted'
                  : modeConfig[humanMode].borderColor,
                !isReadOnly && humanMode !== 'observe' && 'bg-background'
              )}>
                {!isReadOnly && humanMode !== 'observe' && (
                  <div className={cn(
                    'flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium shrink-0',
                    modeConfig[humanMode].color
                  )}>
                    {humanMode === 'collaborate' && <Users className="w-3 h-3" />}
                    {humanMode === 'direct' && <Zap className="w-3 h-3" />}
                    {humanMode === 'collaborate' ? 'Suggesting' : 'Commanding'}
                  </div>
                )}
                <Input
                  placeholder={
                    isReadOnly
                      ? 'Read-only mode - you cannot send messages'
                      : isStreaming
                      ? 'Waiting for agent response...'
                      : modeConfig[humanMode].placeholder
                  }
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={humanMode === 'observe' || isReadOnly || isStreaming}
                  className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                {isStreaming ? (
                  <Button variant="ghost" size="sm" onClick={cancelResponse}>
                    <X className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleSend}
                    disabled={humanMode === 'observe' || isReadOnly || !input.trim()}
                    className={cn(
                      humanMode === 'direct' && 'bg-amber-500 hover:bg-amber-600',
                      humanMode === 'collaborate' && 'bg-blue-500 hover:bg-blue-600'
                    )}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {humanMode === 'observe' && !isReadOnly && (
                <p className="text-xs text-center text-muted-foreground">
                  Switch to <button onClick={() => setHumanMode('collaborate')} className="text-blue-500 hover:underline">Collaborate</button> or{' '}
                  <button onClick={() => setHumanMode('direct')} className="text-amber-500 hover:underline">Direct</button> mode to send messages
                </p>
              )}
            </div>
          </div>
        </div>

        <aside className="hidden lg:block w-72 border-l border-border overflow-y-auto">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-medium mb-3">Agents</h3>
            <div className="space-y-2">
              {swarmAgents.map((agent: Agent) => {
                const agentStatus = getAgentStatus(agent.id)
                const isThisAgentTyping = streamingAgentId === agent.id && isStreaming
                return (
                  <div key={agent.id} className="flex items-center gap-2 group">
                    <div className="relative">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={{ backgroundColor: getAgentColor(agent) }}
                      >
                        {agent.name[0]}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 bg-background rounded-full p-0.5">
                        <StatusIndicator
                          status={isThisAgentTyping ? 'busy' : agentStatus.status}
                          activityType={isThisAgentTyping ? 'typing' : agentStatus.activityType}
                          size="sm"
                          showTooltip={true}
                        />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{agent.name}</p>
                      {isThisAgentTyping ? (
                        <p className="text-xs text-amber-500 truncate">Typing...</p>
                      ) : agentStatus.status === 'busy' && agentStatus.activityType === 'thinking' ? (
                        <p className="text-xs text-amber-500 truncate">Thinking...</p>
                      ) : (
                        <p className="text-xs text-muted-foreground truncate">{agent.role}</p>
                      )}
                    </div>
                    {isOwner ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        onClick={() => openRemoveDialog(agent)}
                        disabled={isReadOnly}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    ) : (
                      <StatusIndicator
                        status={agentStatus.status}
                        activityType={agentStatus.activityType}
                        size="sm"
                        showTooltip={true}
                      />
                    )}
                  </div>
                )
              })}
              {isOwner && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => setAddAgentOpen(true)}
                  disabled={isReadOnly}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Agent
                </Button>
              )}
            </div>
          </div>

          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium">Shared Context</h3>
              {isOwner && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={handleAddContext}
                  disabled={isReadOnly}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              )}
            </div>
            <div className="space-y-2">
              {swarm?.task && (
                <Card className="bg-muted/50">
                  <CardContent className="p-3">
                    <p className="text-xs font-medium">Task Objective</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-3">
                      {swarm.task}
                    </p>
                  </CardContent>
                </Card>
              )}
              {contextBlocks.length === 0 && !swarm?.task ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No context blocks yet
                </p>
              ) : (
                contextBlocks.map((block) => (
                  <Card key={block.id} className="bg-muted/50 group">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="w-3 h-3 text-primary shrink-0" />
                          <p className="text-xs font-medium truncate">{block.name}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Badge variant={getPriorityColor(block.priority)} className="text-xs h-4 px-1">
                            {block.priority}
                          </Badge>
                          {isOwner && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleEditContext(block)}
                                disabled={isReadOnly}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleDeleteContextClick(block)}
                                disabled={isReadOnly}
                              >
                                <Trash2 className="w-3 h-3 text-destructive" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 break-all">
                        {block.content.length > 100
                          ? `${block.content.substring(0, 100)}...`
                          : block.content}
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          <div className="p-4">
            <h3 className="text-sm font-medium mb-3">Tools</h3>
            <div className="space-y-2">
              {swarmTools.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No tools assigned yet
                </p>
              ) : (
                swarmTools.map((tool: any) => (
                  <div key={tool.id} className="flex items-center gap-2 text-sm group">
                    <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center shrink-0">
                      <Wrench className="w-3 h-3 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{tool.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{tool.description}</p>
                    </div>
                    {isOwner && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        onClick={() => handleRemoveTool(tool.id)}
                        disabled={isReadOnly}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                ))
              )}
              {isOwner && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-3"
                  onClick={() => setSpawnToolOpen(true)}
                  disabled={isReadOnly}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Spawn Tool
                </Button>
              )}
              {!isDemo && recentToolExecutions.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <ToolExecutionList executions={recentToolExecutions} maxVisible={3} />
                </div>
              )}
            </div>
          </div>

          {!isDemo && totalViewers > 1 && (
            <div className="p-4 border-t border-border">
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Who&apos;s Viewing
              </h3>
              <div className="space-y-2">
                {otherViewers.map((viewer) => (
                  <div key={viewer.user_id} className="flex items-center gap-2">
                    <div className="relative">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white"
                        style={{
                          backgroundColor: viewer.profile?.avatar_url
                            ? undefined
                            : '#' + viewer.user_id.substring(0, 6),
                        }}
                      >
                        {viewer.profile?.avatar_url ? (
                          <img
                            src={viewer.profile.avatar_url}
                            alt={viewer.profile?.full_name ? `${viewer.profile.full_name}'s avatar` : 'User avatar'}
                            className="w-full h-full rounded-full object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          (viewer.profile?.full_name?.[0] || '?').toUpperCase()
                        )}
                      </div>
                      <span
                        className={cn(
                          'absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-background',
                          viewer.is_active ? 'bg-emerald-500' : 'bg-slate-400'
                        )}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">
                        {viewer.profile?.full_name || 'Anonymous'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {viewer.is_active ? 'Active now' : 'Away'}
                      </p>
                    </div>
                  </div>
                ))}
                {otherViewers.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    You&apos;re the only one here
                  </p>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
    </>
  )
}
