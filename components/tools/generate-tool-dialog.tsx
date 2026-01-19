'use client'

import { useState } from 'react'
import {
  Loader2,
  Sparkles,
  Wand2,
  Code,
  Database,
  Mail,
  Search,
  Calendar,
  Palette,
  DollarSign,
  Shield,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Pencil,
  ArrowLeft,
  Info,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ScrollArea } from '@/components/ui/scroll-area'
import { supabase } from '@/lib/supabase'

interface GenerateToolDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onToolGenerated: () => void
}

interface ValidationResult {
  security: {
    isValid: boolean
    errors: string[]
    warnings: string[]
  }
  structure: {
    isValid: boolean
    errors: string[]
    hasExportFunction: boolean
    hasProperStructure: boolean
  }
}

interface PreviewTool {
  name: string
  description: string
  category: string
  icon: string
  input_schema: {
    type: string
    properties: Record<string, { type: string; description: string }>
    required: string[]
  }
  output_schema: {
    type: string
    properties: Record<string, { type: string; description: string }>
  }
  wrapper_code: string
  capabilities: {
    category: string
    requires_config: boolean
    config_fields: Array<{
      name: string
      type: string
      label: string
      required: boolean
    }>
  }
}

const CATEGORIES = [
  { value: 'Data', label: 'Data Processing', icon: Database },
  { value: 'Communication', label: 'Communication', icon: Mail },
  { value: 'Development', label: 'Development', icon: Code },
  { value: 'Research', label: 'Research', icon: Search },
  { value: 'Productivity', label: 'Productivity', icon: Calendar },
  { value: 'Creative', label: 'Creative', icon: Palette },
  { value: 'Finance', label: 'Finance', icon: DollarSign },
  { value: 'Security', label: 'Security', icon: Shield },
  { value: 'Custom', label: 'Custom', icon: Wrench },
]

const EXAMPLE_PROMPTS = [
  {
    title: 'REST API Fetcher',
    description: 'Fetch and parse JSON data from a REST API endpoint with authentication support',
    category: 'Research',
  },
  {
    title: 'Slack Notifier',
    description: 'Send formatted Slack messages with attachments to a specified channel',
    category: 'Communication',
  },
  {
    title: 'CSV to JSON',
    description: 'Convert CSV files to JSON format with data validation and type inference',
    category: 'Data',
  },
  {
    title: 'Hash Generator',
    description: 'Generate secure hash values using SHA-256 for text content',
    category: 'Security',
  },
  {
    title: 'Interest Calculator',
    description: 'Calculate compound interest with variable rates over time periods',
    category: 'Finance',
  },
  {
    title: 'Input Validator',
    description: 'Validate and sanitize user input data with customizable rules',
    category: 'Security',
  },
  {
    title: 'URL Shortener',
    description: 'Create shortened URLs with tracking and expiration support',
    category: 'Development',
  },
  {
    title: 'Text Summarizer',
    description: 'Extract key points and summarize long text content',
    category: 'Productivity',
  },
]

type Step = 'input' | 'preview' | 'success'

export function GenerateToolDialog({
  open,
  onOpenChange,
  onToolGenerated,
}: GenerateToolDialogProps) {
  const [description, setDescription] = useState('')
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [previewTool, setPreviewTool] = useState<PreviewTool | null>(null)
  const [editedCode, setEditedCode] = useState('')
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [savedTool, setSavedTool] = useState<PreviewTool | null>(null)
  const [error, setError] = useState('')
  const [step, setStep] = useState<Step>('input')
  const [showExamples, setShowExamples] = useState(false)

  const handleGenerate = async () => {
    if (!description.trim() || description.trim().length < 10) {
      setError('Please provide a detailed description (at least 10 characters)')
      return
    }

    setGenerating(true)
    setError('')

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        setError('Please sign in to generate tools')
        return
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-tool`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            description: description.trim(),
            name: name.trim() || undefined,
            category: category || undefined,
            previewOnly: true,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to generate tool')
      }

      setPreviewTool(data.tool)
      setEditedCode(data.tool.wrapper_code)
      setValidation(data.validation)
      setStep('preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate tool')
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!previewTool) return

    setSaving(true)
    setError('')

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        setError('Please sign in to save tools')
        return
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-tool`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            description: description.trim(),
            name: previewTool.name,
            category: previewTool.category,
            customCode: editedCode,
            previewOnly: false,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        if (data.details && Array.isArray(data.details)) {
          throw new Error(data.details.join('. '))
        }
        throw new Error(data.message || data.error || 'Failed to save tool')
      }

      setSavedTool(data.tool)
      setStep('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save tool')
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    if (savedTool) {
      onToolGenerated()
    }
    setDescription('')
    setName('')
    setCategory('')
    setPreviewTool(null)
    setEditedCode('')
    setValidation(null)
    setSavedTool(null)
    setError('')
    setStep('input')
    onOpenChange(false)
  }

  const handleUseExample = (example: (typeof EXAMPLE_PROMPTS)[0]) => {
    setDescription(example.description)
    setCategory(example.category)
    setShowExamples(false)
  }

  const handleBack = () => {
    setStep('input')
    setError('')
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            {step === 'input' && 'Generate Custom Tool'}
            {step === 'preview' && 'Review Generated Tool'}
            {step === 'success' && 'Tool Created'}
          </DialogTitle>
          <DialogDescription>
            {step === 'input' &&
              'Describe what you want your tool to do and we will generate it for you.'}
            {step === 'preview' &&
              'Review the generated tool and edit the code if needed before saving.'}
            {step === 'success' && 'Your custom tool has been created successfully.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {step === 'input' && (
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-6 py-4">
                <div className="space-y-2">
                  <Label htmlFor="description">
                    Tool Description <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what your tool should do in detail. For example: 'Fetch weather data from an API and return temperature, humidity, and forecast for a given city'"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    Be specific about inputs, outputs, and any external services needed.
                  </p>
                </div>

                <Collapsible open={showExamples} onOpenChange={setShowExamples}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                      <Info className="w-4 h-4" />
                      {showExamples ? 'Hide examples' : 'Show example prompts'}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {EXAMPLE_PROMPTS.map((example) => (
                        <Card
                          key={example.title}
                          className="cursor-pointer hover:bg-accent transition-colors"
                          onClick={() => handleUseExample(example)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-medium text-sm">{example.title}</p>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {example.description}
                                </p>
                              </div>
                              <Badge variant="secondary" className="text-xs shrink-0">
                                {example.category}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Tool Name (optional)</Label>
                    <Input
                      id="name"
                      placeholder="Auto-generated if empty"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category (optional)</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Auto-detect" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            <div className="flex items-center gap-2">
                              <cat.icon className="w-4 h-4" />
                              {cat.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive flex items-start gap-2">
                    <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}

          {step === 'preview' && previewTool && (
            <div className="h-[60vh] flex flex-col">
              <Tabs defaultValue="overview" className="flex-1 flex flex-col">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview" className="gap-2">
                    <Eye className="w-4 h-4" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="code" className="gap-2">
                    <Pencil className="w-4 h-4" />
                    Edit Code
                  </TabsTrigger>
                  <TabsTrigger value="validation" className="gap-2">
                    <Shield className="w-4 h-4" />
                    Validation
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="flex-1 mt-4">
                  <ScrollArea className="h-[45vh]">
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{previewTool.name}</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              {previewTool.description}
                            </p>
                          </div>
                          <Badge>{previewTool.category}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {previewTool.input_schema?.properties &&
                          Object.keys(previewTool.input_schema.properties).length > 0 && (
                            <div>
                              <Label className="text-sm font-medium">Inputs</Label>
                              <div className="mt-2 space-y-1">
                                {Object.entries(previewTool.input_schema.properties).map(
                                  ([key, value]) => (
                                    <div key={key} className="flex items-center gap-2 text-sm">
                                      <code className="px-1.5 py-0.5 bg-muted rounded text-xs">
                                        {key}
                                      </code>
                                      <span className="text-muted-foreground">({value.type})</span>
                                      {previewTool.input_schema.required?.includes(key) && (
                                        <Badge variant="outline" className="text-xs">
                                          required
                                        </Badge>
                                      )}
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )}

                        {previewTool.output_schema?.properties &&
                          Object.keys(previewTool.output_schema.properties).length > 0 && (
                            <div>
                              <Label className="text-sm font-medium">Outputs</Label>
                              <div className="mt-2 space-y-1">
                                {Object.entries(previewTool.output_schema.properties).map(
                                  ([key, value]) => (
                                    <div key={key} className="flex items-center gap-2 text-sm">
                                      <code className="px-1.5 py-0.5 bg-muted rounded text-xs">
                                        {key}
                                      </code>
                                      <span className="text-muted-foreground">({value.type})</span>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )}

                        {previewTool.capabilities?.config_fields &&
                          previewTool.capabilities.config_fields.length > 0 && (
                            <div>
                              <Label className="text-sm font-medium">Configuration Required</Label>
                              <div className="mt-2 space-y-1">
                                {previewTool.capabilities.config_fields.map((field) => (
                                  <div key={field.name} className="flex items-center gap-2 text-sm">
                                    <code className="px-1.5 py-0.5 bg-muted rounded text-xs">
                                      {field.name}
                                    </code>
                                    <span className="text-muted-foreground">{field.label}</span>
                                    {field.required && (
                                      <Badge variant="outline" className="text-xs">
                                        required
                                      </Badge>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                      </CardContent>
                    </Card>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="code" className="flex-1 mt-4">
                  <div className="h-[45vh] flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-medium">Tool Code</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditedCode(previewTool.wrapper_code)}
                            >
                              Reset
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Reset to generated code</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Textarea
                      value={editedCode}
                      onChange={(e) => setEditedCode(e.target.value)}
                      className="flex-1 font-mono text-xs resize-none"
                      placeholder="Tool code will appear here..."
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      You can edit the generated code before saving. Make sure to keep the execute
                      function signature.
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="validation" className="flex-1 mt-4">
                  <ScrollArea className="h-[45vh]">
                    <div className="space-y-4">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            Security Check
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {validation?.security.isValid ? (
                            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="w-4 h-4" />
                              <span className="text-sm">No security issues detected</span>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {validation?.security.errors.map((err, i) => (
                                <div
                                  key={i}
                                  className="flex items-start gap-2 text-destructive text-sm"
                                >
                                  <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                  <span>{err}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {validation?.security.warnings &&
                            validation.security.warnings.length > 0 && (
                              <div className="mt-3 space-y-2">
                                {validation.security.warnings.map((warn, i) => (
                                  <div
                                    key={i}
                                    className="flex items-start gap-2 text-amber-600 dark:text-amber-400 text-sm"
                                  >
                                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                                    <span>{warn}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Code className="w-4 h-4" />
                            Structure Check
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {validation?.structure.isValid ? (
                            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="w-4 h-4" />
                              <span className="text-sm">Code structure is valid</span>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {validation?.structure.errors.map((err, i) => (
                                <div
                                  key={i}
                                  className="flex items-start gap-2 text-destructive text-sm"
                                >
                                  <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                  <span>{err}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>

              {error && (
                <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive flex items-start gap-2">
                  <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          )}

          {step === 'success' && savedTool && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium mb-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Tool Created Successfully
                </div>
                <p className="text-sm text-muted-foreground">
                  Your custom tool is now available in your tools list and can be used by your AI
                  agents.
                </p>
              </div>

              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{savedTool.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{savedTool.description}</p>
                    </div>
                    <Badge>{savedTool.category}</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {step === 'input' && (
            <>
              <Button variant="outline" onClick={handleClose} disabled={generating}>
                Cancel
              </Button>
              <Button onClick={handleGenerate} disabled={generating || !description.trim()}>
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Generate Tool
                  </>
                )}
              </Button>
            </>
          )}

          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={handleBack} disabled={saving}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Save Tool
                  </>
                )}
              </Button>
            </>
          )}

          {step === 'success' && <Button onClick={handleClose}>Done</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
