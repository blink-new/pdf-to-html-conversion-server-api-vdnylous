import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Badge } from './ui/badge'
import { Eye, Code, Download, Copy, Check } from 'lucide-react'
import { ConversionResult } from '../types/conversion'

interface HtmlPreviewProps {
  result: ConversionResult | null
  onDownload: () => void
}

export function HtmlPreview({ result, onDownload }: HtmlPreviewProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  if (!result) {
    return (
      <Card className="h-full">
        <CardContent className="p-6 flex items-center justify-center h-full min-h-[400px]">
          <div className="text-center text-gray-500">
            <Eye className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p>No preview available</p>
            <p className="text-sm mt-1">Convert a PDF file to see the HTML preview</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Eye className="h-5 w-5" />
            <span>HTML Preview</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">
              {result.images.length} images
            </Badge>
            <Button onClick={onDownload} size="sm">
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="preview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mx-6 mb-4">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="html">HTML</TabsTrigger>
            <TabsTrigger value="css">CSS</TabsTrigger>
          </TabsList>
          
          <TabsContent value="preview" className="px-6 pb-6">
            <div className="border rounded-lg bg-white">
              <iframe
                srcDoc={`
                  <html>
                    <head>
                      <style>${result.cssContent}</style>
                    </head>
                    <body>${result.htmlContent}</body>
                  </html>
                `}
                className="w-full h-96 rounded-lg"
                title="HTML Preview"
              />
            </div>
          </TabsContent>
          
          <TabsContent value="html" className="px-6 pb-6">
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                className="absolute top-2 right-2 z-10"
                onClick={() => copyToClipboard(result.htmlContent)}
              >
                {copied ? (
                  <Check className="h-4 w-4 mr-1" />
                ) : (
                  <Copy className="h-4 w-4 mr-1" />
                )}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
              <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-auto max-h-96 border">
                <code>{result.htmlContent}</code>
              </pre>
            </div>
          </TabsContent>
          
          <TabsContent value="css" className="px-6 pb-6">
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                className="absolute top-2 right-2 z-10"
                onClick={() => copyToClipboard(result.cssContent)}
              >
                {copied ? (
                  <Check className="h-4 w-4 mr-1" />
                ) : (
                  <Copy className="h-4 w-4 mr-1" />
                )}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
              <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-auto max-h-96 border">
                <code>{result.cssContent}</code>
              </pre>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}