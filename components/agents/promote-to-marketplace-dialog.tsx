'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Loader2, Store, Tag, DollarSign, Eye, Star, Download,
  RefreshCw, ExternalLink, Unlink, Check
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { LoadingButton } from '@/components/ui/loading-button'
import { supabase } from '@/lib/supabase'
import {
  useMarketplaceActions,
  type MarketplaceAgent,
  type MarketplaceCategory,
} from '@/hooks/use-marketplace'
import type { DefaultAgent } from '@/hooks/use-default-agents'
import { toast } from 'sonner'

interface PromoteToMarketplaceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: DefaultAgent | null
  onPromoted?: () => void
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export function PromoteToMarketplaceDialog({
  open,
  onOpenChange,
  template,
  onPromoted,
}: PromoteToMarketplaceDialogProps) {
  const {
    getListingByTemplate,
    promoteTemplate,
    syncTemplateToListing,
    unpublishAgent,
    updateMarketplaceAgent,
  } = useMarketplaceActions()

  const [categories, setCategories] = useState<MarketplaceCategory[]>([])
  const [existingListing, setExistingListing] = useState<MarketplaceAgent | null>(null)
  const [loadingInit, setLoadingInit] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  const [checkingSlug, setCheckingSlug] = useState(false)

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [longDescription, setLongDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [pricingType, setPricingType] = useState<'free' | 'one_time' | 'subscription'>('free')
  const [priceAmount, setPriceAmount] = useState('')
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly')
  const [syncEnabled, setSyncEnabled] = useState(true)

  const loadCategories = useCallback(async () => {
    const { data } = await supabase
      .from('marketplace_categories')
      .select('*')
      .order('display_order', { ascending: true })
    setCategories(data || [])
  }, [])

  const checkSlug = useCallback(async (s: string) => {
    if (!s || s.length < 3) {
      setSlugAvailable(null)
      return
    }
    setCheckingSlug(true)
    try {
      const { data } = await supabase
        .from('marketplace_agents')
        .select('id')
        .eq('slug', s)
        .maybeSingle()

      const isAvailable = !data || (existingListing ? data.id === existingListing.id : false)
      setSlugAvailable(isAvailable)
    } catch {
      setSlugAvailable(null)
    } finally {
      setCheckingSlug(false)
    }
  }, [existingListing])

  useEffect(() => {
    if (!open || !template) return

    setLoadingInit(true)
    loadCategories()

    getListingByTemplate(template.id).then((listing) => {
      setExistingListing(listing)

      if (listing) {
        setName(listing.name)
        setSlug(listing.slug)
        setDescription(listing.description || '')
        setLongDescription(listing.long_description || '')
        setCategoryId(listing.category_id || '')
        setTagsInput(listing.tags?.join(', ') || '')
        setPricingType(listing.pricing_type)
        setPriceAmount(listing.price_amount ? String(listing.price_amount) : '')
        setBillingInterval(listing.billing_interval || 'monthly')
        setSyncEnabled((listing as any).template_sync_enabled ?? true)
      } else {
        setName(template.name)
        setSlug(generateSlug(template.name))
        setDescription(template.description || '')
        setLongDescription('')
        setCategoryId('')
        setTagsInput(template.tags?.join(', ') || '')
        setPricingType('free')
        setPriceAmount('')
        setBillingInterval('monthly')
        setSyncEnabled(true)
      }

      setLoadingInit(false)
    })
  }, [open, template, loadCategories, getListingByTemplate])

  useEffect(() => {
    if (slug) {
      const timer = setTimeout(() => checkSlug(slug), 400)
      return () => clearTimeout(timer)
    }
  }, [slug, checkSlug])

  const handleNameChange = (val: string) => {
    setName(val)
    if (!existingListing) {
      setSlug(generateSlug(val))
    }
  }

  const handleSubmit = async () => {
    if (!template) return

    if (!name.trim()) {
      toast.error('Name is required')
      return
    }
    if (!slug.trim() || slug.length < 3) {
      toast.error('Slug must be at least 3 characters')
      return
    }
    if (slugAvailable === false) {
      toast.error('Slug is already taken')
      return
    }
    if (!categoryId) {
      toast.error('Category is required')
      return
    }

    setSubmitting(true)
    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)

      const configuration = {
        system_prompt: template.system_prompt,
        framework: template.framework,
        role: template.role,
        settings: template.settings,
      }

      if (existingListing) {
        await updateMarketplaceAgent(existingListing.id, {
          name,
          slug,
          description,
          long_description: longDescription,
          category_id: categoryId,
          tags,
          pricing_type: pricingType,
          price_amount: pricingType === 'free' ? 0 : parseFloat(priceAmount) || 0,
          billing_interval: pricingType === 'subscription' ? billingInterval : null,
          configuration,
          version: template.version,
        } as Partial<MarketplaceAgent>)

        await supabase
          .from('marketplace_agents')
          .update({
            template_sync_enabled: syncEnabled,
            last_synced_at: new Date().toISOString(),
          })
          .eq('id', existingListing.id)

        toast.success('Marketplace listing updated')
      } else {
        await promoteTemplate({
          templateId: template.id,
          name,
          slug,
          description,
          long_description: longDescription,
          category_id: categoryId,
          tags,
          pricing_type: pricingType,
          price_amount: pricingType === 'free' ? 0 : parseFloat(priceAmount) || 0,
          billing_interval: pricingType === 'subscription' ? billingInterval : undefined,
          sync_enabled: syncEnabled,
          configuration,
          version: template.version,
        })
      }

      onPromoted?.()
      onOpenChange(false)
    } catch {
      // errors handled in hook
    } finally {
      setSubmitting(false)
    }
  }

  const handleSync = async () => {
    if (!template || !existingListing) return
    setSyncing(true)
    try {
      await syncTemplateToListing(template.id, {
        name: template.name,
        description: template.description || undefined,
        version: template.version,
        configuration: {
          system_prompt: template.system_prompt,
          framework: template.framework,
          role: template.role,
          settings: template.settings,
        },
        tags: template.tags,
      })
      onPromoted?.()
    } catch {
      // errors handled in hook
    } finally {
      setSyncing(false)
    }
  }

  const handleRemove = async () => {
    if (!existingListing) return
    setRemoving(true)
    try {
      await unpublishAgent(existingListing.id)
      setExistingListing(null)
      onPromoted?.()
      onOpenChange(false)
    } catch {
      // errors handled in hook
    } finally {
      setRemoving(false)
    }
  }

  if (!template) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="w-5 h-5 text-primary" />
            {existingListing ? 'Manage Marketplace Listing' : 'Promote to Marketplace'}
          </DialogTitle>
          <DialogDescription>
            {existingListing
              ? `Manage "${template.name}" on the marketplace`
              : `Promote "${template.name}" template to the public marketplace`}
          </DialogDescription>
        </DialogHeader>

        {loadingInit ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-4 py-2 pr-4">
              {existingListing && (
                <div className="grid grid-cols-4 gap-2">
                  <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
                    <Download className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-lg font-bold">{existingListing.install_count}</p>
                    <p className="text-[10px] text-muted-foreground">Installs</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
                    <Eye className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-lg font-bold">{existingListing.view_count}</p>
                    <p className="text-[10px] text-muted-foreground">Views</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
                    <Star className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-lg font-bold">{existingListing.average_rating.toFixed(1)}</p>
                    <p className="text-[10px] text-muted-foreground">Rating</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
                    <Tag className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-lg font-bold">v{existingListing.version}</p>
                    <p className="text-[10px] text-muted-foreground">Version</p>
                  </div>
                </div>
              )}

              <Tabs defaultValue="details">
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="pricing">Pricing & Sync</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="Agent name on marketplace"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Slug</Label>
                    <div className="relative">
                      <Input
                        value={slug}
                        onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        placeholder="unique-slug"
                        className="pr-8"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        {checkingSlug && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                        {!checkingSlug && slugAvailable === true && <Check className="w-4 h-4 text-emerald-500" />}
                        {!checkingSlug && slugAvailable === false && <span className="text-xs text-destructive">Taken</span>}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={categoryId} onValueChange={setCategoryId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Short Description</Label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Brief description for marketplace cards"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Full Description</Label>
                    <Textarea
                      value={longDescription}
                      onChange={(e) => setLongDescription(e.target.value)}
                      placeholder="Detailed description for marketplace listing page..."
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tags (comma-separated)</Label>
                    <Input
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                      placeholder="e.g., research, analysis, writing"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="pricing" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Pricing Type</Label>
                    <Select value={pricingType} onValueChange={(v) => setPricingType(v as 'free' | 'one_time' | 'subscription')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="one_time">One-Time Purchase</SelectItem>
                        <SelectItem value="subscription">Subscription</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {pricingType !== 'free' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Price (USD)</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={priceAmount}
                            onChange={(e) => setPriceAmount(e.target.value)}
                            className="pl-8"
                            placeholder="9.99"
                          />
                        </div>
                      </div>
                      {pricingType === 'subscription' && (
                        <div className="space-y-2">
                          <Label>Billing Interval</Label>
                          <Select value={billingInterval} onValueChange={(v) => setBillingInterval(v as 'monthly' | 'yearly')}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="yearly">Yearly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="rounded-lg border border-border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Auto-Sync Updates</p>
                        <p className="text-xs text-muted-foreground">
                          Automatically update marketplace listing when template changes
                        </p>
                      </div>
                      <Switch checked={syncEnabled} onCheckedChange={setSyncEnabled} />
                    </div>
                  </div>

                  {existingListing && (
                    <div className="rounded-lg border border-border p-4 space-y-3">
                      <p className="text-sm font-medium">Template Version</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono">
                          Marketplace: v{existingListing.version}
                        </Badge>
                        <Badge variant={template.version !== existingListing.version ? 'default' : 'secondary'} className="font-mono">
                          Template: v{template.version}
                        </Badge>
                      </div>
                      {template.version !== existingListing.version && (
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                          Template version differs from marketplace listing. Use sync to update.
                        </p>
                      )}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {existingListing && (
            <div className="flex gap-2 mr-auto">
              <LoadingButton
                variant="outline"
                size="sm"
                onClick={handleSync}
                loading={syncing}
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Sync Now
              </LoadingButton>
              <LoadingButton
                variant="destructive"
                size="sm"
                onClick={handleRemove}
                loading={removing}
              >
                <Unlink className="w-3.5 h-3.5 mr-1.5" />
                Remove
              </LoadingButton>
            </div>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <LoadingButton onClick={handleSubmit} loading={submitting}>
            <Store className="w-4 h-4 mr-2" />
            {existingListing ? 'Update Listing' : 'Promote to Marketplace'}
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
