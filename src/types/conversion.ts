export interface ConversionJob {
  id: string
  fileName: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  createdAt: string
  completedAt?: string
  htmlUrl?: string
  errorMessage?: string
  userId: string
}

export interface ConversionRequest {
  file: File
  options?: {
    preserveImages: boolean
    extractCss: boolean
    quality: 'low' | 'medium' | 'high'
  }
}

export interface ConversionResult {
  jobId: string
  htmlContent: string
  cssContent: string
  images: string[]
  downloadUrl: string
}