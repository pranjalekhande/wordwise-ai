/**
 * Web Share API Integration
 * Provides native sharing capabilities with proper fallbacks for different platforms
 */

import type { CarouselProject } from './types'
import { createInstagramCaption, type SlideImageData } from './instagram-sharing'

export interface WebShareOptions {
  title?: string
  text?: string
  url?: string
  files?: File[]
}

export interface WebShareResult {
  success: boolean
  method: 'native' | 'fallback' | 'unsupported'
  error?: string
}

export interface SocialPlatformOptions {
  platform: 'facebook' | 'twitter' | 'linkedin' | 'whatsapp' | 'telegram' | 'reddit'
  title: string
  text: string
  url?: string
  hashtags?: string[]
}

/**
 * Check if Web Share API is supported
 */
export function isWebShareSupported(): boolean {
  return typeof navigator !== 'undefined' && 'share' in navigator
}

/**
 * Check if sharing with files is supported
 */
export function isWebShareWithFilesSupported(): boolean {
  return (
    isWebShareSupported() &&
    'canShare' in navigator &&
    typeof navigator.canShare === 'function'
  )
}

/**
 * Get device and browser information for sharing optimization
 */
export function getShareEnvironment() {
  if (typeof window === 'undefined') {
    return {
      isMobile: false,
      isIOS: false,
      isAndroid: false,
      browserSupportsShare: false,
      browserSupportsFiles: false
    }
  }

  const userAgent = navigator.userAgent.toLowerCase()
  const isMobile = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
  const isIOS = /iphone|ipad|ipod/i.test(userAgent)
  const isAndroid = /android/i.test(userAgent)

  return {
    isMobile,
    isIOS,
    isAndroid,
    browserSupportsShare: isWebShareSupported(),
    browserSupportsFiles: isWebShareWithFilesSupported()
  }
}

/**
 * Convert base64 data URL to File object
 */
export async function dataUrlToFile(dataUrl: string, filename: string): Promise<File> {
  const response = await fetch(dataUrl)
  const blob = await response.blob()
  return new File([blob], filename, { type: blob.type })
}

/**
 * Share using native Web Share API
 */
export async function shareWithWebAPI(options: WebShareOptions): Promise<WebShareResult> {
  if (!isWebShareSupported()) {
    return {
      success: false,
      method: 'unsupported',
      error: 'Web Share API not supported'
    }
  }

  try {
    // Check if we can share with files
    if (options.files && options.files.length > 0) {
      if (isWebShareWithFilesSupported()) {
        const shareData = {
          title: options.title,
          text: options.text,
          url: options.url,
          files: options.files
        }

        if (navigator.canShare!(shareData)) {
          await navigator.share(shareData)
          return {
            success: true,
            method: 'native'
          }
        }
      }
      
      // Fallback to sharing without files
      console.warn('File sharing not supported, falling back to text-only sharing')
    }

    // Share without files
    const shareData: ShareData = {
      title: options.title,
      text: options.text,
      url: options.url
    }

    await navigator.share(shareData)
    return {
      success: true,
      method: 'native'
    }
  } catch (error) {
    // User cancelled or sharing failed
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    if (errorMessage.includes('AbortError') || errorMessage.includes('cancelled')) {
      return {
        success: false,
        method: 'native',
        error: 'User cancelled sharing'
      }
    }

    return {
      success: false,
      method: 'native',
      error: errorMessage
    }
  }
}

/**
 * Share carousel using Web Share API
 */
export async function shareCarouselWithWebAPI(
  slideImages: SlideImageData[],
  project: CarouselProject,
  options: {
    includeImages?: boolean
    maxImages?: number
    customCaption?: string
  } = {}
): Promise<WebShareResult> {
  const {
    includeImages = false,
    maxImages = 1,
    customCaption = ''
  } = options

  try {
    // Generate caption
    const caption = createInstagramCaption(
      project,
      slideImages.map(img => ({ content: img.content })),
      {
        useCarouselCaption: true,
        hashtags: project.template_type ? [`#${project.template_type.toLowerCase()}`] : [],
        caption: customCaption
      }
    )

    const shareOptions: WebShareOptions = {
      title: `📸 ${project.title}`,
      text: caption,
      url: window.location.href
    }

    // Try to include images if requested and supported
    if (includeImages && isWebShareWithFilesSupported()) {
      try {
        const imagesToShare = slideImages.slice(0, maxImages)
        const files = await Promise.all(
          imagesToShare.map(async (img) => {
            if (img.imageUrl) {
              return await dataUrlToFile(img.imageUrl, img.fileName)
            }
            throw new Error('No image URL available')
          })
        )

        shareOptions.files = files
      } catch (error) {
        console.warn('Failed to prepare images for sharing:', error)
        // Continue with text-only sharing
      }
    }

    return await shareWithWebAPI(shareOptions)
  } catch (error) {
    return {
      success: false,
      method: 'fallback',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Generate social media sharing URLs
 */
export function generateSocialMediaUrl(options: SocialPlatformOptions): string {
  const { platform, title, text, url, hashtags = [] } = options
  
  const encodedTitle = encodeURIComponent(title)
  const encodedText = encodeURIComponent(text)
  const encodedUrl = url ? encodeURIComponent(url) : ''
  const hashtagString = hashtags.map(tag => tag.startsWith('#') ? tag.slice(1) : tag).join(',')
  
  switch (platform) {
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`
    
    case 'twitter':
      const twitterText = hashtags.length > 0 
        ? `${text} ${hashtags.join(' ')}`
        : text
      return `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}&url=${encodedUrl}`
    
    case 'linkedin':
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedTitle}&summary=${encodedText}`
    
    case 'whatsapp':
      const whatsappText = url ? `${text}\n\n${url}` : text
      return `https://wa.me/?text=${encodeURIComponent(whatsappText)}`
    
    case 'telegram':
      const telegramText = url ? `${text}\n\n${url}` : text
      return `https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent(telegramText)}`
    
    case 'reddit':
      return `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`
    
    default:
      throw new Error(`Unsupported platform: ${platform}`)
  }
}

/**
 * Share to social media platform
 */
export function shareToSocialMedia(options: SocialPlatformOptions): void {
  try {
    const shareUrl = generateSocialMediaUrl(options)
    
    // Open in new window/tab
    const popup = window.open(
      shareUrl,
      'social-share',
      'width=600,height=400,scrollbars=yes,resizable=yes'
    )
    
    // Focus the popup if it opened successfully
    if (popup) {
      popup.focus()
    }
  } catch (error) {
    console.error(`Failed to share to ${options.platform}:`, error)
    throw error
  }
}

/**
 * Share carousel to social media platforms
 */
export function shareCarouselToSocialMedia(
  slideImages: SlideImageData[],
  project: CarouselProject,
  platform: SocialPlatformOptions['platform'],
  options: {
    customCaption?: string
    includeUrl?: boolean
    maxLength?: number
  } = {}
): void {
  const {
    customCaption = '',
    includeUrl = true,
    maxLength = platform === 'twitter' ? 280 : 1000
  } = options

  // Generate optimized caption for the platform
  let caption = createInstagramCaption(
    project,
    slideImages.map(img => ({ content: img.content })),
    {
      useCarouselCaption: true,
      hashtags: project.template_type ? [`#${project.template_type.toLowerCase()}`] : [],
      caption: customCaption
    }
  )

  // Truncate if too long
  if (caption.length > maxLength) {
    caption = caption.substring(0, maxLength - 3) + '...'
  }

  const shareOptions: SocialPlatformOptions = {
    platform,
    title: project.title,
    text: caption,
    url: includeUrl ? window.location.href : undefined,
    hashtags: project.template_type ? [`#${project.template_type.toLowerCase()}`] : []
  }

  shareToSocialMedia(shareOptions)
}

/**
 * Copy content to clipboard with enhanced fallbacks
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Method 1: Modern Clipboard API
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text)
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
    
    return successful
  } catch (error) {
    console.warn('execCommand copy failed:', error)
  }

  return false
}

/**
 * Download multiple files with proper spacing
 */
export async function downloadMultipleFiles(
  files: Array<{ url: string; filename: string }>,
  delayMs: number = 100
): Promise<void> {
  for (let i = 0; i < files.length; i++) {
    const { url, filename } = files[i]
    
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Add delay between downloads to prevent browser blocking
    if (i < files.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }
}

/**
 * Get sharing recommendations based on device and content
 */
export function getSharingRecommendations(
  project: CarouselProject,
  slideCount: number
): {
  recommendedPlatforms: string[]
  tips: string[]
  warnings: string[]
} {
  const env = getShareEnvironment()
  const recommendations = {
    recommendedPlatforms: [] as string[],
    tips: [] as string[],
    warnings: [] as string[]
  }

  // Platform recommendations
  recommendations.recommendedPlatforms.push('instagram')
  
  if (env.browserSupportsShare) {
    recommendations.recommendedPlatforms.push('native')
  }
  
  recommendations.recommendedPlatforms.push('facebook', 'twitter', 'linkedin')

  // Tips based on content
  if (slideCount > 7) {
    recommendations.tips.push('Consider splitting into multiple carousels for better engagement')
  }
  
  if (slideCount < 3) {
    recommendations.warnings.push('Instagram carousels work best with 3+ slides')
  }

  // Device-specific tips
  if (env.isMobile) {
    recommendations.tips.push('On mobile, you can save images directly to your camera roll')
  } else {
    recommendations.tips.push('Download all images and upload them manually to Instagram for best results')
  }

  // Template-specific tips
  if (project.template_type === 'STORY') {
    recommendations.tips.push('Story carousels perform well with personal engagement')
  } else if (project.template_type === 'PRODUCT') {
    recommendations.tips.push('Include clear calls-to-action in your caption')
  }

  return recommendations
} 