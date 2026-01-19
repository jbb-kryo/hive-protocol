'use client'

import { motion } from 'framer-motion'

interface TypingIndicatorProps {
  agentName: string
  agentColor: string
  streamingContent?: string
}

export function TypingIndicator({ agentName, agentColor, streamingContent }: TypingIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-start gap-3 p-4"
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
        style={{ backgroundColor: agentColor }}
      >
        {agentName[0]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium">{agentName}</span>
          {!streamingContent && (
            <span className="text-xs text-muted-foreground">is thinking</span>
          )}
        </div>
        {streamingContent ? (
          <div className="text-sm whitespace-pre-wrap break-words">
            {streamingContent}
            <motion.span
              className="inline-block w-2 h-4 ml-0.5 bg-primary"
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            />
          </div>
        ) : (
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-primary/60"
                animate={{ y: [0, -4, 0] }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
