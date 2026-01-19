import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

export type KeyboardShortcut = {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  description: string
  action: () => void
  category?: string
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled = true) {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      const isInputElement =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable

      for (const shortcut of shortcuts) {
        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase()
        const ctrlMatches = shortcut.ctrlKey === undefined || event.ctrlKey === shortcut.ctrlKey
        const metaMatches = shortcut.metaKey === undefined || event.metaKey === shortcut.metaKey
        const shiftMatches = shortcut.shiftKey === undefined || event.shiftKey === shortcut.shiftKey
        const altMatches = shortcut.altKey === undefined || event.altKey === shortcut.altKey

        const modifierPressed = event.ctrlKey || event.metaKey || event.altKey

        if (keyMatches && ctrlMatches && metaMatches && shiftMatches && altMatches) {
          if (isInputElement && !modifierPressed && shortcut.key !== 'Escape') {
            continue
          }

          event.preventDefault()
          shortcut.action()
          break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts, enabled])
}

export function getShortcutDisplay(shortcut: Partial<KeyboardShortcut>): string {
  const parts: string[] = []
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0

  if (shortcut.ctrlKey || shortcut.metaKey) {
    parts.push(isMac ? '⌘' : 'Ctrl')
  }
  if (shortcut.shiftKey) {
    parts.push(isMac ? '⇧' : 'Shift')
  }
  if (shortcut.altKey) {
    parts.push(isMac ? '⌥' : 'Alt')
  }
  if (shortcut.key) {
    const keyDisplay = shortcut.key.length === 1 ? shortcut.key.toUpperCase() : shortcut.key
    parts.push(keyDisplay)
  }

  return parts.join(isMac ? '' : '+')
}

export function useNavigationShortcuts() {
  const router = useRouter()

  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'd',
      metaKey: true,
      ctrlKey: true,
      description: 'Go to Dashboard',
      action: () => router.push('/dashboard'),
      category: 'Navigation',
    },
    {
      key: 's',
      metaKey: true,
      ctrlKey: true,
      description: 'Go to Swarms',
      action: () => router.push('/swarms'),
      category: 'Navigation',
    },
    {
      key: 'a',
      metaKey: true,
      ctrlKey: true,
      description: 'Go to Agents',
      action: () => router.push('/agents'),
      category: 'Navigation',
    },
    {
      key: 't',
      metaKey: true,
      ctrlKey: true,
      description: 'Go to Tools',
      action: () => router.push('/tools'),
      category: 'Navigation',
    },
    {
      key: ',',
      metaKey: true,
      ctrlKey: true,
      description: 'Go to Settings',
      action: () => router.push('/settings'),
      category: 'Navigation',
    },
  ]

  return shortcuts
}
