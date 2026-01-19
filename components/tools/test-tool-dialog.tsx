'use client'

import { useState, useEffect } from 'react'
import { Loader2, Play, CheckCircle, XCircle, Clock, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { type Tool } from '@/hooks/use-tools'

interface TestToolDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tool: Tool | null
}

interface TestResult {
  success: boolean
  output: any
  duration: number
  timestamp: Date
  error?: string
}

export function TestToolDialog({ open, onOpenChange, tool }: TestToolDialogProps) {
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [testing, setTesting] = useState(false)
  const [results, setResults] = useState<TestResult[]>([])
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (tool && open) {
      const initialInputs: Record<string, string> = {}
      const properties = tool.input_schema?.properties || {}
      Object.keys(properties).forEach((key) => {
        initialInputs[key] = ''
      })
      setInputs(initialInputs)
      setResults([])
    }
  }, [tool, open])

  const handleInputChange = (key: string, value: string) => {
    setInputs((prev) => ({ ...prev, [key]: value }))
  }

  const handleTest = async () => {
    if (!tool) return

    setTesting(true)
    const startTime = Date.now()

    try {
      const parsedInputs: Record<string, any> = {}
      const properties = tool.input_schema?.properties || {}

      Object.entries(inputs).forEach(([key, value]) => {
        const propType = properties[key]?.type
        if (propType === 'number') {
          parsedInputs[key] = parseFloat(value) || 0
        } else if (propType === 'boolean') {
          parsedInputs[key] = value.toLowerCase() === 'true'
        } else if (propType === 'array' || propType === 'object') {
          try {
            parsedInputs[key] = JSON.parse(value)
          } catch {
            parsedInputs[key] = value
          }
        } else {
          parsedInputs[key] = value
        }
      })

      await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 1000))

      const mockOutput: Record<string, any> = { success: true }
      const outputProperties = tool.output_schema?.properties || {}

      Object.entries(outputProperties).forEach(([key, prop]: [string, any]) => {
        if (key === 'success') {
          mockOutput[key] = true
        } else if (key === 'error') {
          return
        } else if (prop.type === 'string') {
          mockOutput[key] = `Mock result for ${key}`
        } else if (prop.type === 'number') {
          mockOutput[key] = Math.floor(Math.random() * 100)
        } else if (prop.type === 'boolean') {
          mockOutput[key] = true
        } else if (prop.type === 'array') {
          mockOutput[key] = ['item1', 'item2', 'item3']
        } else if (prop.type === 'object') {
          mockOutput[key] = { data: 'mock data', status: 'ok' }
        }
      })

      const duration = Date.now() - startTime

      setResults((prev) => [
        {
          success: true,
          output: mockOutput,
          duration,
          timestamp: new Date(),
        },
        ...prev,
      ])
    } catch (err) {
      const duration = Date.now() - startTime
      setResults((prev) => [
        {
          success: false,
          output: null,
          duration,
          timestamp: new Date(),
          error: err instanceof Error ? err.message : 'Unknown error',
        },
        ...prev,
      ])
    } finally {
      setTesting(false)
    }
  }

  const handleCopyOutput = async (output: any) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(output, null, 2))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  if (!tool) return null

  const inputProperties = tool.input_schema?.properties || {}
  const requiredInputs = tool.input_schema?.required || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Test Tool: {tool.name}
            {tool.version && (
              <Badge variant="outline">v{tool.version}</Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Test your custom tool with sample inputs.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Inputs</h3>
            {Object.keys(inputProperties).length === 0 ? (
              <p className="text-sm text-muted-foreground">This tool has no inputs.</p>
            ) : (
              <div className="grid gap-3">
                {Object.entries(inputProperties).map(([key, prop]: [string, any]) => (
                  <div key={key} className="space-y-1">
                    <Label htmlFor={key} className="flex items-center gap-2">
                      {key}
                      <span className="text-xs text-muted-foreground">({prop.type})</span>
                      {requiredInputs.includes(key) && (
                        <Badge variant="outline" className="text-xs">required</Badge>
                      )}
                    </Label>
                    {prop.type === 'object' || prop.type === 'array' ? (
                      <Textarea
                        id={key}
                        value={inputs[key] || ''}
                        onChange={(e) => handleInputChange(key, e.target.value)}
                        placeholder={prop.description || `Enter ${key}`}
                        rows={3}
                        className="font-mono text-sm"
                      />
                    ) : (
                      <Input
                        id={key}
                        type={prop.type === 'number' ? 'number' : 'text'}
                        value={inputs[key] || ''}
                        onChange={(e) => handleInputChange(key, e.target.value)}
                        placeholder={prop.description || `Enter ${key}`}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {results.length > 0 && (
            <div className="flex-1 overflow-hidden">
              <h3 className="text-sm font-medium mb-2">Results</h3>
              <ScrollArea className="h-[200px] rounded-lg border">
                <div className="p-3 space-y-3">
                  {results.map((result, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-lg border ${
                        result.success
                          ? 'bg-emerald-500/5 border-emerald-500/20'
                          : 'bg-destructive/5 border-destructive/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {result.success ? (
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-destructive" />
                          )}
                          <span className="text-sm font-medium">
                            {result.success ? 'Success' : 'Failed'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {result.duration}ms
                          </span>
                          <span>{result.timestamp.toLocaleTimeString()}</span>
                        </div>
                      </div>
                      {result.success ? (
                        <div className="relative">
                          <pre className="text-xs bg-muted/50 p-2 rounded overflow-x-auto">
                            {JSON.stringify(result.output, null, 2)}
                          </pre>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6"
                            onClick={() => handleCopyOutput(result.output)}
                          >
                            {copied ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                      ) : (
                        <p className="text-sm text-destructive">{result.error}</p>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleTest} disabled={testing}>
            {testing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Run Test
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
