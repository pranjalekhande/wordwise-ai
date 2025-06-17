"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { FileText, Plus, Search, MoreHorizontal, Edit, Trash2, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { formatDate } from "@/lib/utils"
import type { Document } from "@/lib/types"

export function DocumentsList() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      const response = await fetch("/api/documents")
      if (response.ok) {
        const { documents } = await response.json()
        setDocuments(documents)
      }
    } catch (error) {
      console.error("Error fetching documents:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredDocuments = documents.filter((document) =>
    document.title.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleDocumentClick = (documentId: string) => {
    router.push(`/documents/${documentId}`)
  }

  const handleNewDocument = () => {
    router.push("/documents/new")
  }

  const handleDelete = async (documentId: string, e: React.MouseEvent) => {
    e.stopPropagation()

    if (!confirm("Are you sure you want to delete this document?")) return

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setDocuments(documents.filter((doc) => doc.id !== documentId))
      }
    } catch (error) {
      console.error("Error deleting document:", error)
    }
  }

  const handleDocumentExport = async (documentId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    try {
      // Find the document in our documents list
      const documentToExport = documents.find(doc => doc.id === documentId)
      if (!documentToExport) {
        console.error("Document not found for export")
        return
      }

      // Import export utility dynamically
      const { exportDocument } = await import("@/lib/export-utils")
      
      // Export as text format
      exportDocument(documentToExport, 'txt')
    } catch (error) {
      console.error("Error exporting document:", error)
    }
  }

  const getFileExtension = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toUpperCase()
    return extension || 'FILE'
  }

  /**
   * Convert file type/MIME type to user-friendly display text
   * Handles special cases for uploaded files and provides fallbacks for other types
   * DOCX support temporarily disabled
   */
  const getFileTypeDisplay = (fileType: string): string => {
    // DOCX support temporarily disabled
    // // Handle Microsoft Word documents - both MIME type and file extension matching
    // if (fileType?.includes('wordprocessingml') || fileType?.includes('docx')) {
    //   return 'Word Document'
    // }
    // Handle plain text files
    if (fileType?.includes('text/plain') || fileType?.includes('txt')) {
      return 'Text File'
    }
    // Handle markdown files
    if (fileType?.includes('markdown') || fileType?.includes('md')) {
      return 'Markdown'
    }
    // Check for docx files and show as disabled
    if (fileType?.includes('wordprocessingml') || fileType?.includes('docx')) {
      return 'Word Document (Legacy)'
    }
    // Fallback for any other uploaded file types
    return 'Uploaded File'
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Documents</h1>
            <p className="text-muted-foreground">Manage your text documents</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded w-full"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Documents</h1>
          <p className="text-muted-foreground">Manage your text documents and create new ones</p>
        </div>
        <Button onClick={handleNewDocument}>
          <Plus className="h-4 w-4 mr-2" />
          New Document
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredDocuments.map((document) => (
          <Card
            key={document.id}
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleDocumentClick(document.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <h3 className="font-semibold truncate">{document.title}</h3>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleDocumentClick(document.id)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => handleDocumentExport(document.id, e)}>
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={(e) => handleDelete(document.id, e)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">{document.content.substring(0, 100)}...</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {document.word_count} words • {document.char_count} chars
                    {document.file_name && (
                      <span className="ml-2">• {getFileTypeDisplay(document.file_type || document.file_name)}</span>
                    )}
                  </span>
                  <span>{formatDate(document.updated_at)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {document.language.toUpperCase()}
                    </Badge>
                    {document.file_name && (
                      <Badge variant="outline" className="text-xs">
                        {getFileExtension(document.file_name)}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-xs text-muted-foreground">Saved</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDocuments.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No documents found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery ? "Try adjusting your search terms" : "Create your first document to get started"}
          </p>
          <Button onClick={handleNewDocument}>
            <Plus className="h-4 w-4 mr-2" />
            New Document
          </Button>
        </div>
      )}
    </div>
  )
}
