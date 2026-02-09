'use client'

import { useState } from 'react'
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Variable } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { TemplateParameter, ParameterType } from '@/lib/template-parameters'

const parameterTypeLabels: Record<ParameterType, string> = {
  text: 'Text',
  number: 'Number',
  select: 'Dropdown',
  boolean: 'Toggle',
  textarea: 'Long Text',
}

interface Props {
  parameters: TemplateParameter[]
  onChange: (parameters: TemplateParameter[]) => void
}

function ParameterRow({
  param,
  index,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  param: TemplateParameter
  index: number
  onUpdate: (index: number, param: TemplateParameter) => void
  onRemove: (index: number) => void
  onMoveUp: (index: number) => void
  onMoveDown: (index: number) => void
  isFirst: boolean
  isLast: boolean
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border border-border rounded-lg p-3 space-y-3 bg-card">
      <div className="flex items-center gap-2">
        <div className="flex flex-col gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4"
            onClick={() => onMoveUp(index)}
            disabled={isFirst}
          >
            <ChevronUp className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4"
            onClick={() => onMoveDown(index)}
            disabled={isLast}
          >
            <ChevronDown className="w-3 h-3" />
          </Button>
        </div>

        <div className="flex-1 grid grid-cols-3 gap-2">
          <Input
            value={param.key}
            onChange={(e) => onUpdate(index, { ...param, key: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') })}
            placeholder="variable_key"
            className="h-8 text-xs font-mono"
          />
          <Input
            value={param.label}
            onChange={(e) => onUpdate(index, { ...param, label: e.target.value })}
            placeholder="Display Label"
            className="h-8 text-xs"
          />
          <Select
            value={param.type}
            onValueChange={(v) => onUpdate(index, { ...param, type: v as ParameterType })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(parameterTypeLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setExpanded(!expanded)}
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => onRemove(index)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 pl-8">
        <div className="flex items-center gap-1.5">
          <Switch
            checked={param.required || false}
            onCheckedChange={(v) => onUpdate(index, { ...param, required: v })}
            className="scale-75"
          />
          <span className="text-[10px] text-muted-foreground">Required</span>
        </div>
        <Badge variant="outline" className="text-[10px] font-mono">{`{{${param.key}}}`}</Badge>
      </div>

      {expanded && (
        <div className="pl-8 space-y-2 pt-1 border-t border-border">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px]">Placeholder</Label>
              <Input
                value={param.placeholder || ''}
                onChange={(e) => onUpdate(index, { ...param, placeholder: e.target.value })}
                placeholder="Placeholder text..."
                className="h-7 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">Default Value</Label>
              <Input
                value={String(param.default ?? '')}
                onChange={(e) => {
                  let val: string | number | boolean = e.target.value
                  if (param.type === 'number') val = Number(val) || 0
                  if (param.type === 'boolean') val = e.target.value === 'true'
                  onUpdate(index, { ...param, default: val })
                }}
                placeholder="Default..."
                className="h-7 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-[10px]">Description</Label>
            <Input
              value={param.description || ''}
              onChange={(e) => onUpdate(index, { ...param, description: e.target.value })}
              placeholder="Help text shown to users..."
              className="h-7 text-xs"
            />
          </div>

          {param.type === 'select' && (
            <div className="space-y-1">
              <Label className="text-[10px]">Options (comma-separated)</Label>
              <Input
                value={(param.options || []).join(', ')}
                onChange={(e) => onUpdate(index, {
                  ...param,
                  options: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                })}
                placeholder="option1, option2, option3"
                className="h-7 text-xs"
              />
            </div>
          )}

          {param.type === 'number' && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px]">Min</Label>
                <Input
                  type="number"
                  value={param.min ?? ''}
                  onChange={(e) => onUpdate(index, { ...param, min: e.target.value ? Number(e.target.value) : undefined })}
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">Max</Label>
                <Input
                  type="number"
                  value={param.max ?? ''}
                  onChange={(e) => onUpdate(index, { ...param, max: e.target.value ? Number(e.target.value) : undefined })}
                  className="h-7 text-xs"
                />
              </div>
            </div>
          )}

          {(param.type === 'text' || param.type === 'textarea') && (
            <div className="space-y-1">
              <Label className="text-[10px]">Max Length</Label>
              <Input
                type="number"
                value={param.maxLength ?? ''}
                onChange={(e) => onUpdate(index, { ...param, maxLength: e.target.value ? Number(e.target.value) : undefined })}
                className="h-7 text-xs w-24"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function TemplateParameterEditor({ parameters, onChange }: Props) {
  const handleAdd = () => {
    const newKey = `param_${parameters.length + 1}`
    onChange([
      ...parameters,
      {
        key: newKey,
        label: '',
        type: 'text',
        required: false,
      },
    ])
  }

  const handleUpdate = (index: number, param: TemplateParameter) => {
    const updated = [...parameters]
    updated[index] = param
    onChange(updated)
  }

  const handleRemove = (index: number) => {
    onChange(parameters.filter((_, i) => i !== index))
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const updated = [...parameters]
    ;[updated[index - 1], updated[index]] = [updated[index], updated[index - 1]]
    onChange(updated)
  }

  const handleMoveDown = (index: number) => {
    if (index === parameters.length - 1) return
    const updated = [...parameters]
    ;[updated[index], updated[index + 1]] = [updated[index + 1], updated[index]]
    onChange(updated)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Variable className="w-4 h-4 text-teal-600" />
          <Label className="text-sm font-medium">Template Parameters</Label>
          {parameters.length > 0 && (
            <Badge variant="secondary" className="text-[10px]">{parameters.length}</Badge>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={handleAdd}
        >
          <Plus className="w-3 h-3 mr-1" />
          Add Parameter
        </Button>
      </div>

      {parameters.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg py-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">No parameters defined</p>
          <p className="text-[10px] text-muted-foreground">
            Add parameters to let users customize this template when cloning. Use {`{{key}}`} in the system prompt.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 px-3 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
            <span className="w-5" />
            <div className="grid grid-cols-3 gap-2">
              <span>Key</span>
              <span>Label</span>
              <span>Type</span>
            </div>
            <span className="w-16" />
          </div>
          {parameters.map((param, index) => (
            <ParameterRow
              key={`${param.key}-${index}`}
              param={param}
              index={index}
              onUpdate={handleUpdate}
              onRemove={handleRemove}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              isFirst={index === 0}
              isLast={index === parameters.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
