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
  const [templateId, setTemplateId] = useState<string>("")
  const [documentId, setDocumentId] = useState<string>(preFilledDocumentId || "")
  const [targetAudience, setTargetAudience] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [loadingStage, setLoadingStage] = useState<string>("")
  const [documents, setDocuments] = useState<Document[]>([])
  const [selectedDocumentContent, setSelectedDocumentContent] = useState<string>("")
  const { templates, addProject } = useAppStore()
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
    setTemplateId("")
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
      // Process template and document IDs properly
      const processedTemplateId = templateId && templateId !== "none" ? templateId : null
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
          template_id: processedTemplateId,
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
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New InstaCarousel</DialogTitle>
            <DialogDescription>
              Create a new Instagram carousel from your content. Select a document, add text, or combine both. Choose a template type and let AI generate your slides.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">InstaCarousel Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter carousel title..."
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="source-text">
                Source Text 
                {selectedDocumentContent && (
                  <span className="ml-2 text-sm text-green-600">
                    + Document Content ({selectedDocumentContent.length} chars)
                  </span>
                )}
                <span className="ml-2 text-sm text-muted-foreground">
                  ({combinedTextLength}/{selectedDocumentContent ? "Combined" : "50 min"})
                </span>
              </Label>
              <Textarea
                id="source-text"
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                placeholder={
                  selectedDocumentContent
                    ? "Add additional context or instructions (optional)..."
                    : "Paste your content here (minimum 50 characters)..."
                }
                className="h-32 resize-none"
              />
              {selectedDocumentContent && sourceText && (
                <div className="text-sm p-2 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-blue-800 font-medium">✓ Test Condition: Document + Additional Text</p>
                  <p className="text-blue-600 text-xs">
                    Will combine document content ({selectedDocumentContent.length} chars) with your additional text ({sourceText.length} chars)
                  </p>
                </div>
              )}
              {!isTextValid && combinedTextLength > 0 && (
                <p className="text-sm text-red-500">
                  Need {50 - combinedTextLength} more characters (minimum 50 required)
                </p>
              )}
              {selectedDocumentContent && !sourceText && (
                <p className="text-sm text-green-600">
                  Using document content only ({selectedDocumentContent.length} characters)
                </p>
              )}
            </div>

            {/* Smart Template Recommendation */}
            <SmartTemplateSelector
              content={getCombinedSourceText()}
              currentTemplate={templateType as "NEWS" | "STORY" | "PRODUCT"}
              onTemplateChange={(template) => setTemplateType(template)}
              className="mb-2"
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="template-type">Template Type</Label>
                <Select value={templateType} onValueChange={setTemplateType}>
                  <SelectTrigger className="h-10">
                    <SelectValue>
                      {templateTypes.find(t => t.value === templateType)?.label || "Select template"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="w-[280px]">
                    {templateTypes.map((template) => (
                      <SelectItem key={template.value} value={template.value} className="py-3">
                        <div className="flex flex-col gap-1 w-full">
                          <span className="font-medium text-sm">{template.label}</span>
                          <span className="text-xs text-muted-foreground leading-tight break-words">{template.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Choose content structure</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="slide-count">Number of Slides</Label>
                <Input
                  id="slide-count"
                  type="number"
                  min="3"
                  max="10"
                  value={slideCount}
                  onChange={(e) => setSlideCount(Number(e.target.value))}
                  className="w-full h-10"
                />
                <p className="text-xs text-muted-foreground">Recommended: 5-7 slides</p>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of your carousel..."
                className="h-20"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="document">Source Document (Optional)</Label>
              <Select value={documentId} onValueChange={handleDocumentChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a document" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No document</SelectItem>
                  {documents.map((document) => (
                    <SelectItem key={document.id} value={document.id}>
                      {document.title} ({document.word_count} words)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="template">Brand Voice Template (Optional)</Label>
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No template</SelectItem>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="audience">Target Audience (Optional)</Label>
              <Input
                id="audience"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="e.g., Small business owners, Content creators..."
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
