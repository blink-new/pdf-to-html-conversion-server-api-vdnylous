import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "npm:@blinkdotnew/sdk"

const blink = createClient({
  projectId: 'pdf-to-html-conversion-server-api-vdnylous',
  authRequired: false
})

interface ConversionRequest {
  file: string // base64 encoded PDF
  options?: {
    preserveImages?: boolean
    extractCss?: boolean
    quality?: 'low' | 'medium' | 'high'
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  try {
    // Get auth token from header
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing or invalid authorization header' 
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    const token = authHeader.replace('Bearer ', '')
    blink.auth.setToken(token)

    // Verify user authentication
    const user = await blink.auth.me()
    if (!user?.id) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid authentication token' 
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    if (req.method === 'POST') {
      const body: ConversionRequest = await req.json()
      
      if (!body.file) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Missing file data' 
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        })
      }

      // Generate job ID
      const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // Create job record with initial progress
      await blink.db.conversionJobs.create({
        id: jobId,
        userId: user.id,
        fileName: `upload_${Date.now()}.pdf`,
        status: 'processing',
        progress: 5, // Start with 5% to show immediate activity
        createdAt: new Date().toISOString()
      })

      // Simulate PDF processing with progress updates (in real implementation, you would use a PDF library)
      const processConversion = async () => {
        try {
          console.log(`Starting conversion for job ${jobId}`)
          
          // Small delay to ensure job is created
          await new Promise(resolve => setTimeout(resolve, 200))
          
          // Update progress to 25%
          console.log(`Updating progress to 25% for job ${jobId}`)
          await blink.db.conversionJobs.update(jobId, {
            progress: 25,
            status: 'processing'
          })

          // Simulate processing delay
          await new Promise(resolve => setTimeout(resolve, 800))

          // Update progress to 50%
          console.log(`Updating progress to 50% for job ${jobId}`)
          await blink.db.conversionJobs.update(jobId, {
            progress: 50
          })

          // Mock HTML conversion result
          const htmlContent = `
            <div class="pdf-content">
              <h1>Converted PDF Document</h1>
              <p>This document was converted from PDF to HTML using our API.</p>
              <div class="content-section">
                <h2>Document Content</h2>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
                <ul>
                  <li>Preserved formatting and structure</li>
                  <li>CSS styling maintained</li>
                  <li>Images extracted and embedded</li>
                </ul>
              </div>
              <div class="footer">
                <p>Converted on ${new Date().toLocaleDateString()}</p>
              </div>
            </div>
          `

          const cssContent = `
            .pdf-content {
              font-family: 'Inter', sans-serif;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
              line-height: 1.6;
            }
            
            .pdf-content h1 {
              color: #2563eb;
              border-bottom: 2px solid #f59e0b;
              padding-bottom: 10px;
              margin-bottom: 20px;
            }
            
            .pdf-content h2 {
              color: #374151;
              margin-top: 30px;
              margin-bottom: 15px;
            }
            
            .content-section {
              background: #f9fafb;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            
            .footer {
              text-align: center;
              color: #6b7280;
              font-size: 0.9em;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
            }
          `

          // Update progress to 75%
          await blink.db.conversionJobs.update(jobId, {
            progress: 75
          })

          // Simulate more processing
          await new Promise(resolve => setTimeout(resolve, 600))

          // Create complete HTML file
          const completeHtml = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Converted PDF</title>
              <style>${cssContent}</style>
            </head>
            <body>
              ${htmlContent}
            </body>
            </html>
          `

          // Update progress to 90%
          await blink.db.conversionJobs.update(jobId, {
            progress: 90
          })

          // Upload HTML file to storage
          const htmlBlob = new Blob([completeHtml], { type: 'text/html' })
          const htmlFile = new File([htmlBlob], `${jobId}.html`, { type: 'text/html' })
          
          const { publicUrl } = await blink.storage.upload(
            htmlFile,
            `conversions/${jobId}.html`,
            { upsert: true }
          )

          // Final completion - update to 100%
          await blink.db.conversionJobs.update(jobId, {
            status: 'completed',
            progress: 100,
            completedAt: new Date().toISOString(),
            htmlUrl: publicUrl,
            cssContent: cssContent
          })

        } catch (error) {
          console.error('Conversion failed:', error)
          
          // Update job with error
          await blink.db.conversionJobs.update(jobId, {
            status: 'failed',
            progress: 0,
            errorMessage: 'Conversion failed: ' + error.message
          })
        }
      }

      // Start processing asynchronously
      processConversion()

      return new Response(JSON.stringify({
        success: true,
        jobId,
        status: 'processing',
        message: 'Conversion started successfully'
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Method not allowed' 
    }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })

  } catch (error) {
    console.error('API Error:', error)
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
})