/**
 * API Route: Export Carousel Images as ZIP
 * Generates Instagram-ready images and packages them in a ZIP file
 * Endpoint: POST /api/projects/[id]/export-zip
 */

import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { requireAuth } from "@/lib/auth"
import { generateCarouselImages } from "@/lib/image-generator"
import type { Slide, CarouselProject } from "@/lib/types"
import JSZip from "jszip"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('🚀 Starting ZIP export request...')
  
  try {
    // Step 1: Authenticate user
    console.log('Step 1: Authenticating user...')
    let userId: string
    try {
      userId = await requireAuth()
      console.log('✅ User authenticated:', userId.substring(0, 8) + '...')
    } catch (authError) {
      console.error('❌ Authentication failed:', authError)
      return NextResponse.json(
        { 
          error: 'Authentication failed',
          details: authError instanceof Error ? authError.message : 'Unknown auth error'
        },
        { status: 401 }
      )
    }

    // Step 2: Initialize database connection
    console.log('Step 2: Initializing database connection...')
    const supabase = createServerSupabaseClient()
    const { id: projectId } = await params
    console.log('✅ Project ID:', projectId)

    // Step 3: Parse request body
    console.log('Step 3: Parsing request body...')
    let body: any = {}
    try {
      body = await request.json().catch(() => ({}))
      console.log('✅ Request body parsed:', Object.keys(body))
    } catch (parseError) {
      console.warn('⚠️ Failed to parse request body, using defaults')
    }
    
    const { 
      includeCaption = true,
      format = 'png'
    } = body

    // Step 4: Fetch project details
    console.log('Step 4: Fetching project details...')
    const { data: project, error: projectError } = await supabase
      .from('carousel_projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single()

    if (projectError) {
      console.error('❌ Project fetch error:', projectError)
      return NextResponse.json(
        { 
          error: 'Failed to fetch project',
          details: projectError.message,
          code: projectError.code
        },
        { status: projectError.code === 'PGRST116' ? 404 : 500 }
      )
    }

    if (!project) {
      console.error('❌ Project not found')
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      )
    }

    console.log('✅ Project found:', project.title)

    // Step 5: Fetch slides
    console.log('Step 5: Fetching slides...')
    const { data: slides, error: slidesError } = await supabase
      .from('slides')
      .select('*')
      .eq('project_id', projectId)
      .order('slide_number', { ascending: true })

    if (slidesError) {
      console.error('❌ Slides fetch error:', slidesError)
      return NextResponse.json(
        { 
          error: 'Failed to fetch slides',
          details: slidesError.message,
          code: slidesError.code
        },
        { status: 500 }
      )
    }

    if (!slides || slides.length === 0) {
      console.error('❌ No slides found')
      return NextResponse.json(
        { error: 'No slides found' },
        { status: 404 }
      )
    }

    console.log(`✅ Found ${slides.length} slides`)

    // Step 6: Generate images
    console.log(`Step 6: Generating images for ${slides.length} slides...`)
    let slideImages: any[]
    
    try {
      slideImages = await generateCarouselImages(
        slides as Slide[],
        project as CarouselProject
      )
      console.log(`✅ Successfully generated ${slideImages.length} images`)
    } catch (imageError) {
      console.error('❌ Image generation failed:', imageError)
      return NextResponse.json(
        { 
          error: 'Failed to generate images',
          details: imageError instanceof Error ? imageError.message : 'Unknown image generation error',
          step: 'image_generation'
        },
        { status: 500 }
      )
    }

    // Step 7: Create ZIP file
    console.log('Step 7: Creating ZIP file...')
    const zip = new JSZip()
    
    try {
      // Add images to ZIP
      slideImages.forEach((slideImage, index) => {
        const fileName = slideImage.fileName
        zip.file(fileName, slideImage.imageBuffer)
        console.log(`Added ${fileName} to ZIP`)
      })

      // Add caption file if requested
      if (includeCaption) {
        console.log('Adding caption file to ZIP...')
        
        // Generate Instagram caption
        const captionLines = []
        captionLines.push(`${project.title}`)
        captionLines.push('')
        
        if (slides.length > 0) {
          captionLines.push(slides[0].content)
          if (slides.length > 1) {
            captionLines.push('')
            captionLines.push('💫 Swipe to see more!')
          }
        }
        
        // Add hashtags
        const hashtags = ['#carousel', '#instagram']
        if (project.template_type) {
          hashtags.push(`#${project.template_type.toLowerCase()}`)
        }
        
        captionLines.push('')
        captionLines.push(hashtags.join(' '))
        
        const captionContent = captionLines.join('\n')
        zip.file('instagram-caption.txt', captionContent)
        console.log('Added caption file to ZIP')

        // Add slide content summary
        const slideContentLines = []
        slideContentLines.push(`${project.title} - Slide Content`)
        slideContentLines.push('=' .repeat(50))
        slideContentLines.push('')
        
        slides.forEach((slide, index) => {
          slideContentLines.push(`Slide ${slide.slide_number || index + 1}:`)
          slideContentLines.push(`${slide.content}`)
          slideContentLines.push('')
        })
        
        slideContentLines.push('')
        slideContentLines.push(`Generated: ${new Date().toLocaleString()}`)
        slideContentLines.push(`Template: ${project.template_type || 'Custom'}`)
        
        const slideContentText = slideContentLines.join('\n')
        zip.file('slide-content.txt', slideContentText)
        console.log('Added slide content file to ZIP')
      }

      // Generate ZIP buffer
      console.log('Generating ZIP buffer...')
      const zipBuffer = await zip.generateAsync({ 
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      })
      
      console.log(`✅ ZIP file created, size: ${zipBuffer.length} bytes`)

      // Step 8: Return ZIP file
      const fileName = `${project.title.replace(/[^a-zA-Z0-9]/g, '_')}_carousel.zip`
      
      return new NextResponse(zipBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Content-Length': zipBuffer.length.toString(),
        },
      })

    } catch (zipError) {
      console.error('❌ ZIP creation failed:', zipError)
      return NextResponse.json(
        { 
          error: 'Failed to create ZIP file',
          details: zipError instanceof Error ? zipError.message : 'Unknown ZIP error',
          step: 'zip_creation'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('💥 Unexpected error in export-zip:', error)
    
    // Detailed error information
    const errorDetails = {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error during ZIP export',
        details: errorDetails.message,
        timestamp: errorDetails.timestamp
      },
      { status: 500 }
    )
  }
} 