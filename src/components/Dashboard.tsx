import React, { useState, useEffect, useCallback } from 'react'
import { FileUpload } from './FileUpload'
import { ConversionHistory } from './ConversionHistory'
import { HtmlPreview } from './HtmlPreview'
import { ApiDocumentation } from './ApiDocumentation'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { FileText, Zap, Download, Settings } from 'lucide-react'
import { blink } from '../blink/client'
import { ConversionJob, ConversionResult } from '../types/conversion'
import { useToast } from '../hooks/use-toast'

export function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [jobs, setJobs] = useState<ConversionJob[]>([])
  const [currentResult, setCurrentResult] = useState<ConversionResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const { toast } = useToast()

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  const loadConversionHistory = useCallback(async () => {
    if (!user?.id) return
    
    try {
      const history = await blink.db.conversionJobs.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        limit: 20
      })
      
      setJobs(history.map(job => ({
        id: job.id,
        fileName: job.fileName,
        status: job.status as ConversionJob['status'],
        progress: job.progress,
        createdAt: job.createdAt,
        completedAt: job.completedAt,
        htmlUrl: job.htmlUrl,
        errorMessage: job.errorMessage,
        userId: job.userId
      })))
    } catch (error) {
      console.error('Failed to load conversion history:', error)
    }
  }, [user?.id])

  useEffect(() => {
    if (user?.id) {
      loadConversionHistory()
    }
  }, [user?.id, loadConversionHistory])

  const handleFileSelect = async (file: File) => {
    if (!user?.id) return

    setIsProcessing(true)
    setProgress(0)
    setCurrentResult(null)

    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const dataUrl = reader.result as string
          const base64Data = dataUrl.split(',')[1]
          resolve(base64Data)
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      // Get auth token
      const token = await blink.auth.getToken()
      if (!token) {
        throw new Error('No authentication token available')
      }

      // Call conversion API
      const response = await fetch('https://vdnylous--pdf-convert.functions.blink.new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          file: base64,
          options: {
            preserveImages: true,
            extractCss: true,
            quality: 'high'
          }
        })
      })

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Conversion failed')
      }

      const jobId = result.jobId
      console.log(`Started conversion job: ${jobId}`)

      // Poll for completion and progress updates
      const pollStatus = async () => {
        try {
          const statusResponse = await fetch(`https://vdnylous--pdf-status.functions.blink.new/${jobId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })

          const statusResult = await statusResponse.json()
          
          if (statusResult.success && statusResult.job) {
            const job = statusResult.job
            
            // Update progress from backend - ensure it's never 0 if job exists
            const currentProgress = Math.max(job.progress || 0, 5) // Minimum 5% to show activity
            console.log(`Job ${jobId} progress: ${job.progress}% -> displaying: ${currentProgress}%`)
            setProgress(currentProgress)
            
            if (job.status === 'completed') {
              // Ensure we show 100% completion
              setProgress(100)
              
              // Create result for preview
              const conversionResult: ConversionResult = {
                jobId: job.id,
                htmlContent: `<div class="pdf-content"><h1>Converted: ${job.fileName}</h1><p>Successfully converted PDF to HTML</p></div>`,
                cssContent: job.cssContent || '',
                images: [],
                downloadUrl: job.htmlUrl || ''
              }
              
              setTimeout(() => {
                setCurrentResult(conversionResult)
                setIsProcessing(false)
                loadConversionHistory()

                toast({
                  title: "Conversion Complete!",
                  description: `Successfully converted ${file.name} to HTML`,
                })
              }, 300)
              
            } else if (job.status === 'failed') {
              throw new Error(job.errorMessage || 'Conversion failed')
            } else {
              // Still processing, continue polling more frequently
              setTimeout(pollStatus, 500)
            }
          } else {
            // If we can't get status, continue polling but less frequently
            setTimeout(pollStatus, 1000)
          }
        } catch (error) {
          console.error('Status polling error:', error)
          setIsProcessing(false)
          setProgress(0)
          
          toast({
            title: "Conversion Failed",
            description: error instanceof Error ? error.message : "There was an error converting your PDF file",
            variant: "destructive"
          })
        }
      }

      // Start polling immediately to catch early progress updates
      setTimeout(pollStatus, 500)

    } catch (error) {
      console.error('Conversion failed:', error)
      setIsProcessing(false)
      setProgress(0)
      
      toast({
        title: "Conversion Failed",
        description: error instanceof Error ? error.message : "There was an error converting your PDF file",
        variant: "destructive"
      })
    }
  }

  const handlePreview = (job: ConversionJob) => {
    if (job.status === 'completed' && job.htmlUrl) {
      // Create a mock result for preview
      const result: ConversionResult = {
        jobId: job.id,
        htmlContent: `<div class="pdf-content"><h1>Preview of ${job.fileName}</h1><p>This is a preview of the converted HTML content.</p></div>`,
        cssContent: job.cssContent || '',
        images: [],
        downloadUrl: job.htmlUrl
      }
      setCurrentResult(result)
    }
  }

  const handleDownload = (job: ConversionJob) => {
    if (job.htmlUrl) {
      // Create download link
      const link = document.createElement('a')
      link.href = job.htmlUrl
      link.download = `${job.fileName.replace('.pdf', '')}.html`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast({
        title: "Download Started",
        description: `Downloading ${job.fileName}`,
      })
    }
  }

  const handleDownloadCurrent = () => {
    if (currentResult) {
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Converted PDF</title>
          <style>${currentResult.cssContent}</style>
        </head>
        <body>
          ${currentResult.htmlContent}
        </body>
        </html>
      `
      
      const blob = new Blob([htmlContent], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'converted.html'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast({
        title: "Download Complete",
        description: "HTML file has been downloaded",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <FileText className="mx-auto h-12 w-12 text-blue-600 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              PDF to HTML Converter
            </h1>
            <p className="text-gray-600 mb-6">
              Please sign in to start converting your PDF files to HTML
            </p>
            <Button onClick={() => blink.auth.login()} className="w-full">
              Sign In to Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  PDF to HTML Converter
                </h1>
                <p className="text-sm text-gray-500">
                  Convert PDFs with preserved styling
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <Zap className="h-3 w-3 mr-1" />
                API Ready
              </Badge>
              <Button
                variant="outline"
                onClick={() => blink.auth.logout()}
                size="sm"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="converter" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="converter">PDF Converter</TabsTrigger>
            <TabsTrigger value="api">API Documentation</TabsTrigger>
          </TabsList>
          
          <TabsContent value="converter" className="space-y-8">
            {/* Upload Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <FileUpload
                  onFileSelect={handleFileSelect}
                  isProcessing={isProcessing}
                  progress={progress}
                />
                
                <ConversionHistory
                  jobs={jobs}
                  onPreview={handlePreview}
                  onDownload={handleDownload}
                />
              </div>
              
              <div>
                <HtmlPreview
                  result={currentResult}
                  onDownload={handleDownloadCurrent}
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="api">
            <ApiDocumentation />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}