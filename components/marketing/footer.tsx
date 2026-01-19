import Link from 'next/link'
import { Hexagon, Twitter, Github, Linkedin } from 'lucide-react'
import { CookiePreferencesButton } from '@/components/cookie-preferences-button'

const footerLinks = {
  Product: [
    { href: '/features', label: 'Features' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/agents', label: 'AI Agents' },
    { href: '/swarms', label: 'Swarms' },
    { href: '/workflows', label: 'Workflows' },
    { href: '/marketplace', label: 'Marketplace' },
    { href: '/integrations', label: 'Integrations' },
    { href: '/changelog', label: 'Changelog' },
  ],
  Resources: [
    { href: '/docs', label: 'Documentation' },
    { href: '/docs/getting-started/quick-start', label: 'Quick Start Guide' },
    { href: '/docs/api/reference', label: 'API Reference' },
    { href: '/agents/templates', label: 'Agent Templates' },
    { href: '/blog', label: 'Blog' },
    { href: '/community', label: 'Community' },
    { href: '/status', label: 'System Status' },
  ],
  Company: [
    { href: '/about', label: 'About Us' },
    { href: '/careers', label: 'Careers' },
    { href: '/contact', label: 'Contact' },
    { href: '/security', label: 'Security' },
  ],
  Legal: [
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms of Service' },
  ],
}

export function Footer() {
  return (
    <footer className="border-t border-border py-12 px-4" role="contentinfo">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2" aria-label="HIVE - Home">
              <Hexagon className="h-8 w-8 text-primary fill-primary/20" />
              <span className="font-bold text-xl">HIVE</span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">
              Multi-agent coordination for the modern AI stack.
            </p>
            <div className="mt-4 flex gap-4">
              <Link
                href="/login"
                className="text-sm text-primary hover:underline"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="text-sm text-primary hover:underline"
              >
                Get Started
              </Link>
            </div>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <nav key={category} aria-label={`${category} links`}>
              <h4 className="font-semibold mb-4">{category}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <p className="text-sm text-muted-foreground">
              {new Date().getFullYear()} HIVE Protocol. All rights reserved.
            </p>
            <span className="hidden sm:inline text-muted-foreground/50">|</span>
            <CookiePreferencesButton />
          </div>
          <nav aria-label="Social links" className="flex items-center gap-4">
            <a
              href="https://x.com/hive-protocol"
              className="text-muted-foreground hover:text-foreground transition-colors"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow us on X"
            >
              <Twitter className="h-5 w-5" />
            </a>
            <a
              href="https://github.com/jbb-kryo/hive"
              className="text-muted-foreground hover:text-foreground transition-colors"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View our GitHub"
            >
              <Github className="h-5 w-5" />
            </a>
            <a
              href="https://www.linkedin.com/company/hive-protocol"
              className="text-muted-foreground hover:text-foreground transition-colors"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Connect on LinkedIn"
            >
              <Linkedin className="h-5 w-5" />
            </a>
          </nav>
        </div>
      </div>
    </footer>
  )
}
