'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Shield,
  Database,
  Eye,
  Server,
  Users,
  Globe,
  Mail,
  FileText,
  ChevronRight,
  ExternalLink,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { Navbar } from '@/components/marketing/navbar'
import { Footer } from '@/components/marketing/footer'

const lastUpdated = 'January 8, 2026'

const sections = [
  { id: 'introduction', title: 'Introduction', icon: FileText },
  { id: 'data-collection', title: 'Data Collection', icon: Database },
  { id: 'data-usage', title: 'How We Use Your Data', icon: Eye },
  { id: 'data-storage', title: 'Data Storage & Security', icon: Server },
  { id: 'third-party', title: 'Third-Party Services', icon: Globe },
  { id: 'cookies', title: 'Cookies & Tracking', icon: FileText },
  { id: 'user-rights', title: 'Your Rights', icon: Users },
  { id: 'gdpr', title: 'GDPR Compliance', icon: Shield },
  { id: 'ccpa', title: 'CCPA Compliance', icon: Shield },
  { id: 'children', title: 'Children\'s Privacy', icon: Users },
  { id: 'changes', title: 'Policy Changes', icon: FileText },
  { id: 'contact', title: 'Contact Us', icon: Mail },
]

export default function PrivacyPolicyPage() {
  const [activeSection, setActiveSection] = useState('introduction')

  useEffect(() => {
    const handleScroll = () => {
      const sectionElements = sections.map(s => ({
        id: s.id,
        element: document.getElementById(s.id),
      }))

      const scrollPosition = window.scrollY + 150

      for (let i = sectionElements.length - 1; i >= 0; i--) {
        const section = sectionElements[i]
        if (section.element && section.element.offsetTop <= scrollPosition) {
          setActiveSection(section.id)
          break
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const offset = 100
      const elementPosition = element.offsetTop - offset
      window.scrollTo({ top: elementPosition, behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="border-b bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Privacy Policy
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-4">
              Your privacy is important to us. This policy explains how HIVE Protocol
              collects, uses, and protects your personal information.
            </p>
            <p className="text-sm text-muted-foreground">
              Last updated: {lastUpdated}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 lg:py-12">
        <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-12">
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="hidden lg:block"
          >
            <div className="sticky top-24">
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide">
                    Table of Contents
                  </h3>
                  <nav className="space-y-1">
                    {sections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => scrollToSection(section.id)}
                        className={cn(
                          'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors text-left',
                          activeSection === section.id
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        )}
                      >
                        <section.icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{section.title}</span>
                      </button>
                    ))}
                  </nav>
                </CardContent>
              </Card>
            </div>
          </motion.aside>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:hidden mb-8"
          >
            <Card>
              <CardContent className="p-4">
                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer list-none">
                    <span className="font-semibold text-sm">Table of Contents</span>
                    <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
                  </summary>
                  <nav className="mt-3 space-y-1">
                    {sections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => scrollToSection(section.id)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-muted text-left"
                      >
                        <section.icon className="w-4 h-4 shrink-0" />
                        <span>{section.title}</span>
                      </button>
                    ))}
                  </nav>
                </details>
              </CardContent>
            </Card>
          </motion.div>

          <motion.main
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="prose prose-neutral dark:prose-invert max-w-none"
          >
            <section id="introduction" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <FileText className="w-6 h-6 text-primary" />
                Introduction
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Welcome to HIVE Protocol ("we," "our," or "us"). We are committed to protecting
                your privacy and ensuring you have a positive experience when using our
                multi-agent AI coordination platform.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                This Privacy Policy explains how we collect, use, disclose, and safeguard your
                information when you use our platform, website, and related services
                (collectively, the "Service"). Please read this policy carefully. By using our
                Service, you consent to the data practices described in this policy.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                If you do not agree with the terms of this privacy policy, please do not access
                the Service.
              </p>
            </section>

            <Separator className="my-8" />

            <section id="data-collection" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <Database className="w-6 h-6 text-primary" />
                Data Collection
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We collect information that you provide directly to us, as well as information
                automatically collected when you use our Service.
              </p>

              <h3 className="text-lg font-semibold mt-6 mb-3">Information You Provide</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
                <li>
                  <strong className="text-foreground">Account Information:</strong> Email address,
                  password (encrypted), display name, and profile picture
                </li>
                <li>
                  <strong className="text-foreground">Profile Data:</strong> Preferences, settings,
                  and notification preferences
                </li>
                <li>
                  <strong className="text-foreground">Content:</strong> Messages, swarm configurations,
                  agent settings, tool definitions, and other content you create
                </li>
                <li>
                  <strong className="text-foreground">Communications:</strong> Feedback, support
                  requests, and correspondence with us
                </li>
                <li>
                  <strong className="text-foreground">Payment Information:</strong> If applicable,
                  payment details are processed by our payment provider and not stored on our servers
                </li>
              </ul>

              <h3 className="text-lg font-semibold mt-6 mb-3">Automatically Collected Information</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>
                  <strong className="text-foreground">Usage Data:</strong> Pages visited, features
                  used, actions taken, time spent, and interaction patterns
                </li>
                <li>
                  <strong className="text-foreground">Device Information:</strong> Browser type,
                  operating system, device identifiers, and screen resolution
                </li>
                <li>
                  <strong className="text-foreground">Log Data:</strong> IP address, access times,
                  referring URLs, and error logs
                </li>
                <li>
                  <strong className="text-foreground">AI Interaction Data:</strong> Prompts sent to
                  agents, agent responses, and tool execution logs
                </li>
              </ul>
            </section>

            <Separator className="my-8" />

            <section id="data-usage" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <Eye className="w-6 h-6 text-primary" />
                How We Use Your Data
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We use the information we collect for the following purposes:
              </p>

              <h3 className="text-lg font-semibold mt-6 mb-3">Service Operation</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
                <li>Provide, maintain, and improve our Service</li>
                <li>Process and complete transactions</li>
                <li>Authenticate users and manage accounts</li>
                <li>Coordinate AI agent swarms and tool executions</li>
                <li>Store and retrieve your configurations and data</li>
              </ul>

              <h3 className="text-lg font-semibold mt-6 mb-3">Communication</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
                <li>Send service-related notifications and updates</li>
                <li>Respond to your comments, questions, and support requests</li>
                <li>Send promotional communications (with your consent)</li>
              </ul>

              <h3 className="text-lg font-semibold mt-6 mb-3">Analytics & Improvement</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
                <li>Analyze usage patterns to improve user experience</li>
                <li>Monitor and analyze trends and usage</li>
                <li>Develop new features and services</li>
                <li>Conduct research and analysis</li>
              </ul>

              <h3 className="text-lg font-semibold mt-6 mb-3">Security & Compliance</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Detect, investigate, and prevent fraudulent or unauthorized activity</li>
                <li>Protect the rights and safety of users and third parties</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <Separator className="my-8" />

            <section id="data-storage" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <Server className="w-6 h-6 text-primary" />
                Data Storage & Security
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We take the security of your data seriously and implement appropriate technical
                and organizational measures to protect it.
              </p>

              <h3 className="text-lg font-semibold mt-6 mb-3">Storage Infrastructure</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Your data is stored on secure servers provided by Supabase, our database
                infrastructure provider. Supabase uses industry-standard security measures
                including:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
                <li>Encryption at rest using AES-256</li>
                <li>Encryption in transit using TLS 1.2+</li>
                <li>Regular security audits and penetration testing</li>
                <li>SOC 2 Type II compliance</li>
                <li>Data centers with physical security controls</li>
              </ul>

              <h3 className="text-lg font-semibold mt-6 mb-3">Security Measures</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
                <li>Row Level Security (RLS) policies ensuring data isolation</li>
                <li>Secure password hashing using industry-standard algorithms</li>
                <li>Two-factor authentication (2FA) option for accounts</li>
                <li>Regular security monitoring and incident response</li>
                <li>Cryptographic message signing for agent communications</li>
              </ul>

              <h3 className="text-lg font-semibold mt-6 mb-3">Data Retention</h3>
              <p className="text-muted-foreground leading-relaxed">
                We retain your personal data for as long as your account is active or as needed
                to provide you services. We may retain certain information as required by law
                or for legitimate business purposes. Upon account deletion, we will delete or
                anonymize your data within 30 days, except where retention is required by law.
              </p>
            </section>

            <Separator className="my-8" />

            <section id="third-party" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <Globe className="w-6 h-6 text-primary" />
                Third-Party Services
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We work with trusted third-party service providers to operate our Service.
                Below are the key providers and how they may access or process your data:
              </p>

              <div className="space-y-6 mt-6">
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2">Supabase (Database & Authentication)</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Supabase provides our database infrastructure and authentication services.
                      They process account data, application data, and authentication tokens.
                    </p>
                    <Link
                      href="https://supabase.com/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                    >
                      View Supabase Privacy Policy
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2">AI Model Providers</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      We integrate with AI providers including OpenAI, Anthropic, Google, and others
                      to power our agent capabilities. When you interact with agents, your prompts
                      and relevant context are sent to these providers for processing.
                    </p>
                    <div className="flex flex-wrap gap-3 mt-3">
                      <Link
                        href="https://openai.com/privacy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                      >
                        OpenAI Privacy
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                      <Link
                        href="https://www.anthropic.com/privacy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                      >
                        Anthropic Privacy
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                      <Link
                        href="https://policies.google.com/privacy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                      >
                        Google Privacy
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2">Analytics & Monitoring</h4>
                    <p className="text-sm text-muted-foreground">
                      We may use analytics services to understand how users interact with our
                      Service. These services collect anonymized usage data to help us improve
                      the user experience.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2">Hosting & Infrastructure</h4>
                    <p className="text-sm text-muted-foreground">
                      Our application is hosted on cloud infrastructure providers that maintain
                      SOC 2 compliance and implement industry-standard security measures.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <p className="text-muted-foreground leading-relaxed mt-6">
                We ensure that all third-party providers are bound by appropriate data processing
                agreements and maintain adequate security standards.
              </p>
            </section>

            <Separator className="my-8" />

            <section id="cookies" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <FileText className="w-6 h-6 text-primary" />
                Cookies & Tracking
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We use cookies and similar tracking technologies to enhance your experience
                on our Service.
              </p>

              <h3 className="text-lg font-semibold mt-6 mb-3">Types of Cookies We Use</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
                <li>
                  <strong className="text-foreground">Essential Cookies:</strong> Required for
                  the Service to function, including authentication and security cookies
                </li>
                <li>
                  <strong className="text-foreground">Functional Cookies:</strong> Remember your
                  preferences and settings (e.g., theme, language)
                </li>
                <li>
                  <strong className="text-foreground">Analytics Cookies:</strong> Help us understand
                  how visitors interact with our Service
                </li>
              </ul>

              <h3 className="text-lg font-semibold mt-6 mb-3">Managing Cookies</h3>
              <p className="text-muted-foreground leading-relaxed">
                Most web browsers allow you to control cookies through their settings. You can
                set your browser to refuse cookies or alert you when cookies are being sent.
                Please note that disabling cookies may affect the functionality of our Service.
              </p>
            </section>

            <Separator className="my-8" />

            <section id="user-rights" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <Users className="w-6 h-6 text-primary" />
                Your Rights
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Depending on your location, you may have certain rights regarding your personal
                information:
              </p>

              <div className="grid gap-4 sm:grid-cols-2 mt-6">
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2">Access</h4>
                    <p className="text-sm text-muted-foreground">
                      Request a copy of the personal data we hold about you
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2">Correction</h4>
                    <p className="text-sm text-muted-foreground">
                      Request correction of inaccurate or incomplete data
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2">Deletion</h4>
                    <p className="text-sm text-muted-foreground">
                      Request deletion of your personal data
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2">Portability</h4>
                    <p className="text-sm text-muted-foreground">
                      Request your data in a portable format
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2">Restriction</h4>
                    <p className="text-sm text-muted-foreground">
                      Request restriction of processing in certain circumstances
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2">Objection</h4>
                    <p className="text-sm text-muted-foreground">
                      Object to processing based on legitimate interests
                    </p>
                  </CardContent>
                </Card>
              </div>

              <p className="text-muted-foreground leading-relaxed mt-6">
                To exercise any of these rights, please contact us using the information provided
                in the Contact section. We will respond to your request within the timeframe
                required by applicable law.
              </p>
            </section>

            <Separator className="my-8" />

            <section id="gdpr" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <Shield className="w-6 h-6 text-primary" />
                GDPR Compliance
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                For users in the European Economic Area (EEA), we comply with the General Data
                Protection Regulation (GDPR).
              </p>

              <h3 className="text-lg font-semibold mt-6 mb-3">Legal Basis for Processing</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We process your personal data based on the following legal grounds:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
                <li>
                  <strong className="text-foreground">Contractual Necessity:</strong> Processing
                  necessary to perform our contract with you (providing the Service)
                </li>
                <li>
                  <strong className="text-foreground">Legitimate Interests:</strong> Processing
                  for our legitimate business interests (security, analytics, improvements)
                </li>
                <li>
                  <strong className="text-foreground">Consent:</strong> Where you have given
                  explicit consent (e.g., marketing communications)
                </li>
                <li>
                  <strong className="text-foreground">Legal Obligation:</strong> Processing
                  required to comply with legal requirements
                </li>
              </ul>

              <h3 className="text-lg font-semibold mt-6 mb-3">International Data Transfers</h3>
              <p className="text-muted-foreground leading-relaxed">
                Your data may be transferred to and processed in countries outside the EEA.
                When we transfer data internationally, we ensure appropriate safeguards are in
                place, such as Standard Contractual Clauses (SCCs) or adequacy decisions.
              </p>
            </section>

            <Separator className="my-8" />

            <section id="ccpa" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <Shield className="w-6 h-6 text-primary" />
                CCPA Compliance
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                For California residents, we comply with the California Consumer Privacy Act
                (CCPA) and the California Privacy Rights Act (CPRA).
              </p>

              <h3 className="text-lg font-semibold mt-6 mb-3">Your California Privacy Rights</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
                <li>Right to know what personal information is collected</li>
                <li>Right to know whether your personal information is sold or disclosed</li>
                <li>Right to say no to the sale of personal information</li>
                <li>Right to access your personal information</li>
                <li>Right to request deletion of your personal information</li>
                <li>Right to equal service and price, even if you exercise privacy rights</li>
              </ul>

              <h3 className="text-lg font-semibold mt-6 mb-3">Do Not Sell My Personal Information</h3>
              <p className="text-muted-foreground leading-relaxed">
                We do not sell personal information to third parties. We may share information
                with service providers who assist us in operating our Service, but this is not
                considered a "sale" under the CCPA.
              </p>
            </section>

            <Separator className="my-8" />

            <section id="children" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <Users className="w-6 h-6 text-primary" />
                Children's Privacy
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Our Service is not intended for children under the age of 16. We do not knowingly
                collect personal information from children under 16. If you are a parent or
                guardian and believe your child has provided us with personal information, please
                contact us immediately. If we discover that we have collected personal information
                from a child under 16, we will delete that information promptly.
              </p>
            </section>

            <Separator className="my-8" />

            <section id="changes" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <FileText className="w-6 h-6 text-primary" />
                Policy Changes
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any
                material changes by posting the new Privacy Policy on this page and updating the
                "Last updated" date. For significant changes, we may also send you an email
                notification. We encourage you to review this Privacy Policy periodically for
                any changes.
              </p>
            </section>

            <Separator className="my-8" />

            <section id="contact" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <Mail className="w-6 h-6 text-primary" />
                Contact Us
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                If you have any questions about this Privacy Policy or our data practices, please
                contact us:
              </p>

              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-1">HIVE Protocol</h4>
                      <p className="text-sm text-muted-foreground">Data Protection Inquiries</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email:</p>
                      <Link
                        href="mailto:privacy@hiveprotocol.ai"
                        className="text-primary hover:underline"
                      >
                        privacy@hiveprotocol.ai
                      </Link>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        For general inquiries, visit our{' '}
                        <Link href="/contact" className="text-primary hover:underline">
                          Contact Page
                        </Link>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link href="/terms">
                  <Button variant="outline" className="w-full sm:w-auto">
                    View Terms of Service
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button variant="outline" className="w-full sm:w-auto">
                    Contact Support
                  </Button>
                </Link>
              </div>
            </section>
          </motion.main>
        </div>
      </div>
      <Footer />
    </div>
  )
}
