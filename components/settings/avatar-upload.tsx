'use client'

import { useState, useRef, useCallback } from 'react'
import { Camera, Loader2, X, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { processImage, validateImageFile, type ProcessedImage } from '@/lib/image-utils'

interface AvatarUploadProps {
  currentAvatarUrl?: string | null
  fallbackInitial: string
  onUpload: (blob: Blob) => Promise<string | null>
  disabled?: boolean
}

export function AvatarUpload({
  currentAvatarUrl,
  fallbackInitial,
  onUpload,
  disabled,
}: AvatarUploadProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [preview, setPreview] = useState<ProcessedImage | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback(async (file: File) => {
    setError(null)

    const validation = validateImageFile(file)
    if (!validation.valid) {
      setError(validation.error || 'Invalid file')
      return
    }

    try {
      const processed = await processImage(file)
      setPreview(processed)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image')
    }
  }, [])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        handleFileSelect(file)
      }
    },
    [handleFileSelect]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const file = e.dataTransfer.files?.[0]
      if (file) {
        handleFileSelect(file)
      }
    },
    [handleFileSelect]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleUpload = useCallback(async () => {
    if (!preview) return

    setIsUploading(true)
    setError(null)

    try {
      const url = await onUpload(preview.blob)
      if (url) {
        setIsOpen(false)
        setPreview(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload avatar')
    } finally {
      setIsUploading(false)
    }
  }, [preview, onUpload])

  const handleClose = useCallback(() => {
    setIsOpen(false)
    setPreview(null)
    setError(null)
    setIsDragging(false)
  }, [])

  const handleClearPreview = useCallback(() => {
    setPreview(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  return (
    <>
      <div className="flex items-center gap-4">
        <div className="relative group">
          {currentAvatarUrl ? (
            <img
              src={currentAvatarUrl}
              alt="Your current profile avatar"
              className="w-20 h-20 rounded-full object-cover"
              loading="eager"
              decoding="async"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">
                {fallbackInitial.toUpperCase()}
              </span>
            </div>
          )}
          <button
            onClick={() => setIsOpen(true)}
            disabled={disabled}
            className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:cursor-not-allowed"
          >
            <Camera className="w-6 h-6 text-white" />
          </button>
        </div>
        <Button variant="outline" size="sm" onClick={() => setIsOpen(true)} disabled={disabled}>
          Change Avatar
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Avatar</DialogTitle>
            <DialogDescription>
              Choose an image to use as your profile picture
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {preview ? (
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <img
                    src={preview.dataUrl}
                    alt="Preview of your new profile avatar"
                    className="w-40 h-40 rounded-full object-cover border-4 border-border"
                    loading="eager"
                    decoding="async"
                  />
                  <button
                    onClick={handleClearPreview}
                    className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {preview.width} x {preview.height} pixels
                </p>
              </div>
            ) : (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleInputChange}
                  className="hidden"
                  id="avatar-upload"
                />
                <label
                  htmlFor="avatar-upload"
                  className="cursor-pointer flex flex-col items-center gap-3"
                >
                  <div className="p-3 rounded-full bg-muted">
                    <Upload className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">Drop an image here or click to browse</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      JPEG, PNG, GIF, or WebP up to 10MB
                    </p>
                  </div>
                </label>
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleClose} disabled={isUploading}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={!preview || isUploading}>
              {isUploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Avatar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
