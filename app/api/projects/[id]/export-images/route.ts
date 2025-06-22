/**
 * API Route: Export Carousel Images
 * Generates Instagram-ready images from carousel slides
 * Endpoint: POST /api/projects/[id]/export-images
 */

import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { requireAuth } from "@/lib/auth"
import { generateCarouselImages, generateSlideImage } from "@/lib/image-generator"
import type { Slide, CarouselProject } from "@/lib/types"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('🚀 Starting image export request...')
  
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
      slideIds, // Optional: array of specific slide IDs to export
      format = 'png', // Future: support jpg, pdf
      includeZip = false // Future: return as ZIP file
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
    let slidesQuery = supabase
      .from('slides')
      .select('*')
      .eq('project_id', projectId)
      .order('slide_number', { ascending: true })

    // Filter by specific slide IDs if provided
    if (slideIds && Array.isArray(slideIds) && slideIds.length > 0) {
      slidesQuery = slidesQuery.in('id', slideIds)
      console.log('🔍 Filtering by slide IDs:', slideIds.length)
    }

    const { data: slides, error: slidesError } = await slidesQuery

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

    // Step 7: Convert images to base64 for response
    console.log('Step 7: Converting images to base64...')
    let imageData: any[]
    
    try {
      imageData = slideImages.map((img, index) => ({
        slideId: img.slideId,
        slideNumber: img.slideNumber,
        fileName: img.fileName,
        content: img.content.substring(0, 100) + '...', // Truncated for response
        imageUrl: `data:image/png;base64,${img.imageBuffer.toString('base64')}`,
        size: img.imageBuffer.length
      }))
      console.log(`✅ Converted ${imageData.length} images to base64`)
    } catch (conversionError) {
      console.error('❌ Base64 conversion failed:', conversionError)
      return NextResponse.json(
        { 
          error: 'Failed to convert images',
          details: conversionError instanceof Error ? conversionError.message : 'Unknown conversion error',
          step: 'base64_conversion'
        },
        { status: 500 }
      )
    }

    console.log('🎉 Export completed successfully!')
    
    return NextResponse.json({
      success: true,
      projectId: project.id,
      projectTitle: project.title,
      totalSlides: slides.length,
      images: imageData,
      generatedAt: new Date().toISOString(),
      debug: {
        userId: userId.substring(0, 8) + '...',
        slidesCount: slides.length,
        imagesGenerated: imageData.length
      }
    })

  } catch (error) {
    console.error('💥 Unexpected error in export-images:', error)
    
    // Detailed error information
    const errorDetails = {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error during image export',
        details: errorDetails.message,
        timestamp: errorDetails.timestamp
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint for downloading individual slide image
 * Usage: GET /api/projects/[id]/export-images?slideNumber=1
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('🚀 Starting individual image download...')
  
  try {
    const userId = await requireAuth()
    const supabase = createServerSupabaseClient()
    const { id: projectId } = await params
    
    // Get slide number from query params
    const { searchParams } = new URL(request.url)
    const slideNumber = searchParams.get('slideNumber')
    
    if (!slideNumber) {
      return NextResponse.json(
        { error: 'slideNumber parameter is required' },
        { status: 400 }
      )
    }

    console.log(`Fetching slide ${slideNumber} for project ${projectId}`)

    // Fetch project
    const { data: project, error: projectError } = await supabase
      .from('carousel_projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single()

    if (projectError || !project) {
      console.error('Project fetch error:', projectError)
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Fetch specific slide
    const { data: slide, error: slideError } = await supabase
      .from('slides')
      .select('*')
      .eq('project_id', projectId)
      .eq('slide_number', parseInt(slideNumber))
      .single()

    if (slideError || !slide) {
      console.error('Slide fetch error:', slideError)
      return NextResponse.json(
        { error: 'Slide not found' },
        { status: 404 }
      )
    }

    console.log(`Generating image for slide ${slideNumber}...`)

    // Generate single image
    const slideImage = await generateSlideImage(
      slide as Slide,
      project as CarouselProject
    )

    console.log(`✅ Generated image: ${slideImage.fileName}`)

    // Return image as binary response
    return new NextResponse(slideImage.imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="${slideImage.fileName}"`,
        'Content-Length': slideImage.imageBuffer.length.toString(),
      },
    })

  } catch (error) {
    console.error('💥 Error downloading individual image:', error)
    return NextResponse.json(
      { 
        error: 'Failed to download image',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 