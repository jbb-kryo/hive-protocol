'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  Hexagon,
  Target,
  Sparkles,
  Users,
  Shield,
  Zap,
  Heart,
  Globe,
  Lightbulb,
  ArrowRight,
  Quote,
  Network,
  Bot,
  Code,
  Rocket,
  CheckCircle2,
  Building2,
  GraduationCap,
  Briefcase,
  Twitter,
  Linkedin,
  Github,
} from 'lucide-react'
import { Navbar } from '@/components/marketing/navbar'
import { Footer } from '@/components/marketing/footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const values = [
  {
    icon: Shield,
    title: 'Security First',
    description:
      'We believe AI should be trustworthy. Every message is cryptographically signed, every action is auditable, and every byte of data is protected.',
  },
  {
    icon: Users,
    title: 'Human-Centered',
    description:
      'AI should augment human capabilities, not replace human judgment. Our human-in-the-loop design keeps you in control at all times.',
  },
  {
    icon: Lightbulb,
    title: 'Radical Transparency',
    description:
      'No black boxes. Every agent decision, every tool execution, and every interaction is logged and visible. You always know what your agents are doing.',
  },
  {
    icon: Heart,
    title: 'Developer Empathy',
    description:
      'We build tools we want to use ourselves. Clean APIs, thoughtful documentation, and interfaces that make complex orchestration feel simple.',
  },
  {
    icon: Globe,
    title: 'Open Ecosystem',
    description:
      'HIVE is model-agnostic by design. Connect OpenAI, Anthropic, Google, or your own models. Your choice, your control.',
  },
  {
    icon: Zap,
    title: 'Performance Obsessed',
    description:
      'Sub-100ms latency, real-time streaming, and efficient resource usage. Because waiting for AI should never slow you down.',
  },
]

const founder = {
  name: 'JB Benjamin',
  role: 'The Creator',
  image: '/3250399_6539674.jpg',
  bio: 'As the CEO and Founder of Akuma Engineering Ltd since 2024, I lead a pioneering ecosystem that incentivizes ethical data sharing for AI training systems. With a focus on Artificial Intelligence, Machine Learning, and Robotics, our work addresses the critical need for legally compliant and ethically sourced datasets, enabling organizations to build robust AI models while empowering users.',
  links: { twitter: 'https://x.com/jbwb2020', linkedin: 'https://www.linkedin.com/in/jbbenjamin/', github: 'https://github.com/jbb-kryo/' },
}

const milestones = [
  {
    year: 'November 2025',
    title: 'The Spark',
    description:
      'Founded with a simple question: Why is coordinating AI agents so hard? Started building in a garage with a whiteboard full of ideas.',
  },
  {
    year: 'December 2025',
    title: 'First Swarm',
    description:
      'Launched our first working prototype. Three agents collaborating on a research task. It was messy, but it worked.',
  },
  {
    year: 'January 2026',
    title: 'Public Beta',
    description:
      'Opened HIVE Protocol to early adopters. The feedback was incredible. We rebuilt everything twice based on what we learned.',
  },
  {
    year: 'April 2026',
    title: 'Enterprise Ready',
    description:
      'Launched enterprise features: SOC 2 compliance, SSO, advanced security. Major companies started building on HIVE.',
  },
]

const audiences = [
  {
    icon: Code,
    title: 'Developers',
    description:
      'Build sophisticated AI applications without wrestling with agent coordination. Focus on your product, not the plumbing.',
    features: ['Clean TypeScript APIs', 'Comprehensive documentation', 'Active developer community'],
  },
  {
    icon: Building2,
    title: 'Enterprises',
    description:
      'Deploy AI agents at scale with the security and compliance your organization demands. Full audit trails and granular access controls.',
    features: ['SOC 2 compliance', 'SSO integration', 'Dedicated support'],
  },
  {
    icon: Briefcase,
    title: 'Startups',
    description:
      'Move fast without sacrificing security. Our generous free tier lets you experiment, and our pricing scales with your success.',
    features: ['Generous free tier', 'Pay-as-you-grow pricing', 'Quick time-to-market'],
  },
  {
    icon: GraduationCap,
    title: 'Researchers',
    description:
      'Explore multi-agent systems with production-grade infrastructure. From academic experiments to breakthrough discoveries.',
    features: ['Research credits program', 'Academic partnerships', 'Open collaboration'],
  },
]

export default function AboutPage() {
  return (
    <main className="min-h-screen">
      <Navbar />

      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Badge className="mb-6">About HIVE Protocol</Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Pioneering the Future of
              <span className="block text-primary">Multi-Agent AI Systems</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              HIVE Protocol is building the infrastructure for autonomous AI agent orchestration.
              We believe multi-agent systems represent the next evolution of artificial intelligence,
              where specialized AI agents collaborate to solve complex problems no single model can tackle alone.
              Our platform makes this future accessible to every developer and enterprise.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid lg:grid-cols-2 gap-12 items-center"
          >
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">Our Mission: Democratizing AI Agent Orchestration</h2>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                We are democratizing multi-agent AI by providing enterprise-grade infrastructure, cryptographic security,
                and intuitive tools that make autonomous agent swarms accessible to developers and organizations of all sizes.
                From research teams exploring LLM coordination to enterprises deploying production AI workflows.
              </p>
              <div className="flex items-start gap-4 p-4 rounded-xl bg-background border">
                <Target className="w-8 h-8 text-primary shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Our North Star</h3>
                  <p className="text-muted-foreground">
                    Every developer should be able to build, deploy, and manage multi-agent AI swarms
                    as easily as they deploy a modern web application.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square rounded-2xl overflow-hidden relative">
                <Image
                  src="https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt="AI development team collaborating on multi-agent orchestration platform"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-background p-6 rounded-xl border shadow-lg max-w-xs">
                <div className="flex items-center gap-3 mb-2">
                  <Hexagon className="w-8 h-8 text-primary fill-primary/20" />
                  <div>
                    <p className="font-bold text-2xl">10M+</p>
                    <p className="text-sm text-muted-foreground">Messages processed</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid lg:grid-cols-2 gap-12 items-center"
          >
            <div className="order-2 lg:order-1 relative">
              <div className="aspect-video rounded-2xl overflow-hidden relative">
                <Image
                  src="https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt="HIVE Protocol vision: future of AI agent collaboration and coordination"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  loading="lazy"
                />
              </div>
              <div className="absolute -top-6 -right-6 bg-background p-6 rounded-xl border shadow-lg max-w-xs">
                <Sparkles className="w-6 h-6 text-primary mb-2" />
                <p className="text-sm font-medium">
                  &quot;The future belongs to those who harness collective AI intelligence.&quot;
                </p>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">Our Vision</h2>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                We envision a world where AI agents work alongside humans as trusted collaborators,
                handling complex tasks while humans maintain oversight and control.
              </p>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                HIVE Protocol is the foundation for this future, a secure, scalable platform where
                specialized AI agents coordinate seamlessly, and where humans can step in at any moment
                to guide, correct, or approve agent actions.
              </p>
              <ul className="space-y-3">
                {[
                  'AI that augments human capabilities',
                  'Transparent and auditable agent behavior',
                  'Security without sacrificing speed',
                  'Accessible to developers of all skill levels',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
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
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">The Origin Story</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From a frustrating hackathon to a platform serving thousands
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="grid lg:grid-cols-5 gap-0">
                  <div className="lg:col-span-2 relative min-h-[300px]">
                    <Image
                      src="https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=800"
                      alt="Software engineer developing AI orchestration platform at HIVE Protocol"
                      fill
                      sizes="(max-width: 1024px) 100vw, 40vw"
                      className="object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent lg:bg-gradient-to-r" />
                  </div>
                  <div className="lg:col-span-3 p-8 lg:p-12 flex flex-col justify-center">
                    <Quote className="w-10 h-10 text-primary/20 mb-4" />
                    <blockquote className="text-lg mb-6 leading-relaxed">
                      It was 3 AM at a hackathon. I had four AI agents that each worked perfectly alone,
                      but getting them to collaborate was a nightmare. They would lose context, duplicate work,
                      and sometimes outright contradict each other. I spent more time on coordination code
                      than on the actual product.
                    </blockquote>
                    <blockquote className="text-lg mb-6 leading-relaxed">
                      That night, I sketched out what would become HIVE Protocol. What if there was infrastructure
                      specifically designed for multi-agent coordination? What if agents could share context,
                      verify each other&#39;s outputs, and work together as seamlessly as a well-organized team?
                    </blockquote>
                    <blockquote className="text-lg mb-8 leading-relaxed">
                      Barely two months later, that sketch has become a platform used by thousands of developers.
                      But the mission remains the same: make AI agents work better together.
                    </blockquote>
                    <div className="flex items-center gap-4">
                      <Image
                        src="/3250399_6539674.jpg"
                        alt="JB Benjamin - Founder and CEO of HIVE Protocol AI orchestration platform"
                        width={48}
                        height={48}
                        className="rounded-full object-cover"
                        loading="lazy"
                      />
                      <div>
                        <p className="font-semibold">JB Benjamin</p>
                        <p className="text-sm text-muted-foreground">Founder & CEO</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
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
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Our Journey</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Key milestones in the HIVE Protocol story
            </p>
          </motion.div>

          <div className="relative">
            <div className="absolute left-1/2 -translate-x-px h-full w-0.5 bg-border hidden md:block" />
            <div className="space-y-12">
              {milestones.map((milestone, index) => (
                <motion.div
                  key={milestone.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex flex-col md:flex-row items-center gap-8 ${
                    index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                  }`}
                >
                  <div className={`flex-1 ${index % 2 === 0 ? 'md:text-right' : 'md:text-left'}`}>
                    <Card className="inline-block">
                      <CardContent className="p-6">
                        <Badge variant="outline" className="mb-3">
                          {milestone.year}
                        </Badge>
                        <h3 className="text-xl font-bold mb-2">{milestone.title}</h3>
                        <p className="text-muted-foreground">{milestone.description}</p>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="relative z-10 w-12 h-12 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <Rocket className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div className="flex-1 hidden md:block" />
                </motion.div>
              ))}
            </div>
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
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Who We Build For</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              HIVE Protocol is designed for anyone who wants to harness the power of coordinated AI
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {audiences.map((audience, index) => (
              <motion.div
                key={audience.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:border-primary/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <audience.icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-2">{audience.title}</h3>
                        <p className="text-muted-foreground mb-4">{audience.description}</p>
                        <ul className="space-y-2">
                          {audience.features.map((feature) => (
                            <li key={feature} className="flex items-center gap-2 text-sm">
                              <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
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
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Our Values</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The principles that guide everything we build
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="h-full group hover:border-primary/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <value.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">{value.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{value.description}</p>
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
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Meet the Brains</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The person building a future for AI orchestration
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card className="overflow-hidden group max-w-4xl mx-auto">
              <div className="grid md:grid-cols-2">
                <div className="aspect-square md:aspect-auto overflow-hidden relative min-h-[300px]">
                  <Image
                    src={founder.image}
                    alt={`${founder.name} - ${founder.role} at HIVE Protocol multi-agent AI platform`}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
                <CardContent className="p-8 flex flex-col justify-center">
                  <h3 className="font-bold text-2xl mb-2">{founder.name}</h3>
                  <p className="text-primary mb-4 font-medium">{founder.role}</p>
                  <p className="text-muted-foreground leading-relaxed mb-6">{founder.bio}</p>
                  <div className="flex gap-4">
                    <a href={founder.links.twitter} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                      <Twitter className="w-5 h-5" />
                    </a>
                    <a href={founder.links.linkedin} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                      <Linkedin className="w-5 h-5" />
                    </a>
                    <a href={founder.links.github} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                      <Github className="w-5 h-5" />
                    </a>
                  </div>
                </CardContent>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <p className="text-muted-foreground mb-4">Want to join us?</p>
            <Link href="/careers">
              <Button variant="outline" className="gap-2">
                View Open Positions
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
              <CardContent className="p-8 md:p-12 text-center relative">
                <Network className="w-16 h-16 text-primary/20 mx-auto mb-6" />
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to Join the Swarm?</h2>
                <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                  Start building with HIVE Protocol today. Free to start, scales with your success.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Link href="/signup">
                    <Button size="lg" className="gap-2">
                      Get Started Free
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link href="/contact">
                    <Button size="lg" variant="outline">
                      Talk to Us
                    </Button>
                  </Link>
                </div>
                <p className="text-sm text-muted-foreground mt-6">
                  No credit card required
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
