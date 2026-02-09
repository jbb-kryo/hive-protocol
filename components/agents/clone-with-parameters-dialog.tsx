'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Bot, Check, Variable, Eye, EyeOff
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { LoadingButton } from '@/components/ui/loading-button'
import { teamTemplateIconMap } from '@/components/agents/team-template-form-dialog'
import {
  type TemplateParameter,
  getParametersFromSettings,
  getDefaultValues,
  substituteVariables,
  validateParameterValues,
} from '@/lib/template-parameters'
import type { TeamTemplate } from '@/hooks/use-team-templates'

function ParameterField({
  param,
  value,
  onChange,
  error,
}: {
  param: TemplateParameter
  value: string | number | boolean
  onChange: (value: string | number | boolean) => void
  error?: string
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Label className="text-sm">
          {param.label}
          {param.required && <span className="text-red-500 ml-0.5">*</span>}
        </Label>
        <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
          {`{{${param.key}}}`}
        </Badge>
      </div>
      {param.description && (
        <p className="text-[11px] text-muted-foreground">{param.description}</p>
      )}

      {param.type === 'text' && (
        <Input
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          placeholder={param.placeholder || `Enter ${param.label.toLowerCase()}...`}
          className={error ? 'border-red-500' : ''}
          maxLength={param.maxLength}
        />
      )}

      {param.type === 'textarea' && (
        <Textarea
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          placeholder={param.placeholder || `Enter ${param.label.toLowerCase()}...`}
          rows={3}
          className={error ? 'border-red-500' : ''}
          maxLength={param.maxLength}
        />
      )}

      {param.type === 'number' && (
        <Input
          type="number"
          value={value === '' ? '' : Number(value)}
          onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
          placeholder={param.placeholder || `Enter ${param.label.toLowerCase()}...`}
          className={`w-40 ${error ? 'border-red-500' : ''}`}
          min={param.min}
          max={param.max}
        />
      )}

      {param.type === 'select' && (
        <Select
          value={String(value ?? '')}
          onValueChange={(v) => onChange(v)}
        >
          <SelectTrigger className={error ? 'border-red-500' : ''}>
            <SelectValue placeholder={param.placeholder || `Select ${param.label.toLowerCase()}...`} />
          </SelectTrigger>
          <SelectContent>
            {(param.options || []).map(opt => (
              <SelectItem key={opt} value={opt}>
                <span className="capitalize">{opt}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {param.type === 'boolean' && (
        <div className="flex items-center gap-2">
          <Switch
            checked={Boolean(value)}
            onCheckedChange={(v) => onChange(v)}
          />
          <span className="text-sm text-muted-foreground">
            {value ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      )}

      {error && (
        <p className="text-[11px] text-red-500">{error}</p>
      )}
    </div>
  )
}

export function CloneWithParametersDialog({
  template,
  open,
  onOpenChange,
  onClone,
  loading,
}: {
  template: TeamTemplate | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onClone: (parameterValues: Record<string, string | number | boolean>) => Promise<void>
  loading: boolean
}) {
  const parameters = useMemo(
    () => template ? getParametersFromSettings(template.settings) : [],
    [template]
  )

  const [values, setValues] = useState<Record<string, string | number | boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    if (open && parameters.length > 0) {
      setValues(getDefaultValues(parameters))
      setErrors({})
      setShowPreview(false)
    }
  }, [open, parameters])

  if (!template) return null

  const IconComponent = teamTemplateIconMap[template.icon] || Bot

  const previewPrompt = template.system_prompt
    ? substituteVariables(template.system_prompt, values)
    : ''

  const hasUnfilledRequired = parameters.some(
    p => p.required && (values[p.key] === undefined || values[p.key] === '')
  )

  const handleClone = async () => {
    const validationErrors = validateParameterValues(parameters, values)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    setErrors({})
    await onClone(values)
  }

  const handleValueChange = (key: string, value: string | number | boolean) => {
    setValues(prev => ({ ...prev, [key]: value }))
    if (errors[key]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500/20 to-teal-500/5 flex items-center justify-center">
              <IconComponent className="w-5 h-5 text-teal-600" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-base">Customize {template.name}</DialogTitle>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Variable className="w-3 h-3 text-teal-600" />
                <span className="text-xs text-muted-foreground">
                  {parameters.length} parameter{parameters.length !== 1 ? 's' : ''} to configure
                </span>
              </div>
            </div>
          </div>
          <DialogDescription>
            Fill in the parameters below to customize this template before creating your agent.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2">
          <div className="space-y-4">
            {parameters.map(param => (
              <ParameterField
                key={param.key}
                param={param}
                value={values[param.key] ?? ''}
                onChange={(v) => handleValueChange(param.key, v)}
                error={errors[param.key]}
              />
            ))}
          </div>

          {template.system_prompt && (
            <>
              <Separator />
              <div>
                <button
                  type="button"
                  className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-2"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  {showPreview ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  {showPreview ? 'Hide' : 'Show'} Prompt Preview
                </button>
                {showPreview && (
                  <ScrollArea className="h-32 rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
                      {previewPrompt}
                    </p>
                  </ScrollArea>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <LoadingButton
            onClick={handleClone}
            loading={loading}
            disabled={hasUnfilledRequired}
          >
            <Check className="w-4 h-4 mr-1.5" />
            Create Agent
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
