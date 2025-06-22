"use client"

import { useState, useEffect } from "react"
import { TrendingUp, Users, BarChart3, Lightbulb, Target } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { analyzeBrandVoicePatterns, calculateTemplatePerformance, type BrandVoicePattern } from "@/lib/template-optimizer"
import type { CarouselProject, Slide } from "@/lib/types"

interface BrandVoiceInsightsProps {
  userProjects: CarouselProject[]
  userSlides: Slide[]
  className?: string
}

/**
 * Brand Voice Insights Component
 * Shows learned patterns from user's content and template usage
 * Provides lightweight analytics and recommendations
 */
export function BrandVoiceInsights({ 
  userProjects, 
  userSlides,
  className = ""
}: BrandVoiceInsightsProps) {
  const [brandPattern, setBrandPattern] = useState<BrandVoicePattern | null>(null)
  const [templatePerformance, setTemplatePerformance] = useState<{
    mostUsed: string
    recommendedTemplate: "NEWS" | "STORY" | "PRODUCT"
    insights: string[]
  } | null>(null)

  useEffect(() => {
    if (userSlides.length > 0) {
      const pattern = analyzeBrandVoicePatterns(userSlides)
      setBrandPattern(pattern)
    }

    if (userProjects.length > 0) {
      const performance = calculateTemplatePerformance(userProjects)
      setTemplatePerformance(performance)
    }
  }, [userSlides, userProjects])

  if (!brandPattern && !templatePerformance) {
    return (
      <div className={className}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Lightbulb className="h-4 w-4" />
              Brand Voice Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                Create more carousels to see your brand voice patterns and insights.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getTemplateIcon = (template: string) => {
    switch (template) {
      case 'NEWS': return TrendingUp
      case 'PRODUCT': return Target
      case 'STORY': return Users
      default: return BarChart3
    }
  }

  const getToneColor = (tone: string) => {
    switch (tone) {
      case 'professional': return 'bg-blue-100 text-blue-700'
      case 'casual': return 'bg-green-100 text-green-700'
      case 'educational': return 'bg-purple-100 text-purple-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStyleColor = (style: string) => {
    switch (style) {
      case 'formal': return 'bg-slate-100 text-slate-700'
      case 'energetic': return 'bg-orange-100 text-orange-700'
      case 'concise': return 'bg-yellow-100 text-yellow-700'
      case 'conversational': return 'bg-emerald-100 text-emerald-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Lightbulb className="h-4 w-4" />
            Brand Voice Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Brand Voice Pattern */}
          {brandPattern && (
            <div className="space-y-3">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Your Writing Style
              </h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Tone</span>
                    <Badge className={`text-xs ${getToneColor(brandPattern.tone)}`}>
                      {brandPattern.tone}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Style</span>
                    <Badge className={`text-xs ${getStyleColor(brandPattern.style)}`}>
                      {brandPattern.style}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Avg Length</span>
                    <span className="text-xs font-medium">{brandPattern.avgCharCount} chars</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Emoji Use</span>
                    <span className="text-xs font-medium">{brandPattern.emojiUsage}/slide</span>
                  </div>
                </div>
              </div>

              {brandPattern.commonWords.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Common Words</p>
                  <div className="flex flex-wrap gap-1">
                    {brandPattern.commonWords.slice(0, 6).map((word, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {word}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Template Performance */}
          {templatePerformance && (
            <div className="space-y-3 pt-3 border-t">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Template Usage
              </h4>
              
              <div className="flex items-center gap-2">
                {React.createElement(getTemplateIcon(templatePerformance.mostUsed), { 
                  className: "h-4 w-4 text-muted-foreground" 
                })}
                <span className="text-sm font-medium">{templatePerformance.mostUsed}</span>
                <Badge variant="outline" className="text-xs">Most Used</Badge>
              </div>

              {templatePerformance.insights.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Insights</p>
                  {templatePerformance.insights.map((insight, index) => (
                    <div key={index} className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
                      • {insight}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Content Stats */}
          {userSlides.length > 0 && (
            <div className="space-y-3 pt-3 border-t">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Content Stats
              </h4>
              
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Slides</span>
                  <span className="font-medium">{userSlides.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Carousels</span>
                  <span className="font-medium">{userProjects.length}</span>
                </div>
              </div>

              {brandPattern && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Consistency Score</span>
                    <span className="font-medium">
                      {Math.round((1 - Math.abs(brandPattern.avgCharCount - 150) / 150) * 100)}%
                    </span>
                  </div>
                  <Progress 
                    value={Math.round((1 - Math.abs(brandPattern.avgCharCount - 150) / 150) * 100)} 
                    className="h-2" 
                  />
                  <p className="text-xs text-muted-foreground">
                    How consistent your content length is
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 