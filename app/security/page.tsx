'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Shield,
  Lock,
  Key,
  Server,
  Database,
  Eye,
  Bug,
  Mail,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Users,
  Fingerprint,
  Network,
  ChevronRight,
  ExternalLink,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Navbar } from '@/components/marketing/navbar'
import { Footer } from '@/components/marketing/footer'

const lastUpdated = 'January 8, 2026'

const sections = [
  { id: 'overview', title: 'Security Overview', icon: Shield },
  { id: 'encryption', title: 'Data Encryption', icon: Lock },
  { id: 'authentication', title: 'Authentication', icon: Key },
  { id: 'infrastructure', title: 'Infrastructure', icon: Server },
  { id: 'data-protection', title: 'Data Protection', icon: Database },
  { id: 'monitoring', title: 'Monitoring & Response', icon: Eye },
  { id: 'user-security', title: 'User Security', icon: Users },
  { id: 'disclosure', title: 'Responsible Disclosure', icon: Bug },
  { id: 'bug-bounty', title: 'Bug Bounty Program', icon: AlertTriangle },
  { id: 'contact', title: 'Contact Security Team', icon: Mail },
]

const securityFeatures = [
  {
    icon: Lock,
    title: 'End-to-End Encryption',
    description: 'All data encrypted at rest (AES-256) and in transit (TLS 1.3)',
  },
  {
    icon: Fingerprint,
    title: 'Multi-Factor Authentication',
    description: 'Optional 2FA with TOTP for enhanced account security',
  },
  {
    icon: Database,
    title: 'Row Level Security',
    description: 'Database-level access controls ensuring complete data isolation',
  },
  {
    icon: Network,
    title: 'Cryptographic Verification',
    description: 'All agent messages are cryptographically signed and verified',
  },
]

const complianceItems = [
  { name: 'SOC 2 Type II', status: 'compliant' },
  { name: 'GDPR', status: 'compliant' },
  { name: 'CCPA', status: 'compliant' },
  { name: 'HIPAA', status: 'planned' },
]

export default function SecurityPage() {
  const [activeSection, setActiveSection] = useState('overview')

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
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 mb-6">
              <Shield className="w-8 h-8 text-emerald-500" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Security at HIVE Protocol
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-4">
              Security is at the core of everything we build. Learn about our security
              practices, infrastructure, and how to report vulnerabilities.
            </p>
            <p className="text-sm text-muted-foreground">
              Last updated: {lastUpdated}
            </p>
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="max-w-6xl mx-auto px-4 py-8"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {securityFeatures.map((feature) => (
            <Card key={feature.title} className="border-emerald-500/20 bg-emerald-500/5">
              <CardContent className="p-4">
                <feature.icon className="w-8 h-8 text-emerald-500 mb-3" />
                <h3 className="font-semibold mb-1">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

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
                    On This Page
                  </h3>
                  <nav className="space-y-1">
                    {sections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => scrollToSection(section.id)}
                        className={cn(
                          'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors text-left',
                          activeSection === section.id
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium'
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
                    <span className="font-semibold text-sm">On This Page</span>
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
            <section id="overview" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <Shield className="w-6 h-6 text-emerald-500" />
                Security Overview
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                At HIVE Protocol, security is not an afterthought—it's foundational to how we
                design, build, and operate our platform. We implement defense-in-depth strategies
                across all layers of our infrastructure to protect your data and ensure the
                integrity of AI agent communications.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Our security program is designed to meet the needs of enterprise customers while
                remaining accessible to individual developers and small teams.
              </p>

              <h3 className="text-lg font-semibold mt-6 mb-3">Compliance & Certifications</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 not-prose">
                {complianceItems.map((item) => (
                  <Card key={item.name} className="text-center">
                    <CardContent className="p-4">
                      <p className="font-semibold text-sm mb-1">{item.name}</p>
                      <Badge
                        variant={item.status === 'compliant' ? 'default' : 'secondary'}
                        className={item.status === 'compliant' ? 'bg-emerald-500' : ''}
                      >
                        {item.status === 'compliant' ? 'Compliant' : 'Planned'}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            <Separator className="my-8" />

            <section id="encryption" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <Lock className="w-6 h-6 text-emerald-500" />
                Data Encryption
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We employ industry-standard encryption throughout our platform to ensure your
                data remains confidential and protected.
              </p>

              <h3 className="text-lg font-semibold mt-6 mb-3">Encryption at Rest</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
                <li>All database storage encrypted using AES-256</li>
                <li>Encryption keys managed through secure key management services</li>
                <li>Regular key rotation following security best practices</li>
                <li>Backup data encrypted with separate encryption keys</li>
              </ul>

              <h3 className="text-lg font-semibold mt-6 mb-3">Encryption in Transit</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
                <li>TLS 1.3 enforced for all connections</li>
                <li>HTTPS required for all web traffic</li>
                <li>Certificate pinning for mobile applications</li>
                <li>Secure WebSocket connections for real-time features</li>
              </ul>

              <h3 className="text-lg font-semibold mt-6 mb-3">Message Signatures</h3>
              <p className="text-muted-foreground leading-relaxed">
                All agent messages are cryptographically signed using HMAC-SHA256, ensuring
                message authenticity and preventing tampering. Each swarm has a unique signing
                key, and signatures are verified before message processing.
              </p>
            </section>

            <Separator className="my-8" />

            <section id="authentication" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <Key className="w-6 h-6 text-emerald-500" />
                Authentication
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We provide robust authentication mechanisms to protect your account and data.
              </p>

              <h3 className="text-lg font-semibold mt-6 mb-3">Password Security</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
                <li>Passwords hashed using bcrypt with high cost factor</li>
                <li>Minimum password requirements enforced</li>
                <li>Breach detection integration to flag compromised credentials</li>
                <li>Secure password reset flow with time-limited tokens</li>
              </ul>

              <h3 className="text-lg font-semibold mt-6 mb-3">Two-Factor Authentication (2FA)</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
                <li>TOTP-based 2FA using industry-standard algorithms</li>
                <li>Backup codes for account recovery</li>
                <li>2FA required for sensitive operations</li>
                <li>Compatible with popular authenticator apps</li>
              </ul>

              <h3 className="text-lg font-semibold mt-6 mb-3">Session Management</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Secure, HTTP-only session cookies</li>
                <li>Automatic session expiration after inactivity</li>
                <li>Ability to view and revoke active sessions</li>
                <li>IP-based anomaly detection</li>
              </ul>
            </section>

            <Separator className="my-8" />

            <section id="infrastructure" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <Server className="w-6 h-6 text-emerald-500" />
                Infrastructure Security
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Our infrastructure is built on industry-leading cloud providers with comprehensive
                security controls.
              </p>

              <h3 className="text-lg font-semibold mt-6 mb-3">Supabase Platform</h3>
              <div className="not-prose mb-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground mb-3">
                      Our database and authentication infrastructure runs on Supabase, which provides:
                    </p>
                    <ul className="space-y-2">
                      {[
                        'SOC 2 Type II certified infrastructure',
                        'Automatic backups with point-in-time recovery',
                        'Network isolation and firewall protection',
                        'DDoS protection and rate limiting',
                        'Regular security audits and penetration testing',
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <h3 className="text-lg font-semibold mt-6 mb-3">Edge Functions</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
                <li>Serverless execution with automatic scaling</li>
                <li>Isolated execution environments per request</li>
                <li>Secure secret management for API keys</li>
                <li>Request validation and sanitization</li>
              </ul>

              <h3 className="text-lg font-semibold mt-6 mb-3">Network Security</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Web Application Firewall (WAF) protection</li>
                <li>Geographic rate limiting capabilities</li>
                <li>Real-time threat detection and blocking</li>
                <li>CDN with edge security features</li>
              </ul>
            </section>

            <Separator className="my-8" />

            <section id="data-protection" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <Database className="w-6 h-6 text-emerald-500" />
                Data Protection
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We implement strict data protection measures to ensure your information is
                secure and properly isolated.
              </p>

              <h3 className="text-lg font-semibold mt-6 mb-3">Row Level Security (RLS)</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Every table in our database is protected by Row Level Security policies that
                enforce access controls at the database level. This ensures that:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
                <li>Users can only access their own data</li>
                <li>Team members can only access authorized resources</li>
                <li>No data leakage is possible between accounts</li>
                <li>Access policies are enforced regardless of application logic</li>
              </ul>

              <h3 className="text-lg font-semibold mt-6 mb-3">Data Minimization</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
                <li>We only collect data necessary for service operation</li>
                <li>Sensitive data is automatically redacted from logs</li>
                <li>Data retention policies automatically delete old data</li>
              </ul>

              <h3 className="text-lg font-semibold mt-6 mb-3">API Key Security</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>User API keys for integrations are encrypted before storage</li>
                <li>Keys are decrypted only when needed for execution</li>
                <li>Service role keys are never exposed to client applications</li>
              </ul>
            </section>

            <Separator className="my-8" />

            <section id="monitoring" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <Eye className="w-6 h-6 text-emerald-500" />
                Monitoring & Incident Response
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We maintain comprehensive monitoring and have established procedures for
                responding to security incidents.
              </p>

              <h3 className="text-lg font-semibold mt-6 mb-3">Continuous Monitoring</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
                <li>24/7 infrastructure monitoring and alerting</li>
                <li>Automated anomaly detection for suspicious activity</li>
                <li>Comprehensive audit logging of security events</li>
                <li>Real-time error tracking and analysis</li>
              </ul>

              <h3 className="text-lg font-semibold mt-6 mb-3">Incident Response</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Documented incident response procedures</li>
                <li>Defined escalation paths and responsibilities</li>
                <li>Post-incident review and remediation</li>
                <li>User notification within 72 hours for data breaches</li>
              </ul>
            </section>

            <Separator className="my-8" />

            <section id="user-security" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <Users className="w-6 h-6 text-emerald-500" />
                Security Best Practices for Users
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                While we implement robust security measures, account security is a shared
                responsibility. Here are best practices to keep your account secure:
              </p>

              <div className="not-prose grid gap-4 sm:grid-cols-2 mt-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Key className="w-4 h-4 text-emerald-500" />
                      Enable 2FA
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground">
                      Enable two-factor authentication in your account settings for an extra
                      layer of security.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Lock className="w-4 h-4 text-emerald-500" />
                      Strong Passwords
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground">
                      Use a unique, strong password. Consider using a password manager to
                      generate and store complex passwords.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Eye className="w-4 h-4 text-emerald-500" />
                      Review Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground">
                      Regularly review your account activity and active sessions for any
                      unauthorized access.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-500" />
                      Secure API Keys
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground">
                      Never share API keys in public repositories. Use environment variables
                      and rotate keys regularly.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </section>

            <Separator className="my-8" />

            <section id="disclosure" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <Bug className="w-6 h-6 text-emerald-500" />
                Responsible Disclosure Policy
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We value the security research community and encourage responsible disclosure
                of vulnerabilities. If you discover a security issue, please report it to us
                following these guidelines.
              </p>

              <h3 className="text-lg font-semibold mt-6 mb-3">Reporting Guidelines</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
                <li>
                  Email your findings to{' '}
                  <Link href="mailto:security@hiveprotocol.ai" className="text-emerald-600 dark:text-emerald-400 hover:underline">
                    security@hiveprotocol.ai
                  </Link>
                </li>
                <li>Include detailed steps to reproduce the vulnerability</li>
                <li>Provide proof-of-concept code if applicable</li>
                <li>Allow reasonable time for us to investigate and patch (90 days)</li>
                <li>Do not access or modify other users' data</li>
                <li>Do not perform actions that could harm service availability</li>
              </ul>

              <h3 className="text-lg font-semibold mt-6 mb-3">What to Include in Your Report</h3>
              <div className="not-prose">
                <Card>
                  <CardContent className="p-4">
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li><strong className="text-foreground">Description:</strong> Clear explanation of the vulnerability</li>
                      <li><strong className="text-foreground">Impact:</strong> Potential security impact if exploited</li>
                      <li><strong className="text-foreground">Steps:</strong> Detailed reproduction steps</li>
                      <li><strong className="text-foreground">Environment:</strong> Browser, OS, and other relevant details</li>
                      <li><strong className="text-foreground">Screenshots/Videos:</strong> Visual evidence if helpful</li>
                      <li><strong className="text-foreground">Suggested Fix:</strong> Your recommendations (optional)</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <h3 className="text-lg font-semibold mt-6 mb-3">Our Commitment</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Acknowledge receipt within 48 hours</li>
                <li>Provide regular updates on investigation progress</li>
                <li>Work with you to understand and validate the issue</li>
                <li>Credit researchers in our security acknowledgments (with permission)</li>
                <li>Not pursue legal action against good-faith security research</li>
              </ul>
            </section>

            <Separator className="my-8" />

            <section id="bug-bounty" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-emerald-500" />
                Bug Bounty Program
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We offer rewards for qualifying security vulnerabilities reported through our
                responsible disclosure program.
              </p>

              <h3 className="text-lg font-semibold mt-6 mb-3">Eligible Vulnerabilities</h3>
              <div className="not-prose grid gap-3 sm:grid-cols-2 mb-4">
                <Card className="border-emerald-500/30 bg-emerald-500/5">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-emerald-600 dark:text-emerald-400 mb-2">In Scope</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>Authentication bypass</li>
                      <li>SQL injection</li>
                      <li>Cross-site scripting (XSS)</li>
                      <li>Remote code execution</li>
                      <li>Data exposure vulnerabilities</li>
                      <li>Authorization flaws</li>
                      <li>Cryptographic weaknesses</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2">Out of Scope</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>Social engineering attacks</li>
                      <li>Physical security issues</li>
                      <li>Denial of service attacks</li>
                      <li>Spam or rate limiting issues</li>
                      <li>Missing security headers (non-critical)</li>
                      <li>Third-party service vulnerabilities</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <h3 className="text-lg font-semibold mt-6 mb-3">Reward Tiers</h3>
              <div className="not-prose">
                <Card>
                  <CardContent className="p-4">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="text-center p-4 rounded-lg bg-muted/50">
                        <p className="text-2xl font-bold text-emerald-500">$100-$500</p>
                        <p className="text-sm text-muted-foreground mt-1">Low Severity</p>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-muted/50">
                        <p className="text-2xl font-bold text-emerald-500">$500-$2,000</p>
                        <p className="text-sm text-muted-foreground mt-1">Medium Severity</p>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-muted/50">
                        <p className="text-2xl font-bold text-emerald-500">$2,000-$10,000</p>
                        <p className="text-sm text-muted-foreground mt-1">High/Critical</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-4 text-center">
                      Rewards are determined based on severity, impact, and quality of the report.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </section>

            <Separator className="my-8" />

            <section id="contact" className="scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <Mail className="w-6 h-6 text-emerald-500" />
                Contact Security Team
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Have questions about our security practices or need to report an issue?
                Reach out to our security team.
              </p>

              <div className="not-prose">
                <Card className="border-emerald-500/20">
                  <CardContent className="p-6">
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div>
                        <h4 className="font-semibold mb-2">Security Reports</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          For vulnerability reports and security concerns:
                        </p>
                        <Link
                          href="mailto:security@hiveprotocol.ai"
                          className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                        >
                          security@hiveprotocol.ai
                        </Link>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">General Inquiries</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          For general security questions:
                        </p>
                        <Link
                          href="/contact"
                          className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium inline-flex items-center gap-1"
                        >
                          Contact Page
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>

                    <Separator className="my-6" />

                    <div>
                      <h4 className="font-semibold mb-2">PGP Key</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        For encrypted communications, use our PGP public key:
                      </p>
                      <div className="bg-muted rounded-lg p-3">
                        <code className="text-xs break-all text-muted-foreground">
                          Key ID: 0xABCD1234EFGH5678
                        </code>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-4 not-prose">
                <Link href="/privacy">
                  <Button variant="outline" className="w-full sm:w-auto">
                    <FileText className="w-4 h-4 mr-2" />
                    Privacy Policy
                  </Button>
                </Link>
                <Link href="/terms">
                  <Button variant="outline" className="w-full sm:w-auto">
                    <FileText className="w-4 h-4 mr-2" />
                    Terms of Service
                  </Button>
                </Link>
                <Link href="/docs">
                  <Button variant="outline" className="w-full sm:w-auto">
                    <FileText className="w-4 h-4 mr-2" />
                    Documentation
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
