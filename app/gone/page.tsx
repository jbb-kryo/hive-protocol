import Link from 'next/link'
import { Trash2, Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Content Removed - HIVE',
  description: 'This content has been permanently removed.',
  robots: {
    index: false,
    follow: true,
  },
}

export default function GonePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      <div className="max-w-md mx-auto text-center">
        <Trash2 className="h-20 w-20 mx-auto text-muted-foreground mb-6" />
        <h1 className="text-3xl font-bold mb-4">Content Removed</h1>
        <p className="text-muted-foreground mb-8">
          This page has been permanently removed and is no longer available.
          The content you're looking for may have been deprecated, merged into other documentation, or removed entirely.
        </p>

        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <Link href="/">
            <Button size="lg" className="gap-2">
              <Home className="h-4 w-4" />
              Go to Homepage
            </Button>
          </Link>
          <Link href="/docs">
            <Button variant="outline" size="lg" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Browse Docs
            </Button>
          </Link>
        </div>

        <div className="pt-6 border-t">
          <p className="text-sm text-muted-foreground">
            Looking for something specific? Check our{' '}
            <Link href="/docs" className="text-primary hover:underline">
              documentation
            </Link>{' '}
            or{' '}
            <Link href="/contact" className="text-primary hover:underline">
              contact support
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  )
}
