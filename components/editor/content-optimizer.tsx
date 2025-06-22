"use client"

import { useState, useEffect } from "react"
import { Target, AlertTriangle, CheckCircle2, Lightbulb, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getContentOptimizationSuggestions, analyzeBrandVoicePatterns, type BrandVoicePattern } from "@/lib/template-optimizer"
import type { Slide } from "@/lib/types"

interface ContentOptimizerProps {
  content: string
  templateType: "NEWS" | "STORY" | "PRODUCT"
  userSlides: Slide[]
  onContentChange?: (content: string) => void
  className?: string
}

/**
 * Content Optimizer Component
 * Provides real-time optimization suggestions based on template type and user patterns
 * Uses lightweight rule-based analysis for fast, efficient suggestions
 */
export function ContentOptimizer({ 
  content, 
  templateType, 
  userSlides,
  onContentChange,
  className = ""
}: ContentOptimizerProps) {
  const [suggestions, setSuggestions] = useState<Array<{
    type: 'length' | 'tone' | 'structure' | 'words' | 'engagement'
    priority: 'high' | 'medium' | 'low'
    suggestion: string
    reason: string
  }>>([])
  const [userPattern, setUserPattern] = useState<BrandVoicePattern | null>(null)
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set())

  // Analyze user patterns
  useEffect(() => {
    if (userSlides.length > 0) {
      const pattern = analyzeBrandVoicePatterns(userSlides)
      setUserPattern(pattern)
    }
  }, [userSlides])

  // Generate suggestions when content or template changes
  useEffect(() => {
    if (content && content.trim().length > 10) {
      const newSuggestions = getContentOptimizationSuggestions(
        content,
        templateType,
        userPattern || undefined
      )
      setSuggestions(newSuggestions)
      // Reset dismissed suggestions when content changes significantly
      if (content.length % 50 === 0) { // Reset every 50 characters
        setDismissedSuggestions(new Set())
      }
    } else {
      setSuggestions([])
    }
  }, [content, templateType, userPattern])

  const handleDismissSuggestion = (suggestionText: string) => {
    setDismissedSuggestions(prev => new Set([...prev, suggestionText]))
  }

  const handleApplySuggestion = (suggestion: any) => {
    if (onContentChange) {
      // For length suggestions, we can't auto-apply, just show the suggestion
      if (suggestion.type === 'length') {
        // Just dismiss the suggestion since user needs to manually shorten
        handleDismissSuggestion(suggestion.suggestion)
      } else if (suggestion.type === 'words') {
        // For word replacement suggestions, we could implement smart replacement
        // For now, just dismiss and let user manually apply
        handleDismissSuggestion(suggestion.suggestion)
      } else if (suggestion.type === 'engagement') {
        // For engagement suggestions like adding punctuation
        if (suggestion.suggestion.includes('question')) {
          onContentChange(content + ' What do you think?')
        } else if (suggestion.suggestion.includes('exclamation')) {
          onContentChange(content + '!')
        }
        handleDismissSuggestion(suggestion.suggestion)
      }
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return AlertTriangle
      case 'medium': return Target
      case 'low': return Lightbulb
      default: return CheckCircle2
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200'
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'length': return 'Length'
      case 'tone': return 'Tone'
      case 'structure': return 'Structure'
      case 'words': return 'Word Choice'
      case 'engagement': return 'Engagement'
      default: return 'General'
    }
  }

  const visibleSuggestions = suggestions.filter(s => !dismissedSuggestions.has(s.suggestion))

  if (visibleSuggestions.length === 0) {
    return (
      <div className={className}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Content Optimization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-2">
              <p className="text-sm text-green-600">
                Your content looks great for {templateType} template!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Target className="h-4 w-4" />
            Content Optimization ({templateType})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {visibleSuggestions.map((suggestion, index) => {
            const PriorityIcon = getPriorityIcon(suggestion.priority)
            return (
              <div
                key={index}
                className={`p-3 rounded-lg border ${getPriorityColor(suggestion.priority)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <PriorityIcon className="h-4 w-4" />
                    <div>
                      <span className="text-sm font-medium">
                        {getTypeLabel(suggestion.type)}
                      </span>
                      <Badge className="ml-2 text-xs" variant="outline">
                        {suggestion.priority}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => handleDismissSuggestion(suggestion.suggestion)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>

                <p className="text-sm mb-2">{suggestion.suggestion}</p>
                <p className="text-xs opacity-75">{suggestion.reason}</p>

                {(suggestion.type === 'engagement' && onContentChange) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-3 text-xs"
                    onClick={() => handleApplySuggestion(suggestion)}
                  >
                    Apply Suggestion
                  </Button>
                )}
              </div>
            )
          })}

          <div className="text-xs text-muted-foreground text-center pt-2">
            {visibleSuggestions.length} optimization tip{visibleSuggestions.length !== 1 ? 's' : ''} available
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 