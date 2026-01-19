'use client'

import { useState, useEffect, useMemo } from 'react'
import { Loader2, Settings, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { Tool, ConfigField } from '@/hooks/use-tools'

interface ToolConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tool: Tool | null
  existingConfig: Record<string, any>
  onSave: (config: Record<string, any>) => Promise<void>
}

export function ToolConfigDialog({ open, onOpenChange, tool, existingConfig, onSave }: ToolConfigDialogProps) {
  const [config, setConfig] = useState<Record<string, any>>({})
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const configFields: ConfigField[] = useMemo(() => {
    return tool?.capabilities?.config_fields || []
  }, [tool])

  useEffect(() => {
    if (open && tool) {
      const initialConfig: Record<string, any> = {}
      configFields.forEach((field) => {
        if (existingConfig[field.name] !== undefined) {
          initialConfig[field.name] = existingConfig[field.name]
        } else if (field.default !== undefined) {
          initialConfig[field.name] = field.default
        } else if (field.type === 'toggle') {
          initialConfig[field.name] = false
        } else if (field.type === 'multiselect') {
          initialConfig[field.name] = []
        }
      })
      setConfig(initialConfig)
      setErrors({})
    }
  }, [open, tool, existingConfig, configFields])

  const isFieldVisible = (field: ConfigField): boolean => {
    if (!field.show_if) return true

    const dependentValue = config[field.show_if.field]
    const requiredValue = field.show_if.value

    if (Array.isArray(requiredValue)) {
      return requiredValue.includes(dependentValue)
    }
    return dependentValue === requiredValue
  }

  const validateConfig = (): boolean => {
    const newErrors: Record<string, string> = {}

    configFields.forEach((field) => {
      if (!isFieldVisible(field)) return

      const value = config[field.name]

      if (field.required) {
        if (value === undefined || value === null || value === '') {
          newErrors[field.name] = `${field.label} is required`
        } else if (field.type === 'multiselect' && Array.isArray(value) && value.length === 0) {
          newErrors[field.name] = `Select at least one ${field.label.toLowerCase()}`
        }
      }

      if (field.type === 'number' && value !== undefined && value !== '') {
        const numValue = Number(value)
        if (field.min !== undefined && numValue < field.min) {
          newErrors[field.name] = `Minimum value is ${field.min}`
        }
        if (field.max !== undefined && numValue > field.max) {
          newErrors[field.name] = `Maximum value is ${field.max}`
        }
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateConfig()) return

    setSaving(true)
    try {
      const filteredConfig: Record<string, any> = {}
      configFields.forEach((field) => {
        if (isFieldVisible(field) && config[field.name] !== undefined) {
          filteredConfig[field.name] = config[field.name]
        }
      })
      await onSave(filteredConfig)
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving configuration:', error)
    } finally {
      setSaving(false)
    }
  }

  const updateField = (name: string, value: any) => {
    setConfig((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  const toggleMultiSelect = (fieldName: string, option: string) => {
    const current = config[fieldName] || []
    const updated = current.includes(option)
      ? current.filter((o: string) => o !== option)
      : [...current, option]
    updateField(fieldName, updated)
  }

  const renderField = (field: ConfigField) => {
    if (!isFieldVisible(field)) return null

    const value = config[field.name]
    const error = errors[field.name]

    switch (field.type) {
      case 'toggle':
        return (
          <div key={field.name} className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <Label htmlFor={field.name} className="text-sm font-medium">
                {field.label}
              </Label>
            </div>
            <Switch
              id={field.name}
              checked={value ?? false}
              onCheckedChange={(checked) => updateField(field.name, checked)}
            />
          </div>
        )

      case 'multiselect':
        return (
          <div key={field.name} className="space-y-2">
            <Label>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <div className="flex flex-wrap gap-2">
              {field.options?.map((opt) => {
                const isSelected = (value || []).includes(opt)
                return (
                  <Badge
                    key={opt}
                    variant={isSelected ? 'default' : 'outline'}
                    className="cursor-pointer hover:bg-primary/80 transition-colors"
                    onClick={() => toggleMultiSelect(field.name, opt)}
                  >
                    {isSelected && <Check className="w-3 h-3 mr-1" />}
                    {opt}
                  </Badge>
                )
              })}
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )

      case 'select':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Select value={value || ''} onValueChange={(v) => updateField(field.name, v)}>
              <SelectTrigger id={field.name} className={error ? 'border-destructive' : ''}>
                <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )

      case 'password':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              type="password"
              value={value || ''}
              onChange={(e) => updateField(field.name, e.target.value)}
              className={error ? 'border-destructive' : ''}
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )

      case 'number':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              type="number"
              value={value ?? ''}
              onChange={(e) => updateField(field.name, e.target.value ? Number(e.target.value) : '')}
              className={error ? 'border-destructive' : ''}
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
              min={field.min}
              max={field.max}
            />
            {field.min !== undefined && field.max !== undefined && (
              <p className="text-xs text-muted-foreground">Range: {field.min} - {field.max}</p>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )

      default:
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              type="text"
              value={value || ''}
              onChange={(e) => updateField(field.name, e.target.value)}
              className={error ? 'border-destructive' : ''}
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )
    }
  }

  if (!tool) return null

  const visibleFields = configFields.filter(isFieldVisible)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configure {tool.name}
          </DialogTitle>
          <DialogDescription>
            {tool.description}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4 py-4">
            {configFields.length > 0 ? (
              configFields.map(renderField)
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                This tool does not require any configuration.
              </p>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save & Enable'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
