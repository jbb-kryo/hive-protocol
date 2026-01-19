'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Moon, Sun, Monitor } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize how HIVE looks on your device</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-32 animate-pulse bg-muted rounded-lg" />
        </CardContent>
      </Card>
    )
  }

  const currentTheme = theme || 'system'
  const resolvedTheme = theme === 'system' ? systemTheme : theme

  const themeOptions = [
    {
      value: 'light',
      label: 'Light',
      description: 'Light color scheme',
      icon: Sun,
    },
    {
      value: 'dark',
      label: 'Dark',
      description: 'Dark color scheme',
      icon: Moon,
    },
    {
      value: 'system',
      label: 'System',
      description: 'Use system preference',
      icon: Monitor,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>
          Customize how HIVE looks on your device. Your preference will be saved and applied across all sessions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup value={currentTheme} onValueChange={setTheme}>
          <div className="grid gap-4">
            {themeOptions.map((option) => {
              const Icon = option.icon
              const isSelected = currentTheme === option.value

              return (
                <Label
                  key={option.value}
                  htmlFor={option.value}
                  className="relative flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer hover:bg-accent/50 transition-colors"
                  style={{
                    borderColor: isSelected ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                  }}
                >
                  <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
                  <div className="flex-shrink-0">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center transition-colors"
                      style={{
                        backgroundColor: isSelected
                          ? 'hsl(var(--primary) / 0.1)'
                          : 'hsl(var(--muted))',
                      }}
                    >
                      <Icon
                        className="w-6 h-6"
                        style={{
                          color: isSelected ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{option.label}</div>
                    <div className="text-sm text-muted-foreground">{option.description}</div>
                  </div>
                  {isSelected && (
                    <div className="flex-shrink-0">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: 'hsl(var(--primary))' }}
                      >
                        <svg
                          className="w-3 h-3 text-primary-foreground"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                </Label>
              )
            })}
          </div>
        </RadioGroup>

        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Current theme:</span>
            <span className="font-medium capitalize">{resolvedTheme}</span>
          </div>
        </div>

        <div className="rounded-lg bg-muted/50 p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Monitor className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">System Preference</span>
          </div>
          <p className="text-xs text-muted-foreground">
            When set to System, the theme will automatically match your device&apos;s appearance
            settings. Changes to your system theme will be reflected immediately.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
