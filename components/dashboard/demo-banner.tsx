'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export function DemoBanner() {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 border border-primary/30 rounded-lg p-3 mb-6 flex items-center justify-between"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="font-medium text-sm">You're in Demo Mode</p>
          <p className="text-xs text-muted-foreground">
            Sign up to save your work and unlock all features
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" asChild>
          <Link href="/signup">Sign Up Free</Link>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setDismissed(true)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  )
}
