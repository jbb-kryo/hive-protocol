'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, Store, Eye, DollarSign, Tag, Check, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { supabase } from '@/lib/supabase'
import type { Agent } from '@/lib/supabase'
import type { MarketplaceCategory, MarketplaceAgent } from '@/hooks/use-marketplace'

interface PublishAgentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  agent: Agent
  existingListing?: MarketplaceAgent | null
  onPublish: (agentId: string, data: PublishData) => Promise<void>
  onUpdate: (listingId: string, data: Partial<MarketplaceAgent>) => Promise<void>
  onUnpublish: (listingId: string) => Promise<void>
}

export interface PublishData {
  name: string
  slug: string
  description: string
  long_description: string
  category_id: string
  tags: string[]
  pricing_type: 'free' | 'one_time' | 'subscription'
  price_amount?: number
  billing_interval?: 'monthly' | 'yearly'
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)
}

export function PublishAgentDialog({
  open,
  onOpenChange,
  agent,
  existingListing,
  onPublish,
  onUpdate,
  onUnpublish,
}: PublishAgentDialogProps) {
  const [loading, setLoading] = useState(false)
  const [unpublishing, setUnpublishing] = useState(false)
  const [categories, setCategories] = useState<MarketplaceCategory[]>([])
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  const [checkingSlug, setCheckingSlug] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  const [formData, setFormData] = useState<PublishData>({
    name: agent.name,
    slug: generateSlug(agent.name),
    description: '',
    long_description: '',
    category_id: '',
    tags: [],
    pricing_type: 'free',
    price_amount: 0,
    billing_interval: 'monthly',
  })

  useEffect(() => {
    if (existingListing) {
      setFormData({
        name: existingListing.name,
        slug: existingListing.slug,
        description: existingListing.description || '',
        long_description: existingListing.long_description || '',
        category_id: existingListing.category_id || '',
        tags: existingListing.tags || [],
        pricing_type: existingListing.pricing_type,
        price_amount: existingListing.price_amount || 0,
        billing_interval: existingListing.billing_interval || 'monthly',
      })
    } else {
      setFormData({
        name: agent.name,
        slug: generateSlug(agent.name),
        description: '',
        long_description: agent.system_prompt ? agent.system_prompt.slice(0, 200) : '',
        category_id: '',
        tags: [],
        pricing_type: 'free',
        price_amount: 0,
        billing_interval: 'monthly',
      })
    }
  }, [agent, existingListing, open])

  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase
        .from('marketplace_categories')
        .select('*')
        .order('display_order', { ascending: true })
      if (data) setCategories(data)
    }
    if (open) fetchCategories()
  }, [open])

  const checkSlugAvailability = useCallback(async (slug: string) => {
    if (!slug || slug.length < 3) {
      setSlugAvailable(null)
      return
    }

    setCheckingSlug(true)
    try {
      const { data } = await supabase
        .from('marketplace_agents')
        .select('id')
        .eq('slug', slug)
        .maybeSingle()

      const isAvailable = !data || (existingListing ? data.id === existingListing.id : false)
      setSlugAvailable(isAvailable)
    } finally {
      setCheckingSlug(false)
    }
  }, [existingListing])

  useEffect(() => {
    const timer = setTimeout(() => {
      checkSlugAvailability(formData.slug)
    }, 500)
    return () => clearTimeout(timer)
  }, [formData.slug, checkSlugAvailability])

  const validateAgent = useCallback((): string[] => {
    const errors: string[] = []

    if (!agent.name) errors.push('Agent must have a name')
    if (!agent.system_prompt) errors.push('Agent must have a system prompt')
    if (!agent.framework) errors.push('Agent must have a framework selected')

    return errors
  }, [agent])

  const validateForm = useCallback((): string[] => {
    const errors: string[] = []

    if (!formData.name.trim()) errors.push('Title is required')
    if (formData.name.length < 3) errors.push('Title must be at least 3 characters')
    if (!formData.slug.trim()) errors.push('Slug is required')
    if (formData.slug.length < 3) errors.push('Slug must be at least 3 characters')
    if (slugAvailable === false) errors.push('Slug is already taken')
    if (!formData.description.trim()) errors.push('Short description is required')
    if (formData.description.length < 10) errors.push('Short description must be at least 10 characters')
    if (!formData.long_description.trim()) errors.push('Detailed description is required')
    if (!formData.category_id) errors.push('Category is required')

    if (formData.pricing_type === 'one_time') {
      if (!formData.price_amount || formData.price_amount < 1 || formData.price_amount > 999) {
        errors.push('One-time price must be between $1 and $999')
      }
    }
    if (formData.pricing_type === 'subscription') {
      if (!formData.price_amount || formData.price_amount < 1 || formData.price_amount > 99) {
        errors.push('Subscription price must be between $1 and $99/month')
      }
    }

    return errors
  }, [formData, slugAvailable])

  useEffect(() => {
    const agentErrors = validateAgent()
    const formErrors = validateForm()
    setValidationErrors([...agentErrors, ...formErrors])
  }, [validateAgent, validateForm])

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !formData.tags.includes(tag) && formData.tags.length < 10) {
      setFormData({ ...formData, tags: [...formData.tags, tag] })
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tagToRemove) })
  }

  const handlePublish = async () => {
    if (validationErrors.length > 0) return

    setLoading(true)
    try {
      if (existingListing) {
        await onUpdate(existingListing.id, {
          name: formData.name,
          slug: formData.slug,
          description: formData.description,
          long_description: formData.long_description,
          category_id: formData.category_id,
          tags: formData.tags,
          pricing_type: formData.pricing_type,
          price_amount: formData.pricing_type === 'free' ? 0 : formData.price_amount,
          billing_interval: formData.pricing_type === 'subscription' ? formData.billing_interval : null,
        })
      } else {
        await onPublish(agent.id, formData)
      }
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  const handleUnpublish = async () => {
    if (!existingListing) return

    setUnpublishing(true)
    try {
      await onUnpublish(existingListing.id)
      onOpenChange(false)
    } finally {
      setUnpublishing(false)
    }
  }

  const agentErrors = validateAgent()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="w-5 h-5" />
            {existingListing ? 'Update Marketplace Listing' : 'Publish to Marketplace'}
          </DialogTitle>
          <DialogDescription>
            {existingListing
              ? 'Update your agent listing on the marketplace'
              : 'Share your agent with the community and optionally earn from it'}
          </DialogDescription>
        </DialogHeader>

        {agentErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium mb-1">Agent is incomplete:</p>
              <ul className="list-disc list-inside text-sm">
                {agentErrors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[400px] mt-4">
            <TabsContent value="details" className="space-y-4 pr-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value
                    setFormData({
                      ...formData,
                      name,
                      slug: existingListing ? formData.slug : generateSlug(name)
                    })
                  }}
                  placeholder="Agent display name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: generateSlug(e.target.value) })}
                      placeholder="my-agent"
                      className={
                        slugAvailable === false
                          ? 'border-destructive pr-8'
                          : slugAvailable === true
                            ? 'border-green-500 pr-8'
                            : ''
                      }
                    />
                    {checkingSlug && (
                      <Loader2 className="w-4 h-4 animate-spin absolute right-3 top-3 text-muted-foreground" />
                    )}
                    {!checkingSlug && slugAvailable === true && (
                      <Check className="w-4 h-4 absolute right-3 top-3 text-green-500" />
                    )}
                    {!checkingSlug && slugAvailable === false && (
                      <AlertCircle className="w-4 h-4 absolute right-3 top-3 text-destructive" />
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  URL: /marketplace/{formData.slug || 'your-slug'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Short Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description for search results and cards"
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.description.length}/200 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="long_description">Detailed Description</Label>
                <Textarea
                  id="long_description"
                  value={formData.long_description}
                  onChange={(e) => setFormData({ ...formData, long_description: e.target.value })}
                  placeholder="Explain what your agent does, its capabilities, and ideal use cases..."
                  rows={5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
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
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add tag..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddTag()
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={handleAddTag}>
                    <Tag className="w-4 h-4" />
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {formData.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        {tag} x
                      </Badge>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {formData.tags.length}/10 tags - Click a tag to remove it
                </p>
              </div>
            </TabsContent>

            <TabsContent value="pricing" className="space-y-4 pr-4">
              <div className="space-y-4">
                <Label>Pricing Model</Label>
                <RadioGroup
                  value={formData.pricing_type}
                  onValueChange={(value: 'free' | 'one_time' | 'subscription') =>
                    setFormData({ ...formData, pricing_type: value })
                  }
                  className="space-y-3"
                >
                  <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="free" id="free" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="free" className="font-medium cursor-pointer">Free</Label>
                      <p className="text-sm text-muted-foreground">
                        Anyone can install and use your agent at no cost
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="one_time" id="one_time" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="one_time" className="font-medium cursor-pointer">One-Time Purchase</Label>
                      <p className="text-sm text-muted-foreground">
                        Users pay once for lifetime access ($1 - $999)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="subscription" id="subscription" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="subscription" className="font-medium cursor-pointer">Subscription</Label>
                      <p className="text-sm text-muted-foreground">
                        Users pay monthly or yearly for continued access ($1 - $99/mo)
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {formData.pricing_type !== 'free' && (
                <div className="space-y-4 p-4 rounded-lg border border-border bg-muted/30">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (USD)</Label>
                    <div className="relative">
                      <DollarSign className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                      <Input
                        id="price"
                        type="number"
                        min={1}
                        max={formData.pricing_type === 'one_time' ? 999 : 99}
                        value={formData.price_amount || ''}
                        onChange={(e) => setFormData({ ...formData, price_amount: Number(e.target.value) })}
                        className="pl-8"
                        placeholder={formData.pricing_type === 'one_time' ? '1-999' : '1-99'}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formData.pricing_type === 'one_time'
                        ? 'Set a price between $1 and $999'
                        : 'Set a monthly price between $1 and $99'}
                    </p>
                  </div>

                  {formData.pricing_type === 'subscription' && (
                    <div className="space-y-2">
                      <Label>Billing Interval</Label>
                      <Select
                        value={formData.billing_interval}
                        onValueChange={(value: 'monthly' | 'yearly') =>
                          setFormData({ ...formData, billing_interval: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly (Save 20%)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="p-3 rounded-lg bg-background border border-border">
                    <p className="text-sm">
                      <span className="font-medium">Your earnings: </span>
                      <span className="text-green-600 dark:text-green-400">
                        ${((formData.price_amount || 0) * 0.8).toFixed(2)}
                      </span>
                      <span className="text-muted-foreground">
                        {' '}(80% after platform fee)
                        {formData.pricing_type === 'subscription' && formData.billing_interval === 'monthly' && '/month'}
                        {formData.pricing_type === 'subscription' && formData.billing_interval === 'yearly' && '/year'}
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="preview" className="pr-4">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Preview how your agent will appear in the marketplace
                </p>

                <Card className="overflow-hidden">
                  <div className="h-24 bg-gradient-to-r from-primary/20 to-primary/5" />
                  <CardContent className="pt-0 -mt-8">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-xl bg-primary/10 border border-border flex items-center justify-center text-2xl font-bold text-primary">
                        {formData.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 pt-2">
                        <h3 className="font-semibold text-lg">{formData.name || 'Agent Name'}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {formData.description || 'Short description will appear here'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-4">
                      {formData.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {formData.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{formData.tags.length - 3}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Eye className="w-4 h-4" />
                        <span>0 views</span>
                      </div>
                      <div className="font-semibold">
                        {formData.pricing_type === 'free' ? (
                          <span className="text-green-600 dark:text-green-400">Free</span>
                        ) : formData.pricing_type === 'one_time' ? (
                          <span>${formData.price_amount || 0}</span>
                        ) : (
                          <span>
                            ${formData.price_amount || 0}
                            <span className="text-sm font-normal text-muted-foreground">
                              /{formData.billing_interval === 'yearly' ? 'year' : 'mo'}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {categories.find(c => c.id === formData.category_id) && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Category: </span>
                    {categories.find(c => c.id === formData.category_id)?.name}
                  </p>
                )}
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {existingListing && (
            <Button
              variant="destructive"
              onClick={handleUnpublish}
              disabled={unpublishing || loading}
              className="sm:mr-auto"
            >
              {unpublishing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Unpublishing...
                </>
              ) : (
                'Unpublish'
              )}
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handlePublish}
            disabled={loading || validationErrors.length > 0 || agentErrors.length > 0}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {existingListing ? 'Updating...' : 'Publishing...'}
              </>
            ) : (
              <>
                <Store className="w-4 h-4 mr-2" />
                {existingListing ? 'Update Listing' : 'Publish Agent'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
