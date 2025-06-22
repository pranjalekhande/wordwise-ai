/**
 * PDF Export API Endpoint
 * Generates PDF from carousel slides with images
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'
import { generateCarouselImages } from '@/lib/image-generator'
import { generateCarouselPDF, generateTextOnlyPDF, SlideImageData } from '@/lib/pdf-export'
import type { CarouselProject, Slide } from '@/lib/types'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const userId = await requireAuth()
    const supabase = createServerSupabaseClient()
    const { id: projectId } = await params
    
    const { includeImages = true, textOnly = false } = await request.json()

    // Fetch project data
    const { data: project, error: projectError } = await supabase
      .from('carousel_projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { success: false, error: 'Project not found or access denied' },
        { status: 404 }
      )
    }

    // Fetch slides
    const { data: slides, error: slidesError } = await supabase
      .from('slides')
      .select('*')
      .eq('project_id', projectId)
      .order('slide_number')

    if (slidesError || !slides?.length) {
      return NextResponse.json(
        { success: false, error: 'No slides found' },
        { status: 404 }
      )
    }

    // Generate text-only PDF if requested
    if (textOnly) {
      const pdfResult = await generateTextOnlyPDF(slides, project as CarouselProject)
      
      if (!pdfResult.success) {
        return NextResponse.json(
          { success: false, error: pdfResult.error },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        fileName: pdfResult.fileName,
        type: 'text-only',
        slidesCount: slides.length
      })
    }

    // Generate images first
    let slideImages: SlideImageData[] = []
    
    if (includeImages) {
      try {
        const imageResults = await generateCarouselImages(slides as Slide[], project as CarouselProject)
        
        if (imageResults?.length) {
          slideImages = imageResults.map((img, index: number) => ({
            slideId: slides[index].id,
            slideNumber: slides[index].slide_number,
            content: slides[index].content,
            fileName: img.fileName,
            imageUrl: `data:image/png;base64,${img.imageBuffer.toString('base64')}`
          }))
        } else {
          console.warn('Image generation failed, creating text-only PDF')
          const pdfResult = await generateTextOnlyPDF(slides, project as CarouselProject)
          
          return NextResponse.json({
            success: true,
            fileName: pdfResult.fileName,
            type: 'text-only-fallback',
            warning: 'Images could not be generated',
            slidesCount: slides.length
          })
        }
      } catch (imageError) {
        console.warn('Image generation error, falling back to text-only:', imageError)
        const pdfResult = await generateTextOnlyPDF(slides, project as CarouselProject)
        
        return NextResponse.json({
          success: true,
          fileName: pdfResult.fileName,
          type: 'text-only-fallback',
          warning: 'Images could not be generated due to error',
          slidesCount: slides.length
        })
      }
    } else {
      // Create slide data without images
      slideImages = slides.map((slide: Slide) => ({
        slideId: slide.id,
        slideNumber: slide.slide_number,
        content: slide.content,
        fileName: `slide_${slide.slide_number}.png`,
        imageUrl: undefined
      }))
    }

    // Generate PDF with images
    const pdfResult = await generateCarouselPDF(slideImages, project as CarouselProject)
    
    if (!pdfResult.success) {
      return NextResponse.json(
        { success: false, error: pdfResult.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      fileName: pdfResult.fileName,
      type: includeImages ? 'with-images' : 'text-only',
      slidesCount: slides.length,
      imagesGenerated: slideImages.filter(img => img.imageUrl).length
    })

  } catch (error) {
    console.error('PDF export error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
} 