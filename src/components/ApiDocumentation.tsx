import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Copy, Check, Code, Key, Book } from 'lucide-react'

export function ApiDocumentation() {
  const [copied, setCopied] = useState('')

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(id)
      setTimeout(() => setCopied(''), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const apiEndpoints = [
    {
      method: 'POST',
      path: 'https://vdnylous--pdf-convert.functions.blink.new',
      description: 'Convert PDF to HTML',
      requestBody: `{
  "file": "base64_encoded_pdf_content",
  "options": {
    "preserveImages": true,
    "extractCss": true,
    "quality": "high"
  }
}`,
      response: `{
  "success": true,
  "jobId": "job_abc123",
  "status": "processing",
  "message": "Conversion started successfully"
}`
    },
    {
      method: 'GET',
      path: 'https://vdnylous--pdf-status.functions.blink.new/:jobId',
      description: 'Check conversion status',
      response: `{
  "success": true,
  "job": {
    "id": "job_abc123",
    "fileName": "document.pdf",
    "status": "completed",
    "progress": 100,
    "createdAt": "2024-01-20T10:30:00.000Z",
    "completedAt": "2024-01-20T10:32:15.000Z",
    "htmlUrl": "https://storage.googleapis.com/.../job_abc123.html"
  }
}`
    },
    {
      method: 'GET',
      path: '[htmlUrl from status response]',
      description: 'Download converted HTML file',
      response: 'Complete HTML file with embedded CSS and styling'
    }
  ]

  const curlExamples = [
    {
      title: 'Convert PDF',
      code: `curl -X POST https://vdnylous--pdf-convert.functions.blink.new \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "file": "base64_encoded_pdf_content",
    "options": {
      "preserveImages": true,
      "extractCss": true,
      "quality": "high"
    }
  }'`
    },
    {
      title: 'Check Status',
      code: `curl -X GET https://vdnylous--pdf-status.functions.blink.new/job_abc123 \\
  -H "Authorization: Bearer YOUR_API_KEY"`
    },
    {
      title: 'Download Result',
      code: `curl -X GET [HTML_URL_FROM_STATUS_RESPONSE] \\
  -o converted.html`
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Book className="h-5 w-5" />
          <span>API Documentation</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="endpoints" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
            <TabsTrigger value="examples">Examples</TabsTrigger>
            <TabsTrigger value="authentication">Auth</TabsTrigger>
          </TabsList>
          
          <TabsContent value="endpoints" className="space-y-6 mt-6">
            {apiEndpoints.map((endpoint, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Badge 
                    variant={endpoint.method === 'POST' ? 'default' : 'secondary'}
                    className={endpoint.method === 'POST' ? 'bg-green-100 text-green-800' : ''}
                  >
                    {endpoint.method}
                  </Badge>
                  <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                    {endpoint.path}
                  </code>
                </div>
                
                <p className="text-gray-600 mb-4">{endpoint.description}</p>
                
                {endpoint.requestBody && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Request Body:</h4>
                    <div className="relative">
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute top-2 right-2 z-10"
                        onClick={() => copyToClipboard(endpoint.requestBody!, `req-${index}`)}
                      >
                        {copied === `req-${index}` ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto">
                        <code>{endpoint.requestBody}</code>
                      </pre>
                    </div>
                  </div>
                )}
                
                <div>
                  <h4 className="font-medium mb-2">Response:</h4>
                  <div className="relative">
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2 z-10"
                      onClick={() => copyToClipboard(endpoint.response, `res-${index}`)}
                    >
                      {copied === `res-${index}` ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto">
                      <code>{endpoint.response}</code>
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>
          
          <TabsContent value="examples" className="space-y-6 mt-6">
            {curlExamples.map((example, index) => (
              <div key={index} className="border rounded-lg p-4">
                <h3 className="font-medium mb-3 flex items-center space-x-2">
                  <Code className="h-4 w-4" />
                  <span>{example.title}</span>
                </h3>
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2 z-10"
                    onClick={() => copyToClipboard(example.code, `curl-${index}`)}
                  >
                    {copied === `curl-${index}` ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <pre className="bg-gray-900 text-green-400 p-4 rounded text-sm overflow-auto">
                    <code>{example.code}</code>
                  </pre>
                </div>
              </div>
            ))}
          </TabsContent>
          
          <TabsContent value="authentication" className="mt-6">
            <div className="space-y-6">
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-3 flex items-center space-x-2">
                  <Key className="h-4 w-4" />
                  <span>API Authentication</span>
                </h3>
                <p className="text-gray-600 mb-4">
                  All API requests require authentication using a Bearer token in the Authorization header.
                </p>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-blue-900 mb-2">Getting Your API Key</h4>
                  <p className="text-blue-800 text-sm">
                    Your API key is automatically generated when you sign in. 
                    Use your Blink authentication token for API access.
                  </p>
                </div>
                
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2 z-10"
                    onClick={() => copyToClipboard('Authorization: Bearer YOUR_API_KEY', 'auth-header')}
                  >
                    {copied === 'auth-header' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <pre className="bg-gray-50 p-3 rounded text-sm">
                    <code>Authorization: Bearer YOUR_API_KEY</code>
                  </pre>
                </div>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-3">Rate Limits</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 100 requests per hour for free users</li>
                  <li>• 1000 requests per hour for pro users</li>
                  <li>• Maximum file size: 50MB</li>
                  <li>• Supported format: PDF only</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}