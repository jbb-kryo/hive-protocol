'use client'

import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  rating: number
  size?: 'xs' | 'sm' | 'md' | 'lg'
  showValue?: boolean
  count?: number
  className?: string
}

const sizeMap = {
  xs: 'w-3 h-3',
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
}

const textSizeMap = {
  xs: 'text-[10px]',
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
}

export function StarRating({ rating, size = 'sm', showValue, count, className }: StarRatingProps) {
  const starSize = sizeMap[size]
  const textSize = textSizeMap[size]

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => {
          const fill = Math.min(Math.max(rating - (star - 1), 0), 1)
          return (
            <Star
              key={star}
              className={cn(
                starSize,
                fill >= 1
                  ? 'fill-amber-400 text-amber-400'
                  : fill > 0
                  ? 'fill-amber-400/50 text-amber-400'
                  : 'text-muted-foreground/30'
              )}
            />
          )
        })}
      </div>
      {showValue && (
        <span className={cn('font-medium text-foreground', textSize)}>
          {rating.toFixed(1)}
        </span>
      )}
      {count !== undefined && (
        <span className={cn('text-muted-foreground', textSize)}>
          ({count})
        </span>
      )}
    </div>
  )
}

interface InteractiveStarRatingProps {
  value: number
  onChange: (value: number) => void
  size?: 'sm' | 'md' | 'lg'
}

export function InteractiveStarRating({ value, onChange, size = 'lg' }: InteractiveStarRatingProps) {
  const starSize = size === 'lg' ? 'w-8 h-8' : size === 'md' ? 'w-6 h-6' : 'w-5 h-5'

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        >
          <Star
            className={cn(
              starSize,
              'transition-colors',
              star <= value
                ? 'fill-amber-400 text-amber-400'
                : 'text-muted-foreground/30 hover:text-amber-300'
            )}
          />
        </button>
      ))}
    </div>
  )
}
