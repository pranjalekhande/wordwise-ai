import type { Document } from "./types"

/**
 * Template type detection keywords for content analysis
 */
const PRODUCT_KEYWORDS = [
  'product', 'launch', 'feature', 'buy', 'pricing', 'offer', 
  'sale', 'discount', 'free trial', 'subscription', 'plan',
  'purchase', 'order', 'checkout', 'payment', 'upgrade',
  'benefits', 'features', 'advantage', 'solution'
]

const NEWS_KEYWORDS = [
  'news', 'announced', 'breaking', 'update', 'report', 
  'today', 'yesterday', 'this week', 'new study', 'research',
  'statement', 'press release', 'official', 'confirmed',
  'revealed', 'disclosed', 'published', 'released'
]

/**
 * Slide count calculation ranges based on content length
 */
const SLIDE_COUNT_RANGES = [
  { maxChars: 400, slides: 3 },   // Tweet-length content
  { maxChars: 800, slides: 5 },   // Short article
  { maxChars: 1200, slides: 6 },  // Medium article
  { maxChars: 1600, slides: 7 },  // Long article
  { maxChars: Infinity, slides: 8 } // Very long (max for readability)
]

/**
 * Detects the most appropriate template type based on content analysis
 */
export const detectTemplateType = (content: string): "NEWS" | "STORY" | "PRODUCT" => {
  if (!content || content.trim().length === 0) {
    return 'STORY' // Default fallback
  }

  const keywords = content.toLowerCase()
  
  // Count keyword matches for each category
  const productMatches = PRODUCT_KEYWORDS.filter(keyword => keywords.includes(keyword)).length
  const newsMatches = NEWS_KEYWORDS.filter(keyword => keywords.includes(keyword)).length
  
  // Use threshold-based detection with bias toward more specific categories
  if (productMatches >= 2) {
    return 'PRODUCT'
  }
  
  if (newsMatches >= 2) {
    return 'NEWS'
  }
  
  // Additional single-keyword detection for strong indicators
  if (keywords.includes('product launch') || keywords.includes('buy now') || keywords.includes('pricing')) {
    return 'PRODUCT'
  }
  
  if (keywords.includes('breaking news') || keywords.includes('just announced') || keywords.includes('press release')) {
    return 'NEWS'
  }
  
  return 'STORY' // Default for personal stories, case studies, tutorials, etc.
}

/**
 * Calculates optimal slide count based on content length
 */
export const calculateSlideCount = (content: string): number => {
  if (!content || content.trim().length === 0) {
    return 5 // Default
  }

  const length = content.trim().length
  
  // Find the appropriate slide count based on content length
  for (const range of SLIDE_COUNT_RANGES) {
    if (length <= range.maxChars) {
      return range.slides
    }
  }
  
  return 8 // Fallback for very long content
}

/**
 * Generates a carousel-appropriate title from document title
 */
export const generateCarouselTitle = (documentTitle: string): string => {
  if (!documentTitle || documentTitle.trim().length === 0) {
    return "Untitled Carousel"
  }

  const title = documentTitle.trim()
  
  // If title already mentions carousel/slides, don't duplicate
  if (title.toLowerCase().includes('carousel') || title.toLowerCase().includes('slides')) {
    return title
  }
  
  return `${title} - Carousel`
}

/**
 * Creates a description that links back to the source document
 */
export const generateCarouselDescription = (documentTitle: string): string => {
  if (!documentTitle || documentTitle.trim().length === 0) {
    return "Carousel created from document"
  }
  
  return `Carousel created from: ${documentTitle.trim()}`
}

/**
 * Validates that document content meets minimum requirements for carousel creation
 */
export const validateDocumentContent = (content: string): { isValid: boolean; error?: string } => {
  if (!content) {
    return { isValid: false, error: "Document content is empty" }
  }
  
  const trimmedContent = content.trim()
  
  if (trimmedContent.length === 0) {
    return { isValid: false, error: "Document content is empty" }
  }
  
  if (trimmedContent.length < 50) {
    return { 
      isValid: false, 
      error: `Content too short (${trimmedContent.length} chars). Minimum 50 characters required.` 
    }
  }
  
  if (trimmedContent.length > 10000) {
    return { 
      isValid: false, 
      error: "Content too long (max 10,000 characters). Consider splitting into multiple carousels." 
    }
  }
  
  return { isValid: true }
}

/**
 * Main function that creates all carousel data from a document
 * This is the primary integration point for document-to-carousel conversion
 */
export const createCarouselFromDocument = (document: Document) => {
  // Validate the document content first
  const validation = validateDocumentContent(document.content)
  if (!validation.isValid) {
    throw new Error(validation.error)
  }

  // Generate all the carousel metadata
  const templateType = detectTemplateType(document.content)
  const slideCount = calculateSlideCount(document.content)
  const title = generateCarouselTitle(document.title)
  const description = generateCarouselDescription(document.title)

  return {
    title,
    sourceText: document.content.trim(),
    documentId: document.id,
    templateType,
    slideCount,
    description,
    // Additional metadata for context
    originalDocument: {
      title: document.title,
      wordCount: document.word_count,
      charCount: document.char_count,
      language: document.language
    }
  }
}

/**
 * Helper function to get template type description for UI display
 */
export const getTemplateTypeDescription = (templateType: "NEWS" | "STORY" | "PRODUCT"): string => {
  switch (templateType) {
    case 'NEWS':
      return 'Breaking news, announcements, updates'
    case 'PRODUCT':
      return 'Product launches, features, marketing'
    case 'STORY':
      return 'Personal stories, case studies, journeys'
    default:
      return 'General content structure'
  }
}

/**
 * Helper function to get recommended slide count range for template type
 */
export const getRecommendedSlideRange = (templateType: "NEWS" | "STORY" | "PRODUCT"): { min: number; max: number; optimal: number } => {
  switch (templateType) {
    case 'NEWS':
      return { min: 4, max: 6, optimal: 5 } // Hook, Key Points, Details, Conclusion, CTA
    case 'PRODUCT':
      return { min: 5, max: 8, optimal: 6 } // Problem, Solution, Features, Benefits, Proof, CTA
    case 'STORY':
      return { min: 4, max: 10, optimal: 7 } // Hook, Setup, Challenge, Journey, Resolution, Lesson, CTA
    default:
      return { min: 3, max: 10, optimal: 5 }
  }
} 