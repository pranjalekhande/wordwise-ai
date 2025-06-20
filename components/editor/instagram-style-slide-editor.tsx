"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronLeft, ChevronRight, Plus, Trash2, Copy, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useAppStore } from "@/lib/store"
import { calculateReadabilityScore, generateId } from "@/lib/utils"
import { GrammarSidebar } from "@/components/editor/grammar-sidebar"
import { GrammarStatusIndicator } from "@/components/editor/grammar-status-indicator"
import { InstagramSquarePreview } from "@/components/editor/instagram-square-preview"
import { FormattingToolbar } from "@/components/editor/formatting-toolbar"
import type { Slide } from "@/lib/types"

interface InstagramStyleSlideEditorProps {
  projectId: string
}

export function InstagramStyleSlideEditor({ projectId }: InstagramStyleSlideEditorProps) {
  const {
    slides,
    currentSlide,
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

  return (
    <div className="space-y-6">
      {/* Header Navigation */}
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
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
            {showPreview ? "Hide Preview" : "Show Preview"}
          </Button>
          <Button variant="outline" size="sm" onClick={addNewSlide} disabled={slides.length >= 10}>
            <Plus className="h-4 w-4 mr-1" />
            Add Slide
          </Button>
          <Button variant="outline" size="sm" onClick={duplicateSlide} disabled={!currentSlide || slides.length >= 10}>
            <Copy className="h-4 w-4 mr-1" />
            Duplicate
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={deleteCurrentSlide}
            disabled={!currentSlide || slides.length <= 1}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`grid gap-4 ${showPreview ? 'lg:grid-cols-12' : 'lg:grid-cols-8'}`}>
        {/* Editor */}
        <div className={showPreview ? 'lg:col-span-5' : 'lg:col-span-5'}>
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Instagram Slide Editor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormattingToolbar onFormatText={handleFormatText} />
              
              <Textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="Write your Instagram carousel slide content here...

Use **bold** for emphasis
Use *italic* for style  
Use #hashtags for topics
Use @mentions for people
Add emojis with the toolbar! 🎉"
                className="min-h-[350px] resize-none text-base leading-relaxed"
              />
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="lg:col-span-3 flex justify-center">
            <InstagramSquarePreview
              content={content}
              slideNumber={currentSlideIndex + 1}
              totalSlides={slides.length}
              className="scale-75"
            />
          </div>
        )}

        {/* Grammar Sidebar */}
        <div className={showPreview ? 'lg:col-span-4' : 'lg:col-span-3'}>
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
  )
} 