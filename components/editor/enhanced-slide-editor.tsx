"use client"

import { useState, useEffect, useCallback } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Copy,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Zap,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAppStore } from "@/lib/store"
import { calculateReadabilityScore, generateId } from "@/lib/utils"
import { useGrammarCheck } from "@/hooks/use-grammar-check"
import { GrammarHighlight } from "@/components/documents/grammar-highlight-simple"
import { GrammarStatusIndicator } from "@/components/editor/grammar-status-indicator"
import type { Slide } from "@/lib/types"
import type { Suggestion } from "@/app/api/generate-variations/route"

interface EnhancedSlideEditorProps {
  projectId: string
}

export function EnhancedSlideEditor({ projectId }: EnhancedSlideEditorProps) {
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
  const [variations, setVariations] = useState<Suggestion[]>([])
  const [selectedVariationId, setSelectedVariationId] = useState<string>("")
  const [showVariations, setShowVariations] = useState(false)
  const [isGeneratingVariations, setIsGeneratingVariations] = useState(false)
  const [grammarCheckEnabled, setGrammarCheckEnabled] = useState(true)

  // Grammar checking hook
  const {
    issues,
    isChecking,
    error: grammarError,
    summary,
    smartCheck,
    checkGrammar,
    dismissIssue,
    applySuggestion,
  } = useGrammarCheck({
    autoCheck: grammarCheckEnabled,
    debounceMs: 2000,
    minTextLength: 10,
    pauseDetectionMs: 1000,
  })

  useEffect(() => {
    if (currentSlide) {
      setContent(currentSlide.content)
      
      // Load variations if they exist
      if (currentSlide.variations) {
        try {
          const parsedVariations = typeof currentSlide.variations === 'string' 
            ? JSON.parse(currentSlide.variations) 
            : currentSlide.variations
          setVariations(parsedVariations)
          setSelectedVariationId(currentSlide.selectedVariationId || parsedVariations[0]?.id || '')
        } catch (error) {
          console.error('Error parsing variations:', error)
          setVariations([])
        }
      } else {
        setVariations([])
      }
    }
  }, [currentSlide])

  useEffect(() => {
    if (slides.length > 0 && currentSlideIndex < slides.length) {
      setCurrentSlide(slides[currentSlideIndex])
    }
  }, [currentSlideIndex, slides, setCurrentSlide])

  // Auto grammar check when content changes
  useEffect(() => {
    if (grammarCheckEnabled && content.trim().length > 10) {
      smartCheck(content)
    }
  }, [content, grammarCheckEnabled, smartCheck])

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

  const generateVariations = async () => {
    if (!currentSlide) return

    setIsGeneratingVariations(true)
    try {
      const response = await fetch('/api/generate-variations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          original_content: content,
          slide_type: 'content',
          template_type: 'STORY',
          slide_number: currentSlide.slide_number,
          total_slides: slides.length
        })
      })

      if (response.ok) {
        const { variations: newVariations, recommended_variation_id } = await response.json()
        setVariations(newVariations)
        setSelectedVariationId(recommended_variation_id)
        setShowVariations(true)

        // Save variations to database
        const updatedSlide = {
          ...currentSlide,
          variations: JSON.stringify(newVariations),
          selectedVariationId: recommended_variation_id
        }
        updateSlide(currentSlide.id, updatedSlide)

        // Update database
        await fetch(`/api/slides/${currentSlide.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            variations: JSON.stringify(newVariations),
            selected_variation_id: recommended_variation_id
          }),
        })
      }
    } catch (error) {
      console.error('Failed to generate variations:', error)
    } finally {
      setIsGeneratingVariations(false)
    }
  }

  const selectVariation = async (variationId: string) => {
    const variation = variations.find(v => v.id === variationId)
    if (variation && currentSlide) {
      setContent(variation.content)
      setSelectedVariationId(variationId)
      
      // Update slide data
      const updatedSlide = {
        ...currentSlide,
        content: variation.content,
        selectedVariationId: variationId,
        char_count: variation.content.length,
        updated_at: new Date().toISOString(),
      }
      
      updateSlide(currentSlide.id, updatedSlide)

      // Update database
      try {
        await fetch(`/api/slides/${currentSlide.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: variation.content,
            selected_variation_id: variationId
          }),
        })
      } catch (error) {
        console.error('Failed to update variation selection:', error)
      }
    }
  }

  const handleApplySuggestion = useCallback((issueId: string, suggestion: string) => {
    const newContent = applySuggestion(issueId, suggestion, content)
    if (newContent !== content) {
      handleContentChange(newContent)
    }
  }, [content, applySuggestion])

  const handleManualGrammarCheck = () => {
    if (content.trim().length > 0) {
      checkGrammar(content, true)
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
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              Slide {currentSlideIndex + 1} of {slides.length}
            </span>
            <GrammarStatusIndicator 
              issueCount={summary.totalIssues}
              size="sm"
              showCount={summary.totalIssues > 0}
            />
          </div>
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
        <div className="lg:col-span-2 space-y-4">
          {/* Content Variations Panel */}
          {showVariations && variations.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Content Variations</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowVariations(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground mb-3">Choose your tone:</p>
                  <div className="space-y-2">
                    {variations.map((variation) => (
                      <div
                        key={variation.id}
                        className={`p-3 rounded border cursor-pointer transition-all ${
                          selectedVariationId === variation.id
                            ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                            : 'border-muted hover:border-primary/50 hover:bg-muted/50'
                        }`}
                        onClick={() => selectVariation(variation.id)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={selectedVariationId === variation.id ? 'default' : 'secondary'} 
                              className="text-xs capitalize"
                            >
                              {variation.tone}
                            </Badge>
                            {selectedVariationId === variation.id && (
                              <CheckCircle2 className="h-3 w-3 text-primary" />
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {variation.char_count}/180
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed">{variation.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Editor Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Slide Content</CardTitle>
                <div className="flex items-center gap-2">
                  {/* Grammar status indicator */}
                  {grammarCheckEnabled && (
                    <div className="flex items-center gap-1">
                      {isChecking ? (
                        <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                      ) : summary.totalIssues > 0 ? (
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                      <span className="text-xs text-muted-foreground">
                        {isChecking ? 'Checking...' : 
                         summary.totalIssues > 0 
                           ? `${summary.totalIssues} issue${summary.totalIssues > 1 ? 's' : ''}`
                           : 'No issues'
                        }
                      </span>
                    </div>
                  )}

                  {/* Auto-save status */}
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

                  {/* Variations toggle */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowVariations(!showVariations)}
                    disabled={variations.length === 0}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Variations
                  </Button>

                  {/* Generate new variations */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateVariations}
                    disabled={isGeneratingVariations || !content.trim()}
                  >
                    {isGeneratingVariations ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-1" />
                    )}
                    {isGeneratingVariations ? 'Generating...' : 'Rephrase'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              {/* Grammar highlighting overlay */}
              {grammarCheckEnabled && issues.length > 0 && (
                <div className="absolute inset-0 pointer-events-none z-10 p-3">
                  <GrammarHighlight
                    text={content}
                    issues={issues}
                    onApplySuggestion={handleApplySuggestion}
                    onDismissIssue={dismissIssue}
                    className="min-h-[300px] text-base leading-relaxed"
                  />
                </div>
              )}

              {/* Main textarea */}
              <Textarea
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="Write your Instagram carousel slide content here..."
                className="min-h-[300px] resize-none relative z-0"
                style={grammarCheckEnabled && issues.length > 0 ? { color: 'transparent' } : {}}
              />
            </CardContent>
          </Card>

          {/* Grammar error alert */}
          {grammarError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Grammar check error: {grammarError}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Sidebar with metrics and tools */}
        <div className="space-y-4">
          {/* Grammar Check Control */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Grammar Check
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Auto-check</span>
                <Switch
                  checked={grammarCheckEnabled}
                  onCheckedChange={setGrammarCheckEnabled}
                />
              </div>
              
              {grammarCheckEnabled && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleManualGrammarCheck}
                    disabled={isChecking || !content.trim()}
                    className="w-full"
                  >
                    {isChecking ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                    )}
                    Check Now
                  </Button>

                  {summary.totalIssues > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Issues found:</span>
                        <span className="font-medium">{summary.totalIssues}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {summary.grammarIssues + summary.spellingIssues} grammar & spelling, {summary.styleIssues} style
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Character Count */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Character Count</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{content.length}</span>
                  <Badge variant={isOverLimit ? "destructive" : "secondary"}>
                    {charLimit - content.length} left
                  </Badge>
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

          {/* Variation Generation Status */}
          {variations.length === 0 && !isGeneratingVariations && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Content Variations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4 text-muted-foreground">
                  <p className="text-sm">No variations generated yet</p>
                  <p className="text-xs">Click "Rephrase" to create tone variations</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
} 