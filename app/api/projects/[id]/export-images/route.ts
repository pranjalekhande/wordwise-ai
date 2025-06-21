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
  try {
    // Authenticate user
    const userId = await requireAuth()
    const supabase = createServerSupabaseClient()
    const { id: projectId } = await params

    // Get request options
    const body = await request.json().catch(() => ({}))
    const { 
      slideIds, // Optional: array of specific slide IDs to export
      format = 'png', // Future: support jpg, pdf
      includeZip = false // Future: return as ZIP file
    } = body

    // Fetch project details
    const { data: project, error: projectError } = await supabase
      .from('carousel_projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      )
    }

    // Fetch slides
    let slidesQuery = supabase
      .from('slides')
      .select('*')
      .eq('project_id', projectId)
      .order('slide_number', { ascending: true })

    // Filter by specific slide IDs if provided
    if (slideIds && Array.isArray(slideIds) && slideIds.length > 0) {
      slidesQuery = slidesQuery.in('id', slideIds)
    }

    const { data: slides, error: slidesError } = await slidesQuery

    if (slidesError) {
      console.error('Error fetching slides:', slidesError)
      return NextResponse.json(
        { error: 'Failed to fetch slides' },
        { status: 500 }
      )
    }

    if (!slides || slides.length === 0) {
      return NextResponse.json(
        { error: 'No slides found' },
        { status: 404 }
      )
    }

    // Generate images
    console.log(`Generating images for ${slides.length} slides...`)
    const slideImages = await generateCarouselImages(
      slides as Slide[],
      project as CarouselProject
    )

    // Convert images to base64 for response (for single image downloads)
    // For production, consider using cloud storage URLs instead
    const imageData = slideImages.map(img => ({
      slideId: img.slideId,
      slideNumber: img.slideNumber,
      fileName: img.fileName,
      content: img.content.substring(0, 100) + '...', // Truncated for response
      imageUrl: `data:image/png;base64,${img.imageBuffer.toString('base64')}`,
      size: img.imageBuffer.length
    }))

    return NextResponse.json({
      success: true,
      projectId: project.id,
      projectTitle: project.title,
      totalSlides: slides.length,
      images: imageData,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error exporting images:', error)
    return NextResponse.json(
      { 
        error: 'Failed to export images',
        details: error instanceof Error ? error.message : 'Unknown error'
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

    // Fetch project
    const { data: project, error: projectError } = await supabase
      .from('carousel_projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single()

    if (projectError || !project) {
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
      return NextResponse.json(
        { error: 'Slide not found' },
        { status: 404 }
      )
    }

    // Generate single image
    const slideImage = await generateSlideImage(
      slide as Slide,
      project as CarouselProject
    )

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
    console.error('Error downloading image:', error)
    return NextResponse.json(
      { error: 'Failed to download image' },
      { status: 500 }
    )
  }
} 