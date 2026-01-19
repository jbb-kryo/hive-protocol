'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Home,
  Hexagon,
  Bot,
  Wrench,
  Plug,
  Settings,
  Plus,
  Search,
  FileText,
  Shield,
  Users,
  Zap,
  BookOpen,
  Mail,
  DollarSign,
  BarChart3,
  Activity,
} from 'lucide-react'
import { useStore } from '@/store'

type CommandItem = {
  id: string
  label: string
  icon: any
  action: () => void
  category: string
  keywords?: string[]
}

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter()
  const { user } = useStore()
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!open) {
      setSearch('')
    }
  }, [open])

  const commands: CommandItem[] = useMemo(() => {
    const items: CommandItem[] = [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: Home,
        action: () => {
          router.push('/dashboard')
          onOpenChange(false)
        },
        category: 'Navigation',
        keywords: ['home', 'overview'],
      },
      {
        id: 'swarms',
        label: 'View Swarms',
        icon: Hexagon,
        action: () => {
          router.push('/swarms')
          onOpenChange(false)
        },
        category: 'Navigation',
        keywords: ['teams', 'groups'],
      },
      {
        id: 'agents',
        label: 'View Agents',
        icon: Bot,
        action: () => {
          router.push('/agents')
          onOpenChange(false)
        },
        category: 'Navigation',
        keywords: ['ai', 'bots'],
      },
      {
        id: 'tools',
        label: 'View Tools',
        icon: Wrench,
        action: () => {
          router.push('/tools')
          onOpenChange(false)
        },
        category: 'Navigation',
        keywords: ['utilities', 'functions'],
      },
      {
        id: 'integrations',
        label: 'View Integrations',
        icon: Plug,
        action: () => {
          router.push('/integrations')
          onOpenChange(false)
        },
        category: 'Navigation',
        keywords: ['connections', 'api'],
      },
      {
        id: 'settings',
        label: 'Settings',
        icon: Settings,
        action: () => {
          router.push('/settings')
          onOpenChange(false)
        },
        category: 'Navigation',
        keywords: ['preferences', 'config'],
      },
      {
        id: 'new-swarm',
        label: 'Create New Swarm',
        icon: Plus,
        action: () => {
          router.push('/swarms?action=create')
          onOpenChange(false)
        },
        category: 'Actions',
        keywords: ['add', 'new team'],
      },
      {
        id: 'docs',
        label: 'View Documentation',
        icon: BookOpen,
        action: () => {
          router.push('/docs')
          onOpenChange(false)
        },
        category: 'Help',
        keywords: ['help', 'guide', 'tutorial'],
      },
      {
        id: 'features',
        label: 'View Features',
        icon: Zap,
        action: () => {
          router.push('/features')
          onOpenChange(false)
        },
        category: 'Help',
        keywords: ['capabilities', 'what can'],
      },
      {
        id: 'pricing',
        label: 'View Pricing',
        icon: DollarSign,
        action: () => {
          router.push('/pricing')
          onOpenChange(false)
        },
        category: 'Help',
        keywords: ['plans', 'cost', 'upgrade'],
      },
      {
        id: 'contact',
        label: 'Contact Support',
        icon: Mail,
        action: () => {
          router.push('/contact')
          onOpenChange(false)
        },
        category: 'Help',
        keywords: ['help', 'email', 'message'],
      },
      {
        id: 'blog',
        label: 'View Blog',
        icon: FileText,
        action: () => {
          router.push('/blog')
          onOpenChange(false)
        },
        category: 'Help',
        keywords: ['articles', 'news', 'updates'],
      },
    ]

    if (user?.role === 'admin') {
      items.push(
        {
          id: 'admin',
          label: 'Admin Dashboard',
          icon: Shield,
          action: () => {
            router.push('/admin')
            onOpenChange(false)
          },
          category: 'Admin',
          keywords: ['administrator', 'management'],
        },
        {
          id: 'admin-users',
          label: 'Manage Users',
          icon: Users,
          action: () => {
            router.push('/admin/users')
            onOpenChange(false)
          },
          category: 'Admin',
          keywords: ['administrator', 'accounts'],
        },
        {
          id: 'admin-analytics',
          label: 'View Analytics',
          icon: BarChart3,
          action: () => {
            router.push('/admin/analytics')
            onOpenChange(false)
          },
          category: 'Admin',
          keywords: ['statistics', 'metrics', 'data'],
        },
        {
          id: 'admin-errors',
          label: 'View Error Logs',
          icon: Activity,
          action: () => {
            router.push('/admin/errors')
            onOpenChange(false)
          },
          category: 'Admin',
          keywords: ['logs', 'debugging'],
        }
      )
    }

    return items
  }, [router, onOpenChange, user])

  const filteredCommands = useMemo(() => {
    if (!search) return commands

    const searchLower = search.toLowerCase()
    return commands.filter((command) => {
      const labelMatch = command.label.toLowerCase().includes(searchLower)
      const keywordMatch = command.keywords?.some((keyword) =>
        keyword.toLowerCase().includes(searchLower)
      )
      const categoryMatch = command.category.toLowerCase().includes(searchLower)
      return labelMatch || keywordMatch || categoryMatch
    })
  }, [commands, search])

  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {}
    filteredCommands.forEach((command) => {
      if (!groups[command.category]) {
        groups[command.category] = []
      }
      groups[command.category].push(command)
    })
    return groups
  }, [filteredCommands])

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Type a command or search..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {Object.entries(groupedCommands).map(([category, items], index) => (
          <div key={category}>
            {index > 0 && <CommandSeparator />}
            <CommandGroup heading={category}>
              {items.map((item) => (
                <CommandItem
                  key={item.id}
                  onSelect={() => item.action()}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </div>
        ))}
      </CommandList>
    </CommandDialog>
  )
}
