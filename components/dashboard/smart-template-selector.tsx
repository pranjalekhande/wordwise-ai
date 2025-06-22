"use client"

import { useState, useEffect } from "react"
import { Sparkles, TrendingUp, Users, Lightbulb } from "lucide-react"
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

  const TemplateIcon = getTemplateIcon(recommendation.recommended)

  return (
    <div className={`p-3 bg-blue-50 border border-blue-200 rounded-lg ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <TemplateIcon className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-900">
            Recommended: {recommendation.recommended}
          </span>
        </div>
        {recommendation.confidence >= 0.8 && (
          <Badge variant="secondary" className="text-xs">
            High confidence
          </Badge>
        )}
      </div>
      
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => onTemplateChange(recommendation.recommended)}
          className="bg-blue-600 hover:bg-blue-700 text-xs"
        >
          Switch to {recommendation.recommended}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setRecommendation(null)}
          className="text-blue-600 border-blue-300 text-xs"
        >
          Keep {currentTemplate}
        </Button>
      </div>
    </div>
  )
} 