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
 * Escape XML special characters for safe SVG content (preserve emojis)
 */
function escapeXML(text: string): string {
  if (!text) return ''
  
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u0084\u0086-\u009F]/g, '') // Remove control characters only
    // Emojis are preserved and should render properly in modern SVG viewers
}

/**
 * Parse and convert markdown formatting to clean text with formatting info
 */
function parseFormattedText(text: string): Array<{
  text: string
  bold: boolean
  italic: boolean
  isHashtag: boolean
}> {
  if (!text || typeof text !== 'string') return [{ text: '', bold: false, italic: false, isHashtag: false }]
  
  const segments: Array<{
    text: string
    bold: boolean
    italic: boolean
    isHashtag: boolean
  }> = []
  
  let processedText = text
  let currentPos = 0
  
  // Find all markdown patterns
  const boldRegex = /\*\*(.*?)\*\*/g
  const italicRegex = /\*([^*]+?)\*/g
  const hashtagRegex = /#(\w+)/g
  
  const allMatches: Array<{
    start: number
    end: number
    content: string
    type: 'bold' | 'italic' | 'hashtag'
  }> = []
  
  // Find bold matches
  let match: RegExpExecArray | null
  while ((match = boldRegex.exec(text)) !== null) {
    allMatches.push({
      start: match.index,
      end: match.index + match[0].length,
      content: match[1],
      type: 'bold'
    })
  }
  
  // Find italic matches (skip if inside bold)
  boldRegex.lastIndex = 0 // Reset regex
  while ((match = italicRegex.exec(text)) !== null) {
    const isInsideBold = allMatches.some(boldMatch => 
      boldMatch.type === 'bold' && 
      match!.index >= boldMatch.start && 
      match!.index + match![0].length <= boldMatch.end
    )
    if (!isInsideBold) {
      allMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        content: match[1],
        type: 'italic'
      })
    }
  }
  
  // Find hashtag matches
  while ((match = hashtagRegex.exec(text)) !== null) {
    allMatches.push({
      start: match.index,
      end: match.index + match[0].length,
      content: match[0], // Keep the # symbol
      type: 'hashtag'
    })
  }
  
  // Sort by position
  allMatches.sort((a, b) => a.start - b.start)
  
  // Build segments
  let pos = 0
  
  for (const match of allMatches) {
    // Add text before this match
    if (match.start > pos) {
      const beforeText = text.substring(pos, match.start)
      if (beforeText.trim()) {
        segments.push({
          text: escapeXML(beforeText),
          bold: false,
          italic: false,
          isHashtag: false
        })
      }
    }
    
    // Add the formatted text
    segments.push({
      text: escapeXML(match.content),
      bold: match.type === 'bold',
      italic: match.type === 'italic',
      isHashtag: match.type === 'hashtag'
    })
    
    pos = match.end
  }
  
  // Add remaining text
  if (pos < text.length) {
    const remainingText = text.substring(pos)
    if (remainingText.trim()) {
      segments.push({
        text: escapeXML(remainingText),
        bold: false,
        italic: false,
        isHashtag: false
      })
    }
  }
  
  // If no formatting found, return the whole text
  if (segments.length === 0) {
    segments.push({
      text: escapeXML(text),
      bold: false,
      italic: false,
      isHashtag: false
    })
  }
  
  return segments
}

/**
 * Break text into multiple lines for better SVG display
 */
function wrapTextForSVG(text: string, maxCharsPerLine: number = 35): string[] {
  if (!text || typeof text !== 'string') return ['']
  
  const words = text.trim().split(/\s+/)
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
        // Word is too long, break it
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

  // Limit to 6 lines max for better readability
  return lines.slice(0, 6)
}

/**
 * Generate SVG tspan elements with proper formatting
 */
function generateFormattedSVGText(segments: Array<{
  text: string
  bold: boolean
  italic: boolean
  isHashtag: boolean
}>, centerX: number, startY: number, lineHeight: number): string {
  
  if (segments.length === 0) return ''
  
  // For now, we'll combine all segments into lines and apply basic formatting
  // SVG has limited support for mixed formatting within a single text element
  const allText = segments.map(seg => seg.text).join('')
  const lines = wrapTextForSVG(allText, 30)
  
  const textLines = lines.map((line, index) => {
    const yPosition = startY + (index * lineHeight)
    return `<tspan x="${centerX}" y="${yPosition}">${escapeXML(line)}</tspan>`
  }).join('')
  
  return textLines
}

/**
 * Create SVG markup for slide content with proper formatting
 */
function createSlideSVG(slide: Slide, project?: CarouselProject): string {
  console.log(`Creating SVG for slide ${slide.slide_number}...`)
  
  // Validate inputs
  if (!slide) {
    throw new Error('Slide data is required')
  }
  
  if (!slide.content) {
    console.warn(`Slide ${slide.slide_number} has no content, using placeholder`)
  }
  
  const centerX = INSTAGRAM_SPECS.SQUARE_SIZE / 2
  const centerY = INSTAGRAM_SPECS.SQUARE_SIZE / 2
  
  // Process content with formatting
  const rawContent = slide.content || 'No content'
  console.log(`Processing content: "${rawContent.substring(0, 50)}..."`)
  
  // Parse formatted segments
  const formattedSegments = parseFormattedText(rawContent)
  console.log(`Formatted segments:`, formattedSegments.length)
  console.log('DEBUG segments:', formattedSegments.map(s => ({ 
    text: `"${s.text.substring(0, 20)}"`, 
    bold: s.bold, 
    italic: s.italic, 
    hashtag: s.isHashtag 
  })))
  
  // Create properly formatted text with actual bold/italic
  const processedContent = createFormattedSVGContent(formattedSegments, centerX, centerY)
  
  // Safely escape project data
  const safeTemplateType = project?.template_type ? escapeXML(project.template_type.toString()) : ''
  const slideNumberStr = slide.slide_number?.toString() || '1'

  // Create the SVG with improved structure
  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${INSTAGRAM_SPECS.SQUARE_SIZE}" height="${INSTAGRAM_SPECS.SQUARE_SIZE}" 
     xmlns="http://www.w3.org/2000/svg" 
     viewBox="0 0 ${INSTAGRAM_SPECS.SQUARE_SIZE} ${INSTAGRAM_SPECS.SQUARE_SIZE}">
  
  <!-- Background -->
  <rect x="0" y="0" 
        width="${INSTAGRAM_SPECS.SQUARE_SIZE}" 
        height="${INSTAGRAM_SPECS.SQUARE_SIZE}" 
        fill="${INSTAGRAM_SPECS.COLORS.background}"/>
  
  <!-- Slide Number -->
  <text x="${INSTAGRAM_SPECS.SQUARE_SIZE - INSTAGRAM_SPECS.PADDING}" 
        y="${INSTAGRAM_SPECS.PADDING + 30}" 
        font-family="Arial, sans-serif" 
        font-size="${INSTAGRAM_SPECS.FONT_SIZES.slideNumber}" 
        fill="${INSTAGRAM_SPECS.COLORS.secondary}" 
        text-anchor="end">${slideNumberStr}</text>
  
  <!-- Main Content with Formatting -->
  ${processedContent}
  
  ${safeTemplateType ? `
  <!-- Template Type Badge -->
  <rect x="${INSTAGRAM_SPECS.PADDING - 10}" 
        y="${INSTAGRAM_SPECS.PADDING - 10}" 
        width="${Math.max(safeTemplateType.length * 10 + 20, 80)}" 
        height="30" 
        rx="15" 
        fill="${INSTAGRAM_SPECS.COLORS.hashtag}" 
        opacity="0.1"/>
  <text x="${INSTAGRAM_SPECS.PADDING}" 
        y="${INSTAGRAM_SPECS.PADDING + 5}" 
        font-family="Arial, sans-serif" 
        font-size="14" 
        font-weight="bold" 
        fill="${INSTAGRAM_SPECS.COLORS.hashtag}">${safeTemplateType}</text>
  ` : ''}
  
</svg>`

  console.log(`✅ SVG created for slide ${slide.slide_number}, length: ${svgContent.length}`)
  return svgContent
}

/**
 * Get formatting properties for a text range
 */
function getFormattingForRange(
  start: number,
  end: number,
  formatRanges: Array<{
    start: number
    end: number
    bold: boolean
    italic: boolean
    isHashtag: boolean
  }>
): { bold: boolean; italic: boolean; isHashtag: boolean } {
  let bold = false
  let italic = false
  let isHashtag = false
  
  for (const range of formatRanges) {
    // Check if ranges overlap
    if (range.start < end && range.end > start) {
      if (range.bold) bold = true
      if (range.italic) italic = true
      if (range.isHashtag) isHashtag = true
    }
  }
  
  return { bold, italic, isHashtag }
}

/**
 * Create formatted SVG content with proper bold, italic, and hashtag styling
 */
function createFormattedSVGContent(
  segments: Array<{
    text: string
    bold: boolean
    italic: boolean
    isHashtag: boolean
  }>,
  centerX: number,
  centerY: number
): string {
  
  if (segments.length === 0) {
    return `<text x="${centerX}" y="${centerY}" font-family="Arial, sans-serif" font-size="${INSTAGRAM_SPECS.FONT_SIZES.content}" fill="${INSTAGRAM_SPECS.COLORS.text}" text-anchor="middle">No content</text>`
  }
  
  console.log('DEBUG: Creating SVG with segments:', segments.map(s => ({ text: s.text.substring(0, 20), bold: s.bold, italic: s.italic, hashtag: s.isHashtag })))
  
  // Better approach: Combine all segments into full text, then apply smart word-based wrapping
  // while preserving formatting information
  
  // First, rebuild the full text and track formatting positions
  let fullText = ''
  const formatRanges: Array<{
    start: number
    end: number
    bold: boolean
    italic: boolean
    isHashtag: boolean
  }> = []
  
  for (const segment of segments) {
    const startPos = fullText.length
    fullText += segment.text
    const endPos = fullText.length
    
    if (segment.bold || segment.italic || segment.isHashtag) {
      formatRanges.push({
        start: startPos,
        end: endPos,
        bold: segment.bold,
        italic: segment.italic,
        isHashtag: segment.isHashtag
      })
    }
  }
  
  // Smart word-based line wrapping
  const maxCharsPerLine = 40 // Increased for better balance
  const words = fullText.split(/(\s+)/) // Split on spaces but keep them
  const lines: Array<{
    text: string
    bold: boolean
    italic: boolean
    isHashtag: boolean
  }> = []
  
  let currentLine = ''
  let currentLineStart = 0
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i]
    if (!word) continue // Skip empty strings
    
    // Handle hashtags specially - they should start new lines
    if (word.trim().startsWith('#')) {
      // Finish current line if it has content
      if (currentLine.trim().length > 0) {
        const lineEnd = currentLineStart + currentLine.length
        const formatting = getFormattingForRange(currentLineStart, lineEnd, formatRanges)
        lines.push({
          text: currentLine.trim(),
          ...formatting
        })
      }
      
      // Add hashtag on its own line
      lines.push({
        text: word.trim(),
        bold: false,
        italic: false,
        isHashtag: true
      })
      
      // Reset for next line
      currentLine = ''
      currentLineStart = fullText.indexOf(word.trim(), currentLineStart) + word.trim().length
      continue
    }
    
    // Skip whitespace-only words unless they're needed for spacing
    if (word.match(/^\s+$/)) {
      // Add space to current line if it has content
      if (currentLine.length > 0) {
        currentLine += ' '
      }
      continue
    }
    
    // Test if adding this word would exceed the line limit
    const testLine = currentLine.length > 0 ? currentLine + ' ' + word : word
    
    if (testLine.length > maxCharsPerLine && currentLine.trim().length > 0) {
      // Finish current line
      const lineEnd = currentLineStart + currentLine.length
      const formatting = getFormattingForRange(currentLineStart, lineEnd, formatRanges)
      lines.push({
        text: currentLine.trim(),
        ...formatting
      })
      
      // Start new line with current word
      currentLine = word
      currentLineStart = fullText.indexOf(word, currentLineStart)
    } else {
      // Add word to current line
      currentLine = testLine
    }
  }
  
  // Add the last line
  if (currentLine.trim().length > 0) {
    const lineEnd = currentLineStart + currentLine.length
    const formatting = getFormattingForRange(currentLineStart, lineEnd, formatRanges)
    lines.push({
      text: currentLine.trim(),
      ...formatting
    })
  }
  
  // Limit to 6 lines max
  const limitedLines = lines.slice(0, 6)
  
  // Calculate positioning
  const lineHeight = 55
  const totalHeight = limitedLines.length * lineHeight
  const startY = centerY - (totalHeight / 2) + (lineHeight / 2)
  
  // Create SVG elements for each line with preserved formatting
  const svgElements: string[] = []
  
  limitedLines.forEach((line, lineIndex) => {
    const yPosition = startY + (lineIndex * lineHeight)
    
    // Apply formatting based on the line's properties
    let fontWeight = 'normal'
    let textColor = INSTAGRAM_SPECS.COLORS.text as string
    let fontSize = INSTAGRAM_SPECS.FONT_SIZES.content as number
    let fontStyle = 'normal'
    
    if (line.bold) {
      fontWeight = 'bold'
    }
    
    if (line.italic && !line.bold) {
      fontStyle = 'italic'
    }
    
    if (line.isHashtag) {
      textColor = INSTAGRAM_SPECS.COLORS.hashtag
      fontSize = INSTAGRAM_SPECS.FONT_SIZES.hashtag
    }
    
    console.log(`DEBUG: Line ${lineIndex + 1}: "${line.text.trim()}" - Bold: ${line.bold}, Italic: ${line.italic}, Hashtag: ${line.isHashtag}`)
    
    // OVERRIDE: If line contains only hashtags, force hashtag formatting
    if (line.text.trim().startsWith('#')) {
      line.bold = false
      line.italic = false
      line.isHashtag = true
    }
    
    svgElements.push(`
      <text x="${centerX}" y="${yPosition}" 
            font-family="Arial, sans-serif" 
            font-size="${line.isHashtag ? INSTAGRAM_SPECS.FONT_SIZES.hashtag : fontSize}" 
            font-weight="${line.isHashtag ? 'normal' : fontWeight}"
            font-style="${fontStyle}"
            fill="${line.isHashtag ? INSTAGRAM_SPECS.COLORS.hashtag : textColor}" 
            text-anchor="middle">${escapeXML(line.text.trim())}</text>
    `)
  })
  
  return svgElements.join('')
}

/**
 * Generate a single slide image with improved error handling
 */
export async function generateSlideImage(
  slide: Slide,
  project?: CarouselProject
): Promise<SlideImageData> {
  console.log(`🖼️ Generating image for slide ${slide.slide_number}...`)
  
  try {
    // Validate slide data
    if (!slide) {
      throw new Error('Slide data is required')
    }
    
    if (!slide.id) {
      throw new Error('Slide ID is required')
    }
    
    if (slide.slide_number === undefined || slide.slide_number === null) {
      throw new Error('Slide number is required')
    }
    
    // Create SVG content
    console.log(`Creating SVG for slide ${slide.slide_number}...`)
    const svgContent = createSlideSVG(slide, project)
    
    // Validate SVG content
    if (!svgContent || svgContent.trim().length === 0) {
      throw new Error('Generated SVG content is empty')
    }
    
    if (svgContent.length < 100) {
      throw new Error('Generated SVG content is too short, likely invalid')
    }
    
    console.log(`SVG validated, converting to PNG...`)
    
    // Convert SVG to PNG using Sharp
    const imageBuffer = await sharp(Buffer.from(svgContent))
      .png({ 
        quality: 95,
        compressionLevel: 6,
        progressive: false // Disable progressive for better compatibility
      })
      .ensureAlpha()
      .toColorspace('srgb')
      .toBuffer()

    // Generate safe filename
    const projectTitle = project?.title?.replace(/[^a-zA-Z0-9]/g, '_') || 'slide'
    const fileName = `${projectTitle}_slide_${slide.slide_number.toString().padStart(2, '0')}.png`

    console.log(`✅ Image generated successfully for slide ${slide.slide_number}`)
    console.log(`   File: ${fileName}`)
    console.log(`   Size: ${imageBuffer.length} bytes`)

    return {
      slideId: slide.id,
      slideNumber: slide.slide_number,
      content: slide.content || '',
      imageBuffer,
      fileName
    }
    
  } catch (error) {
    console.error(`❌ Error generating image for slide ${slide.slide_number}:`, error)
    console.error('Slide data:', {
      id: slide?.id,
      slide_number: slide?.slide_number,
      content_length: slide?.content?.length || 0,
      content_preview: slide?.content?.substring(0, 50) || 'N/A'
    })
    
    if (project) {
      console.error('Project data:', {
        title: project.title,
        template_type: project.template_type
      })
    }
    
    // Create a more specific error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Failed to generate image for slide ${slide.slide_number}: ${errorMessage}`)
  }
}

/**
 * Generate images for all slides in a carousel with improved error handling
 */
export async function generateCarouselImages(
  slides: Slide[],
  project?: CarouselProject
): Promise<SlideImageData[]> {
  console.log(`🎯 Generating images for ${slides.length} slides...`)
  
  if (!slides || slides.length === 0) {
    throw new Error('No slides provided for image generation')
  }
  
  // Validate all slides first
  for (const slide of slides) {
    if (!slide.id) {
      throw new Error(`Slide missing ID: ${JSON.stringify(slide)}`)
    }
    if (slide.slide_number === undefined) {
      throw new Error(`Slide missing slide_number: ${slide.id}`)
    }
  }
  
  const sortedSlides = slides.sort((a, b) => a.slide_number - b.slide_number)
  console.log(`Slides sorted, processing in order...`)
  
  try {
    // Generate images sequentially to avoid memory issues
    const results: SlideImageData[] = []
    
    for (let i = 0; i < sortedSlides.length; i++) {
      const slide = sortedSlides[i]
      console.log(`Processing slide ${i + 1}/${sortedSlides.length} (slide #${slide.slide_number})`)
      
      try {
        const result = await generateSlideImage(slide, project)
        results.push(result)
        console.log(`✅ Slide ${slide.slide_number} completed`)
      } catch (slideError) {
        console.error(`❌ Failed to generate slide ${slide.slide_number}:`, slideError)
        throw new Error(`Failed to generate slide ${slide.slide_number}: ${slideError instanceof Error ? slideError.message : 'Unknown error'}`)
      }
    }
    
    console.log(`🎉 All ${results.length} images generated successfully!`)
    return results
    
  } catch (error) {
    console.error('💥 Error generating carousel images:', error)
    throw new Error(`Failed to generate carousel images: ${error instanceof Error ? error.message : 'Unknown error'}`)
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