"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronLeft, ChevronRight, Plus, Trash2, Copy, Eye, EyeOff, Instagram } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useAppStore } from "@/lib/store"
import { calculateReadabilityScore, generateId } from "@/lib/utils"
import { GrammarSidebar } from "@/components/editor/grammar-sidebar"
import { GrammarStatusIndicator } from "@/components/editor/grammar-status-indicator"
import { InstagramSquarePreview } from "@/components/editor/instagram-square-preview"
import { FormattingToolbar } from "@/components/editor/formatting-toolbar"
import { AiStyleSuggestions } from "@/components/editor/ai-style-suggestions"
import type { Slide, StyleSuggestion } from "@/lib/types"

interface InstagramStyleSlideEditorProps {
  projectId: string
}

export function InstagramStyleSlideEditor({ projectId }: InstagramStyleSlideEditorProps) {
  const {
    slides,
    currentSlide,
    currentProject,
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
  const [grammarIssuesCount, setGrammarIssuesCount] = useState(0)
  const [showPreview, setShowPreview] = useState(true)
  const [previewOpen, setPreviewOpen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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

      // Auto-save to database
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

  const handleFormatText = (format: string, value?: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)
    
    let newContent = content
    let newCursorPos = start

    switch (format) {
      case "bold":
        if (selectedText) {
          newContent = content.substring(0, start) + `**${selectedText}**` + content.substring(end)
          newCursorPos = end + 4
        } else {
          newContent = content.substring(0, start) + "****" + content.substring(end)
          newCursorPos = start + 2
        }
        break
        
      case "italic":
        if (selectedText) {
          newContent = content.substring(0, start) + `*${selectedText}*` + content.substring(end)
          newCursorPos = end + 2
        } else {
          newContent = content.substring(0, start) + "**" + content.substring(end)
          newCursorPos = start + 1
        }
        break
        
      case "hashtag":
        const hashtag = selectedText || "hashtag"
        newContent = content.substring(0, start) + `#${hashtag}` + content.substring(end)
        newCursorPos = start + hashtag.length + 1
        break
        
      case "mention":
        const mention = selectedText || "username"
        newContent = content.substring(0, start) + `@${mention}` + content.substring(end)
        newCursorPos = start + mention.length + 1
        break
        
      case "insert":
        if (value) {
          newContent = content.substring(0, start) + value + content.substring(end)
          newCursorPos = start + value.length
        }
        break
    }

    handleContentChange(newContent)
    
    // Restore cursor position
    setTimeout(() => {
      if (textarea) {
        textarea.focus()
        textarea.setSelectionRange(newCursorPos, newCursorPos)
      }
    }, 0)
  }

  const handleApplyStyleSuggestion = (suggestion: StyleSuggestion) => {
    const textarea = textareaRef.current
    if (!textarea) return

    // Different handling based on suggestion type
    switch (suggestion.type) {
      case "emphasis":
        // Replace original text with suggestion
        const newContent = content.replace(suggestion.original, suggestion.suggestion)
        handleContentChange(newContent)
        break
        
      case "hashtag":
      case "emoji":
      case "mention":
        // Add at the end of content with spacing
        const spacing = content.trim().endsWith('.') || content.trim().endsWith('!') || content.trim().endsWith('?') ? ' ' : ' '
        handleContentChange(content.trim() + spacing + suggestion.suggestion)
        break
        
      case "structure":
        // Replace the entire content for structure changes
        handleContentChange(suggestion.suggestion)
        break
        
      default:
        // Fallback: replace original with suggestion
        if (suggestion.original && content.includes(suggestion.original)) {
          const newContent = content.replace(suggestion.original, suggestion.suggestion)
          handleContentChange(newContent)
        } else {
          // Add at end if original text not found
          handleContentChange(content.trim() + ' ' + suggestion.suggestion)
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

  const deleteCurrentSlide = async () => {
    if (currentSlide && slides.length > 1) {
      // Delete from database
      try {
        await fetch(`/api/slides/${currentSlide.id}`, {
          method: "DELETE",
        })
      } catch (error) {
        console.error("Error deleting slide:", error)
      }
      
      // Update local state
      deleteSlide(currentSlide.id)
      const newIndex = Math.max(0, currentSlideIndex - 1)
      setCurrentSlideIndex(newIndex)
    }
  }

  const handleGrammarStatusChange = (issuesCount: number) => {
    setGrammarIssuesCount(issuesCount)
  }

  // Get template type from current project
  const templateType = (currentProject?.template_type as "NEWS" | "STORY" | "PRODUCT") || "PRODUCT"

  // Safe Instagram Preview component
  const SafeInstagramPreview = ({ content, slideNumber, totalSlides }: { 
    content: string; 
    slideNumber: number; 
    totalSlides: number 
  }) => {
    try {
      return (
        <InstagramSquarePreview
          content={content}
          slideNumber={slideNumber}
          totalSlides={totalSlides}
        />
      )
    } catch (error) {
      console.error('Instagram preview error:', error)
      return (
        <div className="flex flex-col items-center space-y-4">
          <div className="text-sm text-muted-foreground font-medium">
            Instagram Preview
          </div>
          <div className="relative w-80 h-80 bg-white border-2 border-gray-200 shadow-lg overflow-hidden rounded-lg">
            <div className="h-full flex items-center justify-center p-6">
              <div className="text-center w-full">
                <div className="text-gray-400 text-sm mb-2">
                  Preview temporarily unavailable
                </div>
                <div className="text-xs text-gray-300">
                  Content: {content.substring(0, 50)}{content.length > 50 ? '...' : ''}
                </div>
              </div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            {content?.length || 0} characters
          </div>
        </div>
      )
    }
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header Navigation - Minimalistic */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
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
                Image {currentSlideIndex + 1} of {slides.length}
              </span>
              <GrammarStatusIndicator 
                issueCount={grammarIssuesCount}
                size="sm"
                showCount={grammarIssuesCount > 0}
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

            {/* Show Preview with tooltip */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{showPreview ? "Hide Preview" : "Show Preview"}</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="flex items-center gap-2">
            <Popover open={previewOpen} onOpenChange={setPreviewOpen}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Instagram className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Instagram Preview</p>
                </TooltipContent>
              </Tooltip>
              <PopoverContent className="w-96 p-6" align="end">
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <SafeInstagramPreview
                      content={content}
                      slideNumber={currentSlideIndex + 1}
                      totalSlides={slides.length}
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={addNewSlide} disabled={slides.length >= 10}>
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add Image</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={duplicateSlide} disabled={!currentSlide || slides.length >= 10}>
                  <Copy className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Duplicate Image</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={deleteCurrentSlide}
                  disabled={!currentSlide || slides.length <= 1}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete Image</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Main Content - Simplified */}
        <div className={`grid gap-6 items-start ${showPreview ? 'lg:grid-cols-12' : 'lg:grid-cols-8'}`}>
          {/* Editor */}
          <div className={showPreview ? 'lg:col-span-5' : 'lg:col-span-5'}>
            <div className="space-y-4">
              <FormattingToolbar onFormatText={handleFormatText} />
              
              <Textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="Write your Instagram carousel image content here...

Use **bold** for emphasis
Use *italic* for style  
Use #hashtags for topics
Use @mentions for people
Add emojis! 🎉"
                className="min-h-[400px] resize-none text-base leading-relaxed border-2 focus:border-primary"
              />
            </div>
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="lg:col-span-4">
              <div className="flex flex-col items-start space-y-4">
                <div className="flex justify-center w-full">
                  <SafeInstagramPreview
                    content={content}
                    slideNumber={currentSlideIndex + 1}
                    totalSlides={slides.length}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Sidebar - Simplified */}
          <div className={showPreview ? 'lg:col-span-3' : 'lg:col-span-3'}>
            <div className="space-y-4">
              {/* AI Style Suggestions */}
              <AiStyleSuggestions
                content={content}
                templateType={templateType}
                onApplySuggestion={handleApplyStyleSuggestion}
              />
              
              {/* Grammar Sidebar */}
              <GrammarSidebar 
                content={content}
                onContentChange={handleContentChange}
                slideNumber={currentSlideIndex + 1}
                totalSlides={slides.length}
                onGrammarStatusChange={handleGrammarStatusChange}
              />
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
} 