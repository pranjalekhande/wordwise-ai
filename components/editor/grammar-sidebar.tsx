"use client"

import React, { useState } from "react"
import { CheckCircle2, Loader2, AlertCircle, Zap, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { useGrammarCheck } from "@/hooks/use-grammar-check"
import type { GrammarIssue } from "@/lib/types"

interface GrammarSidebarProps {
  content: string
  onContentChange: (newContent: string) => void
  slideNumber?: number
  totalSlides?: number
  onGrammarStatusChange?: (issuesCount: number) => void
}

export function GrammarSidebar({ 
  content, 
  onContentChange, 
  slideNumber = 1, 
  totalSlides = 1,
  onGrammarStatusChange
}: GrammarSidebarProps) {
  const [grammarEnabled, setGrammarEnabled] = useState(true)
  
  const {
    issues,
    isChecking,
    error,
    summary,
    checkGrammar,
    smartCheck,
    clearIssues,
    dismissIssue,
    applySuggestion,
  } = useGrammarCheck({
    autoCheck: grammarEnabled,
    minTextLength: 10, // Lower threshold for slides
    debounceMs: 2000, // Faster checking for slides
  })

  // Handle grammar checking as content changes
  React.useEffect(() => {
    if (grammarEnabled && content.trim()) {
      smartCheck(content)
    }
  }, [content, grammarEnabled, smartCheck])

  // Notify parent of grammar status changes
  React.useEffect(() => {
    const grammarSpellingCount = issues.filter(issue => 
      issue.type === "grammar" || issue.type === "spelling"
    ).length
    onGrammarStatusChange?.(grammarSpellingCount)
  }, [issues, onGrammarStatusChange])

  const handleApplySuggestion = (issueId: string, suggestion: string) => {
    const newContent = applySuggestion(issueId, suggestion, content)
    onContentChange(newContent)
  }

  const handleManualCheck = () => {
    if (content.trim()) {
      checkGrammar(content, true)
    }
  }

  // Instagram-specific character limits
  const instagramLimits = {
    title: 60,
    content: 180,
    optimal: 150,
  }

  const isOverLimit = content.length > instagramLimits.content
  const isNearLimit = content.length > instagramLimits.optimal

  // Separate issues by type
  const grammarSpellingIssues = issues.filter(issue => 
    issue.type === "grammar" || issue.type === "spelling"
  )
  const styleIssues = issues.filter(issue => issue.type === "style")

  return (
    <div className="space-y-4">
      {/* Grammar Control */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Grammar Check
            </CardTitle>
            <Switch
              checked={grammarEnabled}
              onCheckedChange={setGrammarEnabled}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              {isChecking ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span className="text-muted-foreground">Checking...</span>
                </>
              ) : summary.totalIssues > 0 ? (
                <>
                  <AlertCircle className="h-3 w-3 text-orange-500" />
                  <span>{summary.totalIssues} issues</span>
                </>
              ) : content.length > 5 ? (
                <>
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  <span className="text-green-600">Clean</span>
                </>
              ) : null}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleManualCheck}
              disabled={isChecking || !content.trim()}
            >
              Check Now
            </Button>
          </div>

          {/* Error display */}
          {error && (
            <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instagram Character Limits */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Instagram Limits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Characters</span>
              <Badge variant={isOverLimit ? "destructive" : isNearLimit ? "secondary" : "outline"}>
                {content.length}/{instagramLimits.content}
              </Badge>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  isOverLimit ? "bg-destructive" : isNearLimit ? "bg-yellow-500" : "bg-green-500"
                }`}
                style={{ 
                  width: `${Math.min(100, (content.length / instagramLimits.content) * 100)}%` 
                }}
              />
            </div>
            {isOverLimit ? (
              <p className="text-xs text-red-600">
                Over Instagram limit by {content.length - instagramLimits.content} characters
              </p>
            ) : isNearLimit ? (
              <p className="text-xs text-yellow-600">
                Approaching limit ({instagramLimits.content - content.length} remaining)
              </p>
            ) : (
              <p className="text-xs text-green-600">
                Optimal length ({instagramLimits.content - content.length} remaining)
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Grammar & Spelling Issues */}
      {grammarEnabled && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Grammar & Spelling
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isChecking ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Checking grammar...
              </div>
            ) : grammarSpellingIssues.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Issues:</span>
                  <span className="font-medium">{grammarSpellingIssues.length}</span>
                </div>
                
                {/* Individual Issues */}
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {grammarSpellingIssues.slice(0, 4).map((issue) => (
                    <GrammarIssueCard
                      key={issue.id}
                      issue={issue}
                      content={content}
                      onApply={(suggestion) => handleApplySuggestion(issue.id, suggestion)}
                      onDismiss={() => dismissIssue(issue.id)}
                    />
                  ))}
                  {grammarSpellingIssues.length > 4 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{grammarSpellingIssues.length - 4} more issues
                    </p>
                  )}
                </div>
              </div>
            ) : content.length > 5 ? (
              <div className="text-sm text-green-600 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                No grammar or spelling issues
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Style Suggestions */}
      {grammarEnabled && styleIssues.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Style Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {styleIssues.slice(0, 3).map((issue) => (
                <div key={issue.id} className="p-2 border rounded-sm bg-blue-50/50 border-blue-200">
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-xs font-medium text-blue-600">
                      Improve Style
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0"
                      onClick={() => dismissIssue(issue.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">
                    "{content.substring(issue.start, Math.min(issue.end, issue.start + 30))}..."
                  </p>
                  <p className="text-xs mb-2 text-blue-700">{issue.message}</p>
                  {issue.suggestions.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 w-full text-xs justify-start border-blue-200 text-blue-700 hover:bg-blue-50"
                      onClick={() => handleApplySuggestion(issue.id, issue.suggestions[0])}
                    >
                      "{issue.suggestions[0]}"
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Individual Grammar Issue Card Component
interface GrammarIssueCardProps {
  issue: GrammarIssue
  content: string
  onApply: (suggestion: string) => void
  onDismiss: () => void
}

function GrammarIssueCard({ issue, content, onApply, onDismiss }: GrammarIssueCardProps) {
  const getSeverityColor = () => {
    switch (issue.severity) {
      case "high": return "border-red-200 bg-red-50"
      case "medium": return "border-orange-200 bg-orange-50"
      case "low": return "border-yellow-200 bg-yellow-50"
      default: return "border-gray-200 bg-gray-50"
    }
  }

  const getTypeColor = () => {
    switch (issue.type) {
      case "spelling": return "text-red-600"
      case "grammar": return "text-orange-600"
      default: return "text-gray-600"
    }
  }

  // Get text excerpt around the issue
  const getExcerpt = () => {
    const start = Math.max(0, issue.start - 10)
    const end = Math.min(content.length, issue.end + 10)
    const excerpt = content.substring(start, end)
    const problemText = content.substring(issue.start, issue.end)
    return { excerpt, problemText }
  }

  const { excerpt, problemText } = getExcerpt()

  return (
    <div className={`p-2 border rounded-sm ${getSeverityColor()}`}>
      <div className="flex items-start justify-between mb-1">
        <span className={`text-xs font-medium capitalize ${getTypeColor()}`}>
          {issue.type}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-4 w-4 p-0"
          onClick={onDismiss}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
      
      <p className="text-xs text-muted-foreground mb-1">
        "...{excerpt}..."
      </p>
      <p className="text-xs font-medium text-red-700 mb-1">
        "{problemText}"
      </p>
      <p className="text-xs mb-2">{issue.message}</p>
      
      {issue.suggestions.length > 0 && (
        <div className="space-y-1">
          {issue.suggestions.slice(0, 2).map((suggestion, idx) => (
            <Button
              key={idx}
              variant="outline"
              size="sm"
              className="h-6 w-full text-xs justify-start"
              onClick={() => onApply(suggestion)}
            >
              Replace with "{suggestion}"
            </Button>
          ))}
        </div>
      )}
    </div>
  )
} 