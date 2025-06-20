"use client"

import React, { useState } from "react"
import { Sparkles, Loader2, CheckCircle2, X, Zap, Hash, AtSign, Smile } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { StyleSuggestion } from "@/lib/types"

interface AiStyleSuggestionsProps {
  content: string
  onApplySuggestion: (suggestion: StyleSuggestion) => void
  isLoading?: boolean
  className?: string
  templateType?: "NEWS" | "STORY" | "PRODUCT"
}

export function AiStyleSuggestions({ 
  content, 
  onApplySuggestion, 
  isLoading = false,
  className = "",
  templateType = "STORY"
}: AiStyleSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<StyleSuggestion[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set())

  const analyzeContent = async () => {
    if (!content.trim() || content.length < 10) return

    setIsAnalyzing(true)
    try {
      const response = await fetch('/api/analyze-style', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, template_type: templateType }),
      })

      if (response.ok) {
        const { suggestions: newSuggestions } = await response.json()
        setSuggestions(newSuggestions || [])
        setDismissedSuggestions(new Set()) // Reset dismissed suggestions
      }
    } catch (error) {
      console.error('Error analyzing content:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleApplySuggestion = (suggestion: StyleSuggestion) => {
    onApplySuggestion(suggestion)
    // Remove applied suggestion
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id))
  }

  const handleDismissSuggestion = (suggestionId: string) => {
    setDismissedSuggestions(prev => new Set([...prev, suggestionId]))
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "emphasis": return Zap
      case "hashtag": return Hash
      case "emoji": return Smile
      case "mention": return AtSign
      case "structure": return Sparkles
      default: return Sparkles
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "emphasis": return "text-orange-600 bg-orange-50 border-orange-200"
      case "hashtag": return "text-blue-600 bg-blue-50 border-blue-200"
      case "emoji": return "text-yellow-600 bg-yellow-50 border-yellow-200"
      case "mention": return "text-purple-600 bg-purple-50 border-purple-200"
      case "structure": return "text-green-600 bg-green-50 border-green-200"
      default: return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return "High"
    if (confidence >= 0.6) return "Medium"
    return "Low"
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "bg-green-100 text-green-700"
    if (confidence >= 0.6) return "bg-yellow-100 text-yellow-700"
    return "bg-gray-100 text-gray-700"
  }

  const visibleSuggestions = suggestions.filter(s => !dismissedSuggestions.has(s.id))

  return (
    <div className={className}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              AI Style Suggestions ({templateType})
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={analyzeContent}
              disabled={isAnalyzing || !content.trim() || content.length < 10}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-3 w-3 mr-1" />
                  Analyze
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Getting suggestions...
            </div>
          )}

          {!isLoading && visibleSuggestions.length === 0 && suggestions.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-4">
              Click "Analyze" to get AI-powered styling suggestions for your content.
            </div>
          )}

          {!isLoading && visibleSuggestions.length === 0 && suggestions.length > 0 && (
            <div className="text-sm text-green-600 text-center py-4 flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              All suggestions applied or dismissed!
            </div>
          )}

          {visibleSuggestions.map((suggestion) => {
            const TypeIcon = getTypeIcon(suggestion.type)
            return (
              <div
                key={suggestion.id}
                className={`p-3 rounded-lg border ${getTypeColor(suggestion.type)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <TypeIcon className="h-4 w-4" />
                    <span className="text-sm font-medium capitalize">
                      {suggestion.type}
                    </span>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getConfidenceColor(suggestion.confidence)}`}
                    >
                      {getConfidenceLabel(suggestion.confidence)}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => handleDismissSuggestion(suggestion.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>

                <p className="text-sm mb-2">{suggestion.reason}</p>

                <div className="space-y-2">
                  <div className="text-xs">
                    <span className="font-medium">Original:</span> "{suggestion.original}"
                  </div>
                  <div className="text-xs">
                    <span className="font-medium">Suggested:</span> "{suggestion.suggestion}"
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-3 text-xs"
                  onClick={() => handleApplySuggestion(suggestion)}
                >
                  Apply Suggestion
                </Button>
              </div>
            )
          })}

          {visibleSuggestions.length > 0 && (
            <div className="text-xs text-muted-foreground text-center pt-2">
              {visibleSuggestions.length} suggestion{visibleSuggestions.length !== 1 ? 's' : ''} available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 