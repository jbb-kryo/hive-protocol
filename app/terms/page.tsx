'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Scale,
  UserCheck,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Lock,
  Ban,
  RefreshCw,
  ChevronRight,
  Mail,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { Navbar } from '@/components/marketing/navbar'
import { Footer } from '@/components/marketing/footer'

const lastUpdated = 'January 8, 2026'

const sections = [
  { id: 'acceptance', title: '1. Acceptance of Terms', icon: FileText },
  { id: 'definitions', title: '2. Definitions', icon: FileText },
  { id: 'accounts', title: '3. User Accounts', icon: UserCheck },
  { id: 'acceptable-use', title: '4. Acceptable Use', icon: ShieldCheck },
  { id: 'prohibited', title: '5. Prohibited Activities', icon: Ban },
  { id: 'service', title: '6. Service Description', icon: FileText },
  { id: 'limitations', title: '7. Service Limitations', icon: AlertTriangle },
  { id: 'ip-rights', title: '8. Intellectual Property', icon: Lock },
  { id: 'user-content', title: '9. User Content', icon: FileText },
  { id: 'third-party', title: '10. Third-Party Services', icon: FileText },
  { id: 'disclaimer', title: '11. Disclaimers', icon: AlertTriangle },
  { id: 'liability', title: '12. Limitation of Liability', icon: Scale },
  { id: 'indemnification', title: '13. Indemnification', icon: ShieldCheck },
  { id: 'termination', title: '14. Termination', icon: Ban },
  { id: 'changes', title: '15. Changes to Terms', icon: RefreshCw },
  { id: 'general', title: '16. General Provisions', icon: FileText },
  { id: 'contact', title: '17. Contact Information', icon: Mail },
]

export default function TermsOfServicePage() {
  const [activeSection, setActiveSection] = useState('acceptance')

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
              <Scale className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Terms of Service
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-4">
              Please read these terms carefully before using HIVE Protocol.
              By accessing or using our Service, you agree to be bound by these terms.
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
                  <nav className="space-y-0.5 max-h-[calc(100vh-200px)] overflow-y-auto">
                    {sections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => scrollToSection(section.id)}
                        className={cn(
                          'w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors text-left',
                          activeSection === section.id
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        )}
                      >
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
                  <nav className="mt-3 space-y-1 max-h-64 overflow-y-auto">
                    {sections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => scrollToSection(section.id)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-muted text-left"
                      >
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
            <section id="acceptance" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Welcome to HIVE Protocol. These Terms of Service ("Terms") govern your access to
                and use of the HIVE Protocol platform, website, APIs, and related services
                (collectively, the "Service") provided by HIVE Protocol ("Company," "we," "us,"
                or "our").
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                By accessing or using our Service, you agree to be bound by these Terms. If you
                are using the Service on behalf of an organization, you represent and warrant
                that you have the authority to bind that organization to these Terms.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                <strong className="text-foreground">If you do not agree to these Terms, you
                may not access or use the Service.</strong>
              </p>
            </section>

            <Separator className="my-8" />

            <section id="definitions" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4">2. Definitions</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                For the purposes of these Terms:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>
                  <strong className="text-foreground">"Service"</strong> refers to the HIVE
                  Protocol platform, including our website, applications, APIs, and all related
                  services.
                </li>
                <li>
                  <strong className="text-foreground">"User"</strong> or <strong className="text-foreground">"you"</strong> refers
                  to any individual or entity that accesses or uses the Service.
                </li>
                <li>
                  <strong className="text-foreground">"Account"</strong> refers to your registered
                  account on the Service.
                </li>
                <li>
                  <strong className="text-foreground">"Swarm"</strong> refers to a group of AI
                  agents working together on the platform.
                </li>
                <li>
                  <strong className="text-foreground">"Agent"</strong> refers to an AI assistant
                  configured and deployed within the Service.
                </li>
                <li>
                  <strong className="text-foreground">"Content"</strong> refers to any text,
                  data, information, configurations, or materials submitted to or generated
                  through the Service.
                </li>
                <li>
                  <strong className="text-foreground">"Tools"</strong> refers to integrations,
                  functions, or capabilities that can be assigned to agents.
                </li>
              </ul>
            </section>

            <Separator className="my-8" />

            <section id="accounts" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4">3. User Accounts</h2>

              <h3 className="text-lg font-semibold mt-6 mb-3">3.1 Account Creation</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                To access certain features of the Service, you must create an account. When
                creating an account, you agree to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain and promptly update your account information</li>
                <li>Keep your password secure and confidential</li>
                <li>Notify us immediately of any unauthorized access to your account</li>
                <li>Be at least 16 years of age (or the age of majority in your jurisdiction)</li>
              </ul>

              <h3 className="text-lg font-semibold mt-6 mb-3">3.2 Account Responsibility</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You are responsible for all activities that occur under your account. We reserve
                the right to suspend or terminate accounts that violate these Terms or for any
                other reason at our sole discretion.
              </p>

              <h3 className="text-lg font-semibold mt-6 mb-3">3.3 Account Security</h3>
              <p className="text-muted-foreground leading-relaxed">
                We strongly recommend enabling two-factor authentication (2FA) on your account.
                You acknowledge that failure to maintain adequate security measures may result
                in unauthorized access to your account and data.
              </p>
            </section>

            <Separator className="my-8" />

            <section id="acceptable-use" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4">4. Acceptable Use</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You agree to use the Service only for lawful purposes and in accordance with
                these Terms. Acceptable use of the Service includes:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Creating and managing AI agent swarms for legitimate business purposes</li>
                <li>Developing and testing AI-powered applications and workflows</li>
                <li>Collaborating with team members on AI projects</li>
                <li>Integrating third-party services through authorized tools</li>
                <li>Using the API in accordance with rate limits and documentation</li>
                <li>Providing accurate information and maintaining data integrity</li>
              </ul>
            </section>

            <Separator className="my-8" />

            <section id="prohibited" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4">5. Prohibited Activities</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You agree NOT to use the Service to:
              </p>

              <h3 className="text-lg font-semibold mt-6 mb-3">5.1 Illegal or Harmful Activities</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
                <li>Violate any applicable laws, regulations, or third-party rights</li>
                <li>Generate, distribute, or facilitate illegal content</li>
                <li>Harass, abuse, threaten, or incite violence against any individual or group</li>
                <li>Generate content that exploits or harms minors</li>
                <li>Engage in fraud, phishing, or deceptive practices</li>
              </ul>

              <h3 className="text-lg font-semibold mt-6 mb-3">5.2 Platform Abuse</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
                <li>Attempt to bypass rate limits or usage restrictions</li>
                <li>Interfere with or disrupt the Service or its infrastructure</li>
                <li>Attempt to gain unauthorized access to other users' accounts or data</li>
                <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
                <li>Use automated systems to scrape or extract data without authorization</li>
                <li>Introduce malware, viruses, or other harmful code</li>
              </ul>

              <h3 className="text-lg font-semibold mt-6 mb-3">5.3 Content Violations</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Generate or distribute spam, misleading content, or disinformation</li>
                <li>Create content that infringes intellectual property rights</li>
                <li>Impersonate any person or entity</li>
                <li>Generate content that violates privacy rights</li>
                <li>Use the Service to generate malware, exploits, or attack tools</li>
              </ul>
            </section>

            <Separator className="my-8" />

            <section id="service" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4">6. Service Description</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                HIVE Protocol provides a multi-agent AI coordination platform that enables users
                to create, configure, and manage swarms of AI agents that can work together on
                complex tasks.
              </p>

              <h3 className="text-lg font-semibold mt-6 mb-3">6.1 Service Features</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
                <li>Create and manage AI agent swarms</li>
                <li>Configure individual agents with specific roles and capabilities</li>
                <li>Connect agents to various AI model providers</li>
                <li>Integrate custom tools and external services</li>
                <li>Real-time collaboration and message streaming</li>
                <li>Cryptographic message verification and security features</li>
              </ul>

              <h3 className="text-lg font-semibold mt-6 mb-3">6.2 Service Availability</h3>
              <p className="text-muted-foreground leading-relaxed">
                We strive to maintain high availability of the Service but do not guarantee
                uninterrupted access. We may perform scheduled maintenance, updates, or
                experience unexpected downtime.
              </p>
            </section>

            <Separator className="my-8" />

            <section id="limitations" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4">7. Service Limitations</h2>

              <h3 className="text-lg font-semibold mt-6 mb-3">7.1 Usage Limits</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Your use of the Service may be subject to certain limitations, including but
                not limited to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
                <li>Number of swarms, agents, and tools you can create</li>
                <li>API rate limits and request quotas</li>
                <li>Storage limits for messages and data</li>
                <li>Concurrent user or connection limits</li>
              </ul>

              <h3 className="text-lg font-semibold mt-6 mb-3">7.2 AI Model Limitations</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                AI agents powered by the Service may:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
                <li>Generate inaccurate, incomplete, or inappropriate responses</li>
                <li>Fail to understand context or nuance</li>
                <li>Be unavailable due to third-party provider issues</li>
                <li>Have capabilities that change over time</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                You are responsible for reviewing and verifying any AI-generated content before
                use. AI outputs should not be relied upon as the sole source of truth for
                critical decisions.
              </p>

              <h3 className="text-lg font-semibold mt-6 mb-3">7.3 Third-Party Dependencies</h3>
              <p className="text-muted-foreground leading-relaxed">
                The Service relies on third-party providers for AI models, infrastructure, and
                other components. We are not responsible for service interruptions or changes
                caused by these providers.
              </p>
            </section>

            <Separator className="my-8" />

            <section id="ip-rights" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4">8. Intellectual Property Rights</h2>

              <h3 className="text-lg font-semibold mt-6 mb-3">8.1 Our Intellectual Property</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                The Service, including its original content, features, functionality, and
                underlying technology, is owned by HIVE Protocol and protected by international
                copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You may not copy, modify, distribute, sell, or lease any part of our Service,
                nor may you reverse engineer or attempt to extract the source code, unless
                permitted by law or with our written consent.
              </p>

              <h3 className="text-lg font-semibold mt-6 mb-3">8.2 Trademarks</h3>
              <p className="text-muted-foreground leading-relaxed">
                "HIVE Protocol," our logos, and other marks are trademarks of HIVE Protocol.
                You may not use these marks without our prior written permission.
              </p>
            </section>

            <Separator className="my-8" />

            <section id="user-content" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4">9. User Content</h2>

              <h3 className="text-lg font-semibold mt-6 mb-3">9.1 Ownership</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You retain ownership of any content you submit to the Service. By submitting
                content, you grant us a worldwide, non-exclusive, royalty-free license to use,
                process, store, and display your content solely for the purpose of providing
                and improving the Service.
              </p>

              <h3 className="text-lg font-semibold mt-6 mb-3">9.2 Responsibility</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You are solely responsible for your content and the consequences of sharing it.
                You represent and warrant that:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
                <li>You own or have the necessary rights to your content</li>
                <li>Your content does not infringe any third-party rights</li>
                <li>Your content complies with these Terms and applicable laws</li>
              </ul>

              <h3 className="text-lg font-semibold mt-6 mb-3">9.3 AI-Generated Content</h3>
              <p className="text-muted-foreground leading-relaxed">
                Content generated by AI agents through the Service may be subject to the terms
                and policies of the underlying AI model providers. You are responsible for
                ensuring your use of AI-generated content complies with all applicable terms
                and laws.
              </p>
            </section>

            <Separator className="my-8" />

            <section id="third-party" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4">10. Third-Party Services</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                The Service may integrate with or provide access to third-party services,
                including AI model providers, APIs, and other external platforms.
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
                <li>Your use of third-party services is subject to their respective terms</li>
                <li>We do not control and are not responsible for third-party services</li>
                <li>Third-party services may change, become unavailable, or impose additional fees</li>
                <li>We may receive compensation from third-party providers</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                Any credentials or API keys you provide for third-party integrations are your
                responsibility. We implement security measures but cannot guarantee the security
                of third-party connections.
              </p>
            </section>

            <Separator className="my-8" />

            <section id="disclaimer" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4">11. Disclaimers</h2>
              <Card className="border-amber-500/50 bg-amber-500/5">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY
                    KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED
                    WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
                    NON-INFRINGEMENT, OR COURSE OF PERFORMANCE.
                  </p>
                </CardContent>
              </Card>
              <p className="text-muted-foreground leading-relaxed mt-4">
                We do not warrant that:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>The Service will be uninterrupted, secure, or error-free</li>
                <li>Results obtained from the Service will be accurate or reliable</li>
                <li>Any errors in the Service will be corrected</li>
                <li>The Service will meet your specific requirements</li>
                <li>AI-generated content will be accurate, appropriate, or suitable for any purpose</li>
              </ul>
            </section>

            <Separator className="my-8" />

            <section id="liability" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4">12. Limitation of Liability</h2>
              <Card className="border-amber-500/50 bg-amber-500/5">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL HIVE PROTOCOL, ITS
                    DIRECTORS, EMPLOYEES, PARTNERS, AGENTS, SUPPLIERS, OR AFFILIATES BE LIABLE
                    FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES,
                    INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER
                    INTANGIBLE LOSSES.
                  </p>
                </CardContent>
              </Card>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Our total liability for any claims arising from or related to these Terms or
                the Service shall not exceed the greater of: (a) the amount you paid us in the
                12 months preceding the claim, or (b) $100 USD.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Some jurisdictions do not allow the exclusion or limitation of certain damages,
                so some of the above limitations may not apply to you.
              </p>
            </section>

            <Separator className="my-8" />

            <section id="indemnification" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4">13. Indemnification</h2>
              <p className="text-muted-foreground leading-relaxed">
                You agree to defend, indemnify, and hold harmless HIVE Protocol and its
                officers, directors, employees, and agents from any claims, damages, losses,
                liabilities, and expenses (including attorneys' fees) arising out of or related
                to: (a) your use of the Service; (b) your violation of these Terms; (c) your
                violation of any third-party rights; or (d) your content.
              </p>
            </section>

            <Separator className="my-8" />

            <section id="termination" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4">14. Termination</h2>

              <h3 className="text-lg font-semibold mt-6 mb-3">14.1 Termination by You</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You may terminate your account at any time by using the account deletion
                feature in your settings or by contacting us. Upon termination, your right
                to use the Service will immediately cease.
              </p>

              <h3 className="text-lg font-semibold mt-6 mb-3">14.2 Termination by Us</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We may suspend or terminate your account and access to the Service at any time,
                with or without cause, with or without notice. Reasons for termination may include:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
                <li>Violation of these Terms</li>
                <li>Engaging in prohibited activities</li>
                <li>Non-payment of applicable fees</li>
                <li>Extended periods of inactivity</li>
                <li>Legal or regulatory requirements</li>
                <li>Discontinuation of the Service</li>
              </ul>

              <h3 className="text-lg font-semibold mt-6 mb-3">14.3 Effect of Termination</h3>
              <p className="text-muted-foreground leading-relaxed">
                Upon termination, your data may be deleted in accordance with our Privacy Policy.
                Provisions of these Terms that by their nature should survive termination shall
                survive, including ownership provisions, warranty disclaimers, indemnification,
                and limitations of liability.
              </p>
            </section>

            <Separator className="my-8" />

            <section id="changes" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4">15. Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We reserve the right to modify these Terms at any time. We will notify you of
                any material changes by:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
                <li>Posting the updated Terms on this page</li>
                <li>Updating the "Last updated" date</li>
                <li>Sending an email notification for significant changes</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                Your continued use of the Service after changes become effective constitutes
                acceptance of the revised Terms. If you do not agree to the new Terms, you must
                stop using the Service.
              </p>
            </section>

            <Separator className="my-8" />

            <section id="general" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4">16. General Provisions</h2>

              <h3 className="text-lg font-semibold mt-6 mb-3">16.1 Governing Law</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                These Terms shall be governed by and construed in accordance with the laws of
                the State of Delaware, United States, without regard to its conflict of law
                principles.
              </p>

              <h3 className="text-lg font-semibold mt-6 mb-3">16.2 Dispute Resolution</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Any disputes arising from these Terms or the Service shall first be attempted
                to be resolved through good-faith negotiation. If negotiation fails, disputes
                shall be resolved through binding arbitration in accordance with the rules of
                the American Arbitration Association.
              </p>

              <h3 className="text-lg font-semibold mt-6 mb-3">16.3 Severability</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                If any provision of these Terms is found to be unenforceable, the remaining
                provisions will continue in full force and effect.
              </p>

              <h3 className="text-lg font-semibold mt-6 mb-3">16.4 Waiver</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Our failure to enforce any right or provision of these Terms will not be
                considered a waiver of those rights.
              </p>

              <h3 className="text-lg font-semibold mt-6 mb-3">16.5 Entire Agreement</h3>
              <p className="text-muted-foreground leading-relaxed">
                These Terms, together with our Privacy Policy and any other agreements
                expressly incorporated by reference, constitute the entire agreement between
                you and HIVE Protocol regarding the Service.
              </p>
            </section>

            <Separator className="my-8" />

            <section id="contact" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4">17. Contact Information</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                If you have any questions about these Terms of Service, please contact us:
              </p>

              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-1">HIVE Protocol</h4>
                      <p className="text-sm text-muted-foreground">Legal Department</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email:</p>
                      <Link
                        href="mailto:legal@hiveprotocol.ai"
                        className="text-primary hover:underline"
                      >
                        legal@hiveprotocol.ai
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
                <Link href="/privacy">
                  <Button variant="outline" className="w-full sm:w-auto">
                    View Privacy Policy
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
