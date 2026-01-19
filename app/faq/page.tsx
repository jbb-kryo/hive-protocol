'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Search, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Navbar } from '@/components/marketing/navbar'
import { Footer } from '@/components/marketing/footer'
import { JsonLd } from '@/components/seo/json-ld'
import { Breadcrumbs } from '@/components/seo/breadcrumbs'

interface FAQ {
  question: string
  answer: string
  links?: { text: string; href: string }[]
}

interface FAQCategory {
  name: string
  slug: string
  faqs: FAQ[]
}

const faqCategories: FAQCategory[] = [
  {
    name: 'Getting Started',
    slug: 'getting-started',
    faqs: [
      {
        question: 'What is an AI agent?',
        answer: 'An AI agent is an autonomous software program powered by large language models that can understand instructions, make decisions, and complete tasks. Unlike simple chatbots, agents can use tools, maintain context, and work toward complex goals.',
        links: [{ text: 'Learn more about agents', href: '/docs/getting-started/concepts' }],
      },
      {
        question: 'How do I create my first AI agent?',
        answer: 'Sign up for a free account, then use our visual agent builder or API to configure your agent. Choose a model, set a system prompt, and optionally add tools. Your agent is ready to use in minutes.',
        links: [{ text: 'Quick start guide', href: '/docs/getting-started/quickstart' }],
      },
      {
        question: 'Do I need coding experience to use HIVE?',
        answer: 'No coding required for basic use. Our visual builder lets you create agents through a simple interface. For advanced customization and integrations, we provide comprehensive APIs and SDKs.',
        links: [{ text: 'View documentation', href: '/docs' }],
      },
      {
        question: 'What AI models does HIVE support?',
        answer: 'HIVE supports major AI models including GPT-4, GPT-3.5, Claude 3 (Opus, Sonnet, Haiku), Gemini Pro, Llama 2, and Mistral. You can also connect custom fine-tuned models via our API.',
        links: [{ text: 'See integrations', href: '/integrations' }],
      },
      {
        question: 'How long does it take to set up HIVE?',
        answer: 'Most users create their first working agent in under 5 minutes. Enterprise deployments with custom integrations typically take 2-4 weeks including security review and team onboarding.',
      },
    ],
  },
  {
    name: 'Pricing & Plans',
    slug: 'pricing',
    faqs: [
      {
        question: 'Is there a free plan available?',
        answer: 'Yes, our free tier includes 10,000 messages per month, 3 agents, and access to all core features. No credit card required to start. Upgrade anytime as your needs grow.',
        links: [{ text: 'View pricing', href: '/pricing' }],
      },
      {
        question: 'How does HIVE pricing work?',
        answer: 'Pricing is based on message volume and features. Each plan includes a set number of messages per month. You can add more messages or upgrade plans anytime. Enterprise plans offer custom pricing.',
        links: [{ text: 'Compare plans', href: '/pricing' }],
      },
      {
        question: 'What counts as a message?',
        answer: 'A message is a single exchange with an agent, including both the user input and agent response. Tool executions and internal agent communications are included at no extra cost.',
      },
      {
        question: 'Can I change plans at any time?',
        answer: 'Yes, upgrade or downgrade your plan anytime from your account settings. Upgrades take effect immediately with prorated billing. Downgrades apply at your next billing cycle.',
        links: [{ text: 'Manage subscription', href: '/settings' }],
      },
      {
        question: 'Do you offer discounts for startups or nonprofits?',
        answer: 'Yes, we offer 50% off for eligible startups and nonprofits. Contact our sales team with your organization details to apply for discounted pricing.',
        links: [{ text: 'Contact sales', href: '/contact' }],
      },
    ],
  },
  {
    name: 'AI Agents & Swarms',
    slug: 'agents',
    faqs: [
      {
        question: 'What is a swarm in HIVE?',
        answer: 'A swarm is a group of AI agents working together on a shared task. Agents in a swarm can communicate, collaborate, and coordinate their actions. This enables complex workflows that single agents cannot handle alone.',
        links: [{ text: 'Learn about swarms', href: '/docs/swarms/creating-swarms' }],
      },
      {
        question: 'How many agents can work together in a swarm?',
        answer: 'Swarms can include up to 10 agents on standard plans and up to 50 agents on enterprise plans. Most use cases work well with 3-5 specialized agents collaborating on specific roles.',
      },
      {
        question: 'Can agents use external tools and APIs?',
        answer: 'Yes, agents can use custom tools you define. Tools can call external APIs, query databases, search the web, or execute code. HIVE includes pre-built tools and supports custom tool development.',
        links: [{ text: 'Explore tools', href: '/tools' }],
      },
      {
        question: 'How do agents maintain context across conversations?',
        answer: 'Agents use conversation memory to maintain context within sessions. For long-term memory, you can configure knowledge bases and context blocks that persist across conversations.',
        links: [{ text: 'Context management', href: '/docs/getting-started/concepts' }],
      },
      {
        question: 'Can I customize agent personalities and behaviors?',
        answer: 'Yes, fully customize agents through system prompts, behavior guidelines, and response formatting rules. You can create specialized personas for different use cases like support, sales, or research.',
      },
    ],
  },
  {
    name: 'Security & Privacy',
    slug: 'security',
    faqs: [
      {
        question: 'Is my data secure with HIVE?',
        answer: 'Yes, we use AES-256 encryption for data at rest and TLS 1.3 for data in transit. We are SOC 2 Type II certified and undergo regular third-party security audits.',
        links: [{ text: 'Security overview', href: '/security' }],
      },
      {
        question: 'Does HIVE train AI models on my data?',
        answer: 'No, we never use your data to train AI models. Your conversations and data remain private. We only use aggregated, anonymized usage statistics to improve our platform.',
        links: [{ text: 'Privacy policy', href: '/privacy' }],
      },
      {
        question: 'Is HIVE GDPR compliant?',
        answer: 'Yes, HIVE is fully GDPR compliant. We provide data processing agreements, support data subject requests, and offer EU data residency options for European customers.',
        links: [{ text: 'Compliance info', href: '/security' }],
      },
      {
        question: 'Can I use HIVE for HIPAA-regulated data?',
        answer: 'Yes, enterprise plans include HIPAA compliance with signed Business Associate Agreements. Contact our sales team to discuss healthcare-specific requirements and configuration.',
        links: [{ text: 'Enterprise solutions', href: '/solutions/enterprise' }],
      },
      {
        question: 'How do you handle API keys and credentials?',
        answer: 'API keys and credentials are encrypted using industry-standard methods and stored securely. We support secret management integrations and never log or expose credentials in plaintext.',
      },
    ],
  },
  {
    name: 'Technical & Integration',
    slug: 'technical',
    faqs: [
      {
        question: 'What programming languages does the SDK support?',
        answer: 'We provide official SDKs for JavaScript/TypeScript and Python. Community SDKs are available for Go, Ruby, and Java. Our REST API works with any language.',
        links: [{ text: 'SDK documentation', href: '/docs/getting-started/quickstart' }],
      },
      {
        question: 'Can I integrate HIVE with my existing systems?',
        answer: 'Yes, HIVE integrates via REST APIs, webhooks, and pre-built connectors for popular tools like Slack, GitHub, Notion, Salesforce, and more. Custom integrations are fully supported.',
        links: [{ text: 'View integrations', href: '/integrations' }],
      },
      {
        question: 'Does HIVE support real-time streaming responses?',
        answer: 'Yes, our API supports server-sent events (SSE) for real-time response streaming. Users see agent responses as they are generated, providing a responsive experience.',
        links: [{ text: 'API reference', href: '/docs/api/authentication' }],
      },
      {
        question: 'Can I self-host HIVE?',
        answer: 'Enterprise plans include self-hosted deployment options for AWS, Azure, GCP, or on-premises infrastructure. Self-hosting requires a minimum annual commitment.',
        links: [{ text: 'Contact sales', href: '/contact' }],
      },
      {
        question: 'What is the API rate limit?',
        answer: 'Rate limits vary by plan: Free tier allows 60 requests/minute, Pro allows 300 requests/minute, and Enterprise plans have custom limits. Burst capacity is available for temporary spikes.',
      },
    ],
  },
  {
    name: 'Billing & Account',
    slug: 'billing',
    faqs: [
      {
        question: 'What payment methods do you accept?',
        answer: 'We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and wire transfers for annual enterprise contracts. Invoicing is available for qualifying accounts.',
      },
      {
        question: 'Can I get a refund if HIVE does not meet my needs?',
        answer: 'We offer a 14-day money-back guarantee for new paid subscriptions. If you are not satisfied, contact support within 14 days for a full refund, no questions asked.',
        links: [{ text: 'Contact support', href: '/contact' }],
      },
      {
        question: 'How do I cancel my subscription?',
        answer: 'Cancel anytime from your account settings. Your access continues until the end of your billing period. Canceled accounts can be reactivated within 30 days without data loss.',
        links: [{ text: 'Account settings', href: '/settings' }],
      },
      {
        question: 'Do you offer annual billing discounts?',
        answer: 'Yes, annual billing saves 20% compared to monthly pricing. Annual plans are billed upfront and include priority support as a bonus benefit.',
        links: [{ text: 'View pricing', href: '/pricing' }],
      },
      {
        question: 'How do I add team members to my account?',
        answer: 'Invite team members from your team settings. Each plan includes a set number of seats. Additional seats can be purchased as needed. Enterprise plans offer unlimited seats.',
        links: [{ text: 'Team management', href: '/teams' }],
      },
    ],
  },
]

const allFaqs = faqCategories.flatMap((cat) =>
  cat.faqs.map((faq) => ({ ...faq, category: cat.name }))
)

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategory, setExpandedCategory] = useState<string | null>('getting-started')
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set())

  const filteredCategories = searchQuery
    ? faqCategories
        .map((cat) => ({
          ...cat,
          faqs: cat.faqs.filter(
            (faq) =>
              faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
              faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
          ),
        }))
        .filter((cat) => cat.faqs.length > 0)
    : faqCategories

  const toggleQuestion = (id: string) => {
    setExpandedQuestions((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <>
      <JsonLd
        data={[
          {
            type: 'FAQPage',
            questions: allFaqs.map((faq) => ({
              question: faq.question,
              answer: faq.answer,
            })),
          },
          {
            type: 'BreadcrumbList',
            items: [
              { name: 'Home', url: 'https://hive-protocol.online' },
              { name: 'FAQ', url: 'https://hive-protocol.online/faq' },
            ],
          },
        ]}
      />
      <Navbar />
      <main className="min-h-screen py-20">
        <div className="container mx-auto px-4">
          <Breadcrumbs className="mb-8" />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Find answers to common questions about HIVE, AI agents, pricing, and more.
              Can&apos;t find what you&apos;re looking for?{' '}
              <Link href="/contact" className="text-primary hover:underline">
                Contact us
              </Link>
              .
            </p>
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </motion.div>

          <div className="max-w-3xl mx-auto">
            <div className="flex flex-wrap gap-2 mb-8 justify-center">
              {faqCategories.map((cat) => (
                <Button
                  key={cat.slug}
                  variant={expandedCategory === cat.slug && !searchQuery ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setExpandedCategory(cat.slug)
                    setSearchQuery('')
                  }}
                >
                  {cat.name}
                </Button>
              ))}
            </div>

            <div className="space-y-6">
              {filteredCategories.map((category, catIndex) => (
                <motion.div
                  key={category.slug}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: catIndex * 0.1 }}
                >
                  {searchQuery && (
                    <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Badge variant="outline">{category.name}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {category.faqs.length} result{category.faqs.length !== 1 ? 's' : ''}
                      </span>
                    </h2>
                  )}
                  {(!searchQuery && expandedCategory === category.slug) || searchQuery ? (
                    <div className="space-y-3">
                      {category.faqs.map((faq, faqIndex) => {
                        const questionId = `${category.slug}-${faqIndex}`
                        const isExpanded = expandedQuestions.has(questionId)
                        return (
                          <Card key={questionId}>
                            <button
                              onClick={() => toggleQuestion(questionId)}
                              className="w-full text-left p-4 flex items-start gap-3"
                            >
                              <div className="mt-0.5">
                                {isExpanded ? (
                                  <ChevronDown className="w-5 h-5 text-primary" />
                                ) : (
                                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex-1">
                                <h3 className="font-medium">{faq.question}</h3>
                                {isExpanded && (
                                  <CardContent className="p-0 pt-3">
                                    <p className="text-muted-foreground">{faq.answer}</p>
                                    {faq.links && faq.links.length > 0 && (
                                      <div className="flex flex-wrap gap-2 mt-3">
                                        {faq.links.map((link) => (
                                          <Link key={link.href} href={link.href}>
                                            <Badge
                                              variant="secondary"
                                              className="hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                                            >
                                              {link.text}
                                            </Badge>
                                          </Link>
                                        ))}
                                      </div>
                                    )}
                                  </CardContent>
                                )}
                              </div>
                            </button>
                          </Card>
                        )
                      })}
                    </div>
                  ) : null}
                </motion.div>
              ))}
              {filteredCategories.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">
                    No questions found matching &quot;{searchQuery}&quot;
                  </p>
                  <Button variant="outline" onClick={() => setSearchQuery('')}>
                    Clear search
                  </Button>
                </div>
              )}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto mt-16 text-center"
          >
            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">Still have questions?</h2>
              <p className="text-muted-foreground mb-6">
                Our team is here to help. Reach out and we&apos;ll get back to you within 24 hours.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/contact">
                  <Button>Contact Support</Button>
                </Link>
                <Link href="/docs">
                  <Button variant="outline">Browse Documentation</Button>
                </Link>
              </div>
            </Card>
          </motion.div>
        </div>
      </main>
      <Footer />
    </>
  )
}
