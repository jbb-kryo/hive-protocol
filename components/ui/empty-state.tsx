'use client'

import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
    variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link'
  }
  secondaryAction?: {
    label: string
    onClick: () => void
    variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link'
  }
  children?: ReactNode
  className?: string
  variant?: 'default' | 'card'
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  children,
  className = '',
  variant = 'default',
}: EmptyStateProps) {
  const content = (
    <div className={`flex flex-col items-center justify-center text-center ${className}`}>
      <div className="mb-4 rounded-full bg-muted p-6">
        <Icon className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="mb-6 max-w-sm text-sm text-muted-foreground">
        {description}
      </p>
      {children}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {action && (
            <Button
              onClick={action.onClick}
              variant={action.variant || 'default'}
              size="lg"
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              variant={secondaryAction.variant || 'outline'}
              size="lg"
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )

  if (variant === 'card') {
    return (
      <Card className="p-12">
        {content}
      </Card>
    )
  }

  return (
    <div className="py-12 px-4">
      {content}
    </div>
  )
}

interface EmptyStateListProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyStateList({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateListProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-3 rounded-full bg-muted/50 p-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h4 className="mb-1 text-base font-medium">{title}</h4>
      <p className="mb-4 text-sm text-muted-foreground max-w-xs">
        {description}
      </p>
      {action && (
        <Button onClick={action.onClick} size="sm">
          {action.label}
        </Button>
      )}
    </div>
  )
}
