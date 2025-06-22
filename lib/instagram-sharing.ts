/**
 * Instagram Web Sharing Utility
 * Handles sharing carousel images to Instagram through web intents and mobile deep links
 */

import type { CarouselProject } from './types'

export interface SlideImageData {
  slideId: string
  slideNumber: number
  content: string
  imageBuffer?: Buffer | null
  fileName: string
  imageUrl?: string // For base64 data URLs from API
}

export interface InstagramShareOptions {
  caption?: string
  hashtags?: string[]
  useCarouselCaption?: boolean
}

export interface ShareResult {
  success: boolean
  shareMethod: 'web' | 'mobile-app' | 'fallback' | 'native'
  shareUrl?: string
  error?: string
  captionCopied?: boolean
}

/**
 * Detect if user is on mobile device
 */
function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false
  
  const userAgent = navigator.userAgent.toLowerCase()
  const mobileKeywords = ['android', 'iphone', 'ipad', 'ipod']
  
  return mobileKeywords.some(keyword => userAgent.includes(keyword)) ||
         (window.innerWidth <= 768)
}

/**
 * Create Instagram-ready caption from carousel data
 */
export function createInstagramCaption(
  project: CarouselProject,
  slides: any[],
  options: InstagramShareOptions = {}
): string {
  const parts: string[] = []
  
  if (project.title) {
    parts.push(`📸 ${project.title}`)
    parts.push('')
  }
  
  if (options.useCarouselCaption && slides.length > 0) {
    parts.push(slides[0].content)
    if (slides.length > 1) {
      parts.push('')
      parts.push('💫 Swipe to see more!')
    }
  }
  
  if (options.caption) {
    parts.push('')
    parts.push(options.caption)
  }
  
  const hashtags = options.hashtags || []
  hashtags.unshift('#carousel', '#instagram')
  
  if (hashtags.length > 0) {
    parts.push('')
    parts.push(hashtags.join(' '))
  }
  
  return parts.join('\n').trim()
}

/**
 * Enhanced clipboard copy with fallback methods
 */
async function copyTextToClipboard(text: string): Promise<boolean> {
  // Method 1: Modern Clipboard API
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text)
      console.log('✅ Caption copied to clipboard (Clipboard API)')
      return true
    } catch (error) {
      console.warn('Clipboard API failed:', error)
    }
  }

  // Method 2: Legacy fallback using execCommand
  try {
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.top = '-9999px'
    textArea.style.left = '-9999px'
    textArea.style.opacity = '0'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    
    const successful = document.execCommand('copy')
    document.body.removeChild(textArea)
    
    if (successful) {
      console.log('✅ Caption copied to clipboard (execCommand)')
      return true
    }
  } catch (error) {
    console.warn('execCommand copy failed:', error)
  }

  // Method 3: Show manual copy dialog as last resort
  try {
    const userWantsToCopy = confirm(
      'Unable to automatically copy caption. Would you like to see it so you can copy manually?'
    )
    
    if (userWantsToCopy) {
      prompt('Copy this caption for Instagram:', text)
      return true
    }
  } catch (error) {
    console.warn('Manual copy dialog failed:', error)
  }

  console.warn('❌ All clipboard methods failed')
  return false
}

/**
 * Share carousel to Instagram
 */
export async function shareCarouselToInstagram(
  slideImages: SlideImageData[],
  project: CarouselProject,
  options: InstagramShareOptions = {}
): Promise<ShareResult> {
  try {
    const mobile = isMobileDevice()
    const slides = slideImages.map(img => ({ content: img.content }))
    const fullCaption = createInstagramCaption(project, slides, options)
    
    // ALWAYS copy caption to clipboard first (before opening Instagram)
    console.log('📋 Copying caption to clipboard...')
    const copySuccess = await copyTextToClipboard(fullCaption)
    console.log(`📋 Caption copy result: ${copySuccess ? 'Success' : 'Failed'}`)
    
    if (mobile) {
      // Mobile: Copy first, then open Instagram app
      console.log('📱 Mobile device detected - opening Instagram app...')
      
      const instagramUrl = 'instagram://camera'
      
      // Try to open Instagram app
      try {
        window.location.href = instagramUrl
        console.log('📱 Instagram app opened via deep link')
      } catch (error) {
        console.warn('📱 Instagram app deep link failed, trying web fallback')
        window.open('https://www.instagram.com/', '_blank')
      }
      
      // Fallback to web if app doesn't open
      setTimeout(() => {
        if (document.hasFocus()) {
          console.log('📱 App didn\'t open, opening Instagram web as fallback')
          window.open('https://www.instagram.com/', '_blank')
        }
      }, 1500)
      
      return {
        success: true,
        shareMethod: 'mobile-app',
        shareUrl: instagramUrl,
        captionCopied: copySuccess
      }
    } else {
      // Desktop: Copy caption and open Instagram web
      console.log('💻 Desktop device detected - opening Instagram web...')
      
      const shareUrl = 'https://www.instagram.com/'
      window.open(shareUrl, '_blank')
      
      return {
        success: true,
        shareMethod: 'web',
        shareUrl,
        captionCopied: copySuccess
      }
    }
  } catch (error) {
    console.error('❌ Instagram sharing failed:', error)
    return {
      success: false,
      shareMethod: 'fallback',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Copy carousel content to clipboard with enhanced fallbacks
 */
export async function copyCarouselToClipboard(
  slideImages: SlideImageData[],
  project: CarouselProject,
  options: InstagramShareOptions = {}
): Promise<boolean> {
  try {
    const slides = slideImages.map(img => ({ content: img.content }))
    const caption = createInstagramCaption(project, slides, options)
    
    return await copyTextToClipboard(caption)
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    return false
  }
}

/**
 * Generate and display caption for manual copying
 */
export function showCaptionForManualCopy(
  slideImages: SlideImageData[],
  project: CarouselProject,
  options: InstagramShareOptions = {}
): string {
  const slides = slideImages.map(img => ({ content: img.content }))
  const caption = createInstagramCaption(project, slides, options)
  
  // Show in a dialog for manual copying
  prompt('Copy this caption for Instagram:', caption)
  
  return caption
} 