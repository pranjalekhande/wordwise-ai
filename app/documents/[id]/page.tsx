"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EnhancedDocumentEditor } from "@/components/documents/enhanced-document-editor"
import type { Document } from "@/lib/types"

export default function DocumentPage() {
  const params = useParams()
  const router = useRouter()
  const [document, setDocument] = useState<Document | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isNewDocument, setIsNewDocument] = useState(false)

  useEffect(() => {
    if (params.id) {
      if (params.id === "new") {
        // This is a new document
        setIsNewDocument(true)
        setDocument(null)
        setIsLoading(false)
      } else {
        // This is an existing document
        setIsNewDocument(false)
        fetchDocument(params.id as string)
      }
    }
  }, [params.id])

  const fetchDocument = async (documentId: string) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/documents/${documentId}`)

      if (!response.ok) {
        throw new Error("Document not found")
      }

      const { document } = await response.json()
      setDocument(document)
    } catch (error) {
      console.error("Error fetching document:", error)
      setError("Failed to load document")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading document...</span>
        </div>
      </div>
    )
  }

  if (error && !isNewDocument) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <h2 className="text-xl font-semibold">Document not found</h2>
        <p className="text-muted-foreground">{error || "The document you're looking for doesn't exist."}</p>
        <Button onClick={() => router.push("/documents")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Documents
        </Button>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      <EnhancedDocumentEditor document={document} isNewDocument={isNewDocument} />
    </div>
  )
}
