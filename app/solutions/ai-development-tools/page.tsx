'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Code,
  Terminal,
  GitBranch,
  Boxes,
  ArrowRight,
  Check,
  Braces,
  FileCode,
  TestTube,
  Bug,
  Rocket,
  BookOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Navbar } from '@/components/marketing/navbar'
import { Footer } from '@/components/marketing/footer'
import { JsonLd } from '@/components/seo/json-ld'
import { Breadcrumbs } from '@/components/seo/breadcrumbs'

const developerTools = [
  {
    icon: Braces,
    title: 'REST & WebSocket APIs',
    description: 'Full-featured APIs for creating agents, managing swarms, and streaming responses in real-time.',
    link: '/docs/api/authentication',
  },
  {
    icon: Boxes,
    title: 'Official SDKs',
    description: 'Type-safe SDKs for JavaScript/TypeScript and Python with comprehensive documentation.',
    link: '/docs/getting-started/quickstart',
  },
  {
    icon: Terminal,
    title: 'CLI Tools',
    description: 'Command-line interface for local development, testing, and deployment automation.',
    link: '/docs/local-setup/environment-setup',
  },
  {
    icon: FileCode,
    title: 'Code Generation',
    description: 'Generate agent configurations, tool schemas, and integration code automatically.',
    link: '/tools',
  },
  {
    icon: TestTube,
    title: 'Testing Framework',
    description: 'Built-in tools for testing agent behaviors, mocking responses, and validating outputs.',
    link: '/docs/local-setup/troubleshooting',
  },
  {
    icon: Bug,
    title: 'Debugging Tools',
    description: 'Real-time logs, message traces, and step-through debugging for agent conversations.',
    link: '/docs/getting-started/concepts',
  },
]

const codeExamples = [
  {
    title: 'Create an Agent',
    language: 'typescript',
    code: `import { Hive } from '@hive/sdk';

const hive = new Hive({ apiKey: 'your-key' });

const agent = await hive.agents.create({
  name: 'Research Assistant',
  model: 'claude-3-opus',
  systemPrompt: 'You are a research assistant...',
  tools: ['web-search', 'document-reader'],
});`,
  },
  {
    title: 'Start a Swarm',
    language: 'typescript',
    code: `const swarm = await hive.swarms.create({
  name: 'Content Team',
  agents: [writerAgent, editorAgent, seoAgent],
  coordinationMode: 'collaborative',
});

// Stream messages in real-time
for await (const message of swarm.stream()) {
  console.log(message.agent, message.content);
}`,
  },
  {
    title: 'Create Custom Tools',
    language: 'typescript',
    code: `const tool = await hive.tools.create({
  name: 'fetch-data',
  description: 'Fetch data from an API endpoint',
  parameters: {
    url: { type: 'string', required: true },
    method: { type: 'string', default: 'GET' },
  },
  handler: async (params) => {
    const res = await fetch(params.url);
    return res.json();
  },
});`,
  },
]

const features = [
  {
    title: 'Type Safety',
    description: 'Full TypeScript support with generated types for all API responses and configurations.',
  },
  {
    title: 'Streaming First',
    description: 'Native support for real-time streaming with async iterators and WebSocket connections.',
  },
  {
    title: 'Local Development',
    description: 'Run and test agents locally before deploying to production environments.',
  },
  {
    title: 'Version Control',
    description: 'Version your agent configurations and roll back changes when needed.',
  },
  {
    title: 'CI/CD Integration',
    description: 'Deploy agents as part of your existing CI/CD pipelines with CLI commands.',
  },
  {
    title: 'Comprehensive Docs',
    description: 'Detailed documentation with examples, tutorials, and API reference.',
  },
]

export default function AIDevelopmentToolsPage() {
  return (
    <>
      <JsonLd
        data={[
          {
            type: 'SoftwareApplication',
            name: 'HIVE AI Development Tools',
            description: 'Developer tools and SDKs for building AI agent applications. REST APIs, TypeScript SDK, CLI, and testing framework.',
            applicationCategory: 'DeveloperApplication',
            operatingSystem: 'Any',
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
              { name: 'AI Development Tools', url: 'https://hiveprotocol.ai/solutions/ai-development-tools' },
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
                { label: 'AI Development Tools', href: '/solutions/ai-development-tools' },
              ]}
              className="mb-8"
            />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto text-center"
            >
              <Badge className="mb-4">Developer Tools</Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Build AI Applications
                <span className="text-primary block mt-2">With Developer-First Tools</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Comprehensive SDKs, APIs, and developer tools for building, testing, and
                deploying AI agent applications. Designed for developers who demand
                flexibility and control.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/docs/getting-started/quickstart">
                  <Button size="lg" className="gap-2 w-full sm:w-auto">
                    Read the Docs
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/docs/api/authentication">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    API Reference
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
                Everything Developers Need
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                From APIs to SDKs to CLI tools, we provide the building blocks
                for creating sophisticated AI applications.
              </p>
            </motion.div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {developerTools.map((tool, index) => (
                <motion.div
                  key={tool.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link href={tool.link}>
                    <Card className="h-full hover:border-primary/50 transition-colors group">
                      <CardHeader>
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                          <tool.icon className="w-6 h-6 text-primary" />
                        </div>
                        <CardTitle className="group-hover:text-primary transition-colors">
                          {tool.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="text-base">
                          {tool.description}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  </Link>
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
                Clean, Intuitive APIs
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Our APIs are designed to be simple to use while providing full control
                over agent behavior and orchestration.
              </p>
            </motion.div>
            <div className="grid lg:grid-cols-3 gap-6">
              {codeExamples.map((example, index) => (
                <motion.div
                  key={example.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle className="text-lg">{example.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-muted rounded-lg p-4 overflow-x-auto text-sm">
                        <code className="text-muted-foreground">{example.code}</code>
                      </pre>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link href="/docs/getting-started/quickstart">
                <Button variant="outline" className="gap-2">
                  <BookOpen className="w-4 h-4" />
                  View Full Documentation
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
                  Built for Modern Development
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  We designed HIVE with the modern developer workflow in mind.
                  Type safety, streaming support, local development, and CI/CD integration
                  come standard.
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {features.map((feature, index) => (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-start gap-3"
                    >
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-sm">{feature.title}</h3>
                        <p className="text-xs text-muted-foreground">{feature.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <Card className="p-6 bg-background">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <pre className="text-sm overflow-x-auto">
                    <code className="text-muted-foreground">
{`$ npm install @hive/sdk

$ hive login
✓ Authenticated successfully

$ hive agents create \\
    --name "Assistant" \\
    --model claude-3-opus
✓ Agent created: ag_abc123

$ hive deploy
✓ Deployed to production`}
                    </code>
                  </pre>
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
                Start Building Today
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Get your API key and start building AI agent applications in minutes.
                Our documentation and examples will guide you every step of the way.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/signup">
                  <Button size="lg" className="gap-2 w-full sm:w-auto">
                    Get API Key
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/docs/getting-started/quickstart">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Quick Start Guide
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
