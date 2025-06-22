/**
 * Template-Based AI Optimizer
 * Lightweight AI features that enhance template selection and content optimization
 * Uses pattern matching and simple analytics instead of heavy AI computation
 */

import type { BrandVoiceTemplate, CarouselProject, Slide } from "./types"

// Template recommendation keywords (lightweight pattern matching)
const TEMPLATE_KEYWORDS = {
  NEWS: {
    primary: ['news', 'breaking', 'announced', 'update', 'report', 'study', 'research', 'released', 'launched'],
    secondary: ['today', 'yesterday', 'this week', 'new', 'latest', 'recent', 'confirmed', 'revealed'],
    negative: ['story', 'journey', 'personal', 'experience', 'lesson', 'learned']
  },
  PRODUCT: {
    primary: ['product', 'launch', 'feature', 'solution', 'tool', 'service', 'offer', 'pricing', 'buy'],
    secondary: ['benefits', 'advantages', 'problems', 'solves', 'helps', 'improves', 'saves', 'increases'],
    negative: ['news', 'story', 'personal', 'journey', 'experience']
  },
  STORY: {
    primary: ['story', 'journey', 'experience', 'learned', 'lesson', 'personal', 'challenge', 'overcome'],
    secondary: ['my', 'me', 'I', 'we', 'our', 'journey', 'transformation', 'growth', 'success'],
    negative: ['product', 'launch', 'news', 'breaking', 'announced']
  }
} as const

// Brand voice patterns for learning user preferences
export interface BrandVoicePattern {
  tone: string
  style: string
  avgCharCount: number
  commonWords: string[]
  emojiUsage: number
  hashtagCount: number
}

// Content optimization rules by template
const TEMPLATE_OPTIMIZATION_RULES = {
  NEWS: {
    maxCharCount: 160,
    recommendedStructure: ['headline', 'key_facts', 'context', 'impact', 'next_steps'],
    toneGuidelines: ['professional', 'authoritative', 'clear'],
    avoidWords: ['maybe', 'perhaps', 'might', 'possibly'],
    preferWords: ['confirmed', 'reported', 'announced', 'revealed']
  },
  PRODUCT: {
    maxCharCount: 180,
    recommendedStructure: ['problem', 'solution', 'benefits', 'features', 'cta'],
    toneGuidelines: ['persuasive', 'benefit-focused', 'clear'],
    avoidWords: ['complicated', 'difficult', 'hard', 'complex'],
    preferWords: ['easy', 'simple', 'effective', 'proven', 'results']
  },
  STORY: {
    maxCharCount: 200,
    recommendedStructure: ['hook', 'setup', 'challenge', 'resolution', 'lesson'],
    toneGuidelines: ['personal', 'authentic', 'relatable'],
    avoidWords: ['perfect', 'always', 'never', 'everyone'],
    preferWords: ['learned', 'discovered', 'realized', 'experienced']
  }
} as const

/**
 * Analyzes content and recommends the best template type
 * Uses lightweight keyword matching instead of heavy AI
 */
export function recommendTemplateType(content: string): {
  recommended: "NEWS" | "STORY" | "PRODUCT"
  confidence: number
  reasoning: string
} {
  if (!content || content.trim().length < 20) {
    return {
      recommended: "STORY",
      confidence: 0.3,
      reasoning: "Content too short for accurate analysis. Defaulting to STORY template."
    }
  }

  const lowerContent = content.toLowerCase()
  const scores = { NEWS: 0, PRODUCT: 0, STORY: 0 }

  // Calculate scores for each template type
  Object.entries(TEMPLATE_KEYWORDS).forEach(([template, keywords]) => {
    const templateKey = template as keyof typeof TEMPLATE_KEYWORDS
    
    // Primary keywords (high weight)
    keywords.primary.forEach(keyword => {
      if (lowerContent.includes(keyword)) {
        scores[templateKey] += 3
      }
    })

    // Secondary keywords (medium weight)
    keywords.secondary.forEach(keyword => {
      if (lowerContent.includes(keyword)) {
        scores[templateKey] += 1
      }
    })

    // Negative keywords (penalty)
    keywords.negative.forEach(keyword => {
      if (lowerContent.includes(keyword)) {
        scores[templateKey] -= 2
      }
    })
  })

  // Find highest scoring template
  const maxScore = Math.max(...Object.values(scores))
  const recommended = Object.entries(scores).find(([_, score]) => score === maxScore)?.[0] as "NEWS" | "STORY" | "PRODUCT"
  
  // Calculate confidence based on score difference
  const totalScore = Object.values(scores).reduce((sum, score) => sum + Math.max(0, score), 0)
  const confidence = totalScore > 0 ? Math.min(0.95, maxScore / totalScore) : 0.3

  // Generate reasoning
  const reasoning = generateRecommendationReasoning(recommended, scores, lowerContent)

  return {
    recommended: recommended || "STORY",
    confidence,
    reasoning
  }
}

/**
 * Learns from user's previous content to suggest brand voice improvements
 * Analyzes patterns in user's existing slides
 */
export function analyzeBrandVoicePatterns(userSlides: Slide[]): BrandVoicePattern {
  if (userSlides.length === 0) {
    return {
      tone: 'casual',
      style: 'conversational',
      avgCharCount: 150,
      commonWords: [],
      emojiUsage: 0,
      hashtagCount: 3
    }
  }

  const contents = userSlides.map(slide => slide.content).filter(Boolean)
  
  // Calculate average character count
  const avgCharCount = Math.round(
    contents.reduce((sum, content) => sum + content.length, 0) / contents.length
  )

  // Analyze emoji usage
  const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu
  const totalEmojis = contents.reduce((sum, content) => {
    const matches = content.match(emojiRegex)
    return sum + (matches ? matches.length : 0)
  }, 0)
  const emojiUsage = Math.round((totalEmojis / contents.length) * 10) / 10

  // Analyze hashtag usage
  const hashtagRegex = /#\w+/g
  const totalHashtags = contents.reduce((sum, content) => {
    const matches = content.match(hashtagRegex)
    return sum + (matches ? matches.length : 0)
  }, 0)
  const hashtagCount = Math.round(totalHashtags / contents.length)

  // Extract common words (excluding stop words)
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those']
  const wordFreq: Record<string, number> = {}
  
  contents.forEach(content => {
    const words = content.toLowerCase().match(/\b\w+\b/g) || []
    words.forEach(word => {
      if (word.length > 3 && !stopWords.includes(word)) {
        wordFreq[word] = (wordFreq[word] || 0) + 1
      }
    })
  })

  const commonWords = Object.entries(wordFreq)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word)

  // Determine tone based on word usage
  const tone = determineToneFromWords(commonWords, contents)
  const style = determineStyleFromPatterns(avgCharCount, emojiUsage, hashtagCount)

  return {
    tone,
    style,
    avgCharCount,
    commonWords,
    emojiUsage,
    hashtagCount
  }
}

/**
 * Provides content optimization suggestions based on template type
 * Uses rule-based analysis instead of heavy AI
 */
export function getContentOptimizationSuggestions(
  content: string,
  templateType: "NEWS" | "STORY" | "PRODUCT",
  userPattern?: BrandVoicePattern
): Array<{
  type: 'length' | 'tone' | 'structure' | 'words' | 'engagement'
  priority: 'high' | 'medium' | 'low'
  suggestion: string
  reason: string
}> {
  const suggestions = []
  const rules = TEMPLATE_OPTIMIZATION_RULES[templateType]

  // Length optimization
  if (content.length > rules.maxCharCount) {
    suggestions.push({
      type: 'length' as const,
      priority: 'high' as const,
      suggestion: `Shorten content to ${rules.maxCharCount} characters or less`,
      reason: `${templateType} templates work best with concise content. Current: ${content.length} chars`
    })
  }

  // Word choice optimization
  const lowerContent = content.toLowerCase()
  rules.avoidWords.forEach(word => {
    if (lowerContent.includes(word)) {
      const preferredAlternatives = rules.preferWords.slice(0, 2).join(' or ')
      suggestions.push({
        type: 'words' as const,
        priority: 'medium' as const,
        suggestion: `Consider replacing "${word}" with ${preferredAlternatives}`,
        reason: `"${word}" weakens your message. ${templateType} content should be more definitive.`
      })
    }
  })

  // Engagement optimization
  if (!content.includes('?') && !content.includes('!') && templateType === 'STORY') {
    suggestions.push({
      type: 'engagement' as const,
      priority: 'medium' as const,
      suggestion: 'Add a question or exclamation to increase engagement',
      reason: 'Story content performs better with emotional punctuation'
    })
  }

  // Brand consistency (if user pattern available)
  if (userPattern) {
    if (Math.abs(content.length - userPattern.avgCharCount) > 50) {
      suggestions.push({
        type: 'tone' as const,
        priority: 'low' as const,
        suggestion: `Adjust length to match your usual style (~${userPattern.avgCharCount} chars)`,
        reason: 'Consistency with your brand voice helps audience recognition'
      })
    }
  }

  return suggestions.slice(0, 3) // Limit to top 3 suggestions
}

/**
 * Tracks template performance for user insights
 * Simple analytics without heavy computation
 */
export function calculateTemplatePerformance(userProjects: CarouselProject[]): {
  mostUsed: string
  recommendedTemplate: "NEWS" | "STORY" | "PRODUCT"
  insights: string[]
} {
  if (userProjects.length === 0) {
    return {
      mostUsed: 'STORY',
      recommendedTemplate: 'STORY',
      insights: ['Start with STORY template for personal content']
    }
  }

  // Count template usage
  const templateCounts: Record<string, number> = {}
  userProjects.forEach(project => {
    if (project.template_type) {
      templateCounts[project.template_type] = (templateCounts[project.template_type] || 0) + 1
    }
  })

  const mostUsed = Object.entries(templateCounts)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'STORY'

  // Generate insights
  const insights = []
  const totalProjects = userProjects.length
  
  if (templateCounts.STORY && templateCounts.STORY / totalProjects > 0.6) {
    insights.push('You prefer storytelling content - great for building personal connection')
  }
  
  if (templateCounts.PRODUCT && templateCounts.PRODUCT / totalProjects > 0.4) {
    insights.push('You create a lot of product content - consider mixing in more stories')
  }
  
  if (templateCounts.NEWS && templateCounts.NEWS / totalProjects > 0.3) {
    insights.push('You share news frequently - your audience values timely information')
  }

  if (insights.length === 0) {
    insights.push('Try experimenting with different template types for variety')
  }

  return {
    mostUsed,
    recommendedTemplate: mostUsed as "NEWS" | "STORY" | "PRODUCT",
    insights
  }
}

// Helper functions
function generateRecommendationReasoning(
  recommended: "NEWS" | "STORY" | "PRODUCT",
  scores: Record<string, number>,
  content: string
): string {
  const reasons = []
  
  if (recommended === 'NEWS') {
    if (content.includes('announced') || content.includes('breaking')) {
      reasons.push('Contains announcement or breaking news language')
    }
    if (content.includes('study') || content.includes('research')) {
      reasons.push('References studies or research')
    }
  } else if (recommended === 'PRODUCT') {
    if (content.includes('solution') || content.includes('helps')) {
      reasons.push('Focuses on solutions and benefits')
    }
    if (content.includes('product') || content.includes('feature')) {
      reasons.push('Mentions products or features')
    }
  } else if (recommended === 'STORY') {
    if (content.includes('my') || content.includes('I ')) {
      reasons.push('Uses personal pronouns')
    }
    if (content.includes('learned') || content.includes('experience')) {
      reasons.push('Shares personal experiences or lessons')
    }
  }

  return reasons.length > 0 
    ? reasons.join('; ') 
    : `Best match based on content analysis (score: ${scores[recommended]})`
}

function determineToneFromWords(commonWords: string[], contents: string[]): string {
  const professionalWords = ['business', 'professional', 'strategy', 'growth', 'success', 'results']
  const casualWords = ['love', 'amazing', 'awesome', 'fun', 'cool', 'great']
  const educationalWords = ['learn', 'tips', 'guide', 'how', 'steps', 'method']

  const allText = contents.join(' ').toLowerCase()
  
  const professionalScore = professionalWords.reduce((score, word) => 
    score + (allText.includes(word) ? 1 : 0), 0)
  const casualScore = casualWords.reduce((score, word) => 
    score + (allText.includes(word) ? 1 : 0), 0)
  const educationalScore = educationalWords.reduce((score, word) => 
    score + (allText.includes(word) ? 1 : 0), 0)

  if (professionalScore > casualScore && professionalScore > educationalScore) {
    return 'professional'
  } else if (educationalScore > casualScore) {
    return 'educational'
  } else {
    return 'casual'
  }
}

function determineStyleFromPatterns(avgCharCount: number, emojiUsage: number, hashtagCount: number): string {
  if (avgCharCount > 200 && emojiUsage < 1) {
    return 'formal'
  } else if (emojiUsage > 2 && hashtagCount > 5) {
    return 'energetic'
  } else if (avgCharCount < 100) {
    return 'concise'
  } else {
    return 'conversational'
  }
} 