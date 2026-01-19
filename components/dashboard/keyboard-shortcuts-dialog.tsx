'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Kbd } from '@/components/ui/kbd'

interface KeyboardShortcutsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const shortcuts = [
  {
    category: 'General',
    items: [
      { keys: ['⌘/Ctrl', 'K'], description: 'Open command palette' },
      { keys: ['⌘/Ctrl', 'P'], description: 'Global search' },
      { keys: ['⌘/Ctrl', 'Shift', 'F'], description: 'Global search (alternative)' },
      { keys: ['?'], description: 'Show keyboard shortcuts' },
      { keys: ['Esc'], description: 'Close dialogs and modals' },
    ],
  },
  {
    category: 'Navigation',
    items: [
      { keys: ['⌘/Ctrl', 'D'], description: 'Go to Dashboard' },
      { keys: ['⌘/Ctrl', 'S'], description: 'Go to Swarms' },
      { keys: ['⌘/Ctrl', 'A'], description: 'Go to Agents' },
      { keys: ['⌘/Ctrl', 'T'], description: 'Go to Tools' },
      { keys: ['⌘/Ctrl', ','], description: 'Go to Settings' },
    ],
  },
  {
    category: 'Actions',
    items: [
      { keys: ['N'], description: 'Create new swarm (on Swarms page)' },
      { keys: ['/'], description: 'Focus search input' },
    ],
  },
]

export function KeyboardShortcutsDialog({ open, onOpenChange }: KeyboardShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Use these shortcuts to navigate and perform actions faster
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          {shortcuts.map((group) => (
            <div key={group.category}>
              <h3 className="text-sm font-semibold mb-3">{group.category}</h3>
              <div className="space-y-2">
                {group.items.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <Kbd key={keyIndex}>{key}</Kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Press <Kbd>?</Kbd> at any time to view this dialog
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
