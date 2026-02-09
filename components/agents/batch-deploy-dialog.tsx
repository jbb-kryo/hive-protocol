'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Loader2, Check, X, Rocket, Users, ChevronRight,
  AlertCircle, CheckCircle2, XCircle, Bot
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { LoadingButton } from '@/components/ui/loading-button'
import { supabase } from '@/lib/supabase'
import type { Swarm } from '@/lib/supabase'
import type { DefaultAgent } from '@/hooks/use-default-agents'

type DeployStep = 'select' | 'preview' | 'deploying' | 'report'

interface DeployResult {
  swarmId: string
  swarmName: string
  agentId?: string
  success: boolean
  error?: string
}

interface BatchDeployDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: DefaultAgent | null
}

export function BatchDeployDialog({
  open,
  onOpenChange,
  template,
}: BatchDeployDialogProps) {
  const [step, setStep] = useState<DeployStep>('select')
  const [swarms, setSwarms] = useState<Swarm[]>([])
  const [loadingSwarms, setLoadingSwarms] = useState(false)
  const [selectedSwarmIds, setSelectedSwarmIds] = useState<Set<string>>(new Set())
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<DeployResult[]>([])
  const [deploying, setDeploying] = useState(false)

  const fetchSwarms = useCallback(async () => {
    setLoadingSwarms(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('swarms')
        .select('id, name, status, created_at')
        .order('created_at', { ascending: false })

      if (error) throw error
      setSwarms(data as Swarm[] || [])
    } catch {
      setSwarms([])
    } finally {
      setLoadingSwarms(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      setStep('select')
      setSelectedSwarmIds(new Set())
      setProgress(0)
      setResults([])
      setDeploying(false)
      fetchSwarms()
    }
  }, [open, fetchSwarms])

  const toggleSwarm = (swarmId: string) => {
    setSelectedSwarmIds(prev => {
      const next = new Set(prev)
      if (next.has(swarmId)) {
        next.delete(swarmId)
      } else {
        next.add(swarmId)
      }
      return next
    })
  }

  const toggleAll = () => {
    if (selectedSwarmIds.size === swarms.length) {
      setSelectedSwarmIds(new Set())
    } else {
      setSelectedSwarmIds(new Set(swarms.map(s => s.id)))
    }
  }

  const handleDeploy = async () => {
    if (!template || selectedSwarmIds.size === 0) return

    setStep('deploying')
    setDeploying(true)
    setProgress(0)

    const targetSwarms = swarms.filter(s => selectedSwarmIds.has(s.id))
    const deployResults: DeployResult[] = []

    for (let i = 0; i < targetSwarms.length; i++) {
      const swarm = targetSwarms[i]

      try {
        const { data: agent, error: agentError } = await supabase
          .from('agents')
          .insert({
            name: template.name,
            role: template.role,
            framework: template.framework,
            system_prompt: template.system_prompt,
            settings: template.settings || {},
            source_template_id: template.id,
            source_template_version: template.version,
          })
          .select()
          .single()

        if (agentError) throw agentError

        const { error: linkError } = await supabase
          .from('swarm_agents')
          .insert({
            swarm_id: swarm.id,
            agent_id: agent.id,
          })

        if (linkError) throw linkError

        deployResults.push({
          swarmId: swarm.id,
          swarmName: swarm.name,
          agentId: agent.id,
          success: true,
        })
      } catch (err) {
        deployResults.push({
          swarmId: swarm.id,
          swarmName: swarm.name,
          success: false,
          error: err instanceof Error ? err.message : 'Deployment failed',
        })
      }

      setProgress(Math.round(((i + 1) / targetSwarms.length) * 100))
      setResults([...deployResults])
    }

    setDeploying(false)
    setStep('report')
  }

  const successCount = results.filter(r => r.success).length
  const failureCount = results.filter(r => !r.success).length

  if (!template) return null

  return (
    <Dialog open={open} onOpenChange={(v) => {
      if (deploying) return
      onOpenChange(v)
    }}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-primary" />
            {step === 'select' && 'Deploy to Swarms'}
            {step === 'preview' && 'Preview Deployment'}
            {step === 'deploying' && 'Deploying...'}
            {step === 'report' && 'Deployment Report'}
          </DialogTitle>
          <DialogDescription>
            {step === 'select' && `Select swarms to deploy "${template.name}" to`}
            {step === 'preview' && 'Review what will be created before deploying'}
            {step === 'deploying' && 'Creating agents and linking them to swarms'}
            {step === 'report' && 'Deployment completed'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col py-2">
          {step === 'select' && (
            <div className="flex-1 overflow-hidden flex flex-col gap-3">
              <div className="flex items-center gap-2 px-1">
                <Badge variant="outline" className="text-xs font-mono">
                  {template.name}
                </Badge>
                <Badge variant="secondary" className="text-xs font-mono">
                  v{template.version}
                </Badge>
              </div>

              {loadingSwarms ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : swarms.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="w-8 h-8 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">No swarms available</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Create a swarm first to deploy templates to it
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between px-1">
                    <button
                      onClick={toggleAll}
                      className="text-xs text-primary hover:underline"
                    >
                      {selectedSwarmIds.size === swarms.length ? 'Deselect All' : 'Select All'}
                    </button>
                    <span className="text-xs text-muted-foreground">
                      {selectedSwarmIds.size} of {swarms.length} selected
                    </span>
                  </div>

                  <ScrollArea className="flex-1 -mx-6 px-6">
                    <div className="space-y-1.5 pr-4">
                      {swarms.map(swarm => {
                        const isSelected = selectedSwarmIds.has(swarm.id)
                        return (
                          <button
                            key={swarm.id}
                            onClick={() => toggleSwarm(swarm.id)}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                              isSelected
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/30 hover:bg-muted/50'
                            }`}
                          >
                            <Checkbox
                              checked={isSelected}
                              className="pointer-events-none"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{swarm.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Badge
                                  variant={swarm.status === 'active' ? 'default' : 'secondary'}
                                  className="text-[10px] h-4"
                                >
                                  {swarm.status}
                                </Badge>
                                <span className="text-[11px] text-muted-foreground">
                                  {new Date(swarm.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </ScrollArea>
                </>
              )}
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border p-4 bg-muted/30">
                <h4 className="text-sm font-medium mb-2">Template</h4>
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{template.name}</span>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    v{template.version}
                  </Badge>
                </div>
                {template.role && (
                  <p className="text-xs text-muted-foreground mt-1 ml-6">
                    Role: {template.role}
                  </p>
                )}
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">
                  Will deploy to {selectedSwarmIds.size} swarm{selectedSwarmIds.size !== 1 ? 's' : ''}
                </h4>
                <ScrollArea className="max-h-[200px]">
                  <div className="space-y-1.5">
                    {swarms.filter(s => selectedSwarmIds.has(s.id)).map(swarm => (
                      <div
                        key={swarm.id}
                        className="flex items-center gap-2 p-2 rounded-md bg-muted/50 text-sm"
                      >
                        <ChevronRight className="w-3 h-3 text-muted-foreground" />
                        <span className="truncate">{swarm.name}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                <div className="flex gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                      This will create {selectedSwarmIds.size} new agent{selectedSwarmIds.size !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
                      One agent clone per swarm, each linked to the source template.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 'deploying' && (
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Deploying to swarms...
                  </span>
                  <span className="font-mono text-sm">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              <ScrollArea className="max-h-[250px]">
                <div className="space-y-1.5">
                  {results.map((result, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-2 rounded-md text-sm"
                    >
                      {result.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-destructive shrink-0" />
                      )}
                      <span className={`truncate ${result.success ? '' : 'text-destructive'}`}>
                        {result.swarmName}
                      </span>
                    </div>
                  ))}
                  {deploying && (
                    <div className="flex items-center gap-2 p-2 rounded-md text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      <span>Processing...</span>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}

          {step === 'report' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 text-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-emerald-600">{successCount}</p>
                  <p className="text-xs text-emerald-600">Successful</p>
                </div>
                <div className={`rounded-lg border p-4 text-center ${
                  failureCount > 0
                    ? 'border-destructive/30 bg-destructive/5'
                    : 'border-border bg-muted/30'
                }`}>
                  {failureCount > 0 ? (
                    <XCircle className="w-6 h-6 text-destructive mx-auto mb-1" />
                  ) : (
                    <Check className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                  )}
                  <p className={`text-2xl font-bold ${failureCount > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {failureCount}
                  </p>
                  <p className={`text-xs ${failureCount > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    Failed
                  </p>
                </div>
              </div>

              <ScrollArea className="max-h-[250px]">
                <div className="space-y-1.5">
                  {results.map((result, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-2 p-2.5 rounded-md text-sm border ${
                        result.success ? 'border-border' : 'border-destructive/30 bg-destructive/5'
                      }`}
                    >
                      {result.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-destructive shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="truncate block">{result.swarmName}</span>
                        {result.error && (
                          <span className="text-xs text-destructive truncate block">
                            {result.error}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter>
          {step === 'select' && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => setStep('preview')}
                disabled={selectedSwarmIds.size === 0}
              >
                Preview
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </>
          )}
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('select')}>
                Back
              </Button>
              <LoadingButton onClick={handleDeploy} loading={deploying}>
                <Rocket className="w-4 h-4 mr-2" />
                Deploy to {selectedSwarmIds.size} Swarm{selectedSwarmIds.size !== 1 ? 's' : ''}
              </LoadingButton>
            </>
          )}
          {step === 'deploying' && (
            <Button variant="outline" disabled>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Deploying...
            </Button>
          )}
          {step === 'report' && (
            <Button onClick={() => onOpenChange(false)}>
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
