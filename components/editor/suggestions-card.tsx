"use client"

import { Sparkles, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Suggestion } from "@/app/api/generate-variations/route"

interface SuggestionsCardProps {
  suggestions: Suggestion[]
  onReplace: (content: string) => void
  onDismiss: () => void
}

export function SuggestionsCard({ suggestions, onReplace, onDismiss }: SuggestionsCardProps) {
  const handleReplace = (suggestion: Suggestion) => {
    onReplace(suggestion.content)
    onDismiss() // Auto-close after replacement
  }

  return (
    <Card className="mt-4 border-l-4 border-l-blue-500 bg-blue-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <CardTitle className="text-sm text-blue-900">Wording Suggestions</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-6 w-6 p-0 hover:bg-blue-100"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions.map((suggestion, index) => (
          <div key={suggestion.id} className="p-3 bg-white rounded border border-blue-200/50">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200">
                    Option {index + 1}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {suggestion.char_count}/180 chars
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-gray-700">{suggestion.content}</p>
              </div>
              <Button
                size="sm"
                onClick={() => handleReplace(suggestion)}
                className="shrink-0 bg-blue-600 hover:bg-blue-700"
              >
                Replace
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
} 