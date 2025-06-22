"use client"

import { useState, useEffect } from "react"
import { 
  Share, 
  Instagram, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Download, 
  Copy, 
  FileDown,
  Smartphone,
  Monitor,
  Globe,
  Check,
  Loader2,
  Eye,
  ExternalLink,
  Archive,
  Image as ImageIcon,
  FileText,
  Zap,
  Lightbulb, 
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { InstagramSquarePreview } from "./instagram-square-preview"
import { 
  shareCarouselToInstagram, 
  copyCarouselToClipboard, 
  createInstagramCaption,
  type SlideImageData,
  type InstagramShareOptions,
  type ShareResult
} from "@/lib/instagram-sharing"
import type { CarouselProject, Slide } from "@/lib/types"

interface SharingModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  project: CarouselProject
  slides: Slide[]
  projectId: string
}

interface ShareProgress {
  stage: 'idle' | 'generating' | 'processing' | 'sharing' | 'complete' | 'error'
  progress: number
  message: string
  error?: string
}

interface PostingProgress {
  captionCopied: boolean
  imagesDownloaded: boolean
  instagramOpened: boolean
}

interface PlatformShareOptions {
  platform: 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'whatsapp' | 'native'
  enabled: boolean
  customMessage?: string
}

export function SharingModal({ 
  isOpen, 
  onOpenChange, 
  project, 
  slides, 
  projectId 
}: SharingModalProps) {
  // State management
  const [activeTab, setActiveTab] = useState<'instructions' | 'preview' | 'social' | 'download' | 'advanced'>('instructions')
  const [deviceType, setDeviceType] = useState<'mobile' | 'desktop'>('mobile')
  const [shareProgress, setShareProgress] = useState<ShareProgress>({
    stage: 'idle',
    progress: 0,
    message: ''
  })
  const [postingProgress, setPostingProgress] = useState<PostingProgress>({
    captionCopied: false,
    imagesDownloaded: false,
    instagramOpened: false
  })
  const [generatedImages, setGeneratedImages] = useState<any[]>([])
  const [customCaption, setCustomCaption] = useState('')
  const [platformOptions, setPlatformOptions] = useState<PlatformShareOptions[]>([
    { platform: 'instagram', enabled: false },
    { platform: 'facebook', enabled: false },
    { platform: 'twitter', enabled: false },
    { platform: 'linkedin', enabled: false },
    { platform: 'whatsapp', enabled: false },
    { platform: 'native', enabled: false }
  ])
  const [previewSlideIndex, setPreviewSlideIndex] = useState(0)
  const [shareResults, setShareResults] = useState<Record<string, ShareResult>>({})

  // Device detection
  const [isMobile, setIsMobile] = useState(false)
  const [supportsWebShare, setSupportsWebShare] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMobile(/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
      setSupportsWebShare('share' in navigator)
    }
  }, [])

  // Generate Instagram caption
  const instagramCaption = createInstagramCaption(
    project,
    slides.map(slide => ({ content: slide.content })),
    {
      useCarouselCaption: true,
      hashtags: project.template_type ? [`#${project.template_type.toLowerCase()}`] : [],
      caption: customCaption
    }
  )

  // Generate images for sharing
  const generateImages = async (): Promise<any[]> => {
    if (generatedImages.length > 0) return generatedImages

    setShareProgress({
      stage: 'generating',
      progress: 20,
      message: `Generating ${slides.length} images...`
    })

    try {
      const response = await fetch(`/api/projects/${projectId}/export-images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: 'png', includeZip: false })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to generate images')
      }

      const data = await response.json()
      
      if (!data.success || !data.images) {
        throw new Error('No images were generated')
      }

      setGeneratedImages(data.images)
      setShareProgress({
        stage: 'processing',
        progress: 60,
        message: 'Images generated successfully!'
      })

      return data.images
    } catch (error) {
      setShareProgress({
        stage: 'error',
        progress: 0,
        message: 'Failed to generate images',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  // Enhanced Instagram share with progress tracking
  const handleInstagramShare = async () => {
    try {
      // Step 1: Copy caption first
      setShareProgress({
        stage: 'processing',
        progress: 25,
        message: 'Copying caption to clipboard...'
      })

      const slideImages: SlideImageData[] = slides.map(slide => ({
        slideId: slide.id,
        slideNumber: slide.slide_number,
        content: slide.content,
        fileName: `slide_${slide.slide_number}.png`
      }))

      const captionSuccess = await copyCarouselToClipboard(slideImages, project, {
        useCarouselCaption: true,
        hashtags: project.template_type ? [`#${project.template_type.toLowerCase()}`] : [],
        caption: customCaption
      })

      if (captionSuccess) {
        setPostingProgress(prev => ({ ...prev, captionCopied: true }))
        setShareProgress({
          stage: 'processing',
          progress: 50,
          message: 'Caption copied! Now download your images...'
        })
      }

      // Step 2: Generate and prepare images
      setShareProgress({
        stage: 'processing',
        progress: 75,
        message: 'Preparing images for download...'
      })

      const images = await generateImages()

      setShareProgress({
        stage: 'complete',
        progress: 100,
        message: 'Ready to share! Follow the instructions below.'
      })

      // Switch to instructions tab to guide user
      setActiveTab('instructions')

      // Reset progress after showing success
      setTimeout(() => {
        setShareProgress({ stage: 'idle', progress: 0, message: '' })
      }, 3000)

    } catch (error) {
      setShareProgress({
        stage: 'error',
        progress: 0,
        message: 'Failed to prepare for Instagram sharing',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // Native Web Share API
  const handleNativeShare = async () => {
    if (!supportsWebShare) return

    try {
      const images = await generateImages()
      
      // Create shareable content
      const shareData: ShareData = {
        title: project.title,
        text: instagramCaption,
        url: window.location.href
      }

      // Try to share with files if supported
      if ('canShare' in navigator && images.length > 0) {
        // Convert base64 images to blobs
        const files = await Promise.all(
          images.slice(0, 1).map(async (img: any) => {
            const response = await fetch(img.imageUrl)
            const blob = await response.blob()
            return new File([blob], img.fileName, { type: 'image/png' })
          })
        )

        const shareDataWithFiles = { ...shareData, files }
        
        if (navigator.canShare && navigator.canShare(shareDataWithFiles)) {
          await navigator.share(shareDataWithFiles)
          setShareResults(prev => ({ 
            ...prev, 
            native: { success: true, shareMethod: 'native' as const } 
          }))
          return
        }
      }

      // Fallback to text-only sharing
      await navigator.share(shareData)
      setShareResults(prev => ({ 
        ...prev, 
        native: { success: true, shareMethod: 'native' as const } 
      }))
    } catch (error) {
      console.error('Native sharing failed:', error)
      setShareResults(prev => ({ 
        ...prev, 
        native: { success: false, shareMethod: 'fallback' as const, error: 'Sharing cancelled' } 
      }))
    }
  }

  // Download images with progress tracking
  const handleDownloadImages = async () => {
    try {
      const images = await generateImages()
      
      setShareProgress({
        stage: 'processing',
        progress: 70,
        message: 'Preparing downloads...'
      })

      // Download individual images
      for (let i = 0; i < images.length; i++) {
        const img = images[i]
        const link = document.createElement('a')
        link.href = img.imageUrl
        link.download = img.fileName
        link.style.display = 'none'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        if (i < images.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }

      // Update posting progress
      setPostingProgress(prev => ({ ...prev, imagesDownloaded: true }))
      
      setShareProgress({
        stage: 'complete',
        progress: 100,
        message: `Downloaded ${images.length} images!`
      })

      // Reset after showing success
      setTimeout(() => {
        setShareProgress({ stage: 'idle', progress: 0, message: '' })
      }, 3000)

    } catch (error) {
      setShareProgress({
        stage: 'error',
        progress: 0,
        message: 'Download failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // Copy caption with progress tracking
  const handleCopyCaption = async () => {
    try {
      const slideImages: SlideImageData[] = slides.map(slide => ({
        slideId: slide.id,
        slideNumber: slide.slide_number,
        content: slide.content,
        fileName: `slide_${slide.slide_number}.png`
      }))

      const success = await copyCarouselToClipboard(slideImages, project, {
        useCarouselCaption: true,
        hashtags: project.template_type ? [`#${project.template_type.toLowerCase()}`] : [],
        caption: customCaption
      })

      if (success) {
        // Update posting progress
        setPostingProgress(prev => ({ ...prev, captionCopied: true }))
        
        setShareProgress({
          stage: 'complete',
          progress: 100,
          message: 'Caption copied to clipboard!'
        })

        // Reset after showing success
        setTimeout(() => {
          setShareProgress({ stage: 'idle', progress: 0, message: '' })
        }, 3000)
      }
    } catch (error) {
      setShareProgress({
        stage: 'error',
        progress: 0,
        message: 'Failed to copy caption',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // Export as PDF
  const handleExportPDF = async () => {
    try {
      setShareProgress({
        stage: 'generating',
        progress: 20,
        message: 'Generating PDF...'
      })

      // Call the PDF export API
      const response = await fetch(`/api/projects/${projectId}/export-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          includeImages: true, 
          textOnly: false 
        })
      })

      if (!response.ok) {
        // If it's not a PDF response, try to get error message
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to generate PDF')
        } else {
          throw new Error(`PDF generation failed with status ${response.status}`)
        }
      }

      setShareProgress({
        stage: 'processing',
        progress: 60,
        message: 'Preparing PDF download...'
      })

      // Get the PDF blob
      const pdfBlob = await response.blob()
      
      // Get filename from content-disposition header or use default
      const disposition = response.headers.get('content-disposition')
      let fileName = 'carousel.pdf'
      if (disposition && disposition.includes('filename=')) {
        const filenameMatch = disposition.match(/filename="([^"]+)"/)
        if (filenameMatch) {
          fileName = filenameMatch[1]
        }
      }

      // Create download link
      const url = window.URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      setShareProgress({
        stage: 'complete',
        progress: 100,
        message: `PDF "${fileName}" downloaded successfully!`
      })

      // Reset after showing success message
      setTimeout(() => {
        setShareProgress({ stage: 'idle', progress: 0, message: '' })
      }, 3000)

    } catch (error) {
      setShareProgress({
        stage: 'error',
        progress: 0,
        message: 'Failed to export PDF',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // Reset progress when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setShareProgress({ stage: 'idle', progress: 0, message: '' })
      setShareResults({})
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share className="h-5 w-5" />
            Share "{project.title}"
          </DialogTitle>
          <DialogDescription>
            Export your Instagram carousel and get step-by-step posting guidance.
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        {shareProgress.stage !== 'idle' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>{shareProgress.message}</span>
              {shareProgress.stage === 'processing' && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {shareProgress.stage === 'complete' && (
                <Check className="h-4 w-4 text-green-600" />
              )}
            </div>
            <Progress value={shareProgress.progress} className="h-2" />
            {shareProgress.error && (
              <Alert variant="destructive">
                <AlertDescription>{shareProgress.error}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="instructions">How to Post</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="social">Share</TabsTrigger>
            <TabsTrigger value="download">Export</TabsTrigger>
            <TabsTrigger value="advanced">Settings</TabsTrigger>
          </TabsList>

          {/* Instructions Tab */}
          <TabsContent value="instructions" className="space-y-4">
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">Post Your Carousel to Instagram</h3>
                <p className="text-muted-foreground">Follow these steps to share your content</p>
              </div>

              {/* Progress Overview */}
              {(postingProgress.captionCopied || postingProgress.imagesDownloaded || postingProgress.instagramOpened) && (
                <Card className="bg-green-50 border-green-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-green-800">
                      <Check className="h-5 w-5" />
                      Progress Tracker
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {postingProgress.captionCopied ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                        )}
                        <span className={`text-sm ${postingProgress.captionCopied ? 'text-green-800 font-medium' : 'text-gray-600'}`}>
                          Caption copied to clipboard
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {postingProgress.imagesDownloaded ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                        )}
                        <span className={`text-sm ${postingProgress.imagesDownloaded ? 'text-green-800 font-medium' : 'text-gray-600'}`}>
                          Images downloaded
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                        <span className="text-sm text-gray-600">Ready to post on Instagram</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Device Type Tabs */}
              <Tabs value={deviceType} onValueChange={(value) => setDeviceType(value as 'mobile' | 'desktop')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="mobile" className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    Mobile
                  </TabsTrigger>
                  <TabsTrigger value="desktop" className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    Desktop
                  </TabsTrigger>
                </TabsList>

                {/* Mobile Instructions */}
                <TabsContent value="mobile" className="mt-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                            postingProgress.imagesDownloaded 
                              ? 'bg-green-100 text-green-600' 
                              : 'bg-blue-100 text-blue-600'
                          }`}>
                            {postingProgress.imagesDownloaded ? <Check className="h-4 w-4" /> : '1'}
                          </div>
                          <div>
                            <p className="font-medium">Download Images</p>
                            <p className="text-sm text-muted-foreground">Tap "Download Images" button below</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                            postingProgress.captionCopied 
                              ? 'bg-green-100 text-green-600' 
                              : 'bg-blue-100 text-blue-600'
                          }`}>
                            {postingProgress.captionCopied ? <Check className="h-4 w-4" /> : '2'}
                          </div>
                          <div>
                            <p className="font-medium">Copy Caption</p>
                            <p className="text-sm text-muted-foreground">Tap "Copy Caption" button below</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">3</div>
                          <div>
                            <p className="font-medium">Open Instagram App</p>
                            <p className="text-sm text-muted-foreground">Tap the "+" button → "Post"</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">4</div>
                          <div>
                            <p className="font-medium">Select Multiple Images</p>
                            <p className="text-sm text-muted-foreground">Choose all downloaded images in order</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">5</div>
                          <div>
                            <p className="font-medium">Paste Caption & Post</p>
                            <p className="text-sm text-muted-foreground">Long press in caption box → Paste → Share</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Desktop Instructions */}
                <TabsContent value="desktop" className="mt-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                            postingProgress.imagesDownloaded 
                              ? 'bg-green-100 text-green-600' 
                              : 'bg-green-100 text-green-600'
                          }`}>
                            {postingProgress.imagesDownloaded ? <Check className="h-4 w-4" /> : '1'}
                          </div>
                          <div>
                            <p className="font-medium">Download Images</p>
                            <p className="text-sm text-muted-foreground">Click "Download Images" button below</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                            postingProgress.captionCopied 
                              ? 'bg-green-100 text-green-600' 
                              : 'bg-green-100 text-green-600'
                          }`}>
                            {postingProgress.captionCopied ? <Check className="h-4 w-4" /> : '2'}
                          </div>
                          <div>
                            <p className="font-medium">Copy Caption</p>
                            <p className="text-sm text-muted-foreground">Click "Copy Caption" button below</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-semibold">3</div>
                          <div>
                            <p className="font-medium">Open Instagram.com</p>
                            <p className="text-sm text-muted-foreground">Click "+" → "Select from computer"</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-semibold">4</div>
                          <div>
                            <p className="font-medium">Choose Images</p>
                            <p className="text-sm text-muted-foreground">Select all images, arrange in order → Next</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-semibold">5</div>
                          <div>
                            <p className="font-medium">Paste Caption & Share</p>
                            <p className="text-sm text-muted-foreground">Paste with Ctrl+V → Click Share</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Action Buttons */}
              <div className="flex justify-center">
                <div className="flex gap-3">
                  <Button 
                    onClick={handleDownloadImages}
                    disabled={shareProgress.stage === 'generating'}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Images
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={handleCopyCaption}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Caption
                  </Button>
                </div>
              </div>

              {/* Pro Tips - Bottom with smaller font */}
              <div className="pt-4 border-t">
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-blue-800 text-sm">
                      <Lightbulb className="h-4 w-4" />
                      Pro Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs text-blue-700 space-y-1">
                      <p>• Select images in sequence (1, 2, 3, 4) for best flow</p>
                      <p>• Caption is ready to paste - no editing needed</p>
                      <p>• Add 2-3 relevant hashtags for better reach</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Preview */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Instagram Preview</h3>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewSlideIndex(Math.max(0, previewSlideIndex - 1))}
                      disabled={previewSlideIndex === 0}
                    >
                      ←
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {previewSlideIndex + 1} / {slides.length}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewSlideIndex(Math.min(slides.length - 1, previewSlideIndex + 1))}
                      disabled={previewSlideIndex === slides.length - 1}
                    >
                      →
                    </Button>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <InstagramSquarePreview
                    content={slides[previewSlideIndex]?.content || ''}
                    slideNumber={previewSlideIndex + 1}
                    totalSlides={slides.length}
                  />
                </div>
              </div>

              {/* Caption */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Instagram Caption</h3>
                <div className="space-y-2">
                  <Label>Custom message (optional)</Label>
                  <Textarea
                    placeholder="Add a custom message..."
                    value={customCaption}
                    onChange={(e) => setCustomCaption(e.target.value)}
                    className="h-20"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Generated Caption</Label>
                  <div className="border rounded-lg p-3 bg-muted text-sm max-h-40 overflow-y-auto">
                    <pre className="whitespace-pre-wrap font-sans">{instagramCaption}</pre>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{instagramCaption.length} characters</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyCaption}
                      className="h-6 px-2"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleInstagramShare}
                disabled={shareProgress.stage === 'generating' || shareProgress.stage === 'sharing'}
                className="flex-1 sm:flex-none"
              >
                <Instagram className="h-4 w-4 mr-2" />
                Get Instructions
              </Button>
              {supportsWebShare && (
                <Button
                  variant="outline"
                  onClick={handleNativeShare}
                  className="flex-1 sm:flex-none"
                >
                  <Smartphone className="h-4 w-4 mr-2" />
                  Device Share
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleDownloadImages}
                className="flex-1 sm:flex-none"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Images
              </Button>
            </div>
          </TabsContent>

          {/* Social Media Tab */}
          <TabsContent value="social" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Instagram */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Instagram className="h-5 w-5 text-purple-600" />
                    Instagram
                    <Badge variant="secondary">Recommended</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Prepares caption and images for Instagram posting
                  </p>
                  <Button 
                    onClick={handleInstagramShare}
                    disabled={shareProgress.stage === 'generating' || shareProgress.stage === 'sharing'}
                    className="w-full"
                    size="sm"
                  >
                    {shareResults.instagram?.success ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Ready to Post
                      </>
                    ) : (
                      <>
                        <Instagram className="h-4 w-4 mr-2" />
                        Prepare for Instagram
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Native Sharing */}
              {supportsWebShare && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Smartphone className="h-5 w-5 text-blue-600" />
                      Device Sharing
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Share via your device's native sharing menu
                    </p>
                    <Button 
                      variant="outline"
                      onClick={handleNativeShare}
                      className="w-full"
                      size="sm"
                    >
                      <Share className="h-4 w-4 mr-2" />
                      Open Share Menu
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Copy Caption */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Copy className="h-5 w-5 text-gray-600" />
                    Copy Caption
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Copy Instagram-ready caption to clipboard
                  </p>
                  <Button 
                    variant="outline"
                    onClick={handleCopyCaption}
                    className="w-full"
                    size="sm"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Caption
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Download Tab */}
          <TabsContent value="download" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Archive className="h-5 w-5 text-green-600" />
                    Carousel Images
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Download all {slides.length} carousel images ready for Instagram
                  </p>
                  <Button 
                    onClick={handleDownloadImages}
                    disabled={shareProgress.stage === 'generating'}
                    className="w-full"
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download {slides.length} Images
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="h-5 w-5 text-blue-600" />
                    PDF Export
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Professional PDF with carousel images and content
                  </p>
                  <Button 
                    variant="outline"
                    onClick={handleExportPDF}
                    disabled={shareProgress.stage === 'generating' || shareProgress.stage === 'sharing'}
                    className="w-full"
                    size="sm"
                  >
                    {shareProgress.stage === 'generating' && shareProgress.message.includes('PDF') ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating PDF...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        Export PDF
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Carousel Format</h3>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Instagram Carousel Specifications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      Optimized format for Instagram carousel posts
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">1080x1080px</Badge>
                        <Badge variant="outline">Square Format</Badge>
                        <Badge variant="outline">PNG Quality</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Perfect dimensions and quality for Instagram
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-2">Future Features</h3>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">
                      Enhanced analytics and sharing features coming soon.
                    </p>
                    <Button variant="outline" size="sm" className="mt-2" disabled>
                      Advanced Features (Coming Soon)
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 