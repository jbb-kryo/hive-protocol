'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Bot,
  Zap,
  Shield,
  Code,
  ArrowRight,
  Check,
  Brain,
  Network,
  Lock,
  BarChart3,
  Workflow,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Navbar } from '@/components/marketing/navbar'
import { Footer } from '@/components/marketing/footer'
import { JsonLd } from '@/components/seo/json-ld'
import { Breadcrumbs } from '@/components/seo/breadcrumbs'

const capabilities = [
  {
    icon: Bot,
    title: 'Intelligent AI Agents',
    description: 'Create specialized AI agents with custom personalities, knowledge bases, and capabilities tailored to your specific needs.',
  },
  {
    icon: Network,
    title: 'Multi-Model Support',
    description: 'Connect to Claude, GPT-4, Gemini, Llama, and other leading AI models through a unified interface.',
  },
  {
    icon: Brain,
    title: 'Contextual Memory',
    description: 'Agents maintain context across conversations with persistent memory and knowledge retrieval.',
  },
  {
    icon: Workflow,
    title: 'Custom Workflows',
    description: 'Design complex agent workflows with conditional logic, branching, and automated task routing.',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'SOC 2 compliant with end-to-end encryption, role-based access control, and audit logging.',
  },
  {
    icon: Code,
    title: 'Developer-First API',
    description: 'Comprehensive REST and WebSocket APIs with SDKs for JavaScript, Python, and more.',
  },
]

const useCases = [
  {
    title: 'Customer Support',
    description: 'Deploy AI agents that handle customer inquiries 24/7, escalating complex issues to human agents.',
    metrics: '70% faster response times',
  },
  {
    title: 'Content Creation',
    description: 'Multi-agent teams that research, write, edit, and optimize content at scale.',
    metrics: '5x content output',
  },
  {
    title: 'Data Analysis',
    description: 'Agents that analyze datasets, generate insights, and create automated reports.',
    metrics: '90% time savings',
  },
  {
    title: 'Code Development',
    description: 'AI pair programmers that write, review, test, and document code collaboratively.',
    metrics: '40% faster development',
  },
]

const benefits = [
  'Deploy in minutes with no infrastructure management',
  'Scale automatically based on demand',
  'Pay only for what you use with transparent pricing',
  'Access pre-built agent templates from the marketplace',
  'Real-time monitoring and analytics dashboard',
  'Dedicated support for enterprise customers',
]

export default function AIAgentPlatformPage() {
  return (
    <>
      <JsonLd
        data={[
          {
            type: 'SoftwareApplication',
            name: 'HIVE AI Agent Platform',
            description: 'Enterprise-grade platform for building, deploying, and managing intelligent AI agents at scale.',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web Browser',
            offers: {
              price: '0',
              priceCurrency: 'USD',
            },
          },
          {
            type: 'BreadcrumbList',
            items: [
              { name: 'Home', url: 'https://hiveprotocol.ai' },
              { name: 'Solutions', url: 'https://hiveprotocol.ai/solutions' },
              { name: 'AI Agent Platform', url: 'https://hiveprotocol.ai/solutions/ai-agent-platform' },
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
                { label: 'AI Agent Platform', href: '/solutions/ai-agent-platform' },
              ]}
              className="mb-8"
            />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto text-center"
            >
              <Badge className="mb-4">AI Agent Platform</Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Build Intelligent AI Agents
                <span className="text-primary block mt-2">Without the Complexity</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                HIVE is the enterprise-grade platform for creating, deploying, and managing
                AI agents that automate workflows, enhance productivity, and scale with your business.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/signup">
                  <Button size="lg" className="gap-2 w-full sm:w-auto">
                    Start Building Free
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/docs/getting-started/quickstart">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    View Documentation
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                No credit card required. Free tier includes 10,000 messages/month.
              </p>
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
                Everything You Need to Build AI Agents
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                A complete toolkit for creating intelligent agents that understand context,
                execute tasks, and learn from interactions.
              </p>
            </motion.div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {capabilities.map((capability, index) => (
                <motion.div
                  key={capability.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full hover:border-primary/50 transition-colors">
                    <CardHeader>
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                        <capability.icon className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle>{capability.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base">
                        {capability.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  Why Teams Choose HIVE
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  HIVE provides the infrastructure, tools, and security you need to deploy
                  AI agents in production with confidence.
                </p>
                <ul className="space-y-4">
                  {benefits.map((benefit, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-3"
                    >
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-4 h-4 text-primary" />
                      </div>
                      <span>{benefit}</span>
                    </motion.li>
                  ))}
                </ul>
                <div className="mt-8">
                  <Link href="/pricing">
                    <Button variant="outline" className="gap-2">
                      View Pricing
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="grid grid-cols-2 gap-4"
              >
                {[
                  { icon: Users, label: '10,000+', sublabel: 'Active Users' },
                  { icon: Bot, label: '50M+', sublabel: 'Messages Processed' },
                  { icon: Zap, label: '99.9%', sublabel: 'Uptime SLA' },
                  { icon: BarChart3, label: '4.9/5', sublabel: 'Customer Rating' },
                ].map((stat, index) => (
                  <Card key={index} className="text-center p-6">
                    <stat.icon className="w-8 h-8 text-primary mx-auto mb-3" />
                    <div className="text-2xl font-bold">{stat.label}</div>
                    <div className="text-sm text-muted-foreground">{stat.sublabel}</div>
                  </Card>
                ))}
              </motion.div>
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
                Popular Use Cases
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                See how organizations are using HIVE to transform their operations
                with intelligent AI agents.
              </p>
            </motion.div>
            <div className="grid md:grid-cols-2 gap-6">
              {useCases.map((useCase, index) => (
                <motion.div
                  key={useCase.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>{useCase.title}</CardTitle>
                        <Badge variant="secondary">{useCase.metrics}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base">
                        {useCase.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link href="/marketplace">
                <Button variant="outline" className="gap-2">
                  Explore Agent Templates
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-3xl mx-auto text-center"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Ready to Build Your First AI Agent?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Join thousands of developers and teams already building intelligent
                automation with HIVE. Get started in minutes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/signup">
                  <Button size="lg" className="gap-2 w-full sm:w-auto">
                    Create Free Account
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Contact Sales
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
