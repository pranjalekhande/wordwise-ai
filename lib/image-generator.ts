/**
 * Instagram Image Generation Utility
 * Converts slide content to Instagram-ready square images (1080x1080px)
 * Supports markdown formatting, emojis, and Instagram-style typography
 */

import sharp from 'sharp'
import type { Slide, CarouselProject } from './types'

// Instagram specifications
export const INSTAGRAM_SPECS = {
  SQUARE_SIZE: 1080,
  MAX_CONTENT_LENGTH: 180,
  PADDING: 80,
  FONT_SIZES: {
    title: 48,
    content: 36,
    hashtag: 32,
    slideNumber: 24,
    branding: 20
  },
  COLORS: {
    background: '#FFFFFF',
    text: '#1A1A1A',
    secondary: '#666666',
    accent: '#E91E63',
    hashtag: '#1DA1F2'
  }
} as const

export interface ImageGenerationOptions {
  includeSlideNumber?: boolean
  includeBranding?: boolean
  customBrandColor?: string
  backgroundColor?: string
  textColor?: string
  watermark?: string
}

export interface SlideImageData {
  slideId: string
  slideNumber: number
  content: string
  imageBuffer: Buffer
  fileName: string
}

/**
 * Escape XML special characters for safe SVG content
 */
function escapeXML(text: string): string {
  if (!text) return ''
  
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u0084\u0086-\u009F]/g, '') // Remove control characters
}

/**
 * Break text into multiple lines for better SVG display
 */
function wrapTextForSVG(text: string, maxCharsPerLine: number = 40): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    
    if (testLine.length <= maxCharsPerLine) {
      currentLine = testLine
    } else {
      if (currentLine) {
        lines.push(currentLine)
        currentLine = word
      } else {
        // Word is too long, add it anyway but try to break it
        if (word.length > maxCharsPerLine) {
          lines.push(word.substring(0, maxCharsPerLine))
          currentLine = word.substring(maxCharsPerLine)
        } else {
          lines.push(word)
        }
      }
    }
  }

  if (currentLine) {
    lines.push(currentLine)
  }

  return lines.slice(0, 8) // Limit to 8 lines max for readability
}

/**
 * Parse markdown-style formatting in content
 * Supports **bold**, *italic*, #hashtags, @mentions
 */
function parseMarkdownContent(content: string): {
  text: string
  formatting: Array<{
    type: 'bold' | 'italic' | 'hashtag' | 'mention'
    start: number
    end: number
    originalText: string
  }>
} {
  const formatting: Array<{
    type: 'bold' | 'italic' | 'hashtag' | 'mention'
    start: number
    end: number
    originalText: string
  }> = []
  
  let parsedText = content
  let offset = 0

  // Parse **bold** text
  const boldRegex = /\*\*(.*?)\*\*/g
  let boldMatch
  while ((boldMatch = boldRegex.exec(content)) !== null) {
    const start = boldMatch.index - offset
    const end = start + boldMatch[1].length
    formatting.push({
      type: 'bold',
      start,
      end,
      originalText: boldMatch[1]
    })
    parsedText = parsedText.replace(boldMatch[0], boldMatch[1])
    offset += 4 // Remove ** at start and end
  }

  // Parse *italic* text
  const italicRegex = /\*(.*?)\*/g
  let italicMatch
  while ((italicMatch = italicRegex.exec(parsedText)) !== null) {
    const start = italicMatch.index
    const end = start + italicMatch[1].length
    formatting.push({
      type: 'italic',
      start,
      end,
      originalText: italicMatch[1]
    })
    parsedText = parsedText.replace(italicMatch[0], italicMatch[1])
  }

  // Parse #hashtags
  const hashtagRegex = /#(\w+)/g
  let hashtagMatch
  while ((hashtagMatch = hashtagRegex.exec(parsedText)) !== null) {
    formatting.push({
      type: 'hashtag',
      start: hashtagMatch.index,
      end: hashtagMatch.index + hashtagMatch[0].length,
      originalText: hashtagMatch[0]
    })
  }

  // Parse @mentions
  const mentionRegex = /@(\w+)/g
  let mentionMatch
  while ((mentionMatch = mentionRegex.exec(parsedText)) !== null) {
    formatting.push({
      type: 'mention',
      start: mentionMatch.index,
      end: mentionMatch.index + mentionMatch[0].length,
      originalText: mentionMatch[0]
    })
  }

  return { text: parsedText, formatting }
}

/**
 * Break text into lines that fit within the image width
 * Considers font size and available width
 */
function wrapText(text: string, maxWidth: number, fontSize: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  // Approximate character width (adjust based on font)
  const avgCharWidth = fontSize * 0.6

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    const estimatedWidth = testLine.length * avgCharWidth

    if (estimatedWidth <= maxWidth) {
      currentLine = testLine
    } else {
      if (currentLine) {
        lines.push(currentLine)
        currentLine = word
      } else {
        // Word is too long, break it
        lines.push(word)
      }
    }
  }

  if (currentLine) {
    lines.push(currentLine)
  }

  return lines
}

/**
 * Create SVG markup for slide content with proper XML escaping
 */
function createSlideSVG(slide: Slide, project?: CarouselProject): string {
  const centerX = INSTAGRAM_SPECS.SQUARE_SIZE / 2
  const centerY = INSTAGRAM_SPECS.SQUARE_SIZE / 2
  
  // Escape and wrap the content safely
  const safeContent = escapeXML(slide.content || '')
  const contentLines = wrapTextForSVG(safeContent, 35) // Shorter lines for better display
  const lineHeight = INSTAGRAM_SPECS.FONT_SIZES.content * 1.3
  
  // Calculate starting Y position to center the text block
  const totalTextHeight = contentLines.length * lineHeight
  const startY = centerY - (totalTextHeight / 2) + (lineHeight / 2)

  // Generate text lines
  const textLines = contentLines.map((line, index) => 
    `<tspan x="${centerX}" dy="${index === 0 ? 0 : lineHeight}">${escapeXML(line)}</tspan>`
  ).join('')

  // Safely escape template type
  const safeTemplateType = project?.template_type ? escapeXML(project.template_type) : ''

  return `<svg width="${INSTAGRAM_SPECS.SQUARE_SIZE}" height="${INSTAGRAM_SPECS.SQUARE_SIZE}" 
       xmlns="http://www.w3.org/2000/svg" 
       viewBox="0 0 ${INSTAGRAM_SPECS.SQUARE_SIZE} ${INSTAGRAM_SPECS.SQUARE_SIZE}"
       style="background-color: ${INSTAGRAM_SPECS.COLORS.background};">
  
  <!-- Background -->
  <rect x="0" y="0" 
        width="${INSTAGRAM_SPECS.SQUARE_SIZE}" 
        height="${INSTAGRAM_SPECS.SQUARE_SIZE}" 
        fill="${INSTAGRAM_SPECS.COLORS.background}" 
        stroke="none"/>
  
  <!-- Slide Number -->
  <text x="${INSTAGRAM_SPECS.SQUARE_SIZE - INSTAGRAM_SPECS.PADDING}" 
        y="${INSTAGRAM_SPECS.PADDING + 30}" 
        font-family="Arial, Helvetica, sans-serif" 
        font-size="${INSTAGRAM_SPECS.FONT_SIZES.slideNumber}" 
        font-weight="normal"
        fill="${INSTAGRAM_SPECS.COLORS.secondary}" 
        text-anchor="end"
        dominant-baseline="middle">${slide.slide_number}</text>
  
  <!-- Main Content -->
  <text x="${centerX}" 
        y="${startY}" 
        font-family="Arial, Helvetica, sans-serif" 
        font-size="${INSTAGRAM_SPECS.FONT_SIZES.content}" 
        font-weight="normal"
        fill="${INSTAGRAM_SPECS.COLORS.text}" 
        text-anchor="middle" 
        dominant-baseline="middle">
    ${textLines}
  </text>
  
  ${safeTemplateType ? `
  <!-- Template Type Badge -->
  <rect x="${INSTAGRAM_SPECS.PADDING - 10}" 
        y="${INSTAGRAM_SPECS.PADDING + 10}" 
        width="${safeTemplateType.length * 8 + 20}" 
        height="40" 
        rx="20" ry="20" 
        fill="${INSTAGRAM_SPECS.COLORS.hashtag}" 
        opacity="0.1"/>
  <text x="${INSTAGRAM_SPECS.PADDING}" 
        y="${INSTAGRAM_SPECS.PADDING + 30}" 
        font-family="Arial, Helvetica, sans-serif" 
        font-size="16" 
        font-weight="bold" 
        fill="${INSTAGRAM_SPECS.COLORS.hashtag}"
        dominant-baseline="middle">${safeTemplateType}</text>
  ` : ''}
  
</svg>`
}

/**
 * Generate a single slide image
 */
export async function generateSlideImage(
  slide: Slide,
  project?: CarouselProject
): Promise<SlideImageData> {
  try {
    const svgContent = createSlideSVG(slide, project)
    
    // Log SVG content for debugging (first 200 chars)
    console.log(`Generating image for slide ${slide.slide_number}:`, svgContent.substring(0, 200) + '...')
    
    // Validate that we have valid content
    if (!svgContent || svgContent.trim().length === 0) {
      throw new Error('Generated SVG content is empty')
    }
    
    const imageBuffer = await sharp(Buffer.from(svgContent))
      .png({ 
        quality: 95,
        compressionLevel: 6,
        progressive: true
      })
      .ensureAlpha() // Ensure proper alpha channel handling
      .toColorspace('srgb') // Ensure proper color space
      .toBuffer()

    const projectTitle = project?.title?.replace(/[^a-zA-Z0-9]/g, '_') || 'slide'
    const fileName = `${projectTitle}_slide_${slide.slide_number.toString().padStart(2, '0')}.png`

    console.log(`Successfully generated image for slide ${slide.slide_number}, size: ${imageBuffer.length} bytes`)

    return {
      slideId: slide.id,
      slideNumber: slide.slide_number,
      content: slide.content,
      imageBuffer,
      fileName
    }
  } catch (error) {
    console.error(`Error generating slide image for slide ${slide.slide_number}:`, error)
    console.error('Slide content:', slide.content)
    if (project) {
      console.error('Project title:', project.title)
      console.error('Template type:', project.template_type)
    }
    throw new Error(`Failed to generate image for slide ${slide.slide_number}: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Generate images for all slides in a carousel
 */
export async function generateCarouselImages(
  slides: Slide[],
  project?: CarouselProject
): Promise<SlideImageData[]> {
  const sortedSlides = slides.sort((a, b) => a.slide_number - b.slide_number)
  
  try {
    const results = await Promise.all(
      sortedSlides.map(slide => generateSlideImage(slide, project))
    )
    return results
  } catch (error) {
    console.error('Error generating carousel images:', error)
    throw new Error('Failed to generate carousel images')
  }
}

/**
 * Create a ZIP file containing all carousel slide images
 */
export async function createCarouselImageZip(
  slideImages: SlideImageData[]
): Promise<{ buffer: Buffer; fileName: string }> {
  // Note: We'll implement ZIP functionality in the next step
  // For now, this is a placeholder that returns the first image
  if (slideImages.length === 0) {
    throw new Error('No slide images to zip')
  }
  
  // TODO: Implement proper ZIP creation using 'archiver' package
  return {
    buffer: slideImages[0].imageBuffer,
    fileName: `carousel_images_${Date.now()}.zip`
  }
}

/**
 * Utility function to validate slide content for image generation
 */
export function validateSlideForImageGeneration(slide: Slide): {
  isValid: boolean
  issues: string[]
  warnings: string[]
} {
  const issues: string[] = []
  const warnings: string[] = []

  // Check content length
  if (!slide.content || slide.content.trim().length === 0) {
    issues.push('Slide content is empty')
  }

  if (slide.content && slide.content.length > INSTAGRAM_SPECS.MAX_CONTENT_LENGTH) {
    warnings.push(`Content exceeds Instagram limit (${slide.content.length}/${INSTAGRAM_SPECS.MAX_CONTENT_LENGTH} characters)`)
  }

  // Check for potential rendering issues
  const lineCount = slide.content?.split('\n').length || 0
  if (lineCount > 8) {
    warnings.push('Too many line breaks may affect readability')
  }

  // Check hashtag count
  const hashtagCount = slide.hashtags?.length || 0
  if (hashtagCount > 5) {
    warnings.push('Too many hashtags may clutter the image')
  }

  return {
    isValid: issues.length === 0,
    issues,
    warnings
  }
}

/**
 * Generate Instagram Stories format (9:16) from square slide
 * Note: This will be implemented in Phase 3 of the PRD
 */
export async function generateStoriesImage(
  slide: Slide,
  project?: CarouselProject,
  options: ImageGenerationOptions = {}
): Promise<SlideImageData> {
  // TODO: Implement Stories format (1080x1920px) in Phase 3
  throw new Error('Stories format generation not yet implemented - planned for Phase 3')
} 