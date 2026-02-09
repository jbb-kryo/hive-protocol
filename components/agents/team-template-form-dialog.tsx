'use client'

import { useState, useEffect } from 'react'
import {
  Bot, Brain, Code, PenTool, BarChart, Headphones, TrendingUp,
  FileText, Shield, Layout, Kanban, Cpu, Server, Search,
  GraduationCap, Target, Globe, FlaskConical, History, GitMerge, BarChart3
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LoadingButton } from '@/components/ui/loading-button'
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

interface FormData {
  name: string
  role: string
  framework: string
  system_prompt: string
  description: string
  tags: string
  category: string
  icon: string
  permission_level: 'view' | 'use' | 'edit'
}

const defaultFormData: FormData = {
  name: '',
  role: '',
  framework: 'anthropic',
  system_prompt: '',
  description: '',
  tags: '',
  category: 'general',
  icon: 'Bot',
  permission_level: 'use',
}

export function TeamTemplateFormDialog({
  open,
  onOpenChange,
  template,
  organizationId,
  onSubmit,
  loading,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  template?: TeamTemplate | null
  organizationId: string
  onSubmit: (data: FormData & { organization_id: string }) => void
  loading: boolean
}) {
  const [formData, setFormData] = useState<FormData>(defaultFormData)

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
    onSubmit({ ...formData, organization_id: organizationId })
  }

  const IconComponent = teamTemplateIconMap[formData.icon] || Bot

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
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
                onValueChange={(value) => setFormData({ ...formData, permission_level: value as FormData['permission_level'] })}
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
            <Label>System Prompt</Label>
            <Textarea
              value={formData.system_prompt}
              onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
              placeholder="Define the agent's behavior and capabilities..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Tags (comma-separated)</Label>
            <Input
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="e.g., research, analysis, internal"
            />
          </div>
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
