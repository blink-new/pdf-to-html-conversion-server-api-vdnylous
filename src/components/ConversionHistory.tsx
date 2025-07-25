import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Download, Eye, Clock, CheckCircle, XCircle, Loader } from 'lucide-react'
import { ConversionJob } from '../types/conversion'

interface ConversionHistoryProps {
  jobs: ConversionJob[]
  onPreview: (job: ConversionJob) => void
  onDownload: (job: ConversionJob) => void
}

export function ConversionHistory({ jobs, onPreview, onDownload }: ConversionHistoryProps) {
  const getStatusIcon = (status: ConversionJob['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'processing':
        return <Loader className="h-4 w-4 text-blue-500 animate-spin" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusBadge = (status: ConversionJob['status']) => {
    const variants = {
      pending: 'secondary',
      processing: 'default',
      completed: 'default',
      failed: 'destructive'
    } as const

    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    }

    return (
      <Badge variant={variants[status]} className={colors[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  if (jobs.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          <Clock className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <p>No conversion history yet</p>
          <p className="text-sm mt-1">Upload a PDF file to get started</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="h-5 w-5" />
          <span>Conversion History</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {jobs.map((job) => (
          <div
            key={job.id}
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              {getStatusIcon(job.status)}
              <div>
                <p className="font-medium text-gray-900">{job.fileName}</p>
                <p className="text-sm text-gray-500">
                  {new Date(job.createdAt).toLocaleString()}
                </p>
                {job.errorMessage && (
                  <p className="text-sm text-red-600 mt-1">{job.errorMessage}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {getStatusBadge(job.status)}
              
              {job.status === 'completed' && (
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPreview(job)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDownload(job)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}