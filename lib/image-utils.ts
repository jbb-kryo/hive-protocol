const MAX_SIZE = 256
const QUALITY = 0.85
const MAX_FILE_SIZE = 10 * 1024 * 1024

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const
type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number]

const FILE_SIGNATURES: Record<AllowedMimeType, number[][]> = {
  'image/jpeg': [[0xff, 0xd8, 0xff]],
  'image/png': [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  'image/gif': [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61],
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61],
  ],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]],
}

export interface ProcessedImage {
  blob: Blob
  dataUrl: string
  width: number
  height: number
}

export interface FileValidationResult {
  valid: boolean
  error?: string
}

async function readFileSignature(file: File, length: number): Promise<Uint8Array> {
  const slice = file.slice(0, length)
  const buffer = await slice.arrayBuffer()
  return new Uint8Array(buffer)
}

function matchesSignature(bytes: Uint8Array, signature: number[]): boolean {
  if (bytes.length < signature.length) return false
  return signature.every((byte, index) => bytes[index] === byte)
}

async function verifyFileSignature(file: File, mimeType: string): Promise<boolean> {
  if (!(mimeType in FILE_SIGNATURES)) return false

  const signatures = FILE_SIGNATURES[mimeType as AllowedMimeType]
  const maxSignatureLength = Math.max(...signatures.map((s) => s.length))

  try {
    const bytes = await readFileSignature(file, maxSignatureLength + 8)

    if (mimeType === 'image/webp') {
      if (!matchesSignature(bytes, FILE_SIGNATURES['image/webp'][0])) return false
      const webpMarker = [0x57, 0x45, 0x42, 0x50]
      return matchesSignature(bytes.slice(8), webpMarker)
    }

    return signatures.some((signature) => matchesSignature(bytes, signature))
  } catch {
    return false
  }
}

function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/\.{2,}/g, '.')
    .replace(/^\.+/, '')
    .substring(0, 255)
}

function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.')
  if (lastDot === -1) return ''
  return filename.substring(lastDot + 1).toLowerCase()
}

const ALLOWED_EXTENSIONS: Record<AllowedMimeType, string[]> = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/gif': ['gif'],
  'image/webp': ['webp'],
}

export async function processImage(file: File): Promise<ProcessedImage> {
  const validation = await validateImageFileAsync(file)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  return new Promise((resolve, reject) => {
    const img = new Image()
    const reader = new FileReader()

    reader.onload = (e) => {
      img.src = e.target?.result as string
    }

    reader.onerror = () => reject(new Error('Failed to read file'))

    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        reject(new Error('Could not get canvas context'))
        return
      }

      let { width, height } = img

      if (width <= 0 || height <= 0 || width > 10000 || height > 10000) {
        reject(new Error('Invalid image dimensions'))
        return
      }

      if (width > height) {
        if (width > MAX_SIZE) {
          height = Math.round((height * MAX_SIZE) / width)
          width = MAX_SIZE
        }
      } else {
        if (height > MAX_SIZE) {
          width = Math.round((width * MAX_SIZE) / height)
          height = MAX_SIZE
        }
      }

      canvas.width = width
      canvas.height = height

      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob'))
            return
          }

          const dataUrl = canvas.toDataURL('image/jpeg', QUALITY)
          resolve({ blob, dataUrl, width, height })
        },
        'image/jpeg',
        QUALITY
      )
    }

    img.onerror = () => reject(new Error('Failed to load image'))

    reader.readAsDataURL(file)
  })
}

export function validateImageFile(file: File): FileValidationResult {
  if (!file) {
    return { valid: false, error: 'No file provided' }
  }

  const sanitizedName = sanitizeFilename(file.name)
  if (!sanitizedName || sanitizedName.length === 0) {
    return { valid: false, error: 'Invalid filename' }
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type as AllowedMimeType)) {
    return {
      valid: false,
      error: 'Please select a valid image file (JPEG, PNG, GIF, or WebP)',
    }
  }

  const extension = getFileExtension(file.name)
  const allowedExtensions = ALLOWED_EXTENSIONS[file.type as AllowedMimeType]
  if (!allowedExtensions || !allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: 'File extension does not match the file type',
    }
  }

  if (file.size <= 0) {
    return { valid: false, error: 'File is empty' }
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'Image size must be less than 10MB',
    }
  }

  return { valid: true }
}

export async function validateImageFileAsync(file: File): Promise<FileValidationResult> {
  const basicValidation = validateImageFile(file)
  if (!basicValidation.valid) {
    return basicValidation
  }

  const signatureValid = await verifyFileSignature(file, file.type)
  if (!signatureValid) {
    return {
      valid: false,
      error: 'File content does not match declared type. The file may be corrupted or malicious.',
    }
  }

  return { valid: true }
}

export function getSafeFilename(file: File): string {
  return sanitizeFilename(file.name)
}
