"use client"

import { useState } from "react"
import { Sparkles, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import type { Suggestion } from "@/app/api/generate-variations/route"

interface SuggestionsButtonProps {
  content: string
  onSuggestionsGenerated: (suggestions: Suggestion[]) => void
  disabled?: boolean
}

export function SuggestionsButton({ content, onSuggestionsGenerated, disabled }: SuggestionsButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleSuggestWording = async () => {
    if (!content.trim() || content.trim().length < 10) {
      toast.error("Add more content before requesting suggestions")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/generate-variations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ original_content: content.trim() })
      })

      if (response.ok) {
        const { suggestions } = await response.json()
        onSuggestionsGenerated(suggestions)
        toast.success(`Generated ${suggestions.length} wording suggestions`)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to generate suggestions')
      }
    } catch (error) {
      console.error('Suggestions error:', error)
      toast.error('Unable to generate suggestions')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSuggestWording}
      disabled={disabled || isLoading || content.trim().length < 10}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Sparkles className="h-4 w-4 mr-2" />
      )}
      {isLoading ? 'Suggesting...' : 'Suggest Wording'}
    </Button>
  )
} 