'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { JsonLd } from '@/components/seo/json-ld'

export interface FAQ {
  question: string
  answer: string
  links?: { text: string; href: string }[]
}

interface FAQSectionProps {
  title?: string
  subtitle?: string
  faqs: FAQ[]
  showSchema?: boolean
  showMoreLink?: boolean
  columns?: 1 | 2
}

export function FAQSection({
  title = 'Frequently Asked Questions',
  subtitle,
  faqs,
  showSchema = true,
  showMoreLink = true,
  columns = 1,
}: FAQSectionProps) {
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set([0]))

  const toggleQuestion = (index: number) => {
    setExpandedQuestions((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  return (
    <section className="py-20">
      {showSchema && (
        <JsonLd
          data={{
            type: 'FAQPage',
            questions: faqs.map((faq) => ({
              question: faq.question,
              answer: faq.answer,
            })),
          }}
        />
      )}
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
          {subtitle && (
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>
          )}
        </motion.div>

        <div
          className={`max-w-4xl mx-auto ${
            columns === 2 ? 'grid md:grid-cols-2 gap-4' : 'space-y-3'
          }`}
        >
          {faqs.map((faq, index) => {
            const isExpanded = expandedQuestions.has(index)
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="h-full">
                  <button
                    onClick={() => toggleQuestion(index)}
                    className="w-full text-left p-4 flex items-start gap-3"
                  >
                    <div className="mt-0.5 shrink-0">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-primary" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm md:text-base">{faq.question}</h3>
                      {isExpanded && (
                        <CardContent className="p-0 pt-3">
                          <p className="text-sm text-muted-foreground">{faq.answer}</p>
                          {faq.links && faq.links.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {faq.links.map((link) => (
                                <Link key={link.href} href={link.href}>
                                  <Badge
                                    variant="secondary"
                                    className="hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer text-xs"
                                  >
                                    {link.text}
                                  </Badge>
                                </Link>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      )}
                    </div>
                  </button>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {showMoreLink && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-8"
          >
            <Link href="/faq">
              <Button variant="outline">View All FAQs</Button>
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  )
}
