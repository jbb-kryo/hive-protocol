import type { TeamTemplate } from '@/hooks/use-team-templates'

export type InheritanceMode = 'inherit' | 'compose'

export const INHERITABLE_FIELDS = [
  'role',
  'framework',
  'system_prompt',
  'description',
  'category',
  'icon',
  'tags',
  'settings',
  'permission_level',
] as const

export type InheritableField = typeof INHERITABLE_FIELDS[number]

export interface ResolvedTemplate {
  name: string
  role: string | null
  framework: string
  system_prompt: string | null
  description: string | null
  tags: string[]
  category: string
  icon: string
  settings: Record<string, unknown> | null
  permission_level: 'view' | 'use' | 'edit'
  inheritanceChain: string[]
}

export function getAncestorChain(
  templateId: string,
  templatesMap: Map<string, TeamTemplate>,
  maxDepth = 10
): TeamTemplate[] {
  const chain: TeamTemplate[] = []
  const visited = new Set<string>()
  let currentId: string | null = templateId

  while (currentId && chain.length < maxDepth) {
    if (visited.has(currentId)) break
    visited.add(currentId)

    const t = templatesMap.get(currentId)
    if (!t) break
    chain.push(t)
    currentId = t.parent_template_id || null
  }

  return chain
}

export function resolveTemplate(
  template: TeamTemplate,
  templatesMap: Map<string, TeamTemplate>
): ResolvedTemplate {
  const chain = getAncestorChain(template.id, templatesMap)
  const inheritanceChain = chain.map(t => t.id)

  if (chain.length <= 1 || !template.parent_template_id) {
    return {
      name: template.name,
      role: template.role,
      framework: template.framework,
      system_prompt: template.system_prompt,
      description: template.description,
      tags: [...template.tags],
      category: template.category,
      icon: template.icon,
      settings: template.settings ? { ...template.settings } : null,
      permission_level: template.permission_level,
      inheritanceChain,
    }
  }

  const overrides = new Set(template.override_fields || [])
  const mode = template.inheritance_mode || 'inherit'

  const parentChain = chain.slice(1)
  const resolvedParent = parentChain.length === 1
    ? parentChain[0]
    : resolveTemplateFromChain(parentChain, templatesMap)

  const result: ResolvedTemplate = {
    name: template.name,
    role: overrides.has('role') || template.role !== null
      ? template.role
      : resolvedParent.role ?? null,
    framework: overrides.has('framework')
      ? template.framework
      : (template.framework !== 'anthropic' ? template.framework : resolvedParent.framework),
    system_prompt: resolveSystemPrompt(template, resolvedParent, mode, overrides),
    description: overrides.has('description') || template.description !== null
      ? template.description
      : resolvedParent.description ?? null,
    tags: overrides.has('tags')
      ? [...template.tags]
      : mergeUniqueTags(resolvedParent.tags ?? [], template.tags),
    category: overrides.has('category')
      ? template.category
      : (template.category !== 'general' ? template.category : resolvedParent.category),
    icon: overrides.has('icon')
      ? template.icon
      : (template.icon !== 'Bot' ? template.icon : resolvedParent.icon),
    settings: mergeSettings(
      resolvedParent.settings,
      template.settings,
      overrides.has('settings')
    ),
    permission_level: overrides.has('permission_level')
      ? template.permission_level
      : resolvedParent.permission_level ?? template.permission_level,
    inheritanceChain,
  }

  return result
}

function resolveTemplateFromChain(
  chain: TeamTemplate[],
  templatesMap: Map<string, TeamTemplate>
): ResolvedTemplate {
  if (chain.length === 0) {
    return {
      name: '',
      role: null,
      framework: 'anthropic',
      system_prompt: null,
      description: null,
      tags: [],
      category: 'general',
      icon: 'Bot',
      settings: null,
      permission_level: 'use',
      inheritanceChain: [],
    }
  }

  const deepest = chain[chain.length - 1]
  let current: ResolvedTemplate = {
    name: deepest.name,
    role: deepest.role,
    framework: deepest.framework,
    system_prompt: deepest.system_prompt,
    description: deepest.description,
    tags: [...deepest.tags],
    category: deepest.category,
    icon: deepest.icon,
    settings: deepest.settings ? { ...deepest.settings } : null,
    permission_level: deepest.permission_level,
    inheritanceChain: [deepest.id],
  }

  for (let i = chain.length - 2; i >= 0; i--) {
    const t = chain[i]
    const map = new Map<string, TeamTemplate>()
    map.set(t.id, { ...t, parent_template_id: null } as TeamTemplate)
    const fakeParent = { ...t, parent_template_id: null } as TeamTemplate
    const asResolved = resolveTemplate(fakeParent, map)

    const overrides = new Set(t.override_fields || [])
    const mode = t.inheritance_mode || 'inherit'

    current = {
      name: t.name,
      role: overrides.has('role') || t.role !== null ? t.role : current.role,
      framework: overrides.has('framework')
        ? t.framework
        : (t.framework !== 'anthropic' ? t.framework : current.framework),
      system_prompt: resolveSystemPrompt(t, current, mode, overrides),
      description: overrides.has('description') || t.description !== null
        ? t.description
        : current.description,
      tags: overrides.has('tags')
        ? [...t.tags]
        : mergeUniqueTags(current.tags, t.tags),
      category: overrides.has('category')
        ? t.category
        : (t.category !== 'general' ? t.category : current.category),
      icon: overrides.has('icon')
        ? t.icon
        : (t.icon !== 'Bot' ? t.icon : current.icon),
      settings: mergeSettings(current.settings, t.settings, overrides.has('settings')),
      permission_level: overrides.has('permission_level')
        ? t.permission_level
        : current.permission_level,
      inheritanceChain: [...current.inheritanceChain, t.id],
    }
  }

  return current
}

function resolveSystemPrompt(
  child: { system_prompt: string | null; inheritance_mode?: string },
  parent: { system_prompt: string | null },
  mode: InheritanceMode,
  overrides: Set<string>
): string | null {
  if (overrides.has('system_prompt')) {
    return child.system_prompt
  }

  const parentPrompt = parent.system_prompt
  const childPrompt = child.system_prompt

  if (!parentPrompt) return childPrompt
  if (!childPrompt) return parentPrompt

  if (mode === 'compose') {
    return `${parentPrompt}\n\n---\n\n${childPrompt}`
  }

  return childPrompt
}

function mergeUniqueTags(parentTags: string[], childTags: string[]): string[] {
  const tagSet = new Set([...parentTags, ...childTags])
  return Array.from(tagSet)
}

function mergeSettings(
  parentSettings: Record<string, unknown> | null,
  childSettings: Record<string, unknown> | null,
  fullOverride: boolean
): Record<string, unknown> | null {
  if (fullOverride) return childSettings
  if (!parentSettings && !childSettings) return null
  if (!parentSettings) return childSettings
  if (!childSettings) return { ...parentSettings }

  const merged = { ...parentSettings }
  for (const key of Object.keys(childSettings)) {
    merged[key] = childSettings[key]
  }
  return merged
}

export function wouldCreateCircularRef(
  templateId: string,
  proposedParentId: string,
  templatesMap: Map<string, TeamTemplate>
): boolean {
  if (templateId === proposedParentId) return true

  const visited = new Set<string>()
  let currentId: string | null = proposedParentId

  while (currentId) {
    if (visited.has(currentId)) return true
    if (currentId === templateId) return true
    visited.add(currentId)
    const t = templatesMap.get(currentId)
    currentId = t?.parent_template_id || null
  }

  return false
}

export function getChildTemplates(
  templateId: string,
  templates: TeamTemplate[]
): TeamTemplate[] {
  return templates.filter(t => t.parent_template_id === templateId)
}

export function buildTemplatesMap(templates: TeamTemplate[]): Map<string, TeamTemplate> {
  const map = new Map<string, TeamTemplate>()
  for (const t of templates) {
    map.set(t.id, t)
  }
  return map
}
