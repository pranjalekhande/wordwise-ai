"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Plus, Trash2, Copy, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useAppStore } from "@/lib/store"
import { calculateReadabilityScore, generateId } from "@/lib/utils"
import type { Slide } from "@/lib/types"

interface SlideEditorProps {
  projectId: string
}

export function SlideEditor({ projectId }: SlideEditorProps) {
  const {
    slides,
    currentSlide,
    selectedTemplate,
    isAutoSaving,
    lastSaved,
    setCurrentSlide,
    addSlide,
    updateSlide,
    deleteSlide,
    setAutoSaving,
    setLastSaved,
  } = useAppStore()

  const [content, setContent] = useState("")
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)

  useEffect(() => {
    if (currentSlide) {
      setContent(currentSlide.content)
    }
  }, [currentSlide])

  useEffect(() => {
    if (slides.length > 0 && currentSlideIndex < slides.length) {
      setCurrentSlide(slides[currentSlideIndex])
    }
  }, [currentSlideIndex, slides, setCurrentSlide])

  const handleContentChange = async (value: string) => {
    setContent(value)

    if (currentSlide) {
      const updatedSlide = {
        ...currentSlide,
        content: value,
        char_count: value.length,
        updated_at: new Date().toISOString(),
      }

      updateSlide(currentSlide.id, updatedSlide)

      // Real auto-save to database
      setAutoSaving(true)
      try {
        await fetch(`/api/slides/${currentSlide.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: value,
            tone: currentSlide.tone,
          }),
        })
        setLastSaved(new Date())
      } catch (error) {
        console.error("Auto-save failed:", error)
      } finally {
        setAutoSaving(false)
      }
    }
  }

  const addNewSlide = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/slides`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slide_number: slides.length + 1,
          content: "",
        }),
      })

      if (response.ok) {
        const { slide } = await response.json()
        addSlide(slide)
        setCurrentSlideIndex(slides.length)
      }
    } catch (error) {
      console.error("Error creating slide:", error)
    }
  }

  const duplicateSlide = () => {
    if (currentSlide) {
      const duplicatedSlide: Slide = {
        ...currentSlide,
        id: generateId(),
        slide_number: slides.length + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      addSlide(duplicatedSlide)
      setCurrentSlideIndex(slides.length)
    }
  }

  const deleteCurrentSlide = () => {
    if (currentSlide && slides.length > 1) {
      deleteSlide(currentSlide.id)
      const newIndex = Math.max(0, currentSlideIndex - 1)
      setCurrentSlideIndex(newIndex)
    }
  }

  const readabilityScore = calculateReadabilityScore(content)
  const charLimit = selectedTemplate?.voice_profile.max_chars || 280
  const isOverLimit = content.length > charLimit

  return (
    <div className="space-y-6">
      {/* Slide Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
            disabled={currentSlideIndex === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">
            Slide {currentSlideIndex + 1} of {slides.length}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentSlideIndex(Math.min(slides.length - 1, currentSlideIndex + 1))}
            disabled={currentSlideIndex === slides.length - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={addNewSlide}>
            <Plus className="h-4 w-4 mr-1" />
            Add Slide
          </Button>
          <Button variant="outline" size="sm" onClick={duplicateSlide} disabled={!currentSlide}>
            <Copy className="h-4 w-4 mr-1" />
            Duplicate
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={deleteCurrentSlide}
            disabled={!currentSlide || slides.length <= 1}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Editor */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Slide Content</CardTitle>
                <div className="flex items-center gap-2">
                  {isAutoSaving && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
                      Saving...
                    </div>
                  )}
                  {lastSaved && !isAutoSaving && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      Saved {lastSaved.toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="Write your Instagram carousel slide content here..."
                className="min-h-[300px] resize-none"
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar with metrics and tools */}
        <div className="space-y-4">
          {/* Character Count */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Character Count</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{content.length}</span>
                  <Badge variant={isOverLimit ? "destructive" : "secondary"}>{charLimit - content.length} left</Badge>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${isOverLimit ? "bg-destructive" : "bg-primary"}`}
                    style={{ width: `${Math.min(100, (content.length / charLimit) * 100)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Readability Score */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Readability</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{Math.round(readabilityScore.score)}</span>
                  <Badge variant="outline">{readabilityScore.level}</Badge>
                </div>
                {readabilityScore.suggestions.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Suggestions:</p>
                    {readabilityScore.suggestions.map((suggestion, index) => (
                      <p key={index} className="text-xs text-muted-foreground">
                        • {suggestion}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Template Info */}
          {selectedTemplate && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Brand Voice</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    <span className="font-medium">{selectedTemplate.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Tone: {selectedTemplate.voice_profile.tone}</p>
                  <p className="text-xs text-muted-foreground">Style: {selectedTemplate.voice_profile.style}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
