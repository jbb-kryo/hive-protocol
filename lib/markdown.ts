function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (char) => map[char])
}

function sanitizeUrl(url: string): string {
  const trimmed = url.trim()
  if (trimmed.toLowerCase().startsWith('javascript:')) return '#'
  if (trimmed.toLowerCase().startsWith('vbscript:')) return '#'
  if (trimmed.toLowerCase().startsWith('data:text/html')) return '#'
  try {
    const parsed = new URL(trimmed, 'https://example.com')
    if (!['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
      return '#'
    }
  } catch {
    if (!trimmed.startsWith('/') && !trimmed.startsWith('#')) {
      return '#'
    }
  }
  return trimmed
}

function stripDangerousTags(html: string): string {
  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^>]*>/gi,
    /<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi,
    /\bon\w+\s*=/gi,
    /javascript:/gi,
    /vbscript:/gi,
  ]
  let sanitized = html
  for (const pattern of dangerousPatterns) {
    sanitized = sanitized.replace(pattern, '')
  }
  return sanitized
}

export function parseMarkdown(markdown: string): string {
  let html = stripDangerousTags(markdown)

  html = html.replace(/^### (.+)$/gm, '<h3 class="text-xl font-semibold mt-8 mb-4">$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold mt-10 mb-4">$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold mt-10 mb-6">$1</h1>')

  html = html.replace(/^#### (.+)$/gm, '<h4 class="text-lg font-semibold mt-6 mb-3">$1</h4>')

  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')

  html = html.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-muted font-mono text-sm">$1</code>')

  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
    const escapedCode = escapeHtml(code.trim())
    return `<pre class="bg-zinc-950 text-zinc-100 rounded-lg p-4 my-4 overflow-x-auto"><code class="text-sm font-mono">${escapedCode}</code></pre>`
  })

  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => {
    const safeUrl = sanitizeUrl(url)
    const safeText = escapeHtml(text)
    return `<a href="${safeUrl}" class="text-primary hover:underline" rel="noopener noreferrer">${safeText}</a>`
  })

  html = html.replace(/^---$/gm, '<hr class="my-8 border-border" />')

  html = html.replace(/^\|(.+)\|$/gm, (match, content) => {
    const cells = content.split('|').map((cell: string) => cell.trim())
    if (cells.every((cell: string) => /^-+$/.test(cell))) {
      return ''
    }
    const isHeader = cells.some((cell: string) => cell.includes('**'))
    const cellTag = isHeader ? 'th' : 'td'
    const cellClass = isHeader
      ? 'px-4 py-2 text-left font-semibold bg-muted'
      : 'px-4 py-2 border-t border-border'
    const cellsHtml = cells
      .map((cell: string) => `<${cellTag} class="${cellClass}">${cell.replace(/\*\*/g, '')}</${cellTag}>`)
      .join('')
    return `<tr>${cellsHtml}</tr>`
  })

  html = html.replace(/(<tr>[\s\S]*?<\/tr>\n?)+/g, (match) => {
    return `<table class="w-full my-4 border-collapse border border-border rounded-lg overflow-hidden">${match}</table>`
  })

  html = html.replace(/^- \[ \] (.+)$/gm, '<div class="flex items-center gap-2 my-1"><input type="checkbox" disabled class="rounded" /><span>$1</span></div>')
  html = html.replace(/^- \[x\] (.+)$/gm, '<div class="flex items-center gap-2 my-1"><input type="checkbox" checked disabled class="rounded" /><span>$1</span></div>')

  const lines = html.split('\n')
  let inList = false
  let listType = ''
  const processedLines: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const unorderedMatch = line.match(/^- (.+)$/)
    const orderedMatch = line.match(/^\d+\. (.+)$/)

    if (unorderedMatch && !line.includes('checkbox')) {
      if (!inList || listType !== 'ul') {
        if (inList) processedLines.push(listType === 'ul' ? '</ul>' : '</ol>')
        processedLines.push('<ul class="list-disc list-inside my-4 space-y-2">')
        inList = true
        listType = 'ul'
      }
      processedLines.push(`<li>${unorderedMatch[1]}</li>`)
    } else if (orderedMatch) {
      if (!inList || listType !== 'ol') {
        if (inList) processedLines.push(listType === 'ul' ? '</ul>' : '</ol>')
        processedLines.push('<ol class="list-decimal list-inside my-4 space-y-2">')
        inList = true
        listType = 'ol'
      }
      processedLines.push(`<li>${orderedMatch[1]}</li>`)
    } else {
      if (inList) {
        processedLines.push(listType === 'ul' ? '</ul>' : '</ol>')
        inList = false
        listType = ''
      }
      processedLines.push(line)
    }
  }

  if (inList) {
    processedLines.push(listType === 'ul' ? '</ul>' : '</ol>')
  }

  html = processedLines.join('\n')

  html = html
    .split('\n\n')
    .map((block) => {
      const trimmed = block.trim()
      if (
        !trimmed ||
        trimmed.startsWith('<h') ||
        trimmed.startsWith('<ul') ||
        trimmed.startsWith('<ol') ||
        trimmed.startsWith('<pre') ||
        trimmed.startsWith('<table') ||
        trimmed.startsWith('<hr') ||
        trimmed.startsWith('<div')
      ) {
        return block
      }
      if (!trimmed.startsWith('<')) {
        return `<p class="my-4 leading-relaxed">${trimmed}</p>`
      }
      return block
    })
    .join('\n')

  return html
}
