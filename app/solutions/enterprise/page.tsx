'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Shield,
  Building2,
  Users,
  Lock,
  ArrowRight,
  Check,
  Server,
  Key,
  FileCheck,
  Globe,
  Headphones,
  BarChart3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Navbar } from '@/components/marketing/navbar'
import { Footer } from '@/components/marketing/footer'
import { JsonLd } from '@/components/seo/json-ld'
import { Breadcrumbs } from '@/components/seo/breadcrumbs'

const securityFeatures = [
  {
    icon: Lock,
    title: 'End-to-End Encryption',
    description: 'All data encrypted in transit and at rest using AES-256 encryption.',
  },
  {
    icon: Key,
    title: 'SSO & SAML',
    description: 'Integrate with your identity provider. Support for Okta, Azure AD, and more.',
  },
  {
    icon: Shield,
    title: 'SOC 2 Type II',
    description: 'Independently audited security controls and practices.',
  },
  {
    icon: FileCheck,
    title: 'GDPR & CCPA',
    description: 'Full compliance with data protection regulations worldwide.',
  },
  {
    icon: Server,
    title: 'Data Residency',
    description: 'Choose where your data is stored. US, EU, and APAC regions available.',
  },
  {
    icon: BarChart3,
    title: 'Audit Logging',
    description: 'Complete audit trails for all user and agent actions.',
  },
]

const enterpriseFeatures = [
  {
    icon: Building2,
    title: 'Dedicated Infrastructure',
    description: 'Single-tenant deployment options with dedicated compute resources and isolated environments for maximum security and performance.',
  },
  {
    icon: Users,
    title: 'Team Management',
    description: 'Advanced role-based access control, team workspaces, and centralized administration for organizations of any size.',
  },
  {
    icon: Globe,
    title: 'Global Scale',
    description: 'Multi-region deployment with automatic failover and 99.99% uptime SLA for mission-critical applications.',
  },
  {
    icon: Headphones,
    title: 'Premium Support',
    description: '24/7 priority support with dedicated success manager, custom SLAs, and direct engineering access.',
  },
]

const compliance = [
  { name: 'SOC 2 Type II', status: 'Certified' },
  { name: 'GDPR', status: 'Compliant' },
  { name: 'CCPA', status: 'Compliant' },
  { name: 'HIPAA', status: 'Available' },
  { name: 'ISO 27001', status: 'In Progress' },
  { name: 'PCI DSS', status: 'Available' },
]

const caseStudies = [
  {
    company: 'Fortune 500 Financial Services',
    challenge: 'Process millions of customer inquiries while maintaining compliance',
    result: '85% automation rate with zero compliance violations',
  },
  {
    company: 'Global Healthcare Provider',
    challenge: 'Secure patient communication at scale across 50+ facilities',
    result: '60% reduction in response times with HIPAA compliance',
  },
  {
    company: 'Enterprise Software Company',
    challenge: 'Automate technical support for 100,000+ users',
    result: '70% ticket deflection with improved satisfaction scores',
  },
]

const faqs = [
  {
    question: 'Can HIVE be deployed in our private cloud?',
    answer: 'Yes, we offer private cloud deployments on AWS, Azure, and GCP, as well as on-premises options for organizations with strict data residency requirements.',
  },
  {
    question: 'How does HIVE handle sensitive data?',
    answer: 'All data is encrypted in transit and at rest. We support data masking, PII detection, and configurable data retention policies. You maintain full control over your data.',
  },
  {
    question: 'What support options are available?',
    answer: 'Enterprise plans include 24/7 priority support, dedicated success manager, custom SLAs, and direct access to our engineering team for complex integrations.',
  },
  {
    question: 'How long does enterprise deployment take?',
    answer: 'Standard enterprise deployments complete in 2-4 weeks. We provide dedicated onboarding support including architecture review, security assessment, and team training.',
  },
]

export default function EnterprisePage() {
  return (
    <>
      <JsonLd
        data={[
          {
            type: 'Product',
            name: 'HIVE Enterprise',
            description: 'Enterprise AI agent platform with advanced security, compliance, and dedicated support for large organizations.',
            brand: 'HIVE',
            category: 'Enterprise Software',
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
              { name: 'Enterprise', url: 'https://hiveprotocol.ai/solutions/enterprise' },
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
                { label: 'Enterprise', href: '/solutions/enterprise' },
              ]}
              className="mb-8"
            />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto text-center"
            >
              <Badge className="mb-4">Enterprise Solutions</Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                AI Agents Built for
                <span className="text-primary block mt-2">Enterprise Scale</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Deploy AI agents with enterprise-grade security, compliance, and support.
                Dedicated infrastructure, advanced access controls, and 24/7 premium support
                for mission-critical applications.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/contact">
                  <Button size="lg" className="gap-2 w-full sm:w-auto">
                    Contact Sales
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/security">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Security Overview
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
                Enterprise-Grade Security
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Security is built into every layer of HIVE. Meet your compliance
                requirements while leveraging cutting-edge AI capabilities.
              </p>
            </motion.div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {securityFeatures.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full">
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
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  Compliance You Can Trust
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  HIVE maintains the certifications and compliance standards required
                  by enterprises in regulated industries.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {compliance.map((cert) => (
                    <div
                      key={cert.name}
                      className="flex items-center justify-between p-4 rounded-lg border bg-background"
                    >
                      <span className="font-medium">{cert.name}</span>
                      <Badge variant={cert.status === 'Certified' || cert.status === 'Compliant' ? 'default' : 'secondary'}>
                        {cert.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-6"
              >
                {enterpriseFeatures.map((feature, index) => (
                  <Card key={feature.title}>
                    <CardContent className="flex items-start gap-4 pt-6">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <feature.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                    </CardContent>
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
                Trusted by Leading Organizations
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                See how enterprises across industries are using HIVE to transform
                their operations.
              </p>
            </motion.div>
            <div className="grid md:grid-cols-3 gap-6">
              {caseStudies.map((study, index) => (
                <motion.div
                  key={study.company}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle className="text-lg">{study.company}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Challenge</p>
                        <p className="text-sm">{study.challenge}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Result</p>
                        <p className="text-sm font-medium text-primary">{study.result}</p>
                      </div>
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
                Ready to Get Started?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Talk to our enterprise team about your requirements. We&apos;ll help you
                design the right solution for your organization.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/contact">
                  <Button size="lg" className="gap-2 w-full sm:w-auto">
                    Contact Sales
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    View Pricing
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
