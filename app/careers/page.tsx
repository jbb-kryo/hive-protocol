'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Briefcase,
  Heart,
  Clock,
  Globe,
  Zap,
  Users,
  Coffee,
  GraduationCap,
  HeartHandshake,
  Laptop,
  Plane,
  TrendingUp,
  CheckCircle,
  Loader2,
  Send,
  ArrowRight,
  Sparkles,
  Building2,
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
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'

const values = [
  {
    icon: Zap,
    title: 'Move Fast',
    description: 'We ship quickly, iterate constantly, and embrace calculated risks. Speed is a feature.',
  },
  {
    icon: Users,
    title: 'Collaborate Openly',
    description: 'We share context freely, communicate transparently, and believe the best ideas can come from anywhere.',
  },
  {
    icon: Heart,
    title: 'Care Deeply',
    description: 'We obsess over quality, sweat the details, and take pride in craftsmanship.',
  },
  {
    icon: TrendingUp,
    title: 'Think Long-Term',
    description: 'We build for the future, invest in sustainable growth, and prioritize lasting impact.',
  },
]

const benefits = [
  {
    icon: Laptop,
    title: 'Remote-First',
    description: 'Work from anywhere in the world. We believe in output over presence.',
  },
  {
    icon: Clock,
    title: 'Flexible Hours',
    description: 'Design your own schedule. Core hours ensure overlap, but flexibility is key.',
  },
  {
    icon: HeartHandshake,
    title: 'Health & Wellness',
    description: 'Comprehensive health, dental, and vision coverage for you and your family.',
  },
  {
    icon: Plane,
    title: 'Unlimited PTO',
    description: 'Take the time you need to recharge. We trust you to manage your workload.',
  },
  {
    icon: GraduationCap,
    title: 'Learning Budget',
    description: '$2,000 annual budget for courses, conferences, and professional development.',
  },
  {
    icon: Coffee,
    title: 'Home Office Stipend',
    description: '$1,500 to set up your perfect workspace, plus $100/month for ongoing expenses.',
  },
]

const departments = [
  { value: 'engineering', label: 'Engineering' },
  { value: 'product', label: 'Product' },
  { value: 'design', label: 'Design' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'sales', label: 'Sales' },
  { value: 'operations', label: 'Operations' },
  { value: 'other', label: 'Other' },
]

const experienceLevels = [
  { value: '0-2', label: '0-2 years' },
  { value: '3-5', label: '3-5 years' },
  { value: '5-8', label: '5-8 years' },
  { value: '8+', label: '8+ years' },
]

export default function CareersPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    linkedinUrl: '',
    portfolioUrl: '',
    department: '',
    experienceYears: '',
    coverLetter: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const experienceMap: Record<string, number> = {
        '0-2': 1,
        '3-5': 4,
        '5-8': 6,
        '8+': 10,
      }

      const { error: submitError } = await supabase
        .from('job_applications')
        .insert({
          full_name: formData.fullName.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim() || null,
          linkedin_url: formData.linkedinUrl.trim() || null,
          portfolio_url: formData.portfolioUrl.trim() || null,
          position_interest: formData.department,
          experience_years: experienceMap[formData.experienceYears] || 0,
          cover_letter: formData.coverLetter.trim() || null,
        })

      if (submitError) throw submitError

      setIsSubmitted(true)
    } catch (err) {
      setError('Failed to submit your application. Please try again.')
      console.error('Application form error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

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
            <Badge variant="outline" className="mb-4">
              <Sparkles className="w-3 h-3 mr-1" />
              We're Hiring
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Build the Future of
              <span className="text-primary block">AI Orchestration</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join a passionate team working on cutting-edge multi-agent AI systems.
              We're looking for curious minds who want to shape how AI agents collaborate.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative rounded-2xl overflow-hidden mb-20 h-64 sm:h-80 lg:h-96"
          >
            <Image
              src="https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1200"
              alt="HIVE Protocol engineering team collaborating on AI agent orchestration"
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/50 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <div className="flex flex-wrap gap-4 justify-center">
                <div className="flex items-center gap-2 bg-background/80 backdrop-blur px-4 py-2 rounded-full">
                  <Globe className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Remote-First</span>
                </div>
                <div className="flex items-center gap-2 bg-background/80 backdrop-blur px-4 py-2 rounded-full">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Small Team</span>
                </div>
                <div className="flex items-center gap-2 bg-background/80 backdrop-blur px-4 py-2 rounded-full">
                  <Zap className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">High Impact</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Our Values</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              These principles guide how we work, make decisions, and treat each other
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full text-center">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <value.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">{value.title}</h3>
                    <p className="text-sm text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Benefits & Perks</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We take care of our team so they can focus on doing their best work
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <benefit.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">{benefit.title}</h3>
                        <p className="text-sm text-muted-foreground">{benefit.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Open Positions</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore our current opportunities
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card className="max-w-2xl mx-auto">
              <CardContent className="py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                  <Briefcase className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Open Positions Right Now</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  We don't have any active job openings at the moment, but we're always interested
                  in hearing from talented people. Submit your information below and we'll reach
                  out when a relevant opportunity becomes available.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    document.getElementById('application-form')?.scrollIntoView({ behavior: 'smooth' })
                  }}
                >
                  Join Our Talent Pool
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      <section id="application-form" className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Join Our Talent Pool</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Submit your information and we'll contact you when a role matching your
              background opens up
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  General Application
                </CardTitle>
                <CardDescription>
                  Tell us about yourself and what you're looking for
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
                      <h3 className="text-2xl font-semibold mb-2">Application Received!</h3>
                      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        Thank you for your interest in joining HIVE. We've added you to our talent pool
                        and will reach out at <span className="font-medium text-foreground">{formData.email}</span>{' '}
                        when a relevant opportunity becomes available.
                      </p>
                      <div className="flex flex-wrap justify-center gap-4">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsSubmitted(false)
                            setFormData({
                              fullName: '',
                              email: '',
                              phone: '',
                              linkedinUrl: '',
                              portfolioUrl: '',
                              department: '',
                              experienceYears: '',
                              coverLetter: '',
                            })
                          }}
                        >
                          Submit Another Application
                        </Button>
                        <Link href="/about">
                          <Button>
                            Learn More About Us
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
                          <Label htmlFor="fullName">Full Name *</Label>
                          <Input
                            id="fullName"
                            placeholder="Your full name"
                            value={formData.fullName}
                            onChange={(e) => handleChange('fullName', e.target.value)}
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

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="+1 (555) 000-0000"
                            value={formData.phone}
                            onChange={(e) => handleChange('phone', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                          <Input
                            id="linkedinUrl"
                            type="url"
                            placeholder="https://linkedin.com/in/yourprofile"
                            value={formData.linkedinUrl}
                            onChange={(e) => handleChange('linkedinUrl', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="portfolioUrl">Portfolio / Website</Label>
                        <Input
                          id="portfolioUrl"
                          type="url"
                          placeholder="https://yourportfolio.com"
                          value={formData.portfolioUrl}
                          onChange={(e) => handleChange('portfolioUrl', e.target.value)}
                        />
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="department">Area of Interest *</Label>
                          <Select
                            value={formData.department}
                            onValueChange={(value) => handleChange('department', value)}
                            required
                          >
                            <SelectTrigger id="department">
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                            <SelectContent>
                              {departments.map((dept) => (
                                <SelectItem key={dept.value} value={dept.value}>
                                  {dept.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="experienceYears">Experience Level *</Label>
                          <Select
                            value={formData.experienceYears}
                            onValueChange={(value) => handleChange('experienceYears', value)}
                            required
                          >
                            <SelectTrigger id="experienceYears">
                              <SelectValue placeholder="Select experience" />
                            </SelectTrigger>
                            <SelectContent>
                              {experienceLevels.map((level) => (
                                <SelectItem key={level.value} value={level.value}>
                                  {level.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="coverLetter">Tell us about yourself</Label>
                        <Textarea
                          id="coverLetter"
                          placeholder="What excites you about HIVE? What would you bring to the team?"
                          value={formData.coverLetter}
                          onChange={(e) => handleChange('coverLetter', e.target.value)}
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
                          !formData.fullName ||
                          !formData.email ||
                          !formData.department ||
                          !formData.experienceYears
                        }
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Submit Application
                          </>
                        )}
                      </Button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Have Questions?</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Want to learn more about working at HIVE? We'd love to hear from you.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/about">
                <Button variant="outline" size="lg">
                  Learn About Us
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg">
                  Get in Touch
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
