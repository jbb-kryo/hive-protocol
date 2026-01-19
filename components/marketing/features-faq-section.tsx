'use client'

import { FAQSection } from './faq-section'

const featuresFaqs = [
  {
    question: 'What makes HIVE different from other AI agent frameworks?',
    answer: 'HIVE combines visual orchestration with enterprise security. Unlike code-only frameworks like LangChain or AutoGen, HIVE offers a visual dashboard, cryptographic signatures, real-time streaming, and built-in authentication.',
    links: [{ text: 'See comparison', href: '/features' }],
  },
  {
    question: 'Can I use multiple AI models in the same swarm?',
    answer: 'Yes, mix and match GPT-4, Claude, Gemini, and custom models in a single swarm. Use the best model for each agent role, optimizing for cost, speed, or capability depending on the task.',
    links: [{ text: 'View integrations', href: '/integrations' }],
  },
  {
    question: 'How does the human-in-the-loop feature work?',
    answer: 'Choose from three modes: Observe (monitor agents autonomously), Collaborate (provide guidance), or Direct (give specific commands). Switch modes anytime during a conversation.',
    links: [{ text: 'Learn more', href: '/docs/swarms/agent-coordination' }],
  },
  {
    question: 'What are cryptographic signatures and why do they matter?',
    answer: 'Every agent message is signed with SHA-256. This verifies which agent sent each message, detects tampering, and creates an audit trail. Essential for compliance and debugging.',
    links: [{ text: 'Security docs', href: '/security' }],
  },
  {
    question: 'How do auto-generated tools work?',
    answer: 'Describe what you need in plain English, and HIVE generates the tool implementation. Tools can call APIs, query databases, or execute custom logic. Edit the generated code or use as-is.',
    links: [{ text: 'Try it now', href: '/tools' }],
  },
  {
    question: 'Is there a limit to how many agents I can run?',
    answer: 'Free tier supports 3 agents. Pro plans allow 10 agents per swarm. Enterprise plans support up to 50 agents with dedicated resources for complex multi-agent workflows.',
    links: [{ text: 'View plans', href: '/pricing' }],
  },
]

export function FeaturesFAQSection() {
  return (
    <div className="px-4 bg-muted/30">
      <FAQSection
        title="Feature Questions"
        subtitle="Common questions about HIVE capabilities and how they work"
        faqs={featuresFaqs}
        showSchema={true}
        showMoreLink={true}
        columns={1}
      />
    </div>
  )
}
