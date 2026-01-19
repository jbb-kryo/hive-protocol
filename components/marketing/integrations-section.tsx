'use client'

import { motion } from 'framer-motion'
import { Bot, Brain, Cpu, Server, Code } from 'lucide-react'

const integrations = [
  { name: 'Anthropic', icon: Brain },
  { name: 'OpenAI', icon: Bot },
  { name: 'HuggingFace', icon: Cpu },
  { name: 'LM Studio', icon: Server },
  { name: 'LangChain', icon: Code },
]

export function IntegrationsSection() {
  return (
    <section className="py-16 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-muted-foreground mb-8">
          Integrates with your favorite platforms
        </p>
        <div className="flex flex-wrap justify-center gap-8 md:gap-12">
          {integrations.map((integration, i) => (
            <motion.div
              key={integration.name}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-2 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            >
              <integration.icon className="w-6 h-6" />
              <span className="font-medium">{integration.name}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
