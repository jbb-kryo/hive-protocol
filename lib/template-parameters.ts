export type ParameterType = 'text' | 'number' | 'select' | 'boolean' | 'textarea'

export interface TemplateParameter {
  key: string
  label: string
  type: ParameterType
  required?: boolean
  placeholder?: string
  default?: string | number | boolean
  options?: string[]
  description?: string
  min?: number
  max?: number
  maxLength?: number
}

export function getParametersFromSettings(
  settings: Record<string, unknown> | null | undefined
): TemplateParameter[] {
  if (!settings) return []
  const params = settings.parameters
  if (!Array.isArray(params)) return []
  return params.filter(
    (p): p is TemplateParameter =>
      typeof p === 'object' &&
      p !== null &&
      typeof (p as TemplateParameter).key === 'string' &&
      typeof (p as TemplateParameter).label === 'string' &&
      typeof (p as TemplateParameter).type === 'string'
  )
}

export function getDefaultValues(
  parameters: TemplateParameter[]
): Record<string, string | number | boolean> {
  const values: Record<string, string | number | boolean> = {}
  for (const param of parameters) {
    if (param.default !== undefined) {
      values[param.key] = param.default
    } else {
      switch (param.type) {
        case 'boolean':
          values[param.key] = false
          break
        case 'number':
          values[param.key] = param.min ?? 0
          break
        default:
          values[param.key] = ''
      }
    }
  }
  return values
}

export function substituteVariables(
  text: string,
  values: Record<string, string | number | boolean>
): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    if (key in values) {
      return String(values[key])
    }
    return match
  })
}

export function extractVariables(text: string): string[] {
  const matches = text.match(/\{\{(\w+)\}\}/g)
  if (!matches) return []
  return Array.from(new Set(matches.map(m => m.slice(2, -2))))
}

export function validateParameterValues(
  parameters: TemplateParameter[],
  values: Record<string, string | number | boolean>
): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const param of parameters) {
    const val = values[param.key]
    if (param.required) {
      if (val === undefined || val === null || val === '') {
        errors[param.key] = `${param.label} is required`
        continue
      }
    }
    if (param.type === 'number' && val !== '' && val !== undefined) {
      const num = Number(val)
      if (isNaN(num)) {
        errors[param.key] = `${param.label} must be a number`
      } else {
        if (param.min !== undefined && num < param.min) {
          errors[param.key] = `${param.label} must be at least ${param.min}`
        }
        if (param.max !== undefined && num > param.max) {
          errors[param.key] = `${param.label} must be at most ${param.max}`
        }
      }
    }
    if (param.type === 'text' || param.type === 'textarea') {
      if (param.maxLength && typeof val === 'string' && val.length > param.maxLength) {
        errors[param.key] = `${param.label} must be at most ${param.maxLength} characters`
      }
    }
    if (param.type === 'select' && param.options && val !== '' && val !== undefined) {
      if (!param.options.includes(String(val))) {
        errors[param.key] = `${param.label} must be one of: ${param.options.join(', ')}`
      }
    }
  }
  return errors
}
