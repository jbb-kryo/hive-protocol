'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Workflow,
  Zap,
  Clock,
  GitBranch,
  ArrowRight,
  Check,
  Play,
  Pause,
  RotateCcw,
  Calendar,
  Webhook,
  Mail,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Navbar } from '@/components/marketing/navbar'
import { Footer } from '@/components/marketing/footer'
import { JsonLd } from '@/components/seo/json-ld'
import { Breadcrumbs } from '@/components/seo/breadcrumbs'

const workflowFeatures = [
  {
    icon: GitBranch,
    title: 'Visual Workflow Builder',
    description: 'Design complex automation flows with our drag-and-drop interface. No coding required.',
  },
  {
    icon: Zap,
    title: 'Intelligent Triggers',
    description: 'Start workflows from webhooks, schedules, events, or manual triggers with full flexibility.',
  },
  {
    icon: GitBranch,
    title: 'Conditional Logic',
    description: 'Add if/then branches, loops, and parallel execution paths based on data and agent outputs.',
  },
  {
    icon: RotateCcw,
    title: 'Error Recovery',
    description: 'Built-in retry logic, fallback paths, and graceful error handling for robust automation.',
  },
  {
    icon: Clock,
    title: 'Scheduled Execution',
    description: 'Run workflows on schedules from simple intervals to complex cron expressions.',
  },
  {
    icon: Webhook,
    title: 'Webhook Integration',
    description: 'Connect to any service with incoming and outgoing webhooks for seamless integration.',
  },
]

const automationExamples = [
  {
    title: 'Lead Qualification Pipeline',
    trigger: 'New form submission',
    steps: ['Enrich lead data', 'Score and qualify', 'Route to appropriate team', 'Send personalized follow-up'],
    outcome: '80% reduction in manual lead processing',
  },
  {
    title: 'Content Publishing Workflow',
    trigger: 'Draft submitted for review',
    steps: ['AI editorial review', 'SEO optimization', 'Image generation', 'Schedule publication'],
    outcome: '3x faster content production',
  },
  {
    title: 'Customer Onboarding',
    trigger: 'New signup',
    steps: ['Analyze user profile', 'Personalize welcome sequence', 'Setup recommended features', 'Schedule check-in'],
    outcome: '50% improvement in activation',
  },
  {
    title: 'Incident Response',
    trigger: 'Alert triggered',
    steps: ['Analyze incident severity', 'Gather diagnostic data', 'Suggest remediation', 'Notify stakeholders'],
    outcome: '60% faster mean time to resolution',
  },
]

const integrations = [
  { name: 'Slack', category: 'Communication' },
  { name: 'GitHub', category: 'Development' },
  { name: 'Notion', category: 'Productivity' },
  { name: 'Salesforce', category: 'CRM' },
  { name: 'Stripe', category: 'Payments' },
  { name: 'Jira', category: 'Project Management' },
  { name: 'HubSpot', category: 'Marketing' },
  { name: 'Zendesk', category: 'Support' },
]

const benefits = [
  'Reduce manual work by up to 90%',
  'Execute workflows 24/7 without human intervention',
  'Scale operations without scaling headcount',
  'Ensure consistency across all processes',
  'Get complete audit trails for compliance',
  'Iterate and improve workflows with AI insights',
]

export default function WorkflowAutomationPage() {
  return (
    <>
      <JsonLd
        data={[
          {
            type: 'SoftwareApplication',
            name: 'HIVE Workflow Automation',
            description: 'AI-powered workflow automation platform with visual builder, intelligent triggers, and seamless integrations.',
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
              { name: 'Workflow Automation', url: 'https://hiveprotocol.ai/solutions/workflow-automation' },
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
                { label: 'Workflow Automation', href: '/solutions/workflow-automation' },
              ]}
              className="mb-8"
            />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto text-center"
            >
              <Badge className="mb-4">Workflow Automation</Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Automate Any Workflow
                <span className="text-primary block mt-2">With AI Intelligence</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Build intelligent automation workflows that combine AI agents with your
                existing tools. Handle complex decisions, adapt to edge cases, and
                scale without limits.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/signup">
                  <Button size="lg" className="gap-2 w-full sm:w-auto">
                    Start Automating
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/docs/agents/agent-tools">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Explore Integrations
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
                Powerful Automation Capabilities
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Everything you need to automate complex business processes with
                AI-powered decision making.
              </p>
            </motion.div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workflowFeatures.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full hover:border-primary/50 transition-colors">
                    <CardHeader>
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                        <feature.icon className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle>{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base">
                        {feature.description}
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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Automation in Action
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                See how teams use HIVE to automate complex workflows that were
                previously impossible to automate.
              </p>
            </motion.div>
            <div className="grid lg:grid-cols-2 gap-6">
              {automationExamples.map((example, index) => (
                <motion.div
                  key={example.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full">
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <CardTitle>{example.title}</CardTitle>
                        <Badge variant="secondary" className="text-xs">
                          {example.outcome}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Play className="w-4 h-4" />
                        Trigger: {example.trigger}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {example.steps.map((step, stepIndex) => (
                          <div key={stepIndex} className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                              {stepIndex + 1}
                            </div>
                            <span className="text-sm">{step}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link href="/workflows">
                <Button variant="outline" className="gap-2">
                  View More Examples
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  Connect Your Entire Stack
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  HIVE integrates with the tools you already use. Trigger workflows
                  from any event, and take actions across all your systems.
                </p>
                <div className="flex flex-wrap gap-3 mb-8">
                  {integrations.map((integration) => (
                    <Badge key={integration.name} variant="outline" className="text-sm py-1">
                      {integration.name}
                    </Badge>
                  ))}
                  <Badge variant="outline" className="text-sm py-1">
                    +100 more
                  </Badge>
                </div>
                <Link href="/integrations">
                  <Button variant="outline" className="gap-2">
                    Browse All Integrations
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Why Teams Choose HIVE for Automation</h3>
                  <ul className="space-y-3">
                    {benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-primary" />
                        </div>
                        <span className="text-sm">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </motion.div>
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
                Ready to Automate?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Start building AI-powered workflows today. No credit card required.
                Get up and running in minutes with our templates.
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
                    Talk to Sales
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
