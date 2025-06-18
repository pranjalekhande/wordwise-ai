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
import type { Document } from "@/lib/types"

export function NewProjectDialog() {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [sourceText, setSourceText] = useState("")
  const [templateType, setTemplateType] = useState<string>("STORY")
  const [slideCount, setSlideCount] = useState<number>(5)
  const [templateId, setTemplateId] = useState<string>("")
  const [documentId, setDocumentId] = useState<string>("")
  const [targetAudience, setTargetAudience] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [documents, setDocuments] = useState<Document[]>([])
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) return
    if (sourceText.trim().length < 50) {
      alert("Source text must be at least 50 characters long")
      return
    }

    setIsLoading(true)

    try {
      // Process template and document IDs properly
      const processedTemplateId = templateId && templateId !== "none" ? templateId : null
      const processedDocumentId = documentId && documentId !== "none" ? documentId : null

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          source_text: sourceText.trim(),
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

      const { project } = await response.json()
      addProject(project)

      setOpen(false)
      setTitle("")
      setDescription("")
      setSourceText("")
      setTemplateType("STORY")
      setSlideCount(5)
      setTemplateId("")
      setDocumentId("")
      setTargetAudience("")

      // Navigate to the editor
      router.push(`/editor/${project.id}`)
    } catch (error) {
      console.error("Error creating project:", error)
      // Show error to user - you could add a toast notification here
      alert(`Failed to create project: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New InstaCarousel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New InstaCarousel</DialogTitle>
            <DialogDescription>
              Create a new Instagram carousel from your content. Paste your text, choose a template type, and let AI generate your slides.
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
                Source Text <span className="text-red-500">*</span>
                <span className="ml-2 text-sm text-muted-foreground">({sourceText.length}/50 min)</span>
              </Label>
              <Textarea
                id="source-text"
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                placeholder="Paste your content here (minimum 50 characters)..."
                className="h-32 resize-none"
                required
              />
              {sourceText.length > 0 && sourceText.length < 50 && (
                <p className="text-sm text-red-500">
                  Need {50 - sourceText.length} more characters (minimum 50 required)
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="template-type">Template Type</Label>
                <Select value={templateType} onValueChange={setTemplateType}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {templateTypes.map((template) => (
                      <SelectItem key={template.value} value={template.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{template.label}</span>
                          <span className="text-xs text-muted-foreground">{template.description}</span>
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
              <Select value={documentId} onValueChange={setDocumentId}>
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
            <Button type="submit" disabled={!title.trim() || sourceText.trim().length < 50 || isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Carousel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
