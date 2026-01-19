'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, X, LogIn, UserPlus, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function GuestBanner() {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-6"
      >
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-500/20 rounded-lg shrink-0">
            <AlertCircle className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-foreground">You're using Basic Access</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Your data is saved locally in this browser. Create a free account to save your work permanently,
              access from any device, and unlock more features.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Button size="sm" asChild>
                <Link href="/signup" className="gap-2">
                  <UserPlus className="w-4 h-4" />
                  Create Account
                </Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link href="/login" className="gap-2">
                  <LogIn className="w-4 h-4" />
                  Sign In
                </Link>
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => setDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
