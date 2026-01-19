'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Hexagon,
  User,
  Users,
  Code,
  Bot,
  Brain,
  Cpu,
  Server,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  AlertCircle,
  Sparkles,
  X,
  CheckCircle2,
  PartyPopper,
  LogIn,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { updateProfile } from '@/lib/auth'
import { useAgents } from '@/hooks/use-agents'
import { useSwarm } from '@/hooks/use-swarm'
import { useGuest } from '@/hooks/use-guest'
import { useStore } from '@/store'
import { supabase } from '@/lib/supabase'

const useCases = [
  { id: 'personal', icon: User, label: 'Personal Projects', desc: 'Individual AI workflows' },
  { id: 'team', icon: Users, label: 'Team Collaboration', desc: 'Coordinate across your org' },
  { id: 'developer', icon: Code, label: 'Building Applications', desc: 'Multi-agent apps' },
]

const frameworks = [
  { id: 'anthropic', name: 'Claude (Anthropic)', icon: Brain, recommended: true },
  { id: 'openai', name: 'OpenAI GPT-4', icon: Bot },
  { id: 'google', name: 'Google Gemini', icon: Cpu },
  { id: 'local', name: 'LM Studio / Ollama', icon: Server },
]

const roles = ['Research Lead', 'Data Analyst', 'Developer', 'Creative Writer', 'Tool Specialist']

interface OnboardingState {
  agentCreated: boolean
  swarmCreated: boolean
  apiKeySaved: boolean
  agentId?: string
  swarmId?: string
}

interface OnboardingProgress {
  useCase?: string
  selectedFramework?: string
  agentName?: string
  agentRole?: string
  swarmName?: string
  swarmTask?: string
  [key: string]: string | undefined
}

export default function OnboardingPage() {
  const router = useRouter()
  const { setIsDemo, setUser } = useStore()
  const { createAgent } = useAgents()
  const { createSwarm } = useSwarm()
  const {
    isGuest,
    initializeGuest,
    createGuestAgent,
    createGuestSwarm,
    completeGuestOnboarding,
  } = useGuest()

  const [step, setStep] = useState(1)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isGuestMode, setIsGuestMode] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [progressLoaded, setProgressLoaded] = useState(false)

  const [useCase, setUseCase] = useState('')
  const [selectedFramework, setSelectedFramework] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [agentName, setAgentName] = useState('')
  const [agentRole, setAgentRole] = useState('')
  const [swarmName, setSwarmName] = useState('')
  const [swarmTask, setSwarmTask] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [onboardingState, setOnboardingState] = useState<OnboardingState>({
    agentCreated: false,
    swarmCreated: false,
    apiKeySaved: false,
  })
  const [showSuccess, setShowSuccess] = useState(false)
  const [isSkipping, setIsSkipping] = useState(false)
  const [isSavingProgress, setIsSavingProgress] = useState(false)

  const totalSteps = 5

  const saveProgress = async (currentStep: number, progress: OnboardingProgress) => {
    if (!isAuthenticated || !userId) return

    setIsSavingProgress(true)
    try {
      await supabase
        .from('profiles')
        .update({
          onboarding_current_step: currentStep,
          onboarding_progress: progress,
        })
        .eq('id', userId)
    } catch (err) {
      console.error('Failed to save onboarding progress:', err)
    } finally {
      setIsSavingProgress(false)
    }
  }

  const getCurrentProgress = (): OnboardingProgress => ({
    useCase,
    selectedFramework,
    agentName,
    agentRole,
    swarmName,
    swarmTask,
  })

  useEffect(() => {
    const checkAuth = async () => {
      setCheckingAuth(true)
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        setUserId(session.user.id)
        setIsAuthenticated(true)

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle()

        if (profile) {
          setUser(profile)
          setIsDemo(false)

          if (profile.onboarding_complete || profile.onboarding_completed_at) {
            router.push('/dashboard')
            return
          }

          if (profile.onboarding_current_step && profile.onboarding_current_step > 1) {
            setStep(profile.onboarding_current_step)
          }

          if (profile.onboarding_progress) {
            const progress = profile.onboarding_progress as OnboardingProgress
            if (progress.useCase) setUseCase(progress.useCase)
            if (progress.selectedFramework) setSelectedFramework(progress.selectedFramework)
            if (progress.agentName) setAgentName(progress.agentName)
            if (progress.agentRole) setAgentRole(progress.agentRole)
            if (progress.swarmName) setSwarmName(progress.swarmName)
            if (progress.swarmTask) setSwarmTask(progress.swarmTask)
          }

          setProgressLoaded(true)
        }
      } else {
        const result = await initializeGuest()
        setIsGuestMode(true)

        if (!result.needsOnboarding) {
          router.push('/dashboard')
          return
        }
      }

      setCheckingAuth(false)
    }

    checkAuth()
  }, [router, setIsDemo, setUser, initializeGuest])

  const saveApiKey = async () => {
    if (!apiKey || !selectedFramework || !userId || selectedFramework === 'local') {
      return true
    }

    try {
      const { data: existing } = await supabase
        .from('integrations')
        .select('id')
        .eq('user_id', userId)
        .eq('provider', selectedFramework)
        .maybeSingle()

      if (existing) {
        const { error } = await supabase
          .from('integrations')
          .update({
            credentials: { api_key: apiKey },
            settings: {},
          })
          .eq('id', existing.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('integrations')
          .insert({
            user_id: userId,
            provider: selectedFramework,
            credentials: { api_key: apiKey },
            settings: {},
          })

        if (error) throw error
      }

      setOnboardingState(prev => ({ ...prev, apiKeySaved: true }))
      return true
    } catch (err) {
      console.error('Failed to save API key:', err)
      return false
    }
  }

  const handleNext = async () => {
    setError(null)

    if (step === 2 && apiKey && selectedFramework !== 'local' && isAuthenticated) {
      setIsLoading(true)
      const saved = await saveApiKey()
      setIsLoading(false)
      if (!saved) {
        setError('Failed to save API key. You can add it later in settings.')
      }
    }

    if (step < totalSteps) {
      const nextStep = step + 1
      setStep(nextStep)

      saveProgress(nextStep, getCurrentProgress())
    }
  }

  const handleBack = () => {
    setError(null)
    if (step > 1) {
      const prevStep = step - 1
      setStep(prevStep)

      saveProgress(prevStep, getCurrentProgress())
    }
  }

  const handleSkip = async () => {
    setIsSkipping(true)
    setError(null)

    try {
      if (isAuthenticated) {
        await updateProfile({
          onboarding_complete: true,
          onboarding_completed_at: new Date().toISOString(),
          onboarding_current_step: step,
          onboarding_progress: getCurrentProgress(),
        })
      } else {
        completeGuestOnboarding({ useCase, framework: selectedFramework })
      }
      router.push('/dashboard')
    } catch (err) {
      setError('Failed to skip onboarding. Please try again.')
      setIsSkipping(false)
    }
  }

  const handleComplete = async () => {
    setIsLoading(true)
    setError(null)

    try {
      let agentId: string | undefined

      if (isAuthenticated) {
        const agent = await createAgent({
          name: agentName || 'My Agent',
          role: agentRole || 'Assistant',
          framework: selectedFramework || 'anthropic',
          model: null,
          system_prompt: null,
          settings: {},
        })

        if (!agent) {
          throw new Error('Failed to create agent')
        }

        agentId = agent.id
        setOnboardingState(prev => ({ ...prev, agentCreated: true, agentId }))

        let swarmId: string | undefined
        if (swarmName && agentId) {
          const swarm = await createSwarm(swarmName, swarmTask, [agentId])
          if (swarm) {
            swarmId = swarm.id
            setOnboardingState(prev => ({ ...prev, swarmCreated: true, swarmId }))
          }
        }

        await updateProfile({
          onboarding_complete: true,
          onboarding_completed_at: new Date().toISOString(),
          onboarding_current_step: totalSteps,
          onboarding_progress: getCurrentProgress(),
        })
      } else {
        const agent = createGuestAgent({
          name: agentName || 'My Agent',
          role: agentRole || 'Assistant',
          framework: selectedFramework || 'anthropic',
          model: null,
          system_prompt: null,
          settings: {},
        })

        agentId = agent.id
        setOnboardingState(prev => ({ ...prev, agentCreated: true, agentId }))

        if (swarmName && agentId) {
          const swarm = createGuestSwarm(swarmName, swarmTask, [agentId])
          if (swarm) {
            setOnboardingState(prev => ({ ...prev, swarmCreated: true, swarmId: swarm.id }))
          }
        }

        completeGuestOnboarding({ useCase, framework: selectedFramework })
      }

      setShowSuccess(true)

      setTimeout(() => {
        router.push('/dashboard')
      }, 2500)
    } catch (err) {
      console.error('Onboarding error:', err)
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setIsLoading(false)
    }
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return !!useCase
      case 2:
        return !!selectedFramework
      case 3:
        return !!agentName
      case 4:
        return true
      case 5:
        return true
      default:
        return false
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 relative">
        <div className="absolute inset-0 honeycomb-pattern opacity-20" />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center relative z-10"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6"
          >
            <PartyPopper className="w-12 h-12 text-emerald-500" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-3xl font-bold mb-2"
          >
            You're all set!
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-muted-foreground mb-6"
          >
            Your workspace is ready. Let's get started!
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="space-y-2"
          >
            {onboardingState.agentCreated && (
              <div className="flex items-center justify-center gap-2 text-sm text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
                <span>Agent "{agentName || 'My Agent'}" created</span>
              </div>
            )}
            {onboardingState.swarmCreated && (
              <div className="flex items-center justify-center gap-2 text-sm text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
                <span>Swarm "{swarmName}" created</span>
              </div>
            )}
            {onboardingState.apiKeySaved && (
              <div className="flex items-center justify-center gap-2 text-sm text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
                <span>API key configured</span>
              </div>
            )}
            {isGuestMode && (
              <div className="flex items-center justify-center gap-2 text-sm text-amber-600 mt-4">
                <AlertCircle className="w-4 h-4" />
                <span>Guest mode - data stored locally</span>
              </div>
            )}
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8"
          >
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Redirecting to dashboard...</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative">
      <div className="absolute inset-0 honeycomb-pattern opacity-20" />

      <div className="w-full max-w-2xl relative z-10">
        <div className="text-center mb-8">
          <Hexagon className="h-12 w-12 text-primary fill-primary/20 mx-auto" />
          <h1 className="text-2xl font-bold mt-4">Welcome to HIVE</h1>
          <p className="text-muted-foreground mt-2">Let's set up your workspace</p>

          {isGuestMode && (
            <Alert className="mt-4 max-w-md mx-auto">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-left">
                <span className="font-medium">Basic Access</span> - Your settings will be saved locally.{' '}
                <Link href="/signup" className="text-primary hover:underline inline-flex items-center gap-1">
                  Create an account <LogIn className="w-3 h-3" />
                </Link>{' '}
                to save your work permanently.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex justify-center gap-2 mb-8">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-2 w-10 rounded-full transition-colors ${
                i + 1 <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button variant="ghost" size="sm" onClick={() => setError(null)}>
                <X className="w-4 h-4" />
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-center">What brings you to HIVE?</h2>
                <div className="grid gap-4">
                  {useCases.map((uc) => (
                    <Card
                      key={uc.id}
                      className={`cursor-pointer transition-all ${
                        useCase === uc.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                      }`}
                      onClick={() => setUseCase(uc.id)}
                    >
                      <CardContent className="flex items-center gap-4 p-4">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <uc.icon className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{uc.label}</p>
                          <p className="text-sm text-muted-foreground">{uc.desc}</p>
                        </div>
                        {useCase === uc.id && <Check className="w-5 h-5 text-primary" />}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-center">Choose Your AI Provider</h2>
                <p className="text-center text-muted-foreground">Select an AI provider to power your agents</p>
                <div className="grid gap-4">
                  {frameworks.map((fw) => (
                    <Card
                      key={fw.id}
                      className={`cursor-pointer transition-all ${
                        selectedFramework === fw.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedFramework(fw.id)}
                    >
                      <CardContent className="flex items-center gap-4 p-4">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <fw.icon className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{fw.name}</p>
                            {fw.recommended && (
                              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                                Recommended
                              </span>
                            )}
                          </div>
                        </div>
                        {selectedFramework === fw.id && <Check className="w-5 h-5 text-primary" />}
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {selectedFramework && selectedFramework !== 'local' && isAuthenticated && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-2 mt-4"
                  >
                    <Label htmlFor="apiKey">API Key (Optional)</Label>
                    <Input
                      id="apiKey"
                      type="password"
                      placeholder={selectedFramework === 'anthropic' ? 'sk-ant-...' : selectedFramework === 'openai' ? 'sk-...' : 'Enter your API key'}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Your API key will be securely stored. You can also add it later in settings.
                    </p>
                  </motion.div>
                )}
                {selectedFramework && selectedFramework !== 'local' && isGuestMode && (
                  <Alert className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      API keys require an account to store securely.{' '}
                      <Link href="/signup" className="text-primary hover:underline">
                        Sign up
                      </Link>{' '}
                      to connect your API keys.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-center">Create Your First Agent</h2>
                <p className="text-center text-muted-foreground">Give your agent a name and role</p>
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="agentName">Agent Name *</Label>
                      <Input
                        id="agentName"
                        placeholder="ARIA"
                        value={agentName}
                        onChange={(e) => setAgentName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Agent Role</Label>
                      <div className="flex flex-wrap gap-2">
                        {roles.map((role) => (
                          <Button
                            key={role}
                            type="button"
                            variant={agentRole === role ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setAgentRole(role)}
                          >
                            {role}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-center">Create Your First Swarm</h2>
                <p className="text-center text-muted-foreground">A swarm is where your agents collaborate (optional)</p>
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="swarmName">Swarm Name</Label>
                      <Input
                        id="swarmName"
                        placeholder="My First Swarm"
                        value={swarmName}
                        onChange={(e) => setSwarmName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="swarmTask">What should your agents work on?</Label>
                      <Textarea
                        id="swarmTask"
                        placeholder="Research and summarize the latest developments in AI..."
                        value={swarmTask}
                        onChange={(e) => setSwarmTask(e.target.value)}
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
                <p className="text-center text-sm text-muted-foreground">
                  You can skip this step and create swarms later
                </p>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-center">Review Your Setup</h2>
                <p className="text-center text-muted-foreground">Here's what we'll create for you</p>

                <div className="space-y-4">
                  <Card className="border-primary/30 bg-primary/5">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <Bot className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">Agent: {agentName || 'My Agent'}</p>
                          <p className="text-sm text-muted-foreground">
                            {agentRole || 'Assistant'} powered by {frameworks.find(f => f.id === selectedFramework)?.name || 'Claude'}
                          </p>
                        </div>
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      </div>
                    </CardContent>
                  </Card>

                  {swarmName && (
                    <Card className="border-primary/30 bg-primary/5">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <Users className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">Swarm: {swarmName}</p>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {swarmTask || 'No task set'}
                            </p>
                          </div>
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {apiKey && selectedFramework !== 'local' && isAuthenticated && (
                    <Card className="border-emerald-500/30 bg-emerald-500/5">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <Check className="w-5 h-5 text-emerald-500" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">API Key Configured</p>
                            <p className="text-sm text-muted-foreground">
                              {frameworks.find(f => f.id === selectedFramework)?.name} connected
                            </p>
                          </div>
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {isGuestMode && (
                    <Card className="border-amber-500/30 bg-amber-500/5">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                            <AlertCircle className="w-5 h-5 text-amber-500" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">Guest Mode</p>
                            <p className="text-sm text-muted-foreground">
                              Your data will be stored locally.{' '}
                              <Link href="/signup" className="text-primary hover:underline">
                                Create an account
                              </Link>{' '}
                              to save permanently.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between mt-8">
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={handleBack} disabled={step === 1 || isLoading}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={handleSkip}
              disabled={isLoading || isSkipping}
              className="text-muted-foreground"
            >
              {isSkipping ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Skipping...
                </>
              ) : (
                'Skip for now'
              )}
            </Button>
            {step < totalSteps ? (
              <Button onClick={handleNext} disabled={!canProceed() || isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={handleComplete} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Complete Setup
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
