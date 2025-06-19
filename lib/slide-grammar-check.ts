import type { GrammarCheckResponse, GrammarIssue } from "@/lib/types"
import type { ContentVariation } from "@/app/api/generate-variations/route"

// Grammar check service integration for slides
export interface SlideGrammarCheckResult {
  hasErrors: boolean
  suggestions: GrammarIssue[]
  correctedText: string
  originalText: string
  confidence: number
}

// Enhanced grammar service for slide content
export const checkSlideGrammar = async (content: string): Promise<SlideGrammarCheckResult> => {
  try {
    const response = await fetch('/api/documents/check-grammar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        text: content,
        checkType: 'all',
        settings: {
          enableSpellCheck: true,
          enableGrammarCheck: true,
          enableStyleCheck: true, // Include style for slide content
          maxSuggestions: 3, // Limit suggestions for slides
          instagram_mode: true // Special mode for Instagram content
        }
      })
    })
    
    if (!response.ok) {
      throw new Error('Grammar check failed')
    }
    
    const result: GrammarCheckResponse = await response.json()
    
    return {
      hasErrors: result.issues.length > 0,
      suggestions: result.issues.map((issue: GrammarIssue) => ({
        ...issue,
        id: issue.id || Math.random().toString(),
        // Prioritize spelling and grammar over style for slides
        severity: issue.type === 'spelling' ? 'high' : 
                 issue.type === 'grammar' ? 'medium' : 'low'
      })),
      correctedText: result.correctedText || content,
      originalText: content,
      confidence: 0.9
    }
    
  } catch (error) {
    console.error('Grammar check error:', error)
    return {
      hasErrors: false,
      suggestions: [],
      correctedText: content,
      originalText: content,
      confidence: 0
    }
  }
}

// Batch grammar check for all slide variations
export const checkAllVariations = async (variations: ContentVariation[]): Promise<Map<string, SlideGrammarCheckResult>> => {
  const results = new Map<string, SlideGrammarCheckResult>()
  
  // Process variations in parallel for better performance
  const grammarChecks = variations.map(async (variation) => {
    const result = await checkSlideGrammar(variation.content)
    return { variationId: variation.id, result }
  })
  
  try {
    const grammarResults = await Promise.all(grammarChecks)
    
    grammarResults.forEach(({ variationId, result }) => {
      results.set(variationId, result)
    })
  } catch (error) {
    console.error('Batch grammar check failed:', error)
    // Return partial results if some checks failed
  }
  
  return results
}

// Get the variation with the fewest grammar issues
export const getBestVariationByGrammar = (
  variations: ContentVariation[], 
  grammarResults: Map<string, SlideGrammarCheckResult>
): ContentVariation | null => {
  if (variations.length === 0) return null
  
  return variations.reduce((best, current) => {
    const currentResult = grammarResults.get(current.id)
    const bestResult = grammarResults.get(best.id)
    
    if (!currentResult) return best
    if (!bestResult) return current
    
    // Prioritize variations with fewer high-severity issues
    const currentCriticalIssues = currentResult.suggestions.filter(s => s.severity === 'high').length
    const bestCriticalIssues = bestResult.suggestions.filter(s => s.severity === 'high').length
    
    if (currentCriticalIssues < bestCriticalIssues) return current
    if (currentCriticalIssues > bestCriticalIssues) return best
    
    // If equal critical issues, prefer fewer total issues
    return currentResult.suggestions.length < bestResult.suggestions.length ? current : best
  })
}

// Instagram-specific validation for slide content
export const validateInstagramContent = (content: string): {
  isValid: boolean
  issues: string[]
  suggestions: string[]
} => {
  const issues: string[] = []
  const suggestions: string[] = []
  
  // Character limit check
  if (content.length > 180) {
    issues.push('Content exceeds Instagram slide limit (180 characters)')
    suggestions.push('Consider shortening your message or splitting into multiple slides')
  }
  
  // Line break check
  const lineCount = content.split('\n').length
  if (lineCount > 6) {
    issues.push('Too many line breaks may affect readability on mobile')
    suggestions.push('Keep content to 4-5 lines maximum for better mobile viewing')
  }
  
  // Hashtag check in content (should be separate)
  const hashtagCount = (content.match(/#\w+/g) || []).length
  if (hashtagCount > 2) {
    issues.push('Too many hashtags in slide content')
    suggestions.push('Move hashtags to a separate comment or final slide')
  }
  
  // Emoji overuse check
  const emojiCount = (content.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu) || []).length
  if (emojiCount > 3) {
    suggestions.push('Consider reducing emoji usage for better professional appearance')
  }
  
  // Call-to-action check
  const hasCTA = /\b(click|swipe|tap|comment|share|save|follow|dm|link in bio)\b/i.test(content)
  if (!hasCTA && content.length > 100) {
    suggestions.push('Consider adding a call-to-action to increase engagement')
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    suggestions
  }
}

// Combined content quality score
export const calculateSlideQualityScore = (
  content: string,
  grammarResult: SlideGrammarCheckResult,
  instagramValidation: ReturnType<typeof validateInstagramContent>
): {
  score: number // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  improvements: string[]
} => {
  let score = 100
  const improvements: string[] = []
  
  // Grammar deductions
  const highSeverityIssues = grammarResult.suggestions.filter(s => s.severity === 'high').length
  const mediumSeverityIssues = grammarResult.suggestions.filter(s => s.severity === 'medium').length
  const lowSeverityIssues = grammarResult.suggestions.filter(s => s.severity === 'low').length
  
  score -= (highSeverityIssues * 15) + (mediumSeverityIssues * 8) + (lowSeverityIssues * 3)
  
  if (highSeverityIssues > 0) {
    improvements.push(`Fix ${highSeverityIssues} critical spelling/grammar issue${highSeverityIssues > 1 ? 's' : ''}`)
  }
  
  // Instagram validation deductions
  score -= instagramValidation.issues.length * 10
  
  if (instagramValidation.issues.length > 0) {
    improvements.push(...instagramValidation.issues)
  }
  
  // Length optimization
  if (content.length < 50) {
    score -= 10
    improvements.push('Consider adding more detail to your message')
  } else if (content.length > 160) {
    score -= 5
    improvements.push('Consider shortening for better readability')
  }
  
  // Engagement factors
  if (!/[!?]/.test(content)) {
    score -= 5
    improvements.push('Add excitement or questions to increase engagement')
  }
  
  score = Math.max(0, Math.min(100, score))
  
  const grade = score >= 90 ? 'A' : 
               score >= 80 ? 'B' : 
               score >= 70 ? 'C' : 
               score >= 60 ? 'D' : 'F'
  
  return { score, grade, improvements }
} 