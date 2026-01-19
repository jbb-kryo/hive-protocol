'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Users,
  MessageCircle,
  Github,
  BookOpen,
  Heart,
  Award,
  Code,
  Lightbulb,
  Shield,
  HandHeart,
  Star,
  GitPullRequest,
  MessagesSquare,
  ExternalLink,
  ArrowRight,
  Sparkles,
  Globe,
  Zap,
  Trophy,
} from 'lucide-react'
import { Navbar } from '@/components/marketing/navbar'
import { Footer } from '@/components/marketing/footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const communityStats = [
  { label: 'Discord Members', value: '2,500+', icon: MessageCircle },
  { label: 'GitHub Stars', value: '1,200+', icon: Star },
  { label: 'Contributors', value: '85+', icon: Users },
  { label: 'Countries', value: '45+', icon: Globe },
]

const platforms = [
  {
    name: 'Discord',
    description: 'Join our Discord server for real-time discussions, support, and community events.',
    icon: MessageCircle,
    href: '#',
    color: 'bg-[#5865F2]',
    members: '2,500+ members',
    buttonText: 'Join Discord',
  },
  {
    name: 'GitHub',
    description: 'Contribute to HIVE, report issues, and explore the source code.',
    icon: Github,
    href: '#',
    color: 'bg-zinc-800',
    members: '1,200+ stars',
    buttonText: 'View Repository',
  },
  {
    name: 'Discussions',
    description: 'Ask questions, share ideas, and participate in community discussions.',
    icon: MessagesSquare,
    href: '#',
    color: 'bg-emerald-600',
    members: '500+ threads',
    buttonText: 'Browse Discussions',
  },
]

const guidelines = [
  {
    icon: Heart,
    title: 'Be Respectful',
    description: 'Treat everyone with respect. No harassment, hate speech, or personal attacks.',
  },
  {
    icon: HandHeart,
    title: 'Be Helpful',
    description: 'Share knowledge, answer questions, and help others succeed.',
  },
  {
    icon: Shield,
    title: 'Stay On Topic',
    description: 'Keep discussions relevant to HIVE and AI agent development.',
  },
  {
    icon: Lightbulb,
    title: 'Share Ideas',
    description: 'We welcome feedback, feature requests, and creative solutions.',
  },
]

const contributionWays = [
  {
    icon: Code,
    title: 'Code Contributions',
    description: 'Submit pull requests to fix bugs, add features, or improve documentation.',
    action: 'View Issues',
    href: '#',
  },
  {
    icon: BookOpen,
    title: 'Documentation',
    description: 'Help improve our docs, write tutorials, or translate content.',
    action: 'Edit Docs',
    href: '/docs',
  },
  {
    icon: MessagesSquare,
    title: 'Community Support',
    description: 'Answer questions on Discord or GitHub Discussions.',
    action: 'Join Discord',
    href: '#',
  },
  {
    icon: Lightbulb,
    title: 'Feature Ideas',
    description: 'Share your ideas for new features or improvements.',
    action: 'Submit Idea',
    href: '#',
  },
]

const featuredProjects = [
  {
    name: 'HIVE MCP Connector',
    description: 'A community-built connector for Model Context Protocol integration.',
    author: 'Alex Chen',
    authorAvatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=100',
    stars: 234,
    language: 'TypeScript',
  },
  {
    name: 'SwarmViz',
    description: 'Real-time visualization dashboard for monitoring agent swarms.',
    author: 'Maria Santos',
    authorAvatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100',
    stars: 189,
    language: 'React',
  },
  {
    name: 'AgentFlow CLI',
    description: 'Command-line interface for managing HIVE deployments.',
    author: 'James Wilson',
    authorAvatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100',
    stars: 156,
    language: 'Go',
  },
]

const topContributors = [
  {
    name: 'Sarah Kim',
    avatar: 'https://images.pexels.com/photos/3756679/pexels-photo-3756679.jpeg?auto=compress&cs=tinysrgb&w=100',
    contributions: 47,
    role: 'Core Contributor',
  },
  {
    name: 'Michael Brown',
    avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=100',
    contributions: 38,
    role: 'Documentation Lead',
  },
  {
    name: 'Elena Rodriguez',
    avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100',
    contributions: 31,
    role: 'Community Mod',
  },
  {
    name: 'David Park',
    avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100',
    contributions: 28,
    role: 'Bug Hunter',
  },
]

export default function CommunityPage() {
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
              <Users className="w-3 h-3 mr-1" />
              Join the Community
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Built by the Community,
              <span className="text-primary block">For the Community</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Connect with developers, researchers, and AI enthusiasts building the future
              of multi-agent systems. Share ideas, get help, and contribute.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="gap-2">
                <MessageCircle className="w-4 h-4" />
                Join Discord
              </Button>
              <Button size="lg" variant="outline" className="gap-2">
                <Github className="w-4 h-4" />
                View GitHub
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-20"
          >
            {communityStats.map((stat, index) => (
              <Card key={stat.label} className="text-center">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <stat.icon className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
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
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Connect With Us</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose your preferred platform to engage with the HIVE community
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {platforms.map((platform, index) => (
              <motion.div
                key={platform.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:border-primary/50 transition-colors">
                  <CardContent className="pt-6">
                    <div className={`w-12 h-12 rounded-xl ${platform.color} flex items-center justify-center mb-4`}>
                      <platform.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{platform.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{platform.description}</p>
                    <p className="text-xs text-muted-foreground mb-4">{platform.members}</p>
                    <Button variant="outline" className="w-full gap-2">
                      {platform.buttonText}
                      <ExternalLink className="w-4 h-4" />
                    </Button>
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
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Community Guidelines</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Help us maintain a welcoming and productive community
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {guidelines.map((guideline, index) => (
              <motion.div
                key={guideline.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full text-center">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <guideline.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">{guideline.title}</h3>
                    <p className="text-sm text-muted-foreground">{guideline.description}</p>
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
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">How to Contribute</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              There are many ways to contribute to HIVE and help the community grow
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-6">
            {contributionWays.map((way, index) => (
              <motion.div
                key={way.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <way.icon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{way.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{way.description}</p>
                        <Link href={way.href}>
                          <Button variant="outline" size="sm" className="gap-2">
                            {way.action}
                            <ArrowRight className="w-3 h-3" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12"
          >
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="py-8">
                <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                    <GitPullRequest className="w-8 h-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">First Time Contributing?</h3>
                    <p className="text-muted-foreground">
                      Check out our "good first issue" labels on GitHub. We're happy to help you get started!
                    </p>
                  </div>
                  <Button className="gap-2 shrink-0">
                    <Github className="w-4 h-4" />
                    Browse Good First Issues
                  </Button>
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
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Featured Community Projects</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover amazing projects built by the community
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {featuredProjects.map((project, index) => (
              <motion.div
                key={project.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:border-primary/50 transition-colors group cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="secondary">{project.language}</Badge>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Star className="w-4 h-4" />
                        <span className="text-sm">{project.stars}</span>
                      </div>
                    </div>
                    <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                      {project.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">{project.description}</p>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={project.authorAvatar} alt={project.author} />
                        <AvatarFallback>{project.author[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">{project.author}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-8"
          >
            <Button variant="outline" className="gap-2">
              View All Community Projects
              <ArrowRight className="w-4 h-4" />
            </Button>
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
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Top Contributors</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Thank you to our amazing contributors who make HIVE better every day
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {topContributors.map((contributor, index) => (
              <motion.div
                key={contributor.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full text-center">
                  <CardContent className="pt-6">
                    <Avatar className="w-16 h-16 mx-auto mb-4">
                      <AvatarImage src={contributor.avatar} alt={contributor.name} />
                      <AvatarFallback>{contributor.name[0]}</AvatarFallback>
                    </Avatar>
                    <h3 className="font-semibold mb-1">{contributor.name}</h3>
                    <p className="text-xs text-primary mb-2">{contributor.role}</p>
                    <div className="flex items-center justify-center gap-1 text-muted-foreground">
                      <GitPullRequest className="w-4 h-4" />
                      <span className="text-sm">{contributor.contributions} contributions</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-8"
          >
            <Button variant="outline" className="gap-2">
              <Trophy className="w-4 h-4" />
              View All Contributors
            </Button>
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to Join?</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Whether you're looking to learn, contribute, or just connect with like-minded
              developers, we'd love to have you in our community.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="gap-2">
                <MessageCircle className="w-4 h-4" />
                Join Discord
              </Button>
              <Link href="/docs">
                <Button size="lg" variant="outline" className="gap-2">
                  Read the Docs
                  <ArrowRight className="w-4 h-4" />
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
