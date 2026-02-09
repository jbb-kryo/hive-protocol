'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Bot, Brain, Code, PenTool, BarChart, Headphones, TrendingUp,
  FileText, Shield, Layout, Kanban, Cpu, Server, Search,
  GraduationCap, Target, Globe, FlaskConical, History, GitMerge, BarChart3,
  GitBranch, AlertTriangle, Layers
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LoadingButton } from '@/components/ui/loading-button'
import { TemplateParameterEditor } from '@/components/agents/template-parameter-editor'
import { getParametersFromSettings, extractVariables, type TemplateParameter } from '@/lib/template-parameters'
import { wouldCreateCircularRef, buildTemplatesMap, INHERITABLE_FIELDS, type InheritanceMode } from '@/lib/template-inheritance'
import { toast } from 'sonner'
import type { TeamTemplate } from '@/hooks/use-team-templates'

const iconOptions = [
  { value: 'Bot', label: 'Bot', icon: Bot },
  { value: 'Brain', label: 'Brain', icon: Brain },
  { value: 'Code', label: 'Code', icon: Code },
  { value: 'PenTool', label: 'Pen Tool', icon: PenTool },
  { value: 'BarChart', label: 'Bar Chart', icon: BarChart },
  { value: 'BarChart3', label: 'Analytics', icon: BarChart3 },
  { value: 'Headphones', label: 'Headphones', icon: Headphones },
  { value: 'TrendingUp', label: 'Trending Up', icon: TrendingUp },
  { value: 'FileText', label: 'File Text', icon: FileText },
  { value: 'Shield', label: 'Shield', icon: Shield },
  { value: 'Layout', label: 'Layout', icon: Layout },
  { value: 'Kanban', label: 'Kanban', icon: Kanban },
  { value: 'Cpu', label: 'CPU', icon: Cpu },
  { value: 'Server', label: 'Server', icon: Server },
  { value: 'Search', label: 'Search', icon: Search },
  { value: 'GraduationCap', label: 'Academic', icon: GraduationCap },
  { value: 'Target', label: 'Target', icon: Target },
  { value: 'Globe', label: 'Globe', icon: Globe },
  { value: 'FlaskConical', label: 'Science', icon: FlaskConical },
  { value: 'History', label: 'History', icon: History },
  { value: 'GitMerge', label: 'Synthesis', icon: GitMerge },
]

export const teamTemplateIconMap: Record<string, React.ElementType> = Object.fromEntries(
  iconOptions.map((opt) => [opt.value, opt.icon])
)

const categoryOptions = [
  { value: 'general', label: 'General' },
  { value: 'research', label: 'Research' },
  { value: 'development', label: 'Development' },
  { value: 'creative', label: 'Creative' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'support', label: 'Support' },
  { value: 'productivity', label: 'Productivity' },
  { value: 'business', label: 'Business' },
]

const frameworkOptions = [
  { value: 'anthropic', label: 'Anthropic Claude' },
  { value: 'openai', label: 'OpenAI GPT' },
  { value: 'langchain', label: 'LangChain' },
  { value: 'autogen', label: 'AutoGen' },
  { value: 'crewai', label: 'CrewAI' },
  { value: 'custom', label: 'Custom' },
]

const permissionOptions = [
  { value: 'view', label: 'View Only', description: 'Members can see but not clone' },
  { value: 'use', label: 'Use (Clone)', description: 'Members can clone to their agents' },
  { value: 'edit', label: 'Edit', description: 'Members can modify this template' },
]

export interface TeamTemplateFormData {
  name: string
  role: string
  framework: string
  system_prompt: string
  description: string
  tags: string
  category: string
  icon: string
  permission_level: 'view' | 'use' | 'edit'
  parameters: TemplateParameter[]
  parent_template_id: string | null
  inheritance_mode: InheritanceMode
  override_fields: string[]
}

const defaultFormData: TeamTemplateFormData = {
  name: '',
  role: '',
  framework: 'anthropic',
  system_prompt: '',
  description: '',
  tags: '',
  category: 'general',
  icon: 'Bot',
  permission_level: 'use',
  parameters: [],
  parent_template_id: null,
  inheritance_mode: 'inherit',
  override_fields: [],
}

export function TeamTemplateFormDialog({
  open,
  onOpenChange,
  template,
  organizationId,
  allTemplates = [],
  onSubmit,
  loading,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  template?: TeamTemplate | null
  organizationId: string
  allTemplates?: TeamTemplate[]
  onSubmit: (data: TeamTemplateFormData & { organization_id: string }) => void
  loading: boolean
}) {
  const [formData, setFormData] = useState<TeamTemplateFormData>(defaultFormData)

  const eligibleParents = useMemo(() => {
    const templatesMap = buildTemplatesMap(allTemplates)
    return allTemplates.filter(t => {
      if (template && t.id === template.id) return false
      if (template && wouldCreateCircularRef(template.id, t.id, templatesMap)) return false
      return true
    })
  }, [allTemplates, template])

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        role: template.role || '',
        framework: template.framework,
        system_prompt: template.system_prompt || '',
        description: template.description || '',
        tags: template.tags.join(', '),
        category: template.category,
        icon: template.icon,
        permission_level: template.permission_level,
        parameters: getParametersFromSettings(template.settings),
        parent_template_id: template.parent_template_id || null,
        inheritance_mode: template.inheritance_mode || 'inherit',
        override_fields: template.override_fields || [],
      })
    } else {
      setFormData(defaultFormData)
    }
  }, [template, open])

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error('Name is required')
      return
    }

    for (const param of formData.parameters) {
      if (!param.key.trim()) {
        toast.error('All parameters must have a key')
        return
      }
      if (!param.label.trim()) {
        toast.error(`Parameter "${param.key}" must have a label`)
        return
      }
      if (param.type === 'select' && (!param.options || param.options.length === 0)) {
        toast.error(`Dropdown parameter "${param.label}" must have at least one option`)
        return
      }
    }

    const keys = formData.parameters.map(p => p.key)
    const uniqueKeys = new Set(keys)
    if (keys.length !== uniqueKeys.size) {
      toast.error('Parameter keys must be unique')
      return
    }

    onSubmit({ ...formData, organization_id: organizationId })
  }

  const promptVariables = extractVariables(formData.system_prompt)
  const paramKeys = new Set(formData.parameters.map(p => p.key))
  const unmatchedVars = promptVariables.filter(v => !paramKeys.has(v))

  const IconComponent = teamTemplateIconMap[formData.icon] || Bot

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template ? 'Edit Team Template' : 'Create Team Template'}</DialogTitle>
          <DialogDescription>
            {template
              ? 'Update the team template configuration'
              : 'Create a private template shared with your team members'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Team Research Assistant"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Input
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="e.g., researcher"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Framework</Label>
              <Select
                value={formData.framework}
                onValueChange={(value) => setFormData({ ...formData, framework: value })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {frameworkOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Icon</Label>
              <Select
                value={formData.icon}
                onValueChange={(value) => setFormData({ ...formData, icon: value })}
              >
                <SelectTrigger>
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <IconComponent className="w-4 h-4" />
                      {iconOptions.find((opt) => opt.value === formData.icon)?.label}
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {iconOptions.map((opt) => {
                    const Icon = opt.icon
                    return (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          {opt.label}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Member Permissions</Label>
              <Select
                value={formData.permission_level}
                onValueChange={(value) => setFormData({ ...formData, permission_level: value as TeamTemplateFormData['permission_level'] })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {permissionOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div>
                        <span>{opt.label}</span>
                        <span className="text-xs text-muted-foreground ml-2">{opt.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of what this agent does..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>System Prompt</Label>
              {promptVariables.length > 0 && (
                <div className="flex items-center gap-1">
                  {promptVariables.map(v => (
                    <Badge
                      key={v}
                      variant="outline"
                      className={`text-[10px] font-mono ${
                        paramKeys.has(v)
                          ? 'border-teal-500/30 text-teal-600'
                          : 'border-amber-500/30 text-amber-600'
                      }`}
                    >
                      {`{{${v}}}`}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <Textarea
              value={formData.system_prompt}
              onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
              placeholder="Define the agent's behavior. Use {{variable_name}} for customizable parameters..."
              rows={4}
              className="font-mono text-sm"
            />
            {unmatchedVars.length > 0 && (
              <p className="text-[10px] text-amber-600">
                Variables without matching parameters: {unmatchedVars.map(v => `{{${v}}}`).join(', ')}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Tags (comma-separated)</Label>
            <Input
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="e.g., research, analysis, internal"
            />
          </div>

          <Separator />

          {allTemplates.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-teal-600" />
                <Label className="text-sm font-medium">Template Inheritance</Label>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Parent Template</Label>
                <Select
                  value={formData.parent_template_id || '_none'}
                  onValueChange={(value) => {
                    const parentId = value === '_none' ? null : value
                    setFormData({
                      ...formData,
                      parent_template_id: parentId,
                      override_fields: parentId ? formData.override_fields : [],
                    })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No parent (standalone)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">No parent (standalone)</SelectItem>
                    {eligibleParents.map(t => {
                      const ParentIcon = teamTemplateIconMap[t.icon] || Bot
                      return (
                        <SelectItem key={t.id} value={t.id}>
                          <div className="flex items-center gap-2">
                            <ParentIcon className="w-3.5 h-3.5" />
                            <span>{t.name}</span>
                            {t.parent_template_id && (
                              <Badge variant="outline" className="text-[9px] ml-1">child</Badge>
                            )}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              {formData.parent_template_id && (
                <div className="space-y-3 rounded-lg border border-teal-500/20 bg-teal-500/[0.02] p-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-teal-600" />
                    <Label className="text-xs font-medium">Inheritance Mode</Label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, inheritance_mode: 'inherit' })}
                      className={`rounded-lg border p-2.5 text-left transition-colors ${
                        formData.inheritance_mode === 'inherit'
                          ? 'border-teal-500 bg-teal-500/10'
                          : 'border-border hover:border-teal-500/30'
                      }`}
                    >
                      <p className="text-xs font-medium mb-0.5">Inherit</p>
                      <p className="text-[10px] text-muted-foreground">
                        Override parent fields selectively
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, inheritance_mode: 'compose' })}
                      className={`rounded-lg border p-2.5 text-left transition-colors ${
                        formData.inheritance_mode === 'compose'
                          ? 'border-teal-500 bg-teal-500/10'
                          : 'border-border hover:border-teal-500/30'
                      }`}
                    >
                      <p className="text-xs font-medium mb-0.5">Compose</p>
                      <p className="text-[10px] text-muted-foreground">
                        Merge system prompts together
                      </p>
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Override Fields</Label>
                    <p className="text-[10px] text-muted-foreground">
                      Selected fields use this template&apos;s values. Unselected fields inherit from parent.
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {INHERITABLE_FIELDS.map(field => {
                        const isOverridden = formData.override_fields.includes(field)
                        return (
                          <button
                            key={field}
                            type="button"
                            onClick={() => {
                              const next = isOverridden
                                ? formData.override_fields.filter(f => f !== field)
                                : [...formData.override_fields, field]
                              setFormData({ ...formData, override_fields: next })
                            }}
                            className={`rounded-md border px-2 py-1 text-[10px] font-medium transition-colors ${
                              isOverridden
                                ? 'border-teal-500 bg-teal-500/10 text-teal-700'
                                : 'border-border text-muted-foreground hover:border-teal-500/30'
                            }`}
                          >
                            {field.replace(/_/g, ' ')}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {(() => {
                    const parent = allTemplates.find(t => t.id === formData.parent_template_id)
                    if (!parent) return null
                    return (
                      <div className="pt-1 border-t border-teal-500/10">
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <GitBranch className="w-2.5 h-2.5" />
                          Inheriting from <span className="font-medium text-foreground">{parent.name}</span>
                          {parent.parent_template_id && (
                            <span className="text-[9px]">(also a child template)</span>
                          )}
                        </p>
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
          )}

          <Separator />

          <TemplateParameterEditor
            parameters={formData.parameters}
            onChange={(parameters) => setFormData({ ...formData, parameters })}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <LoadingButton onClick={handleSubmit} loading={loading}>
            {template ? 'Save Changes' : 'Create Template'}
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
