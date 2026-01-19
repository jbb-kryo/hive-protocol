'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CTASection() {
  return (
    <section className="py-24 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10" />
      <div className="absolute inset-0 honeycomb-pattern opacity-30" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative z-10 max-w-3xl mx-auto text-center"
      >
        <h2 className="text-3xl sm:text-4xl font-bold">
          Ready to Build Your AI Agent Swarm?
        </h2>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Join thousands of developers building autonomous multi-agent AI systems with HIVE Protocol.
          Start orchestrating LLMs like GPT-4, Claude, and Gemini in minutes.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="gap-2 text-lg px-8" asChild>
            <Link href="/onboarding">
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="text-lg px-8" asChild>
            <Link href="/docs">Learn More</Link>
          </Button>
        </div>
      </motion.div>
    </section>
  )
}
