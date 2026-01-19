'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bot, Search, Filter, ArrowRight, Check, Loader2,
  Code, PenTool, BarChart, Headphones, TrendingUp,
  FileText, Shield, Layout, Kanban, Brain, Cpu, Server,
  GraduationCap, Target, Globe, FlaskConical, History,
  GitMerge, BarChart3, Sparkles, ChevronLeft
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { EmptyState } from '@/components/ui/empty-state'
import { PageTransition } from '@/components/ui/page-transition'
import { LoadingButton } from '@/components/ui/loading-button'
import { DemoBanner } from '@/components/dashboard/demo-banner'
import { useDefaultAgents, type DefaultAgent } from '@/hooks/use-default-agents'
import { useStore } from '@/store'
import { toast } from 'sonner'

const iconMap: Record<string, React.ElementType> = {
  Bot,
  Search,
  Code,
  PenTool,
  BarChart,
  BarChart3,
  Headphones,
  TrendingUp,
  FileText,
  Shield,
  Layout,
  Kanban,
  Brain,
  Cpu,
  Server,
  GraduationCap,
  Target,
  Globe,
  FlaskConical,
  History,
  GitMerge,
}

const categoryLabels: Record<string, string> = {
  all: 'All Templates',
  research: 'Research',
  development: 'Development',
  creative: 'Creative',
  analytics: 'Analytics',
  support: 'Support',
  productivity: 'Productivity',
  business: 'Business',
  general: 'General',
}

const categoryColors: Record<string, string> = {
  research: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  development: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  creative: 'bg-pink-500/10 text-pink-600 border-pink-500/20',
  analytics: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  support: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
  productivity: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  business: 'bg-violet-500/10 text-violet-600 border-violet-500/20',
  general: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
}

function TemplateCard({
  template,
  onSelect,
}: {
  template: DefaultAgent
  onSelect: (template: DefaultAgent) => void
}) {
  const IconComponent = iconMap[template.icon] || Bot

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className="h-full cursor-pointer hover:border-primary/50 hover:shadow-lg transition-all duration-200 group"
        onClick={() => onSelect(template)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0 group-hover:from-primary/30 group-hover:to-primary/10 transition-colors">
              <IconComponent className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base line-clamp-1">{template.name}</CardTitle>
              <Badge
                variant="outline"
                className={`mt-1 text-xs ${categoryColors[template.category] || categoryColors.general}`}
              >
                {categoryLabels[template.category] || template.category}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <CardDescription className="line-clamp-2 text-sm mb-3">
            {template.description || 'No description available'}
          </CardDescription>
          <div className="flex flex-wrap gap-1.5">
            {template.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs font-normal">
                {tag}
              </Badge>
            ))}
            {template.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs font-normal">
                +{template.tags.length - 3}
              </Badge>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{template.framework}</span>
            <Button variant="ghost" size="sm" className="h-7 gap-1 group-hover:bg-primary group-hover:text-primary-foreground">
              Use Template
              <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function TemplatePreviewDialog({
  template,
  open,
  onOpenChange,
  onUse,
  loading,
}: {
  template: DefaultAgent | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUse: () => void
  loading: boolean
}) {
  if (!template) return null

  const IconComponent = iconMap[template.icon] || Bot

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <IconComponent className="w-6 h-6 text-primary" />
            </div>
            <div>
              <DialogTitle>{template.name}</DialogTitle>
              <Badge
                variant="outline"
                className={`mt-1 ${categoryColors[template.category] || categoryColors.general}`}
              >
                {categoryLabels[template.category] || template.category}
              </Badge>
            </div>
          </div>
          <DialogDescription>{template.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Configuration</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-muted/50 rounded-lg p-3">
                <span className="text-muted-foreground block text-xs mb-1">Framework</span>
                <span className="font-medium">{template.framework}</span>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <span className="text-muted-foreground block text-xs mb-1">Role</span>
                <span className="font-medium">{template.role || 'General'}</span>
              </div>
            </div>
          </div>

          {template.system_prompt && (
            <div>
              <h4 className="text-sm font-medium mb-2">System Prompt</h4>
              <ScrollArea className="h-32 rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {template.system_prompt}
                </p>
              </ScrollArea>
            </div>
          )}

          {template.tags.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Tags</h4>
              <div className="flex flex-wrap gap-1.5">
                {template.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <LoadingButton onClick={onUse} loading={loading}>
            <Check className="w-4 h-4 mr-2" />
            Use This Template
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function AgentTemplatesPage() {
  const router = useRouter()
  const { isDemo } = useStore()
  const { templates, loading, error, fetchTemplates, cloneTemplate } = useDefaultAgents()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedTemplate, setSelectedTemplate] = useState<DefaultAgent | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [cloning, setCloning] = useState(false)

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category)
    if (category === 'all') {
      fetchTemplates()
    } else {
      fetchTemplates(category)
    }
  }, [fetchTemplates])

  const filteredTemplates = templates.filter((template) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      template.name.toLowerCase().includes(query) ||
      template.description?.toLowerCase().includes(query) ||
      template.tags.some((tag) => tag.toLowerCase().includes(query)) ||
      template.role?.toLowerCase().includes(query)
    )
  })

  const handleSelectTemplate = (template: DefaultAgent) => {
    setSelectedTemplate(template)
    setPreviewOpen(true)
  }

  const handleUseTemplate = async () => {
    if (!selectedTemplate) return

    setCloning(true)
    try {
      await cloneTemplate(selectedTemplate)
      toast.success('Agent created from template', {
        description: `${selectedTemplate.name} has been added to your agents.`,
      })
      setPreviewOpen(false)
      router.push('/agents')
    } catch (err) {
      toast.error('Failed to create agent', {
        description: err instanceof Error ? err.message : 'Please try again.',
      })
    } finally {
      setCloning(false)
    }
  }

  const categories = ['all', ...Array.from(new Set(templates.map((t) => t.category)))].filter(Boolean)

  return (
    <PageTransition>
      <div className="p-4 lg:p-8">
        {isDemo && <DemoBanner />}

        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-start gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/agents')}
                className="shrink-0 mt-0.5"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-primary" />
                  Agent Templates
                </h1>
                <p className="text-muted-foreground">
                  Browse {templates.length} pre-configured agents for common use cases
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => router.push('/agents')}>
              <Bot className="w-4 h-4 mr-2" />
              My Agents
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Tabs
              value={selectedCategory}
              onValueChange={handleCategoryChange}
              className="overflow-x-auto"
            >
              <TabsList className="h-10">
                {categories.map((category) => (
                  <TabsTrigger key={category} value={category} className="capitalize">
                    {categoryLabels[category] || category}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>

        {loading && templates.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-20">
            <EmptyState
              icon={Bot}
              title="Failed to load templates"
              description={error}
              action={{
                label: 'Try Again',
                onClick: () => fetchTemplates(),
              }}
            />
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <EmptyState
              icon={Search}
              title="No templates found"
              description={
                searchQuery
                  ? `No templates match "${searchQuery}"`
                  : 'No templates available in this category'
              }
              action={
                searchQuery
                  ? {
                      label: 'Clear Search',
                      onClick: () => setSearchQuery(''),
                    }
                  : undefined
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onSelect={handleSelectTemplate}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        <TemplatePreviewDialog
          template={selectedTemplate}
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          onUse={handleUseTemplate}
          loading={cloning}
        />
      </div>
    </PageTransition>
  )
}
