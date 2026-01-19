'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Users,
  MessageSquare,
  GitBranch,
  Sparkles,
  ArrowRight,
  Check,
  Brain,
  Network,
  Eye,
  HandMetal,
  Target,
  Layers,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Navbar } from '@/components/marketing/navbar'
import { Footer } from '@/components/marketing/footer'
import { JsonLd } from '@/components/seo/json-ld'
import { Breadcrumbs } from '@/components/seo/breadcrumbs'

const collaborationModes = [
  {
    icon: Eye,
    title: 'Observer Mode',
    description: 'Watch agents collaborate autonomously while maintaining full visibility into their reasoning and decisions.',
    features: ['Real-time thought streaming', 'Decision audit trails', 'Intervention alerts'],
  },
  {
    icon: HandMetal,
    title: 'Collaborative Mode',
    description: 'Work alongside AI agents, providing guidance and feedback as they execute complex tasks.',
    features: ['Human-in-the-loop controls', 'Approval workflows', 'Context injection'],
  },
  {
    icon: Target,
    title: 'Directed Mode',
    description: 'Take full control and direct agents step-by-step for precise task execution.',
    features: ['Step-by-step guidance', 'Real-time corrections', 'Output validation'],
  },
]

const swarmPatterns = [
  {
    title: 'Research Swarm',
    agents: ['Research Agent', 'Fact Checker', 'Summarizer'],
    description: 'Multiple agents that gather, verify, and synthesize information from various sources.',
  },
  {
    title: 'Content Team',
    agents: ['Writer', 'Editor', 'SEO Specialist'],
    description: 'Collaborative content creation with drafting, editing, and optimization workflows.',
  },
  {
    title: 'Code Review Panel',
    agents: ['Code Analyst', 'Security Auditor', 'Performance Expert'],
    description: 'Multi-perspective code review catching bugs, vulnerabilities, and optimization opportunities.',
  },
  {
    title: 'Support Escalation',
    agents: ['Triage Agent', 'Technical Support', 'Customer Success'],
    description: 'Intelligent routing and escalation for customer support with specialized handlers.',
  },
]

const benefits = [
  {
    icon: Network,
    title: 'Emergent Intelligence',
    description: 'Multiple agents working together produce insights and solutions no single agent could achieve alone.',
  },
  {
    icon: Layers,
    title: 'Specialized Expertise',
    description: 'Each agent focuses on what it does best, combining strengths for superior outcomes.',
  },
  {
    icon: GitBranch,
    title: 'Parallel Processing',
    description: 'Execute multiple tasks simultaneously, dramatically reducing time to completion.',
  },
  {
    icon: Sparkles,
    title: 'Quality Assurance',
    description: 'Built-in peer review and validation between agents ensures higher quality outputs.',
  },
]

const faqs = [
  {
    question: 'How do agents communicate with each other?',
    answer: 'Agents communicate through a shared context system with structured message passing. Each message is cryptographically signed and verified, ensuring authenticity and creating a clear audit trail.',
  },
  {
    question: 'Can I create custom multi-agent workflows?',
    answer: 'Yes, HIVE provides a visual workflow builder and API for creating custom agent coordination patterns. You can define triggers, conditions, and routing logic to match your specific use cases.',
  },
  {
    question: 'How do you prevent agent conflicts or loops?',
    answer: 'HIVE includes built-in safeguards like maximum iteration limits, conflict detection, and automatic deadlock resolution. Human-in-the-loop controls allow you to intervene when needed.',
  },
  {
    question: 'What models can work together in a swarm?',
    answer: 'Any combination of supported models can collaborate in a swarm, including GPT-4, Claude, Gemini, Llama, and custom fine-tuned models. You can even use different models for different agents based on their roles.',
  },
]

export default function MultiAgentCollaborationPage() {
  return (
    <>
      <JsonLd
        data={[
          {
            type: 'SoftwareApplication',
            name: 'HIVE Multi-Agent Collaboration',
            description: 'Platform for orchestrating multiple AI agents to work together on complex tasks with human oversight.',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web Browser',
            offers: {
              price: '0',
              priceCurrency: 'USD',
            },
          },
          {
            type: 'FAQPage',
            questions: faqs,
          },
          {
            type: 'BreadcrumbList',
            items: [
              { name: 'Home', url: 'https://hiveprotocol.ai' },
              { name: 'Solutions', url: 'https://hiveprotocol.ai/solutions' },
              { name: 'Multi-Agent Collaboration', url: 'https://hiveprotocol.ai/solutions/multi-agent-collaboration' },
            ],
          },
        ]}
      />
      <Navbar />
      <main className="min-h-screen">
        <section className="relative py-20 lg:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
          <div className="container relative mx-auto px-4">
            <Breadcrumbs
              customItems={[
                { label: 'Solutions', href: '/features' },
                { label: 'Multi-Agent Collaboration', href: '/solutions/multi-agent-collaboration' },
              ]}
              className="mb-8"
            />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto text-center"
            >
              <Badge className="mb-4">Multi-Agent Collaboration</Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                AI Agents That Work
                <span className="text-primary block mt-2">Better Together</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Orchestrate multiple AI agents to collaborate on complex tasks.
                Combine specialized expertise, enable peer review, and achieve
                outcomes impossible for any single agent.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/signup">
                  <Button size="lg" className="gap-2 w-full sm:w-auto">
                    Try Multi-Agent Swarms
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/docs/swarms/creating-swarms">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Learn About Swarms
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Human-in-the-Loop Collaboration
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Stay in control with flexible collaboration modes that let you choose
                how much autonomy to give your agent teams.
              </p>
            </motion.div>
            <div className="grid md:grid-cols-3 gap-6">
              {collaborationModes.map((mode, index) => (
                <motion.div
                  key={mode.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full hover:border-primary/50 transition-colors">
                    <CardHeader>
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                        <mode.icon className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle>{mode.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base mb-4">
                        {mode.description}
                      </CardDescription>
                      <ul className="space-y-2">
                        {mode.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-2 text-sm">
                            <Check className="w-4 h-4 text-primary" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Pre-Built Swarm Templates
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Get started quickly with proven multi-agent patterns for common use cases.
                Customize or build your own from scratch.
              </p>
            </motion.div>
            <div className="grid md:grid-cols-2 gap-6">
              {swarmPatterns.map((pattern, index) => (
                <motion.div
                  key={pattern.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        {pattern.title}
                      </CardTitle>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {pattern.agents.map((agent) => (
                          <Badge key={agent} variant="secondary">
                            {agent}
                          </Badge>
                        ))}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base">
                        {pattern.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link href="/agents/templates">
                <Button variant="outline" className="gap-2">
                  Browse All Templates
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Why Multi-Agent Systems?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Combining multiple specialized agents delivers capabilities far beyond
                what any single model can achieve.
              </p>
            </motion.div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full text-center">
                    <CardContent className="pt-6">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <benefit.icon className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="font-semibold mb-2">{benefit.title}</h3>
                      <p className="text-sm text-muted-foreground">{benefit.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-3xl mx-auto"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">
                Frequently Asked Questions
              </h2>
              <div className="space-y-6">
                {faqs.map((faq, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">{faq.question}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">{faq.answer}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-20 bg-primary/5">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-3xl mx-auto text-center"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Start Building Agent Teams Today
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Create your first multi-agent swarm in minutes. See how collaborative
                AI can transform your workflows.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/signup">
                  <Button size="lg" className="gap-2 w-full sm:w-auto">
                    Get Started Free
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/docs/swarms/agent-coordination">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Read the Docs
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
