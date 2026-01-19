'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail,
  MessageSquare,
  Send,
  CheckCircle,
  Loader2,
  Building2,
  Headphones,
  Handshake,
  CreditCard,
  MessageCircle,
  HelpCircle,
  MapPin,
  Clock,
  ArrowRight,
} from 'lucide-react'
import { Navbar } from '@/components/marketing/navbar'
import { Footer } from '@/components/marketing/footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

const categories = [
  {
    value: 'sales',
    label: 'Sales Inquiry',
    icon: Building2,
    description: 'Pricing, enterprise plans, custom solutions',
  },
  {
    value: 'support',
    label: 'Technical Support',
    icon: Headphones,
    description: 'Bug reports, technical issues, troubleshooting',
  },
  {
    value: 'partnership',
    label: 'Partnership',
    icon: Handshake,
    description: 'Integration partners, resellers, affiliates',
  },
  {
    value: 'billing',
    label: 'Billing',
    icon: CreditCard,
    description: 'Invoices, payments, subscription changes',
  },
  {
    value: 'feedback',
    label: 'Product Feedback',
    icon: MessageCircle,
    description: 'Feature requests, suggestions, improvements',
  },
  {
    value: 'general',
    label: 'General Inquiry',
    icon: HelpCircle,
    description: 'Other questions or inquiries',
  },
]

const contactInfo = [
  {
    icon: Mail,
    title: 'Email',
    value: 'support@https://hive-protocol.online',
    description: 'Send us an email anytime',
  },
  {
    icon: MapPin,
    title: 'Location',
    value: 'San Francisco, CA',
    description: 'United States',
  },
  {
    icon: Clock,
    title: 'Response Time',
    value: '< 24 hours',
    description: 'For most inquiries',
  },
]

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: '',
    subject: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const { error: submitError } = await supabase
        .from('contact_submissions')
        .insert({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          category: formData.category,
          subject: formData.subject.trim() || null,
          message: formData.message.trim(),
        })

      if (submitError) throw submitError

      setIsSubmitted(true)
    } catch (err) {
      setError('Failed to submit your message. Please try again.')
      console.error('Contact form error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const selectedCategory = categories.find((c) => c.value === formData.category)

  return (
    <main className="min-h-screen">
      <Navbar />

      <section className="pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Contact the HIVE Protocol Team</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Have questions about AI agent orchestration? Need technical support? We're here to help.
              Fill out the form below and our team will get back to you within 24 hours.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Send us a Message
                  </CardTitle>
                  <CardDescription>
                    Fill out the form and we'll respond within 24 hours
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AnimatePresence mode="wait">
                    {isSubmitted ? (
                      <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="py-12 text-center"
                      >
                        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
                          <CheckCircle className="w-8 h-8 text-emerald-500" />
                        </div>
                        <h3 className="text-2xl font-semibold mb-2">Message Sent!</h3>
                        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                          Thank you for reaching out. We've received your message and will get back to
                          you at <span className="font-medium text-foreground">{formData.email}</span>{' '}
                          within 24 hours.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setIsSubmitted(false)
                              setFormData({
                                name: '',
                                email: '',
                                category: '',
                                subject: '',
                                message: '',
                              })
                            }}
                          >
                            Send Another Message
                          </Button>
                          <Link href="/docs">
                            <Button>
                              Browse Documentation
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                          </Link>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.form
                        key="form"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onSubmit={handleSubmit}
                        className="space-y-6"
                      >
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">Name *</Label>
                            <Input
                              id="name"
                              placeholder="Your name"
                              value={formData.name}
                              onChange={(e) => handleChange('name', e.target.value)}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">Email *</Label>
                            <Input
                              id="email"
                              type="email"
                              placeholder="you@example.com"
                              value={formData.email}
                              onChange={(e) => handleChange('email', e.target.value)}
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="category">Category *</Label>
                          <Select
                            value={formData.category}
                            onValueChange={(value) => handleChange('category', value)}
                            required
                          >
                            <SelectTrigger id="category">
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category.value} value={category.value}>
                                  <div className="flex items-center gap-2">
                                    <category.icon className="w-4 h-4" />
                                    <span>{category.label}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {selectedCategory && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {selectedCategory.description}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="subject">Subject</Label>
                          <Input
                            id="subject"
                            placeholder="Brief description of your inquiry"
                            value={formData.subject}
                            onChange={(e) => handleChange('subject', e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="message">Message *</Label>
                          <Textarea
                            id="message"
                            placeholder="Tell us how we can help..."
                            value={formData.message}
                            onChange={(e) => handleChange('message', e.target.value)}
                            required
                            rows={6}
                            className="resize-none"
                          />
                        </div>

                        {error && (
                          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                            {error}
                          </div>
                        )}

                        <Button
                          type="submit"
                          size="lg"
                          className="w-full"
                          disabled={
                            isSubmitting ||
                            !formData.name ||
                            !formData.email ||
                            !formData.category ||
                            !formData.message
                          }
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              Send Message
                            </>
                          )}
                        </Button>
                      </motion.form>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {contactInfo.map((info) => (
                    <div key={info.title} className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <info.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{info.title}</p>
                        <p className="font-medium">{info.value}</p>
                        <p className="text-xs text-muted-foreground">{info.description}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Links</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link
                    href="/docs"
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <span className="text-sm">Documentation</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </Link>
                  <Link
                    href="/pricing"
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <span className="text-sm">Pricing</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </Link>
                  <Link
                    href="/features"
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <span className="text-sm">Features</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </Link>
                </CardContent>
              </Card>

              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">Need Immediate Help?</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Check our documentation for answers to common questions and detailed guides.
                  </p>
                  <Link href="/docs">
                    <Button variant="outline" size="sm" className="w-full">
                      Browse Documentation
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl font-bold mb-2">Choose the Right Department</h2>
            <p className="text-muted-foreground">
              Select the category that best matches your inquiry for faster assistance
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category, index) => (
              <motion.div
                key={category.value}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={cn(
                    'h-full cursor-pointer transition-all hover:border-primary/50',
                    formData.category === category.value && 'border-primary ring-1 ring-primary'
                  )}
                  onClick={() => {
                    handleChange('category', category.value)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <category.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">{category.label}</h3>
                        <p className="text-sm text-muted-foreground">{category.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
