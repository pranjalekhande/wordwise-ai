"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, FileText, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface DocumentUploadProps {
  onDocumentCreated?: (document: any) => void
}

export function DocumentUpload({ onDocumentCreated }: DocumentUploadProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleFile(files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      handleFile(files[0])
    }
  }

  const handleFile = async (file: File) => {
    try {
      if (file.type === "text/plain" || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
        const text = await file.text()
        setContent(text)
        setTitle(file.name.replace(/\.[^/.]+$/, ""))
        setError(null)
      } else {
        setError("Please upload a text file (.txt or .md)")
      }
    } catch (error) {
      setError("Failed to read file")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      setError("Please provide both title and content")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log("Submitting document:", { title: title.trim(), contentLength: content.trim().length })

      const response = await fetch("/api/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
        }),
      })

      const responseData = await response.json()
      console.log("Response:", responseData)

      if (!response.ok) {
        throw new Error(responseData.message || responseData.error || "Failed to create document")
      }

      const { document } = responseData
      onDocumentCreated?.(document)

      setOpen(false)
      setTitle("")
      setContent("")
      setError(null)
    } catch (error) {
      console.error("Error creating document:", error)
      setError(error instanceof Error ? error.message : "Failed to create document")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Add Document
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Document</DialogTitle>
            <DialogDescription>Upload a text file or paste your content to create a new document.</DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Document Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter document title..."
                required
              />
            </div>

            <div className="grid gap-2">
              <Label>Content</Label>
              <Card
                className={`border-2 border-dashed transition-colors ${
                  dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    <div className="flex justify-center">
                      <FileText className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Drop your text file here or</p>
                      <Button
                        type="button"
                        variant="link"
                        className="h-auto p-0"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        browse files
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".txt,.md"
                        onChange={handleFileInput}
                        className="hidden"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Supports .txt and .md files</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="content">Or paste your content</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Type or paste your content here..."
                className="min-h-[200px]"
                required
              />
              <p className="text-xs text-muted-foreground">
                {content.split(/\s+/).filter((word) => word.length > 0).length} words, {content.length} characters
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || !content.trim() || isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Document
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
