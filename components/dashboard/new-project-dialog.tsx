"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAppStore } from "@/lib/store"
import { useRouter } from "next/navigation"
import { SmartTemplateSelector } from "./smart-template-selector"
import type { Document } from "@/lib/types"

interface NewProjectDialogProps {
  // Core pre-filling
  preFilledTitle?: string
  preFilledSourceText?: string  
  preFilledDocumentId?: string
  
  // Smart suggestions
  preFilledTemplateType?: "NEWS" | "STORY" | "PRODUCT"
  preFilledSlideCount?: number
  
  // Additional context
  preFilledDescription?: string
  
  // Dialog control for external triggering
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode // Custom trigger element
}

export function NewProjectDialog({ 
  preFilledTitle,
  preFilledSourceText,
  preFilledDocumentId,
  preFilledTemplateType,
  preFilledSlideCount,
  preFilledDescription,
  isOpen: externalOpen,
  onOpenChange: externalOnOpenChange,
  children
}: NewProjectDialogProps = {}) {
  // Handle external dialog control
  const [internalOpen, setInternalOpen] = useState(false)
  const open = externalOpen !== undefined ? externalOpen : internalOpen
  const setOpen = externalOnOpenChange || setInternalOpen

  // Initialize state with pre-filled values
  const [title, setTitle] = useState(preFilledTitle || "")
  const [description, setDescription] = useState(preFilledDescription || "")
  const [sourceText, setSourceText] = useState(preFilledSourceText || "")
  const [templateType, setTemplateType] = useState<string>(preFilledTemplateType || "STORY")
  const [slideCount, setSlideCount] = useState<number>(preFilledSlideCount || 5)

  const [documentId, setDocumentId] = useState<string>(preFilledDocumentId || "")
  const [targetAudience, setTargetAudience] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [loadingStage, setLoadingStage] = useState<string>("")
  const [documents, setDocuments] = useState<Document[]>([])
  const [selectedDocumentContent, setSelectedDocumentContent] = useState<string>("")
  const { addProject } = useAppStore()
  const router = useRouter()

  // Template type options
  const templateTypes = [
    { value: "STORY", label: "Story", description: "Personal stories, case studies, journeys" },
    { value: "NEWS", label: "News", description: "Breaking news, announcements, updates" },
    { value: "PRODUCT", label: "Product", description: "Product launches, features, marketing" }
  ]

  useEffect(() => {
    if (open) {
      fetchDocuments()
    }
  }, [open])

  // Set document selection when pre-filled document ID is provided
  useEffect(() => {
    if (preFilledDocumentId && documents.length > 0) {
      const documentExists = documents.some(doc => doc.id === preFilledDocumentId)
      if (documentExists) {
        setDocumentId(preFilledDocumentId)
        fetchDocumentContent(preFilledDocumentId)
      }
    }
  }, [preFilledDocumentId, documents])

  // Handle document selection change
  const handleDocumentChange = async (value: string) => {
    setDocumentId(value)
    if (value && value !== "none") {
      await fetchDocumentContent(value)
    } else {
      setSelectedDocumentContent("")
    }
  }

  const fetchDocumentContent = async (docId: string) => {
    try {
      const response = await fetch(`/api/documents/${docId}`)
      if (response.ok) {
        const { document } = await response.json()
        setSelectedDocumentContent(document.content || "")
      }
    } catch (error) {
      console.error("Error fetching document content:", error)
      setSelectedDocumentContent("")
    }
  }

  // Calculate combined source text
  const getCombinedSourceText = () => {
    const hasDocument = selectedDocumentContent.trim().length > 0
    const hasTextInput = sourceText.trim().length > 0
    
    if (hasDocument && hasTextInput) {
      // Test condition: Both document and text input provided
      return `${selectedDocumentContent.trim()}\n\n---\n\nAdditional Context:\n${sourceText.trim()}`
    } else if (hasDocument) {
      return selectedDocumentContent.trim()
    } else if (hasTextInput) {
      return sourceText.trim()
    }
    return ""
  }

  // Get combined text length for validation
  const combinedTextLength = getCombinedSourceText().length
  const isTextValid = combinedTextLength >= 50

  const fetchDocuments = async () => {
    try {
      const response = await fetch("/api/documents")
      if (response.ok) {
        const { documents } = await response.json()
        setDocuments(documents)
      }
    } catch (error) {
      console.error("Error fetching documents:", error)
    }
  }

  const resetForm = () => {
    // Reset to pre-filled values or defaults
    setTitle(preFilledTitle || "")
    setDescription(preFilledDescription || "")
    setSourceText(preFilledSourceText || "")
    setTemplateType(preFilledTemplateType || "STORY")
    setSlideCount(preFilledSlideCount || 5)

    setDocumentId(preFilledDocumentId || "")
    setTargetAudience("")
    setSelectedDocumentContent("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) return
    if (sourceText.trim().length < 50) {
      alert("Source text must be at least 50 characters long")
      return
    }

    setIsLoading(true)
    setLoadingStage("Creating carousel...")

    try {
      // Process document ID properly
      const processedDocumentId = documentId && documentId !== "none" ? documentId : null

      // Show AI generation stage if source text is provided
      if (sourceText.trim().length >= 50) {
        setLoadingStage("Generating AI content...")
      }

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          source_text: getCombinedSourceText(),
          template_type: templateType,
          slide_count: slideCount,

          document_id: processedDocumentId,
          target_audience: targetAudience.trim() || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errorData.error || `Failed to create project (${response.status})`)
      }

      setLoadingStage("Finalizing slides...")

      const { project } = await response.json()
      addProject(project)

      setOpen(false)
      resetForm()

      // Navigate to the editor
      router.push(`/editor/${project.id}`)
    } catch (error) {
      console.error("Error creating project:", error)
      // Show error to user - you could add a toast notification here
      alert(`Failed to create project: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
      setLoadingStage("")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children || (
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New InstaCarousel
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create InstaCarousel</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter title..."
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="source-text">Content</Label>
              <Textarea
                id="source-text"
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                placeholder="Paste your content here (min 50 characters)..."
                className="h-32 resize-none"
              />
              {!isTextValid && combinedTextLength > 0 && (
                <p className="text-sm text-red-500">
                  Need {50 - combinedTextLength} more characters
                </p>
              )}
            </div>

            {/* Smart Template Recommendation */}
            <SmartTemplateSelector
              content={getCombinedSourceText()}
              currentTemplate={templateType as "NEWS" | "STORY" | "PRODUCT"}
              onTemplateChange={(template) => setTemplateType(template)}
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="template-type">Type</Label>
                <Select value={templateType} onValueChange={setTemplateType}>
                  <SelectTrigger className="h-10">
                    <SelectValue>
                      {templateTypes.find(t => t.value === templateType)?.label || "Select type"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {templateTypes.map((template) => (
                      <SelectItem key={template.value} value={template.value}>
                        {template.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="slide-count">Slides</Label>
                <Input
                  id="slide-count"
                  type="number"
                  min="3"
                  max="10"
                  value={slideCount}
                  onChange={(e) => setSlideCount(Number(e.target.value))}
                  className="w-full h-10"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description..."
                className="h-20"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="document">Source Document</Label>
              <Select value={documentId} onValueChange={handleDocumentChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select document" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {documents.map((document) => (
                    <SelectItem key={document.id} value={document.id}>
                      {document.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="audience">Target Audience</Label>
              <Input
                id="audience"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="e.g., Content creators..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || !isTextValid || isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isLoading ? loadingStage : "Create Carousel"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
