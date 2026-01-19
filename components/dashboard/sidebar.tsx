'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import {
  Hexagon,
  Home,
  Bot,
  Wrench,
  Plug,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  Shield,
  Moon,
  Sun,
  Workflow,
  Building2,
  BarChart3,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Kbd } from '@/components/ui/kbd'
import { useStore } from '@/store'
import { signOut } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useTheme } from 'next-themes'

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Dashboard', shortcut: '⌘D' },
  { href: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/swarms', icon: Hexagon, label: 'Swarms', shortcut: '⌘S' },
  { href: '/agents', icon: Bot, label: 'Agents', shortcut: '⌘A' },
  { href: '/workflows', icon: Workflow, label: 'Workflows', shortcut: '⌘W' },
  { href: '/tools', icon: Wrench, label: 'Tools', shortcut: '⌘T' },
  { href: '/dashboard/fine-tuning', icon: Sparkles, label: 'Fine-tuning' },
  { href: '/integrations', icon: Plug, label: 'Integrations' },
  { href: '/teams', icon: Building2, label: 'Teams' },
]

const bottomNavItems = [
  { href: '/settings', icon: Settings, label: 'Settings', shortcut: '⌘,' },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { sidebarOpen, setSidebarOpen, user, isDemo } = useStore()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const closeMobileMenu = () => {
    setMobileOpen(false)
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="flex flex-col h-full">
      <div className="p-4 flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2">
          <Hexagon className="h-8 w-8 text-primary fill-primary/20" />
          {(isMobile || sidebarOpen) && <span className="font-bold text-lg">HIVE</span>}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto hidden lg:flex"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <ChevronLeft className={cn('h-4 w-4 transition-transform', !sidebarOpen && 'rotate-180')} />
        </Button>
      </div>

      {(isMobile || sidebarOpen) && (
        <div className="px-4 pb-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-2 py-1.5">
            <span>Quick search</span>
            <Kbd className="text-xs">⌘K</Kbd>
          </div>
        </div>
      )}

      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const navLink = (
            <Link key={item.href} href={item.href} onClick={isMobile ? closeMobileMenu : undefined}>
              <motion.div
                whileHover={{ x: 4 }}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {(isMobile || sidebarOpen) && <span>{item.label}</span>}
              </motion.div>
            </Link>
          )

          if (!isMobile && !sidebarOpen && item.shortcut) {
            return (
              <TooltipProvider key={item.href}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    {navLink}
                  </TooltipTrigger>
                  <TooltipContent side="right" className="flex items-center gap-2">
                    <span>{item.label}</span>
                    <Kbd className="text-xs">{item.shortcut}</Kbd>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )
          }

          return navLink
        })}
      </nav>

      <div className="px-2 py-4 space-y-1 border-t border-border">
        {user?.role === 'admin' && (
          <Link href="/admin" onClick={isMobile ? closeMobileMenu : undefined}>
            <motion.div
              whileHover={{ x: 4 }}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                pathname === '/admin' || pathname.startsWith('/admin/')
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <Shield className="h-5 w-5 shrink-0" />
              {(isMobile || sidebarOpen) && <span>Admin</span>}
            </motion.div>
          </Link>
        )}
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.href
          const navLink = (
            <Link key={item.href} href={item.href} onClick={isMobile ? closeMobileMenu : undefined}>
              <motion.div
                whileHover={{ x: 4 }}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {(isMobile || sidebarOpen) && <span>{item.label}</span>}
              </motion.div>
            </Link>
          )

          if (!isMobile && !sidebarOpen && item.shortcut) {
            return (
              <TooltipProvider key={item.href}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    {navLink}
                  </TooltipTrigger>
                  <TooltipContent side="right" className="flex items-center gap-2">
                    <span>{item.label}</span>
                    <Kbd className="text-xs">{item.shortcut}</Kbd>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )
          }

          return navLink
        })}
        {mounted && (
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5 shrink-0" />
            ) : (
              <Moon className="h-5 w-5 shrink-0" />
            )}
            {(isMobile || sidebarOpen) && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>
        )}
        {!isDemo && (
          <button
            onClick={() => {
              handleSignOut()
              if (isMobile) closeMobileMenu()
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {(isMobile || sidebarOpen) && <span>Sign Out</span>}
          </button>
        )}
      </div>

      {(isMobile || sidebarOpen) && user && (
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-sm font-medium text-primary">
                {user.full_name?.[0] || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.full_name || 'User'}</p>
              <p className="text-xs text-muted-foreground truncate capitalize">{user.plan} Plan</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <>
      <aside
        className={cn(
          'hidden lg:flex flex-col border-r border-border bg-card transition-all duration-300',
          sidebarOpen ? 'w-64' : 'w-16'
        )}
      >
        <SidebarContent isMobile={false} />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild className="lg:hidden fixed top-4 left-4 z-50">
          <Button variant="outline" size="icon" className="shadow-lg">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <SidebarContent isMobile={true} />
        </SheetContent>
      </Sheet>
    </>
  )
}
