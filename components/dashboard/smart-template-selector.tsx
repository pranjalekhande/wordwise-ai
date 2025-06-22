"use client"

import { useState, useEffect } from "react"
import { Sparkles, TrendingUp, Users, Lightbulb } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { recommendTemplateType } from "@/lib/template-optimizer"

interface SmartTemplateSelectorProps {
  content: string
  currentTemplate: "NEWS" | "STORY" | "PRODUCT"
  onTemplateChange: (template: "NEWS" | "STORY" | "PRODUCT") => void
  className?: string
}

/**
 * Smart Template Selector Component
 * Provides AI-powered template recommendations based on content analysis
 * Uses lightweight pattern matching for fast, efficient suggestions
 */
export function SmartTemplateSelector({ 
  content, 
  currentTemplate, 
  onTemplateChange,
  className = ""
}: SmartTemplateSelectorProps) {
  const [recommendation, setRecommendation] = useState<{
    recommended: "NEWS" | "STORY" | "PRODUCT"
    confidence: number
    reasoning: string
  } | null>(null)

  // Analyze content when it changes
  useEffect(() => {
    if (content && content.trim().length > 20) {
      const result = recommendTemplateType(content)
      setRecommendation(result)
    } else {
      setRecommendation(null)
    }
  }, [content])

  // Don't show if no recommendation or if already using recommended template
  if (!recommendation || recommendation.recommended === currentTemplate) {
    return null
  }

  const getTemplateIcon = (template: string) => {
    switch (template) {
      case 'NEWS': return TrendingUp
      case 'PRODUCT': return Sparkles
      case 'STORY': return Users
      default: return Lightbulb
    }
  }

  const getTemplateDescription = (template: string) => {
    switch (template) {
      case 'NEWS': return 'Breaking news, announcements, updates'
      case 'PRODUCT': return 'Product launches, features, marketing'
      case 'STORY': return 'Personal stories, case studies, journeys'
      default: return 'General content structure'
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-700 border-green-200'
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    return 'bg-blue-100 text-blue-700 border-blue-200'
  }

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High Confidence'
    if (confidence >= 0.6) return 'Medium Confidence'
    return 'Suggestion'
  }

  const TemplateIcon = getTemplateIcon(recommendation.recommended)

  return (
    <div className={className}>
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm text-blue-800">
            <Lightbulb className="h-4 w-4" />
            Smart Template Recommendation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TemplateIcon className="h-5 w-5 text-blue-600" />
              <div>
                <span className="font-medium text-blue-900">{recommendation.recommended} Template</span>
                <p className="text-xs text-blue-700">{getTemplateDescription(recommendation.recommended)}</p>
              </div>
            </div>
            <Badge className={`text-xs ${getConfidenceColor(recommendation.confidence)}`}>
              {getConfidenceLabel(recommendation.confidence)}
            </Badge>
          </div>

          <div className="text-xs text-blue-700 bg-white/50 rounded p-2">
            <span className="font-medium">Why this template?</span>
            <br />
            {recommendation.reasoning}
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => onTemplateChange(recommendation.recommended)}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Switch to {recommendation.recommended}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setRecommendation(null)}
              className="text-blue-600 border-blue-300"
            >
              Keep {currentTemplate}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 