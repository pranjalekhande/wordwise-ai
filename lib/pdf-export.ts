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
 * Generate PDF from carousel slides
 */
export async function generateCarouselPDF(
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
 * Add slide page
 */
async function addSlidePage(pdf: jsPDF, slide: SlideImageData): Promise<void> {
  const pageWidth = pdf.internal.pageSize.getWidth()
  
  // Slide header
  pdf.setFontSize(16)
  pdf.setFont('helvetica', 'bold')
  pdf.text(`Slide ${slide.slideNumber}`, 20, 30)
  
  // Add image if available
  if (slide.imageUrl) {
    try {
      const imageSize = 120
      const imageX = (pageWidth - imageSize) / 2
      pdf.addImage(slide.imageUrl, 'PNG', imageX, 50, imageSize, imageSize)
    } catch (error) {
      console.warn('Failed to add image to PDF:', error)
    }
  }
  
  // Add content text
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'normal')
  const lines = pdf.splitTextToSize(slide.content, pageWidth - 40)
  pdf.text(lines, 20, slide.imageUrl ? 190 : 60)
}

/**
 * Export carousel as text-based PDF (fallback when images aren't available)
 */
export async function generateTextOnlyPDF(
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
    const titleLines = pdf.splitTextToSize(project.title, pageWidth - 40)
    pdf.text(titleLines, 20, 30)
    
    // Add slides content
    let currentY = 60
    const pageHeight = pdf.internal.pageSize.getHeight()
    
    slides.forEach((slide, index) => {
      // Check if we need a new page
      if (currentY > pageHeight - 60) {
        pdf.addPage()
        currentY = 30
      }
      
      // Slide header
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.text(`Slide ${slide.slide_number || index + 1}`, 20, currentY)
      currentY += 15
      
      // Slide content
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'normal')
      const contentLines = pdf.splitTextToSize(slide.content, pageWidth - 40)
      pdf.text(contentLines, 20, currentY)
      currentY += (contentLines.length * 6) + 20
    })

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