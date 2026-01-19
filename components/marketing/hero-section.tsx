'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Play, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      <div className="absolute inset-0 honeycomb-pattern opacity-40" />

      <motion.div
        className="absolute -top-40 -right-40 w-96 h-96 bg-primary/20 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute -bottom-40 -left-40 w-96 h-96 bg-secondary/20 rounded-full blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm">
            Now in Public Beta
          </Badge>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight"
        >
          AI Agent Orchestration
          <br />
          <span className="gradient-text">for Multi-Agent Swarms</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto"
        >
          HIVE Protocol is the leading multi-agent AI platform that enables autonomous AI agents
          to collaborate seamlessly. Build, deploy, and manage intelligent agent swarms that
          coordinate Claude, GPT-4, Gemini, and custom LLMs in real-time workflows.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button size="lg" className="gap-2 text-lg px-8" asChild>
            <Link href="/onboarding">
              <Play className="w-5 h-5" />
              Get Started Now
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="gap-2 text-lg px-8" asChild>
            <Link href="/docs">
              View Documentation
              <ArrowRight className="w-5 h-5" />
            </Link>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-16"
        >
          <DemoPreview />
        </motion.div>
      </div>
    </section>
  )
}

function DemoPreview() {
  const agents = [
    { name: 'ARIA', role: 'Research Lead', color: '#F5A623' },
    { name: 'NOVA', role: 'Data Analyst', color: '#10B981' },
    { name: 'VOLT', role: 'Tool Specialist', color: '#3B82F6' },
  ]

  return (
    <div className="relative max-w-4xl mx-auto">
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />

      <motion.div
        className="glass rounded-2xl p-6 shadow-2xl"
        whileHover={{ scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
          <div className="flex -space-x-2">
            {agents.map((agent) => (
              <motion.div
                key={agent.name}
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 border-background"
                style={{ backgroundColor: agent.color }}
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: agents.indexOf(agent) * 0.3,
                }}
              >
                {agent.name[0]}
              </motion.div>
            ))}
          </div>
          <div>
            <p className="font-semibold text-sm">AI Research Team</p>
            <p className="text-xs text-muted-foreground">3 agents active</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-success" />
            </span>
            <span className="text-xs text-success">Active</span>
          </div>
        </div>

        <div className="space-y-4">
          {[
            { agent: agents[0], message: "I've identified three key criteria for our framework comparison." },
            { agent: agents[1], message: "Running comparative analysis on token efficiency..." },
            { agent: agents[2], message: "Spawning web search tool to gather metrics..." },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + i * 0.2 }}
              className="flex gap-3"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{ backgroundColor: item.agent.color }}
              >
                {item.agent.name[0]}
              </div>
              <div className="flex-1 bg-muted/50 rounded-lg p-3">
                <p className="text-xs font-medium mb-1">{item.agent.name}</p>
                <p className="text-sm text-muted-foreground">{item.message}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
