'use client'

import { Twitter, Linkedin, Facebook, Link2, Mail, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface SocialShareProps {
  url: string
  title: string
  description?: string
}

export function SocialShare({ url, title, description }: SocialShareProps) {
  const [copied, setCopied] = useState(false)

  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)
  const encodedDescription = encodeURIComponent(description || '')

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`,
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      console.error('Failed to copy link')
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground mr-2">Share:</span>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        asChild
      >
        <a
          href={shareLinks.twitter}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on Twitter"
        >
          <Twitter className="w-4 h-4" />
        </a>
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        asChild
      >
        <a
          href={shareLinks.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on LinkedIn"
        >
          <Linkedin className="w-4 h-4" />
        </a>
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        asChild
      >
        <a
          href={shareLinks.facebook}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on Facebook"
        >
          <Facebook className="w-4 h-4" />
        </a>
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        asChild
      >
        <a
          href={shareLinks.email}
          aria-label="Share via Email"
        >
          <Mail className="w-4 h-4" />
        </a>
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={handleCopyLink}
        aria-label="Copy link"
      >
        {copied ? (
          <Check className="w-4 h-4 text-green-500" />
        ) : (
          <Link2 className="w-4 h-4" />
        )}
      </Button>
    </div>
  )
}
