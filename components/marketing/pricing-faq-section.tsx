'use client'

import { FAQSection } from './faq-section'

const pricingFaqs = [
  {
    question: 'What counts as a message in HIVE?',
    answer: 'A message is a single exchange with an agent, including both user input and agent response. Tool executions and internal agent communications within the same conversation are included at no extra cost.',
  },
  {
    question: 'Can I switch plans at any time?',
    answer: 'Yes, upgrade or downgrade anytime from your account settings. Upgrades take effect immediately with prorated billing. Downgrades apply at your next billing cycle. No cancellation fees.',
    links: [{ text: 'Manage subscription', href: '/settings' }],
  },
  {
    question: 'What happens if I exceed my message limit?',
    answer: 'You will receive a notification at 80% usage. After reaching your limit, you can upgrade your plan or purchase additional messages. We never cut off access mid-conversation.',
  },
  {
    question: 'Do unused messages roll over?',
    answer: 'Unused messages do not roll over between billing periods on monthly plans. Annual plans include a higher monthly allocation to accommodate variable usage throughout the year.',
  },
  {
    question: 'Is there a free trial for paid plans?',
    answer: 'The free tier lets you evaluate HIVE indefinitely with 10,000 messages/month. For enterprises evaluating larger deployments, we offer extended trials with custom limits.',
    links: [{ text: 'Contact sales', href: '/contact' }],
  },
  {
    question: 'Do you offer discounts for startups or nonprofits?',
    answer: 'Yes, we offer 50% off for eligible startups (under 2 years old, under $5M raised) and verified nonprofits. Contact our sales team with your organization details to apply.',
    links: [{ text: 'Apply for discount', href: '/contact' }],
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, Mastercard, Amex), PayPal, and wire transfers for annual enterprise contracts. Invoicing is available for accounts over $500/month.',
  },
  {
    question: 'What is included in enterprise pricing?',
    answer: 'Enterprise plans include dedicated infrastructure, SSO/SAML, custom SLAs, unlimited seats, priority support, dedicated success manager, and optional on-premises deployment.',
    links: [{ text: 'Enterprise solutions', href: '/solutions/enterprise' }],
  },
]

export function PricingFAQSection() {
  return (
    <FAQSection
      title="Pricing FAQs"
      subtitle="Common questions about billing, plans, and payments"
      faqs={pricingFaqs}
      showSchema={true}
      showMoreLink={true}
      columns={1}
    />
  )
}
