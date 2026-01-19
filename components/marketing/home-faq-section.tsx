'use client'

import { FAQSection } from './faq-section'

const homeFaqs = [
  {
    question: 'What is HIVE and how does it work?',
    answer: 'HIVE is a platform for building and orchestrating AI agents. Create specialized agents powered by models like GPT-4 and Claude, then combine them into swarms that collaborate on complex tasks with human oversight.',
    links: [{ text: 'Learn more', href: '/about' }],
  },
  {
    question: 'Do I need coding experience to use HIVE?',
    answer: 'No coding required for basic use. Our visual builder lets you create agents through a simple interface. For advanced customization, we provide comprehensive APIs and SDKs for developers.',
    links: [{ text: 'View documentation', href: '/docs' }],
  },
  {
    question: 'What AI models does HIVE support?',
    answer: 'HIVE supports GPT-4, GPT-3.5, Claude 3 (Opus, Sonnet, Haiku), Gemini Pro, Llama 2, Mistral, and custom fine-tuned models. Mix and match models within the same swarm for optimal results.',
    links: [{ text: 'See integrations', href: '/integrations' }],
  },
  {
    question: 'Is there a free plan available?',
    answer: 'Yes, our free tier includes 10,000 messages per month, 3 agents, and access to all core features. No credit card required to start. Upgrade anytime as your needs grow.',
    links: [{ text: 'View pricing', href: '/pricing' }],
  },
  {
    question: 'Is my data secure with HIVE?',
    answer: 'Yes, we use AES-256 encryption and are SOC 2 Type II certified. We never use your data to train AI models. Enterprise plans include additional security options like SSO and data residency.',
    links: [{ text: 'Security details', href: '/security' }],
  },
  {
    question: 'Can I integrate HIVE with my existing tools?',
    answer: 'Yes, HIVE integrates via REST APIs, webhooks, and pre-built connectors for Slack, GitHub, Notion, Salesforce, and 100+ other tools. Custom integrations are fully supported.',
    links: [{ text: 'Browse integrations', href: '/integrations' }],
  },
]

export function HomeFAQSection() {
  return (
    <FAQSection
      title="Frequently Asked Questions"
      subtitle="Get answers to common questions about HIVE and AI agents"
      faqs={homeFaqs}
      showSchema={true}
      showMoreLink={true}
      columns={1}
    />
  )
}
