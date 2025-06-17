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
  const [isProcessing, setIsProcessing] = useState(false)
  const [fileMetadata, setFileMetadata] = useState<{ name?: string; size?: number; type?: string } | null>(null)
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

  /**
   * Main file processing function that handles different file types
   * Supports: .txt, .md files
   * DOCX support temporarily disabled - will be fixed later
   */
  const handleFile = async (file: File) => {
    setIsProcessing(true)
    setError(null)

    try {
      // Store file metadata for database storage - helps track original file information
      setFileMetadata({
        name: file.name,
        size: file.size,
        type: file.type || getFileTypeFromExtension(file.name)
      })

      // Determine file type using both MIME type and file extension
      // This dual approach ensures compatibility across different browsers and file sources
      const fileName = file.name.toLowerCase()
      const isTextFile = file.type === "text/plain" || fileName.endsWith(".txt")
      const isMarkdownFile = fileName.endsWith(".md")
      // DOCX support temporarily disabled
      // const isDocxFile = fileName.endsWith(".docx") || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

      if (isTextFile || isMarkdownFile) {
        // Handle text and markdown files - simple text reading
        const text = await file.text()
        setContent(text)
        setTitle(file.name.replace(/\.[^/.]+$/, ""))
        setError(null)
      } 
      // DOCX support temporarily disabled - will be fixed later
      // else if (isDocxFile) {
      //   // Handle Microsoft Word documents (.docx) using officeparser
      //   try {
      //     // Convert file to buffer - officeparser works with Buffer objects
      //     const arrayBuffer = await file.arrayBuffer()
      //     const buffer = Buffer.from(arrayBuffer)

      //     // Dynamic import of officeparser for better browser compatibility
      //     // This prevents issues with server-side rendering and reduces initial bundle size
      //     const { parseOfficeAsync } = await import("officeparser")
        
      //     // Extract text content from the docx file
      //     // Configuration options:
      //     // - outputErrorToConsole: false - suppress console errors for cleaner UX
      //     // - newlineDelimiter: '\n' - preserve line breaks in extracted text
      //     const extractedText = await parseOfficeAsync(buffer, {
      //       outputErrorToConsole: false,
      //       newlineDelimiter: '\n'
      //     })

      //     // Set the extracted text as document content
      //     setContent(extractedText)
      //     setTitle(file.name.replace(/\.[^/.]+$/, "")) // Remove file extension from title
      //     setError(null)
      //   } catch (parseError) {
      //     // Handle docx parsing errors gracefully
      //     console.error("Error parsing docx file:", parseError)
      //     setError("Failed to parse Word document. Please try a different file or convert to .txt format.")
      //   }
      // } 
      else {
        // Reject unsupported file types (DOCX temporarily disabled)
        setError("Please upload a supported file (.txt or .md). DOCX support is temporarily disabled.")
      }
    } catch (error) {
      console.error("Error processing file:", error)
      setError("Failed to read file")
    } finally {
      setIsProcessing(false)
    }
  }

  /**
   * Helper function to determine file MIME type from file extension
   * Used as fallback when browser doesn't provide MIME type
   */
  const getFileTypeFromExtension = (fileName: string): string => {
    const extension = fileName.toLowerCase().split('.').pop()
    switch (extension) {
      case 'txt':
        return 'text/plain'
      case 'md':
        return 'text/markdown'
      // DOCX support temporarily disabled
      // case 'docx':
      //   // Official MIME type for Microsoft Word documents
      //   return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      default:
        return 'application/octet-stream'
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

      // Include file metadata if available
      const documentData: any = {
        title: title.trim(),
        content: content.trim(),
      }

      if (fileMetadata) {
        documentData.file_name = fileMetadata.name
        documentData.file_size = fileMetadata.size
        documentData.file_type = fileMetadata.type
      }

      const response = await fetch("/api/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(documentData),
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
      setFileMetadata(null)
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
            <DialogDescription>Upload a text file or markdown file to create a new document. (DOCX support temporarily disabled)</DialogDescription>
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
                      <p className="text-sm font-medium">
                        {isProcessing ? "Processing file..." : "Drop your file here or"}
                      </p>
                      {!isProcessing && (
                        <Button
                          type="button"
                          variant="link"
                          className="h-auto p-0"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          browse files
                        </Button>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".txt,.md"
                        onChange={handleFileInput}
                        className="hidden"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {isProcessing ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Processing document...
                        </span>
                      ) : (
                        "Supports .txt and .md files (DOCX temporarily disabled)"
                      )}
                    </p>
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
            <Button type="submit" disabled={!title.trim() || !content.trim() || isLoading || isProcessing}>
              {(isLoading || isProcessing) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isProcessing ? "Processing..." : "Create Document"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
