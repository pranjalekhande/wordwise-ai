/**
 * PDF Export Utility for Instagram Carousels
 */

import jsPDF from 'jspdf'
import type { CarouselProject } from './types'

export interface SlideImageData {
  slideId: string
  slideNumber: number
  content: string
  imageUrl?: string
  fileName: string
}

export interface PDFExportResult {
  success: boolean
  fileName: string
  error?: string
}

/**
 * Parse formatted text to identify bold, italic, and hashtag segments
 * Fixed version that properly removes markdown syntax
 */
function parseFormattedText(text: string): Array<{
  text: string
  bold: boolean
  italic: boolean
  isHashtag: boolean
}> {
  if (!text || typeof text !== 'string') {
    return [{ text: '', bold: false, italic: false, isHashtag: false }]
  }

  const segments: Array<{
    text: string
    bold: boolean
    italic: boolean
    isHashtag: boolean
  }> = []

  console.log('PDF: Parsing text:', text.substring(0, 50) + '...')

  // Enhanced regex to properly capture markdown patterns and hashtags
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|#\w+)/g
  let lastIndex = 0
  let match

  while ((match = regex.exec(text)) !== null) {
    // Add text before the match as regular text
    if (match.index > lastIndex) {
      const regularText = text.slice(lastIndex, match.index)
      if (regularText.trim()) {
        segments.push({
          text: regularText,
          bold: false,
          italic: false,
          isHashtag: false
        })
      }
    }

    const matchedText = match[0]
    
    if (matchedText.startsWith('**') && matchedText.endsWith('**') && matchedText.length > 4) {
      // Bold text - remove the ** markers
      const boldText = matchedText.slice(2, -2)
      console.log('PDF: Found bold text:', boldText)
      segments.push({
        text: boldText,
        bold: true,
        italic: false,
        isHashtag: false
      })
    } else if (matchedText.startsWith('*') && matchedText.endsWith('*') && matchedText.length > 2) {
      // Italic text - remove the * markers
      const italicText = matchedText.slice(1, -1)
      console.log('PDF: Found italic text:', italicText)
      segments.push({
        text: italicText,
        bold: false,
        italic: false, // Treat italic as normal in PDF for simplicity
        isHashtag: false
      })
    } else if (matchedText.startsWith('#') && /^#\w+/.test(matchedText)) {
      // Hashtag
      console.log('PDF: Found hashtag:', matchedText)
      segments.push({
        text: matchedText,
        bold: false,
        italic: false,
        isHashtag: true
      })
    }

    lastIndex = regex.lastIndex
  }

  // Add any remaining text after the last match
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex)
    if (remainingText.trim()) {
      segments.push({
        text: remainingText,
        bold: false,
        italic: false,
        isHashtag: false
      })
    }
  }

  // If no segments found, return the original text
  if (segments.length === 0) {
    return [{ text: text, bold: false, italic: false, isHashtag: false }]
  }

  console.log('PDF: Parsed segments:', segments.length, segments.map(s => ({ text: s.text.substring(0, 10), bold: s.bold, hashtag: s.isHashtag })))
  return segments
}

/**
 * Create well-formatted lines for PDF with proper spacing and formatting
 */
function createFormattedPDFLines(
  segments: Array<{
    text: string
    bold: boolean
    italic: boolean
    isHashtag: boolean
  }>
): Array<{
  text: string
  bold: boolean
  italic: boolean
  isHashtag: boolean
}> {
  if (segments.length === 0) {
    return [{ text: 'No content', bold: false, italic: false, isHashtag: false }]
  }

  console.log('PDF: Creating formatted lines from', segments.length, 'segments')

  // First, separate hashtags and put them on their own lines
  const lines: Array<{
    text: string
    bold: boolean
    italic: boolean
    isHashtag: boolean
  }> = []

  // Rebuild full text and track formatting positions
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

  console.log('PDF: Full text length:', fullText.length)
  console.log('PDF: Format ranges:', formatRanges.length)

  // Process text for hashtags first - extract them
  const hashtagRegex = /#\w+/g
  const hashtags: string[] = []
  let textWithoutHashtags = fullText

  let hashtagMatch
  while ((hashtagMatch = hashtagRegex.exec(fullText)) !== null) {
    hashtags.push(hashtagMatch[0])
    textWithoutHashtags = textWithoutHashtags.replace(hashtagMatch[0], '').trim()
  }

  console.log('PDF: Found hashtags:', hashtags)
  console.log('PDF: Text without hashtags:', textWithoutHashtags.substring(0, 50) + '...')

  // Smart word-based line wrapping for main text
  const maxCharsPerLine = 50 // Reasonable length for PDF
  
  if (textWithoutHashtags.trim()) {
    const words = textWithoutHashtags.trim().split(/\s+/) // Split by whitespace
    let currentLine = ''
    let currentLineStart = 0

    for (let i = 0; i < words.length; i++) {
      const word = words[i]
      if (!word) continue

      // Test if adding this word would exceed the line limit
      const testLine = currentLine ? currentLine + ' ' + word : word

      if (testLine.length > maxCharsPerLine && currentLine.length > 0) {
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
    if (currentLine.trim()) {
      const lineEnd = currentLineStart + currentLine.length
      const formatting = getFormattingForRange(currentLineStart, lineEnd, formatRanges)
      lines.push({
        text: currentLine.trim(),
        ...formatting
      })
    }
  }

  // Add hashtags as separate lines
  hashtags.forEach(hashtag => {
    lines.push({
      text: hashtag,
      bold: false,
      italic: false,
      isHashtag: true
    })
  })

  console.log('PDF: Created', lines.length, 'lines')
  console.log('PDF: Lines preview:', lines.map(l => l.text.substring(0, 20)))

  return lines.slice(0, 8) // Limit to 8 lines for PDF readability
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
 * Generate PDF from carousel slides (returns buffer for server-side use)
 */
export async function generateCarouselPDF(
  slideImages: SlideImageData[],
  project: CarouselProject
): Promise<PDFExportResult & { buffer?: Buffer }> {
  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    // Set metadata
    pdf.setProperties({
      title: project.title,
      subject: 'Instagram Carousel',
      author: 'WordWise AI'
    })

    // Add cover page
    addCoverPage(pdf, project)

    // Add slide pages
    for (let i = 0; i < slideImages.length; i++) {
      pdf.addPage()
      await addSlidePage(pdf, slideImages[i])
    }

    const fileName = `${project.title.replace(/[^a-zA-Z0-9]/g, '_')}_carousel.pdf`
    
    // Generate buffer for server-side use
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))

    return { 
      success: true, 
      fileName,
      buffer: pdfBuffer
    }
  } catch (error) {
    return {
      success: false,
      fileName: '',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Generate PDF from carousel slides (for client-side download)
 */
export async function generateAndDownloadCarouselPDF(
  slideImages: SlideImageData[],
  project: CarouselProject
): Promise<PDFExportResult> {
  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    // Set metadata
    pdf.setProperties({
      title: project.title,
      subject: 'Instagram Carousel',
      author: 'WordWise AI'
    })

    // Add cover page
    addCoverPage(pdf, project)

    // Add slide pages
    for (let i = 0; i < slideImages.length; i++) {
      pdf.addPage()
      await addSlidePage(pdf, slideImages[i])
    }

    const fileName = `${project.title.replace(/[^a-zA-Z0-9]/g, '_')}_carousel.pdf`
    
    // Save directly (client-side only)
    pdf.save(fileName)

    return { success: true, fileName }
  } catch (error) {
    return {
      success: false,
      fileName: '',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Add cover page
 */
function addCoverPage(pdf: jsPDF, project: CarouselProject): void {
  const pageWidth = pdf.internal.pageSize.getWidth()
  
  pdf.setFontSize(24)
  pdf.setFont('helvetica', 'bold')
  pdf.text(project.title, 20, 40)
  
  if (project.template_type) {
    pdf.setFontSize(12)
    pdf.text(`Template: ${project.template_type}`, 20, 60)
  }
  
  pdf.setFontSize(10)
  pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 280)
}

/**
 * Add slide page with only Instagram preview image (no duplicate text)
 */
async function addSlidePage(pdf: jsPDF, slide: SlideImageData): Promise<void> {
  const pageWidth = pdf.internal.pageSize.getWidth()
  
  // Slide header
  pdf.setFontSize(16)
  pdf.setFont('helvetica', 'bold')
  pdf.text(`Slide ${slide.slideNumber}`, 20, 30)
  
  // Add image if available (this is the formatted Instagram preview)
  if (slide.imageUrl) {
    try {
      // Make image larger and center it better
      const imageSize = 150  // Increased from 120
      const imageX = (pageWidth - imageSize) / 2
      const imageY = 50
      pdf.addImage(slide.imageUrl, 'PNG', imageX, imageY, imageSize, imageSize)
    } catch (error) {
      console.warn('Failed to add image to PDF:', error)
      // If image fails, show a message instead of content
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(150, 150, 150)
      pdf.text('Instagram preview image not available', 20, 100)
    }
  } else {
    // If no image available, show a message
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(150, 150, 150)
    pdf.text('Instagram preview image not generated', 20, 100)
  }
  
  // Reset text color for next page
  pdf.setTextColor(0, 0, 0)
}

/**
 * Export carousel as text-based PDF with enhanced formatting (returns buffer for server-side use)
 */
export async function generateTextOnlyPDF(
  slides: any[],
  project: CarouselProject
): Promise<PDFExportResult & { buffer?: Buffer }> {
  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    // Set metadata
    pdf.setProperties({
      title: project.title,
      subject: 'Instagram Carousel Content',
      author: 'WordWise AI'
    })

    // Add title page
    const pageWidth = pdf.internal.pageSize.getWidth()
    
    pdf.setFontSize(20)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(0, 0, 0)
    const titleLines = pdf.splitTextToSize(project.title, pageWidth - 40)
    pdf.text(titleLines, 20, 30)
    
    // Add slides content with enhanced formatting
    let currentY = 60
    const pageHeight = pdf.internal.pageSize.getHeight()
    const lineHeight = 8
    
    slides.forEach((slide, index) => {
      // Check if we need a new page (with extra space for formatting)
      if (currentY > pageHeight - 80) {
        pdf.addPage()
        currentY = 30
      }
      
      // Slide header
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(0, 0, 0)
      pdf.text(`Slide ${slide.slide_number || index + 1}`, 20, currentY)
      currentY += 15
      
      // Parse and format slide content
      const segments = parseFormattedText(slide.content || '')
      const formattedLines = createFormattedPDFLines(segments)
      
      // Render each line with appropriate formatting
      formattedLines.forEach((line) => {
        // Check if we need a new page
        if (currentY > pageHeight - 30) {
          pdf.addPage()
          currentY = 30
        }
        
        if (line.isHashtag) {
          // Hashtag formatting - blue color, slightly larger
          pdf.setFontSize(11)
          pdf.setFont('helvetica', 'normal')
          pdf.setTextColor(0, 123, 255) // Blue color for hashtags
          pdf.text(line.text, 20, currentY)
        } else if (line.bold) {
          // Bold text formatting
          pdf.setFontSize(12)
          pdf.setFont('helvetica', 'bold')
          pdf.setTextColor(0, 0, 0) // Black color
          pdf.text(line.text, 20, currentY)
        } else {
          // Normal text formatting
          pdf.setFontSize(12)
          pdf.setFont('helvetica', 'normal')
          pdf.setTextColor(0, 0, 0) // Black color
          pdf.text(line.text, 20, currentY)
        }
        
        currentY += lineHeight
      })
      
      // Add extra space between slides
      currentY += 15
    })

    // Reset text color
    pdf.setTextColor(0, 0, 0)

    const fileName = `${project.title.replace(/[^a-zA-Z0-9]/g, '_')}_content.pdf`
    
    // Generate buffer for server-side use
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))

    return { 
      success: true, 
      fileName,
      buffer: pdfBuffer
    }
  } catch (error) {
    console.error('Text PDF generation failed:', error)
    return {
      success: false,
      fileName: '',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Export carousel as text-based PDF with enhanced formatting (for client-side download)
 */
export async function generateAndDownloadTextOnlyPDF(
  slides: any[],
  project: CarouselProject
): Promise<PDFExportResult> {
  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    // Set metadata
    pdf.setProperties({
      title: project.title,
      subject: 'Instagram Carousel Content',
      author: 'WordWise AI'
    })

    // Add title page
    const pageWidth = pdf.internal.pageSize.getWidth()
    
    pdf.setFontSize(20)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(0, 0, 0)
    const titleLines = pdf.splitTextToSize(project.title, pageWidth - 40)
    pdf.text(titleLines, 20, 30)
    
    // Add slides content with enhanced formatting
    let currentY = 60
    const pageHeight = pdf.internal.pageSize.getHeight()
    const lineHeight = 8
    
    slides.forEach((slide, index) => {
      // Check if we need a new page (with extra space for formatting)
      if (currentY > pageHeight - 80) {
        pdf.addPage()
        currentY = 30
      }
      
      // Slide header
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(0, 0, 0)
      pdf.text(`Slide ${slide.slide_number || index + 1}`, 20, currentY)
      currentY += 15
      
      // Parse and format slide content
      const segments = parseFormattedText(slide.content || '')
      const formattedLines = createFormattedPDFLines(segments)
      
      // Render each line with appropriate formatting
      formattedLines.forEach((line) => {
        // Check if we need a new page
        if (currentY > pageHeight - 30) {
          pdf.addPage()
          currentY = 30
        }
        
        if (line.isHashtag) {
          // Hashtag formatting - blue color, slightly larger
          pdf.setFontSize(11)
          pdf.setFont('helvetica', 'normal')
          pdf.setTextColor(0, 123, 255) // Blue color for hashtags
          pdf.text(line.text, 20, currentY)
        } else if (line.bold) {
          // Bold text formatting
          pdf.setFontSize(12)
          pdf.setFont('helvetica', 'bold')
          pdf.setTextColor(0, 0, 0) // Black color
          pdf.text(line.text, 20, currentY)
        } else {
          // Normal text formatting
          pdf.setFontSize(12)
          pdf.setFont('helvetica', 'normal')
          pdf.setTextColor(0, 0, 0) // Black color
          pdf.text(line.text, 20, currentY)
        }
        
        currentY += lineHeight
      })
      
      // Add extra space between slides
      currentY += 15
    })

    // Reset text color
    pdf.setTextColor(0, 0, 0)

    const fileName = `${project.title.replace(/[^a-zA-Z0-9]/g, '_')}_content.pdf`
    pdf.save(fileName)

    return { success: true, fileName }
  } catch (error) {
    console.error('Text PDF generation failed:', error)
    return {
      success: false,
      fileName: '',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
} 