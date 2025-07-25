import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "npm:@blinkdotnew/sdk"

const blink = createClient({
  projectId: 'pdf-to-html-conversion-server-api-vdnylous',
  authRequired: false
})

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

    if (req.method === 'GET') {
      const url = new URL(req.url)
      const jobId = url.pathname.split('/').pop()
      
      if (!jobId) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Missing job ID' 
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        })
      }

      // Get job from database
      const jobs = await blink.db.conversionJobs.list({
        where: { 
          AND: [
            { id: jobId },
            { userId: user.id }
          ]
        },
        limit: 1
      })

      if (jobs.length === 0) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Job not found' 
        }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        })
      }

      const job = jobs[0]

      return new Response(JSON.stringify({
        success: true,
        job: {
          id: job.id,
          fileName: job.fileName,
          status: job.status,
          progress: job.progress || 0,
          createdAt: job.createdAt,
          completedAt: job.completedAt,
          htmlUrl: job.htmlUrl,
          cssContent: job.cssContent,
          errorMessage: job.errorMessage
        }
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