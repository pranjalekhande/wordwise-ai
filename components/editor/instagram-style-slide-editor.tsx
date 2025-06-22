"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronLeft, ChevronRight, Plus, Trash2, Copy, Eye, EyeOff, Instagram, Download, Loader2, Share, FileText, File } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useAppStore } from "@/lib/store"
import { calculateReadabilityScore, generateId } from "@/lib/utils"
import { GrammarSidebar } from "@/components/editor/grammar-sidebar"
import { GrammarStatusIndicator } from "@/components/editor/grammar-status-indicator"
import { InstagramSquarePreview } from "@/components/editor/instagram-square-preview"
import { FormattingToolbar } from "@/components/editor/formatting-toolbar"
import { AiStyleSuggestions } from "@/components/editor/ai-style-suggestions"
import { SharingModal } from "@/components/editor/sharing-modal"
import { shareCarouselToInstagram, copyCarouselToClipboard, showCaptionForManualCopy, type SlideImageData } from "@/lib/instagram-sharing"
import type { Slide, StyleSuggestion } from "@/lib/types"

interface InstagramStyleSlideEditorProps {
  projectId: string
}

export function InstagramStyleSlideEditor({ projectId }: InstagramStyleSlideEditorProps) {
  const {
    slides,
    currentSlide,
    currentProject,
    isAutoSaving,
    lastSaved,
    setCurrentSlide,
    addSlide,
    updateSlide,
    deleteSlide,
    setAutoSaving,
    setLastSaved,
  } = useAppStore()

  const [content, setContent] = useState("")
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [grammarIssuesCount, setGrammarIssuesCount] = useState(0)
  const [showPreview, setShowPreview] = useState(true)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [isDownloadingImages, setIsDownloadingImages] = useState(false)
  const [isSharingToInstagram, setIsSharingToInstagram] = useState(false)
  const [isExportingPDF, setIsExportingPDF] = useState(false)
  const [sharingModalOpen, setSharingModalOpen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (currentSlide) {
      setContent(currentSlide.content)
    }
  }, [currentSlide])

  useEffect(() => {
    if (slides.length > 0 && currentSlideIndex < slides.length) {
      setCurrentSlide(slides[currentSlideIndex])
    }
  }, [currentSlideIndex, slides, setCurrentSlide])

  const handleContentChange = async (value: string) => {
    setContent(value)

    if (currentSlide) {
      const updatedSlide = {
        ...currentSlide,
        content: value,
        char_count: value.length,
        updated_at: new Date().toISOString(),
      }

      updateSlide(currentSlide.id, updatedSlide)

      // Auto-save to database
      setAutoSaving(true)
      try {
        await fetch(`/api/slides/${currentSlide.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: value,
            tone: currentSlide.tone,
          }),
        })
        setLastSaved(new Date())
      } catch (error) {
        console.error("Auto-save failed:", error)
      } finally {
        setAutoSaving(false)
      }
    }
  }

  const handleFormatText = (format: string, value?: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)
    
    let newContent = content
    let newCursorPos = start

    switch (format) {
      case "bold":
        if (selectedText) {
          newContent = content.substring(0, start) + `**${selectedText}**` + content.substring(end)
          newCursorPos = end + 4
        } else {
          newContent = content.substring(0, start) + "****" + content.substring(end)
          newCursorPos = start + 2
        }
        break
        
      case "italic":
        if (selectedText) {
          newContent = content.substring(0, start) + `*${selectedText}*` + content.substring(end)
          newCursorPos = end + 2
        } else {
          newContent = content.substring(0, start) + "**" + content.substring(end)
          newCursorPos = start + 1
        }
        break
        
      case "hashtag":
        const hashtag = selectedText || "hashtag"
        newContent = content.substring(0, start) + `#${hashtag}` + content.substring(end)
        newCursorPos = start + hashtag.length + 1
        break
        
      case "mention":
        const mention = selectedText || "username"
        newContent = content.substring(0, start) + `@${mention}` + content.substring(end)
        newCursorPos = start + mention.length + 1
        break
        
      case "insert":
        if (value) {
          newContent = content.substring(0, start) + value + content.substring(end)
          newCursorPos = start + value.length
        }
        break
    }

    handleContentChange(newContent)
    
    // Restore cursor position
    setTimeout(() => {
      if (textarea) {
        textarea.focus()
        textarea.setSelectionRange(newCursorPos, newCursorPos)
      }
    }, 0)
  }

  const handleApplyStyleSuggestion = (suggestion: StyleSuggestion) => {
    const textarea = textareaRef.current
    if (!textarea) return

    // Different handling based on suggestion type
    switch (suggestion.type) {
      case "emphasis":
        // Replace original text with suggestion
        const newContent = content.replace(suggestion.original, suggestion.suggestion)
        handleContentChange(newContent)
        break
        
      case "hashtag":
      case "emoji":
      case "mention":
        // Add at the end of content with spacing
        const spacing = content.trim().endsWith('.') || content.trim().endsWith('!') || content.trim().endsWith('?') ? ' ' : ' '
        handleContentChange(content.trim() + spacing + suggestion.suggestion)
        break
        
      case "structure":
        // Replace the entire content for structure changes
        handleContentChange(suggestion.suggestion)
        break
        
      default:
        // Fallback: replace original with suggestion
        if (suggestion.original && content.includes(suggestion.original)) {
          const newContent = content.replace(suggestion.original, suggestion.suggestion)
          handleContentChange(newContent)
        } else {
          // Add at end if original text not found
          handleContentChange(content.trim() + ' ' + suggestion.suggestion)
        }
    }
  }

  const addNewSlide = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/slides`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slide_number: slides.length + 1,
          content: "",
        }),
      })

      if (response.ok) {
        const { slide } = await response.json()
        addSlide(slide)
        setCurrentSlideIndex(slides.length)
      }
    } catch (error) {
      console.error("Error creating slide:", error)
    }
  }

  const duplicateSlide = () => {
    if (currentSlide) {
      const duplicatedSlide: Slide = {
        ...currentSlide,
        id: generateId(),
        slide_number: slides.length + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      addSlide(duplicatedSlide)
      setCurrentSlideIndex(slides.length)
    }
  }

  const deleteCurrentSlide = async () => {
    if (currentSlide && slides.length > 1) {
      // Delete from database
      try {
        await fetch(`/api/slides/${currentSlide.id}`, {
          method: "DELETE",
        })
      } catch (error) {
        console.error("Error deleting slide:", error)
      }
      
      // Update local state
      deleteSlide(currentSlide.id)
      const newIndex = Math.max(0, currentSlideIndex - 1)
      setCurrentSlideIndex(newIndex)
    }
  }

  const handleGrammarStatusChange = (issuesCount: number) => {
    setGrammarIssuesCount(issuesCount)
  }

  const handleDownloadImages = async () => {
    if (!currentProject || slides.length === 0) return

    setIsDownloadingImages(true)
    console.log(`🚀 Starting download of ${slides.length} images...`)
    
    try {
      // Step 1: Generate images via API
      console.log('Step 1: Generating images via API...')
      const response = await fetch(`/api/projects/${projectId}/export-images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format: 'png',
          includeZip: false
        })
      })

      console.log('API Response status:', response.status)

      if (!response.ok) {
        let errorData: any = {}
        try {
          errorData = await response.json()
          console.error('API Error Response:', errorData)
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError)
        }
        
        const errorMessage = errorData.details || errorData.error || `API request failed with status ${response.status}`
        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log('API Response data:', {
        success: data.success,
        imagesCount: data.images?.length || 0,
        projectTitle: data.projectTitle
      })
      
      if (!data.success) {
        throw new Error(data.error || 'API returned unsuccessful response')
      }

      if (!data.images || data.images.length === 0) {
        throw new Error('No images were generated by the API')
      }

      console.log(`✅ Generated ${data.images.length} images, starting downloads...`)
        
      // Step 2: Download each image
      let downloadedCount = 0
      for (let i = 0; i < data.images.length; i++) {
        const imageData = data.images[i]
        
        try {
          console.log(`Downloading ${i + 1}/${data.images.length}: ${imageData.fileName}`)
          
          const link = document.createElement('a')
          link.href = imageData.imageUrl
          link.download = imageData.fileName
          link.style.display = 'none'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          
          downloadedCount++
          console.log(`✅ Downloaded: ${imageData.fileName}`)
          
          // Small delay between downloads to prevent browser blocking
          if (i < data.images.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100))
          }
        } catch (downloadError) {
          console.error(`❌ Failed to download ${imageData.fileName}:`, downloadError)
          // Continue with other downloads even if one fails
        }
      }
      
      console.log(`🎉 Download completed: ${downloadedCount}/${data.images.length} images`)
      
      if (downloadedCount > 0) {
        const message = downloadedCount === data.images.length 
          ? `Successfully downloaded all ${downloadedCount} images!`
          : `Downloaded ${downloadedCount} out of ${data.images.length} images. Some downloads may have failed.`
        alert(message)
      } else {
        throw new Error('Failed to download any images')
      }
        
    } catch (error) {
      console.error('💥 Download process failed:', error)
      
      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      const userMessage = errorMessage.includes('Authentication') 
        ? 'Please sign in to download images'
        : errorMessage.includes('Project not found')
        ? 'Project not found. Please refresh the page and try again.'
        : errorMessage.includes('No slides found')
        ? 'No slides found to export. Please add some content first.'
        : `Failed to download images: ${errorMessage}`
      
      alert(userMessage)
    } finally {
      setIsDownloadingImages(false)
    }
  }

  const handleShareToInstagram = async () => {
    if (!currentProject || slides.length === 0) return

    setIsSharingToInstagram(true)
    try {
      console.log(`Preparing to share ${slides.length} slides to Instagram...`)
      
      // Generate images using API endpoint (server-side Sharp processing)
      const response = await fetch(`/api/projects/${projectId}/export-images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format: 'png',
          includeZip: false
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to generate images for sharing')
      }

      const data = await response.json()
      
      if (!data.success || !data.images || data.images.length === 0) {
        throw new Error('No images were generated for sharing')
      }

      // Convert API response to SlideImageData format
      const slideImages: SlideImageData[] = data.images.map((img: any) => ({
        slideId: img.slideId,
        slideNumber: img.slideNumber,
        content: img.content,
        imageBuffer: null, // We'll use the imageUrl instead
        fileName: img.fileName,
        imageUrl: img.imageUrl // Add the base64 data URL
      }))

      // Share to Instagram
      const result = await shareCarouselToInstagram(slideImages, currentProject, {
        useCarouselCaption: true,
        hashtags: currentProject.template_type ? [`#${currentProject.template_type.toLowerCase()}`] : []
      })

      if (result.success) {
        console.log(`✅ Successfully initiated Instagram sharing (${result.shareMethod})`)
        
        // Show success message with instructions
        const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        
        let message: string
        if (isMobile) {
          message = "Opening Instagram app... If the app doesn't open, it will redirect to Instagram web."
        } else {
          // Desktop with clipboard feedback
          if (result.captionCopied) {
            message = "Instagram opened in new tab! Caption copied to clipboard - paste it when uploading your images."
          } else {
            message = "Instagram opened in new tab! ⚠️ Couldn't copy caption automatically - you may need to copy it manually."
          }
        }
        
        alert(message)
      } else {
        throw new Error(result.error || 'Sharing failed')
      }
    } catch (error) {
      console.error('Instagram sharing failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`Failed to share to Instagram: ${errorMessage}`)
    } finally {
      setIsSharingToInstagram(false)
    }
  }

  const handleCopyCaption = async () => {
    if (!currentProject || slides.length === 0) return

    try {
      const slideImages: SlideImageData[] = slides.map(slide => ({
        slideId: slide.id,
        slideNumber: slide.slide_number,
        content: slide.content,
        fileName: `slide_${slide.slide_number}.png`
      }))

      const copySuccess = await copyCarouselToClipboard(slideImages, currentProject, {
        useCarouselCaption: true,
        hashtags: currentProject.template_type ? [`#${currentProject.template_type.toLowerCase()}`] : []
      })

      if (copySuccess) {
        alert('✅ Caption copied to clipboard!')
      } else {
        // Show manual copy dialog as fallback
        showCaptionForManualCopy(slideImages, currentProject, {
          useCarouselCaption: true,
          hashtags: currentProject.template_type ? [`#${currentProject.template_type.toLowerCase()}`] : []
        })
      }
    } catch (error) {
      console.error('Copy caption failed:', error)
      alert('Failed to copy caption. Please try again.')
    }
  }

  const handleExportPDF = async () => {
    if (!currentProject || slides.length === 0) return

    setIsExportingPDF(true)
    console.log(`🚀 Starting PDF export for ${slides.length} slides...`)
    
    try {
      // Step 1: Test jsPDF import
      console.log('Step 1: Importing jsPDF...')
      let jsPDF: any
      try {
        const jsPDFModule = await import('jspdf')
        jsPDF = jsPDFModule.default
        console.log('✅ jsPDF imported successfully')
      } catch (importError) {
        console.error('❌ Failed to import jsPDF:', importError)
        throw new Error('Failed to load PDF library. Please refresh the page and try again.')
      }
      
      // Step 2: Test basic PDF creation
      console.log('Step 2: Testing basic PDF creation...')
      try {
        const testPdf = new jsPDF()
        testPdf.text('Test PDF', 10, 10)
        console.log('✅ Basic PDF creation works')
      } catch (pdfError) {
        console.error('❌ PDF creation test failed:', pdfError)
        throw new Error('PDF library initialization failed. Please try again.')
      }
      
      // Step 3: Generate images
      console.log('Step 3: Generating images via API...')
      let response: Response
      try {
        response = await fetch(`/api/projects/${projectId}/export-images`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            format: 'png',
            includeZip: false
          })
        })
        console.log('API Response status:', response.status)
      } catch (fetchError) {
        console.error('❌ API request failed:', fetchError)
        throw new Error('Failed to connect to image generation service. Please check your internet connection.')
      }

      if (!response.ok) {
        let errorData: any = {}
        try {
          errorData = await response.json()
          console.error('API Error Response:', errorData)
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError)
        }
        
        const errorMessage = errorData.details || errorData.error || `Image generation failed (${response.status})`
        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log('API Response:', {
        success: data.success,
        imagesCount: data.images?.length || 0
      })
      
      if (!data.success || !data.images || data.images.length === 0) {
        throw new Error('No images were generated for PDF export')
      }

      console.log(`✅ Generated ${data.images.length} images`)

      // Step 4: Create PDF
      console.log('Step 4: Creating PDF document...')
      let pdf: any
      let pageWidth: number
      try {
        pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        })

        // Set metadata
        pdf.setProperties({
          title: currentProject.title,
          subject: 'Instagram Carousel',
          author: 'WordWise AI'
        })
        
        // Get page width for use in multiple sections
        pageWidth = pdf.internal.pageSize.getWidth()
        console.log('✅ PDF initialized with metadata')
      } catch (pdfInitError) {
        console.error('❌ PDF initialization failed:', pdfInitError)
        throw new Error('Failed to initialize PDF document')
      }

      // Step 5: Add cover page
      console.log('Step 5: Adding cover page...')
      try {
        pdf.setFontSize(24)
        pdf.setFont('helvetica', 'bold')
        const titleText = currentProject.title || 'Instagram Carousel'
        const projectTitleLines = pdf.splitTextToSize(titleText, pageWidth - 40)
        pdf.text(projectTitleLines, 20, 40)
        
        if (currentProject.template_type) {
          pdf.setFontSize(12)
          pdf.text(`Template: ${currentProject.template_type}`, 20, 60)
        }
        
        pdf.setFontSize(10)
        pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 280)
        
        console.log('✅ Cover page added')
      } catch (coverError) {
        console.error('❌ Cover page creation failed:', coverError)
        throw new Error('Failed to create PDF cover page')
      }

      // Step 6: Add slide pages (text-only for reliability)
      console.log('Step 6: Adding slide pages...')
      const maxSlides = Math.min(data.images.length, 10) // Limit to 10 slides for performance
      
      for (let i = 0; i < maxSlides; i++) {
        const imageData = data.images[i]
        console.log(`Adding slide ${i + 1}/${maxSlides}...`)
        
        try {
          pdf.addPage()
          
          // Slide header
          pdf.setFontSize(16)
          pdf.setFont('helvetica', 'bold')
          pdf.text(`Slide ${imageData.slideNumber || i + 1}`, 20, 30)
          
          // Add slide content as text
          pdf.setFontSize(12)
          pdf.setFont('helvetica', 'normal')
          
          // Get the original slide content (not the truncated version)
          const originalSlide = slides.find(s => s.slide_number === imageData.slideNumber)
          const slideContent = originalSlide?.content || imageData.content || 'No content'
          
          // Clean and prepare text for PDF
          const cleanContent = slideContent
            .replace(/[^\x00-\x7F]/g, '') // Remove non-ASCII characters
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim()
          
          const contentLines = pdf.splitTextToSize(cleanContent, pageWidth - 40)
          pdf.text(contentLines, 20, 50)
          
          console.log(`✅ Slide ${i + 1} added`)
        } catch (slideError) {
          console.error(`❌ Failed to add slide ${i + 1}:`, slideError)
          // Continue with other slides
        }
      }

      // Step 7: Save PDF
      console.log('Step 7: Saving PDF...')
      try {
        const fileName = `${(currentProject.title || 'carousel').replace(/[^a-zA-Z0-9]/g, '_')}_export.pdf`
        pdf.save(fileName)
        console.log(`✅ PDF saved successfully: ${fileName}`)
        alert(`✅ PDF "${fileName}" exported successfully!\n\nContains ${maxSlides} slides with text content.`)
      } catch (saveError) {
        console.error('❌ Failed to save PDF:', saveError)
        throw new Error('Failed to save PDF file. Your browser may have blocked the download.')
      }
      
    } catch (error) {
      console.error('💥 PDF export failed:', error)
      
      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      const userMessage = errorMessage.includes('Authentication') 
        ? 'Please sign in to export PDF'
        : errorMessage.includes('Project not found')
        ? 'Project not found. Please refresh the page and try again.'
        : errorMessage.includes('No slides found')
        ? 'No slides found to export. Please add some content first.'
        : errorMessage.includes('PDF library')
        ? 'PDF export is not available in your browser. Please try a different browser.'
        : `PDF export failed: ${errorMessage}`
      
      alert(`❌ Export Failed\n\n${userMessage}\n\nTip: Try the "Download Images" option as an alternative.`)
    } finally {
      setIsExportingPDF(false)
    }
  }

  // Get template type from current project
  const templateType = (currentProject?.template_type as "NEWS" | "STORY" | "PRODUCT") || "PRODUCT"

  // Safe Instagram Preview component
  const SafeInstagramPreview = ({ content, slideNumber, totalSlides }: { 
    content: string; 
    slideNumber: number; 
    totalSlides: number 
  }) => {
    try {
      return (
        <InstagramSquarePreview
          content={content}
          slideNumber={slideNumber}
          totalSlides={totalSlides}
        />
      )
    } catch (error) {
      console.error('Instagram preview error:', error)
      return (
        <div className="flex flex-col items-center space-y-4">
          <div className="text-sm text-muted-foreground font-medium">
            Instagram Preview
          </div>
          <div className="relative w-80 h-80 bg-white border-2 border-gray-200 shadow-lg overflow-hidden rounded-lg">
            <div className="h-full flex items-center justify-center p-6">
              <div className="text-center w-full">
                <div className="text-gray-400 text-sm mb-2">
                  Preview temporarily unavailable
                </div>
                <div className="text-xs text-gray-300">
                  Content: {content.substring(0, 50)}{content.length > 50 ? '...' : ''}
                </div>
              </div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            {content?.length || 0} characters
          </div>
        </div>
      )
    }
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header Navigation - Minimalistic */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
              disabled={currentSlideIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                Image {currentSlideIndex + 1} of {slides.length}
              </span>
              <GrammarStatusIndicator 
                issueCount={grammarIssuesCount}
                size="sm"
                showCount={grammarIssuesCount > 0}
              />
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentSlideIndex(Math.min(slides.length - 1, currentSlideIndex + 1))}
              disabled={currentSlideIndex === slides.length - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Show Preview with tooltip */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{showPreview ? "Hide Preview" : "Show Preview"}</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="flex items-center gap-2">
            <Popover open={previewOpen} onOpenChange={setPreviewOpen}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Instagram className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Instagram Preview</p>
                </TooltipContent>
              </Tooltip>
              <PopoverContent className="w-96 p-6" align="end">
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <SafeInstagramPreview
                      content={content}
                      slideNumber={currentSlideIndex + 1}
                      totalSlides={slides.length}
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={() => setSharingModalOpen(true)}
                  disabled={slides.length === 0}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Share className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Share carousel to Instagram, social media, or download</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleExportPDF}
                  disabled={isExportingPDF || slides.length === 0}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  {isExportingPDF ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <File className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isExportingPDF ? 'Generating PDF...' : 'Export as PDF'}</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={addNewSlide} disabled={slides.length >= 10}>
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add Image</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={duplicateSlide} disabled={!currentSlide || slides.length >= 10}>
                  <Copy className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Duplicate Image</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={deleteCurrentSlide}
                  disabled={!currentSlide || slides.length <= 1}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete Image</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Main Content - Simplified */}
        <div className={`grid gap-6 items-start ${showPreview ? 'lg:grid-cols-12' : 'lg:grid-cols-8'}`}>
          {/* Editor */}
          <div className={showPreview ? 'lg:col-span-5' : 'lg:col-span-5'}>
            <div className="space-y-4">
              <FormattingToolbar onFormatText={handleFormatText} />
              
              <Textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="Write your Instagram carousel image content here...

Use **bold** for emphasis
Use *italic* for style  
Use #hashtags for topics
Use @mentions for people
Add emojis! 🎉"
                className="min-h-[400px] resize-none text-base leading-relaxed border-2 focus:border-primary"
              />
            </div>
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="lg:col-span-4">
              <div className="flex flex-col items-start space-y-4">
                <div className="flex justify-center w-full">
                  <SafeInstagramPreview
                    content={content}
                    slideNumber={currentSlideIndex + 1}
                    totalSlides={slides.length}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Sidebar - Simplified */}
          <div className={showPreview ? 'lg:col-span-3' : 'lg:col-span-3'}>
            <div className="space-y-4">
              {/* AI Style Suggestions */}
              <AiStyleSuggestions
                content={content}
                templateType={templateType}
                onApplySuggestion={handleApplyStyleSuggestion}
              />
              
              {/* Grammar Sidebar */}
              <GrammarSidebar 
                content={content}
                onContentChange={handleContentChange}
                slideNumber={currentSlideIndex + 1}
                totalSlides={slides.length}
                onGrammarStatusChange={handleGrammarStatusChange}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sharing Modal */}
      {currentProject && (
        <SharingModal
          isOpen={sharingModalOpen}
          onOpenChange={setSharingModalOpen}
          project={currentProject}
          slides={slides}
          projectId={projectId}
        />
      )}
    </TooltipProvider>
  )
} 