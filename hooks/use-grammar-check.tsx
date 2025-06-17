import { useState, useCallback, useRef, useEffect } from "react"
import type { GrammarIssue, GrammarCheckResponse } from "@/lib/types"

interface UseGrammarCheckOptions {
  debounceMs?: number
  autoCheck?: boolean
  minTextLength?: number
  pauseDetectionMs?: number
}

export function useGrammarCheck(options: UseGrammarCheckOptions = {}) {
  const { 
    debounceMs = 5000, // Increased from 1000ms to 5000ms
    autoCheck = true,
    minTextLength = 50, // Minimum text length before checking
    pauseDetectionMs = 2000 // Time to wait for user to pause typing
  } = options
  
  const [issues, setIssues] = useState<GrammarIssue[]>([])
  const [isChecking, setIsChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState({
    totalIssues: 0,
    grammarIssues: 0,
    spellingIssues: 0,
    styleIssues: 0
  })
  
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pauseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastCheckedTextRef = useRef<string>("")
  const lastCheckTimeRef = useRef<number>(0)
  const isTypingRef = useRef<boolean>(false)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Track typing activity
  const trackTyping = useCallback(() => {
    isTypingRef.current = true
    
    // Clear existing typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    // Mark as not typing after pause period
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false
    }, pauseDetectionMs)
  }, [pauseDetectionMs])

  // Check if text change is meaningful enough to warrant a grammar check
  const shouldCheckText = useCallback((newText: string): boolean => {
    const trimmedText = newText.trim()
    
    // Don't check empty or very short text
    if (trimmedText.length < minTextLength) {
      return false
    }
    
    // Don't check if user is actively typing
    if (isTypingRef.current) {
      return false
    }
    
    // Don't check if text hasn't changed significantly
    const lastText = lastCheckedTextRef.current
    const textDiff = Math.abs(trimmedText.length - lastText.length)
    const similarityThreshold = Math.max(10, lastText.length * 0.05) // 5% change or minimum 10 chars
    
    if (textDiff < similarityThreshold && trimmedText.includes(lastText.substring(0, Math.min(100, lastText.length)))) {
      return false
    }
    
    // Don't check too frequently (minimum 30 seconds between checks)
    const timeSinceLastCheck = Date.now() - lastCheckTimeRef.current
    if (timeSinceLastCheck < 30000) {
      return false
    }
    
    // Check for sentence or paragraph completion
    const endsWithSentence = /[.!?]\s*$/.test(trimmedText)
    const endsWithParagraph = /\n\s*\n\s*$/.test(trimmedText)
    const hasMinimumContent = trimmedText.split(/[.!?]/).length >= 2 // At least 2 sentences
    
    return endsWithSentence || endsWithParagraph || hasMinimumContent
  }, [minTextLength])

  const checkGrammar = useCallback(async (text: string, force = false) => {
    if (!text.trim()) {
      setIssues([])
      setSummary({
        totalIssues: 0,
        grammarIssues: 0,
        spellingIssues: 0,
        styleIssues: 0
      })
      lastCheckedTextRef.current = ""
      return
    }

    // Skip if not forced and doesn't meet checking criteria
    if (!force && !shouldCheckText(text)) {
      return
    }

    setError(null)
    setIsChecking(true)
    lastCheckTimeRef.current = Date.now()
    lastCheckedTextRef.current = text.trim()

    try {
      const response = await fetch("/api/documents/check-grammar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to check grammar")
      }

      const result: GrammarCheckResponse = await response.json()
      setIssues(result.issues)
      setSummary(result.summary)
    } catch (err) {
      console.error("Grammar check error:", err)
      setError(err instanceof Error ? err.message : "Failed to check grammar")
    } finally {
      setIsChecking(false)
    }
  }, [shouldCheckText])

  const smartCheck = useCallback((text: string) => {
    if (!autoCheck) return

    // Track that user is typing
    trackTyping()

    // Clear existing timeouts
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current)
    }

    // Set up pause detection - only check after user stops typing
    pauseTimeoutRef.current = setTimeout(() => {
      if (!isTypingRef.current && shouldCheckText(text)) {
        // Additional delay before actual check to ensure user is truly done
        debounceTimeoutRef.current = setTimeout(() => {
          checkGrammar(text)
        }, 1000) // Short additional delay after pause detection
      }
    }, pauseDetectionMs)
  }, [checkGrammar, autoCheck, trackTyping, pauseDetectionMs, shouldCheckText])

  // Legacy debouncedCheck for backward compatibility (now uses smartCheck)
  const debouncedCheck = useCallback((text: string) => {
    smartCheck(text)
  }, [smartCheck])

  const clearIssues = useCallback(() => {
    setIssues([])
    setSummary({
      totalIssues: 0,
      grammarIssues: 0,
      spellingIssues: 0,
      styleIssues: 0
    })
    setError(null)
    lastCheckedTextRef.current = ""
  }, [])

  const dismissIssue = useCallback((issueId: string) => {
    setIssues(prev => prev.filter(issue => issue.id !== issueId))
    setSummary(prev => ({
      ...prev,
      totalIssues: prev.totalIssues - 1
    }))
  }, [])

  const applySuggestion = useCallback((issueId: string, suggestion: string, text: string) => {
    const issue = issues.find(i => i.id === issueId)
    if (!issue) return text

    // Use the originalText to find and replace instead of relying on positions
    const originalText = issue.originalText
    if (!originalText) {
      console.warn("No originalText found for issue:", issue)
      return text
    }

    // Find the first occurrence of the original text
    const startIndex = text.indexOf(originalText)
    if (startIndex === -1) {
      // If exact match not found, try to find a close match with some tolerance
      const words = originalText.trim().split(/\s+/)
      if (words.length === 1) {
        // Single word - try case-insensitive search
        const regex = new RegExp(`\\b${words[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
        const match = text.match(regex)
        if (match) {
          const matchStart = text.indexOf(match[0])
          const newText = text.substring(0, matchStart) + suggestion + text.substring(matchStart + match[0].length)
          
          // Remove this issue from the list
          setIssues(prev => prev.filter(i => i.id !== issueId))
          setSummary(prev => ({
            ...prev,
            totalIssues: prev.totalIssues - 1,
            grammarIssues: issue.type === 'grammar' ? prev.grammarIssues - 1 : prev.grammarIssues,
            spellingIssues: issue.type === 'spelling' ? prev.spellingIssues - 1 : prev.spellingIssues,
            styleIssues: issue.type === 'style' ? prev.styleIssues - 1 : prev.styleIssues
          }))
          
          return newText
        }
      }
      
      console.warn("Original text not found in document:", originalText)
      console.warn("Document text sample:", text.substring(Math.max(0, issue.start - 20), issue.start + 50))
      return text
    }

    // Replace the found text with the suggestion
    const newText = text.substring(0, startIndex) + suggestion + text.substring(startIndex + originalText.length)

    // Remove this specific issue from the list and update summary
    setIssues(prev => prev.filter(i => i.id !== issueId))
    setSummary(prev => ({
      ...prev,
      totalIssues: prev.totalIssues - 1,
      grammarIssues: issue.type === 'grammar' ? prev.grammarIssues - 1 : prev.grammarIssues,
      spellingIssues: issue.type === 'spelling' ? prev.spellingIssues - 1 : prev.spellingIssues,
      styleIssues: issue.type === 'style' ? prev.styleIssues - 1 : prev.styleIssues
    }))

    // Don't reset all issues, just this one
    // The remaining issues should still be valid for the new text
    
    return newText
  }, [issues])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current)
      if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current)
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    }
  }, [])

  return {
    issues,
    isChecking,
    error,
    summary,
    checkGrammar,
    debouncedCheck, // Legacy support
    smartCheck, // New smart checking method
    clearIssues,
    dismissIssue,
    applySuggestion,
  }
} 