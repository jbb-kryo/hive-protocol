'use client'

import { motion } from 'framer-motion'
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  trend?: number
}

export function StatCard({ label, value, icon: Icon, trend }: StatCardProps) {
  return (
    <motion.div whileHover={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            {trend !== undefined && (
              <div
                className={`flex items-center gap-1 text-sm ${
                  trend >= 0 ? 'text-success' : 'text-destructive'
                }`}
              >
                {trend >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span>{Math.abs(trend)}%</span>
              </div>
            )}
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
