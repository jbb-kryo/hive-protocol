'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield,
  ShieldCheck,
  Zap,
  Puzzle,
  Users,
  Boxes,
  Workflow,
  Bot,
  Network,
  MessageSquare,
  Eye,
  Hand,
  Target,
  Code,
  Wrench,
  Globe,
  Lock,
  Check,
  X,
  ArrowRight,
  Play,
  Pause,
  RotateCcw,
  Building2,
  Briefcase,
  GraduationCap,
  Stethoscope,
  ChevronRight,
  Sparkles,
  Clock,
  TrendingUp,
  Brain,
} from 'lucide-react'
import { Navbar } from '@/components/marketing/navbar'
import { Footer } from '@/components/marketing/footer'
import { FeaturesFAQSection } from '@/components/marketing/features-faq-section'
import { JsonLd } from '@/components/seo/json-ld'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

const mainFeatures = [
  {
    id: 'multi-agent',
    icon: Network,
    title: 'Multi-Agent Orchestration',
    tagline: 'Coordinate AI agents like a symphony',
    description:
      'Create specialized AI agents that work together seamlessly. Each agent brings unique expertise while maintaining perfect coordination.',
    benefits: [
      'Create unlimited specialized agents',
      'Automatic task delegation',
      'Real-time agent communication',
      'Parallel processing capabilities',
    ],
    demo: {
      type: 'swarm',
      agents: [
        { name: 'Research Agent', role: 'Researcher', status: 'active', color: 'bg-blue-500' },
        { name: 'Analyst', role: 'Data Analyst', status: 'active', color: 'bg-emerald-500' },
        { name: 'Writer', role: 'Content Writer', status: 'thinking', color: 'bg-amber-500' },
        { name: 'Reviewer', role: 'Quality Check', status: 'idle', color: 'bg-rose-500' },
      ],
    },
  },
  {
    id: 'human-in-loop',
    icon: Users,
    title: 'Human-in-the-Loop',
    tagline: 'Stay in control, always',
    description:
      'Three collaboration modes let you choose your level of involvement. Watch, suggest, or direct - the choice is yours.',
    benefits: [
      'Observe mode for monitoring',
      'Collaborate mode for suggestions',
      'Direct mode for commands',
      'Seamless mode switching',
    ],
    demo: {
      type: 'modes',
      modes: [
        {
          name: 'Observe',
          icon: Eye,
          description: 'Watch agents work autonomously',
          color: 'text-blue-500',
        },
        {
          name: 'Collaborate',
          icon: Hand,
          description: 'Provide suggestions and guidance',
          color: 'text-emerald-500',
        },
        {
          name: 'Direct',
          icon: Target,
          description: 'Give specific commands',
          color: 'text-amber-500',
        },
      ],
    },
  },
  {
    id: 'cryptographic',
    icon: Shield,
    title: 'Cryptographic Verification',
    tagline: 'Trust, but verify',
    description:
      'Every agent message is cryptographically signed. Know exactly which agent said what, and detect any tampering instantly.',
    benefits: [
      'SHA-256 message signatures',
      'Tamper detection alerts',
      'Full audit trail',
      'Non-repudiation guarantees',
    ],
    demo: {
      type: 'signature',
      message: 'Based on my analysis, the optimal approach would be...',
      agent: 'Research Agent',
      signature: 'sha256:7f83b1657ff1fc...',
      verified: true,
    },
  },
  {
    id: 'model-agnostic',
    icon: Puzzle,
    title: 'Model Agnostic',
    tagline: 'Use any AI, anywhere',
    description:
      'Connect OpenAI, Anthropic, Google, or your custom models. Mix and match different AI providers in the same swarm.',
    benefits: [
      'OpenAI GPT-4o support',
      'Anthropic Claude support',
      'Google Gemini support',
      'Custom model integration',
    ],
    demo: {
      type: 'providers',
      providers: [
        { name: 'OpenAI', models: ['GPT-4o', 'GPT-4o Mini'], color: 'bg-emerald-500' },
        { name: 'Anthropic', models: ['Claude Sonnet 4', 'Claude Haiku'], color: 'bg-amber-600' },
        { name: 'Google', models: ['Gemini 1.5 Pro', 'Gemini Flash'], color: 'bg-blue-500' },
      ],
    },
  },
  {
    id: 'auto-tools',
    icon: Boxes,
    title: 'Auto-Generated Tools',
    tagline: 'Describe it, we build it',
    description:
      'Need a custom tool? Just describe what you want in plain English. HIVE generates the implementation automatically.',
    benefits: [
      'Natural language tool creation',
      'Automatic API integration',
      'Built-in error handling',
      'Version management',
    ],
    demo: {
      type: 'tool-gen',
      prompt: 'Create a tool that fetches weather data for any city',
      result: {
        name: 'get_weather',
        params: ['city: string', 'units?: string'],
        output: 'WeatherData',
      },
    },
  },
  {
    id: 'realtime',
    icon: Zap,
    title: 'Real-Time Streaming',
    tagline: 'Watch AI think',
    description:
      'See agent responses stream in real-time. WebSocket-powered communication means zero latency between agents.',
    benefits: [
      'Live response streaming',
      'WebSocket architecture',
      'Presence indicators',
      'Typing animations',
    ],
    demo: {
      type: 'streaming',
      text: 'Analyzing the market data reveals several key insights. First, the trend shows...',
    },
  },
]

const comparisonFeatures = [
  { name: 'Multi-agent orchestration', hive: true, langchain: true, autogen: true, crewai: true },
  { name: 'Real-time streaming', hive: true, langchain: false, autogen: false, crewai: false },
  { name: 'Human-in-the-loop modes', hive: true, langchain: false, autogen: true, crewai: false },
  { name: 'Cryptographic signatures', hive: true, langchain: false, autogen: false, crewai: false },
  { name: 'Visual dashboard', hive: true, langchain: false, autogen: false, crewai: false },
  { name: 'Auto-generated tools', hive: true, langchain: false, autogen: false, crewai: false },
  { name: 'Model agnostic', hive: true, langchain: true, autogen: true, crewai: true },
  { name: 'Shared context blocks', hive: true, langchain: true, autogen: true, crewai: true },
  { name: 'Built-in authentication', hive: true, langchain: false, autogen: false, crewai: false },
  { name: 'Webhook integrations', hive: true, langchain: false, autogen: false, crewai: false },
  { name: 'Usage analytics', hive: true, langchain: false, autogen: false, crewai: false },
  { name: 'Two-factor auth', hive: true, langchain: false, autogen: false, crewai: false },
]

const useCases = [
  {
    icon: Building2,
    industry: 'Enterprise',
    title: 'Automated Research Teams',
    description:
      'Deploy a swarm of research agents to analyze market trends, competitor activity, and industry reports. Get comprehensive insights in hours instead of weeks.',
    agents: ['Market Researcher', 'Competitor Analyst', 'Report Writer', 'Data Visualizer'],
    results: ['80% faster research', '24/7 monitoring', 'Consistent quality'],
  },
  {
    icon: Code,
    industry: 'Development',
    title: 'Code Review Swarm',
    description:
      'Set up specialized agents for security analysis, performance optimization, and code style. Get thorough reviews that catch issues humans miss.',
    agents: ['Security Auditor', 'Performance Analyst', 'Style Checker', 'Documentation Writer'],
    results: ['50% fewer bugs', 'Faster reviews', 'Better documentation'],
  },
  {
    icon: Briefcase,
    industry: 'Business',
    title: 'Customer Support Automation',
    description:
      'Create agents that handle common queries, escalate complex issues, and learn from every interaction. Support that scales without hiring.',
    agents: ['Tier 1 Support', 'Technical Specialist', 'Escalation Manager', 'Knowledge Builder'],
    results: ['70% auto-resolution', '24/7 availability', 'Consistent responses'],
  },
  {
    icon: GraduationCap,
    industry: 'Education',
    title: 'Personalized Tutoring',
    description:
      'Build tutoring swarms that adapt to each student. Different agents handle different subjects while sharing context about learning progress.',
    agents: ['Math Tutor', 'Science Guide', 'Writing Coach', 'Progress Tracker'],
    results: ['Personalized learning', 'Instant feedback', 'Progress analytics'],
  },
  {
    icon: Stethoscope,
    industry: 'Healthcare',
    title: 'Medical Research Assistant',
    description:
      'Deploy agents to analyze medical literature, summarize findings, and identify relevant studies. Accelerate research while maintaining accuracy.',
    agents: ['Literature Scanner', 'Study Analyzer', 'Summary Writer', 'Citation Manager'],
    results: ['Faster literature review', 'Comprehensive coverage', 'Organized citations'],
  },
  {
    icon: TrendingUp,
    industry: 'Finance',
    title: 'Investment Analysis',
    description:
      'Create agents that monitor markets, analyze fundamentals, and generate reports. Get institutional-grade analysis at a fraction of the cost.',
    agents: ['Market Monitor', 'Fundamental Analyst', 'Risk Assessor', 'Report Generator'],
    results: ['Real-time monitoring', 'Comprehensive analysis', 'Actionable insights'],
  },
]

function SwarmDemo({ agents }: { agents: typeof mainFeatures[0]['demo']['agents'] }) {
  const [activeAgent, setActiveAgent] = useState(0)

  return (
    <div className="bg-muted/50 rounded-xl p-6 border">
      <div className="flex items-center gap-2 mb-4">
        <Network className="w-5 h-5 text-primary" />
        <span className="font-medium">Research Swarm</span>
        <Badge variant="secondary" className="ml-auto">
          Live
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {agents?.map((agent, i) => (
          <motion.div
            key={agent.name}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className={cn(
              'p-3 rounded-lg border bg-background cursor-pointer transition-all',
              activeAgent === i && 'ring-2 ring-primary'
            )}
            onClick={() => setActiveAgent(i)}
          >
            <div className="flex items-center gap-2 mb-1">
              <div className={cn('w-2 h-2 rounded-full', agent.color)} />
              <span className="text-sm font-medium truncate">{agent.name}</span>
            </div>
            <p className="text-xs text-muted-foreground">{agent.role}</p>
            <div className="mt-2 flex items-center gap-1">
              <span
                className={cn(
                  'text-xs px-1.5 py-0.5 rounded',
                  agent.status === 'active'
                    ? 'bg-emerald-500/10 text-emerald-500'
                    : agent.status === 'thinking'
                      ? 'bg-amber-500/10 text-amber-500'
                      : 'bg-muted text-muted-foreground'
                )}
              >
                {agent.status}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function ModesDemo({ modes }: { modes: typeof mainFeatures[1]['demo']['modes'] }) {
  const [activeMode, setActiveMode] = useState(0)

  return (
    <div className="bg-muted/50 rounded-xl p-6 border">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-primary" />
        <span className="font-medium">Collaboration Mode</span>
      </div>
      <div className="space-y-2">
        {modes?.map((mode, i) => {
          const Icon = mode.icon
          return (
            <motion.button
              key={mode.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                'w-full p-3 rounded-lg border bg-background text-left transition-all flex items-center gap-3',
                activeMode === i && 'ring-2 ring-primary'
              )}
              onClick={() => setActiveMode(i)}
            >
              <div
                className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center',
                  activeMode === i ? 'bg-primary/10' : 'bg-muted'
                )}
              >
                <Icon className={cn('w-5 h-5', activeMode === i ? mode.color : 'text-muted-foreground')} />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{mode.name}</p>
                <p className="text-xs text-muted-foreground">{mode.description}</p>
              </div>
              {activeMode === i && (
                <Badge variant="secondary" className="shrink-0">
                  Active
                </Badge>
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

function SignatureDemo({
  message,
  agent,
  signature,
  verified,
}: {
  message: string
  agent: string
  signature: string
  verified: boolean
}) {
  const [showVerified, setShowVerified] = useState(false)

  return (
    <div className="bg-muted/50 rounded-xl p-6 border">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-primary" />
        <span className="font-medium">Message Verification</span>
      </div>
      <div className="bg-background rounded-lg p-4 border mb-3">
        <div className="flex items-center gap-2 mb-2">
          <Bot className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">{agent}</span>
        </div>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
      <div className="bg-background rounded-lg p-3 border mb-3">
        <p className="text-xs text-muted-foreground mb-1">Signature</p>
        <code className="text-xs font-mono break-all">{signature}</code>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => setShowVerified(true)}
        disabled={showVerified}
      >
        {showVerified ? (
          <span className="flex items-center gap-2 text-emerald-500">
            <ShieldCheck className="w-4 h-4" />
            Signature Verified
          </span>
        ) : (
          'Verify Signature'
        )}
      </Button>
    </div>
  )
}

function ProvidersDemo({ providers }: { providers: typeof mainFeatures[3]['demo']['providers'] }) {
  return (
    <div className="bg-muted/50 rounded-xl p-6 border">
      <div className="flex items-center gap-2 mb-4">
        <Puzzle className="w-5 h-5 text-primary" />
        <span className="font-medium">AI Providers</span>
      </div>
      <div className="space-y-3">
        {providers?.map((provider, i) => (
          <motion.div
            key={provider.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-background rounded-lg p-3 border"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={cn('w-3 h-3 rounded-full', provider.color)} />
              <span className="font-medium text-sm">{provider.name}</span>
              <Badge variant="secondary" className="ml-auto text-xs">
                Connected
              </Badge>
            </div>
            <div className="flex flex-wrap gap-1">
              {provider.models.map((model) => (
                <span key={model} className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                  {model}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function ToolGenDemo({
  prompt,
  result,
}: {
  prompt: string
  result: { name: string; params: string[]; output: string }
}) {
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)

  const handleGenerate = () => {
    setGenerating(true)
    setTimeout(() => {
      setGenerating(false)
      setGenerated(true)
    }, 1500)
  }

  return (
    <div className="bg-muted/50 rounded-xl p-6 border">
      <div className="flex items-center gap-2 mb-4">
        <Boxes className="w-5 h-5 text-primary" />
        <span className="font-medium">Tool Generator</span>
      </div>
      <div className="bg-background rounded-lg p-3 border mb-3">
        <p className="text-xs text-muted-foreground mb-1">Your prompt</p>
        <p className="text-sm">{prompt}</p>
      </div>
      <AnimatePresence mode="wait">
        {!generated ? (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? (
              <span className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className="w-4 h-4" />
                </motion.div>
                Generating...
              </span>
            ) : (
              'Generate Tool'
            )}
          </Button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-background rounded-lg p-3 border"
          >
            <div className="flex items-center gap-2 mb-2">
              <Wrench className="w-4 h-4 text-emerald-500" />
              <span className="font-medium text-sm">{result.name}</span>
            </div>
            <div className="text-xs font-mono text-muted-foreground">
              <p>params: ({result.params.join(', ')})</p>
              <p>returns: {result.output}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function StreamingDemo({ text }: { text: string }) {
  const [displayedText, setDisplayedText] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)

  const startStreaming = () => {
    setDisplayedText('')
    setIsStreaming(true)
    let index = 0
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1))
        index++
      } else {
        clearInterval(interval)
        setIsStreaming(false)
      }
    }, 30)
  }

  return (
    <div className="bg-muted/50 rounded-xl p-6 border">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-primary" />
        <span className="font-medium">Live Streaming</span>
        <Button variant="ghost" size="icon" className="ml-auto h-8 w-8" onClick={startStreaming}>
          {isStreaming ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
      </div>
      <div className="bg-background rounded-lg p-4 border min-h-[80px]">
        <p className="text-sm">
          {displayedText}
          {isStreaming && (
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="inline-block w-2 h-4 bg-primary ml-0.5"
            />
          )}
        </p>
        {!displayedText && !isStreaming && (
          <p className="text-sm text-muted-foreground">Click play to see streaming in action</p>
        )}
      </div>
    </div>
  )
}

function FeatureDemo({ feature }: { feature: (typeof mainFeatures)[0] }) {
  const { demo } = feature

  if (!demo) return null

  switch (demo.type) {
    case 'swarm':
      return <SwarmDemo agents={demo.agents} />
    case 'modes':
      return <ModesDemo modes={demo.modes} />
    case 'signature':
      return (
        <SignatureDemo
          message={demo.message!}
          agent={demo.agent!}
          signature={demo.signature!}
          verified={demo.verified!}
        />
      )
    case 'providers':
      return <ProvidersDemo providers={demo.providers} />
    case 'tool-gen':
      return <ToolGenDemo prompt={demo.prompt!} result={demo.result!} />
    case 'streaming':
      return <StreamingDemo text={demo.text!} />
    default:
      return null
  }
}

export default function FeaturesPage() {
  return (
    <main className="min-h-screen">
      <JsonLd
        data={{
          type: 'SoftwareApplication',
          name: 'HIVE Protocol',
          description: 'AI Agent Orchestration Platform for building and managing autonomous AI agent swarms with human-in-the-loop controls, cryptographic verification, and real-time collaboration.',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Web Browser',
          offers: {
            price: '0',
            priceCurrency: 'USD',
          },
        }}
      />
      <Navbar />

      <section className="pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <Badge className="mb-4">Multi-Agent AI Platform Features</Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Complete AI Agent Orchestration
              <br />
              <span className="text-primary">for Autonomous Swarms</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
              HIVE Protocol provides enterprise-grade infrastructure for multi-agent AI systems.
              Build autonomous agent swarms that coordinate seamlessly across GPT-4, Claude, Gemini,
              and custom LLMs. Deploy production-ready AI workflows with cryptographic security,
              real-time streaming, and human-in-the-loop controls.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="gap-2">
                  Start Building
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/docs">
                <Button size="lg" variant="outline">
                  Read Documentation
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8"
          >
            {[
              { value: '10M+', label: 'Messages Processed' },
              { value: '99.9%', label: 'Uptime SLA' },
              { value: '<100ms', label: 'Response Latency' },
              { value: '3', label: 'AI Providers' },
            ].map((stat) => (
              <div key={stat.label} className="text-center p-4">
                <p className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Core Agent Orchestration Features</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to build, deploy, and manage production multi-agent AI systems
            </p>
          </motion.div>

          <div className="space-y-24">
            {mainFeatures.map((feature, index) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                className={cn(
                  'grid lg:grid-cols-2 gap-8 lg:gap-16 items-center',
                  index % 2 === 1 && 'lg:flex-row-reverse'
                )}
              >
                <div className={cn(index % 2 === 1 && 'lg:order-2')}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.tagline}</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-6 leading-relaxed">{feature.description}</p>
                  <ul className="space-y-3">
                    {feature.benefits.map((benefit) => (
                      <li key={benefit} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 text-emerald-500" />
                        </div>
                        <span className="text-sm">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={cn(index % 2 === 1 && 'lg:order-1')}>
                  <FeatureDemo feature={feature} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">HIVE vs Other AI Agent Frameworks</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Compare HIVE Protocol with LangChain, AutoGen, and CrewAI for multi-agent orchestration
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="overflow-x-auto"
          >
            <table className="w-full border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-semibold">Feature</th>
                  <th className="p-4 font-semibold text-center">
                    <span className="text-primary">HIVE</span>
                  </th>
                  <th className="p-4 font-semibold text-center text-muted-foreground">LangChain</th>
                  <th className="p-4 font-semibold text-center text-muted-foreground">AutoGen</th>
                  <th className="p-4 font-semibold text-center text-muted-foreground">CrewAI</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((row) => (
                  <tr key={row.name} className="border-b last:border-0">
                    <td className="p-4 text-sm">{row.name}</td>
                    <td className="p-4 text-center">
                      {row.hive ? (
                        <Check className="w-5 h-5 text-emerald-500 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-muted-foreground/30 mx-auto" />
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {row.langchain ? (
                        <Check className="w-5 h-5 text-muted-foreground mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-muted-foreground/30 mx-auto" />
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {row.autogen ? (
                        <Check className="w-5 h-5 text-muted-foreground mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-muted-foreground/30 mx-auto" />
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {row.crewai ? (
                        <Check className="w-5 h-5 text-muted-foreground mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-muted-foreground/30 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-8 text-center"
          >
            <p className="text-sm text-muted-foreground">
              HIVE Protocol is the only platform that combines visual orchestration with enterprise
              security features.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">AI Agent Use Cases Across Industries</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover how enterprise teams deploy autonomous AI swarms for research, development, support, and analysis
            </p>
          </motion.div>

          <Tabs defaultValue="enterprise" className="w-full">
            <TabsList className="flex flex-wrap justify-center gap-2 bg-transparent h-auto mb-8">
              {useCases.map((useCase) => (
                <TabsTrigger
                  key={useCase.industry.toLowerCase()}
                  value={useCase.industry.toLowerCase()}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <useCase.icon className="w-4 h-4 mr-2" />
                  {useCase.industry}
                </TabsTrigger>
              ))}
            </TabsList>

            {useCases.map((useCase) => (
              <TabsContent key={useCase.industry.toLowerCase()} value={useCase.industry.toLowerCase()}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid lg:grid-cols-2 gap-8"
                >
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <useCase.icon className="w-5 h-5 text-primary" />
                        </div>
                        <Badge variant="secondary">{useCase.industry}</Badge>
                      </div>
                      <CardTitle className="text-xl">{useCase.title}</CardTitle>
                      <CardDescription className="text-base">{useCase.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium mb-2">Agent Team</p>
                          <div className="flex flex-wrap gap-2">
                            {useCase.agents.map((agent) => (
                              <div
                                key={agent}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted text-sm"
                              >
                                <Bot className="w-3 h-3" />
                                {agent}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-2">Results</p>
                          <div className="flex flex-wrap gap-2">
                            {useCase.results.map((result) => (
                              <div
                                key={result}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm"
                              >
                                <TrendingUp className="w-3 h-3" />
                                {result}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="bg-muted/50 rounded-xl p-6 border flex flex-col justify-center">
                    <div className="text-center">
                      <Brain className="w-16 h-16 text-primary/20 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Ready to get started?</h3>
                      <p className="text-muted-foreground mb-6">
                        Create your own {useCase.industry.toLowerCase()} agent swarm in minutes.
                      </p>
                      <Link href="/signup">
                        <Button className="gap-2">
                          Start Free Trial
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      <FeaturesFAQSection />

      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
              <CardContent className="p-8 md:p-12 text-center">
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">Start Building Your AI Agent Swarm Today</h2>
                <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                  Join thousands of developers building autonomous multi-agent AI systems with HIVE Protocol.
                  Get started free with our comprehensive orchestration platform.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Link href="/signup">
                    <Button size="lg" className="gap-2">
                      Get Started Free
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link href="/pricing">
                    <Button size="lg" variant="outline">
                      View Pricing
                    </Button>
                  </Link>
                </div>
                <p className="text-sm text-muted-foreground mt-6">
                  No credit card required. Start building in minutes.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
