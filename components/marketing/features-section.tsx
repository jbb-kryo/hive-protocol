'use client'

import { motion } from 'framer-motion'
import {
  Shield,
  Zap,
  Puzzle,
  Users,
  Boxes,
  Workflow,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const features = [
  {
    icon: Shield,
    title: 'Cryptographic Trust & Security',
    description: 'Enterprise-grade security with cryptographically signed messages. Every AI agent interaction is verified and auditable for complete transparency.',
  },
  {
    icon: Zap,
    title: 'Real-Time Agent Coordination',
    description: 'WebSocket-powered multi-agent communication with sub-100ms latency. Your autonomous agents coordinate instantly without polling delays.',
  },
  {
    icon: Puzzle,
    title: 'Model-Agnostic LLM Support',
    description: 'Integrate any large language model including Claude, GPT-4, Gemini, Llama, and custom fine-tuned models. Build heterogeneous AI swarms.',
  },
  {
    icon: Users,
    title: 'Human-in-the-Loop Control',
    description: 'Three collaboration modes let you observe, guide, or directly control your AI agents. Maintain oversight while agents work autonomously.',
  },
  {
    icon: Boxes,
    title: 'AI-Powered Tool Generation',
    description: 'Describe custom tools in natural language and HIVE generates the implementation. Extend agent capabilities without writing code.',
  },
  {
    icon: Workflow,
    title: 'Shared Context Memory',
    description: 'Intelligent context sharing between agents eliminates redundancy. Your multi-agent system maintains coherent, long-running conversations.',
  },
]

export function FeaturesSection() {
  return (
    <section className="py-24 px-4 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold">Why Teams Choose HIVE for AI Agent Orchestration</h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            The complete platform for building production-ready multi-agent AI systems.
            From autonomous research teams to customer service swarms.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="h-full hover:border-primary/50 transition-colors">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
