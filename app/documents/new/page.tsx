"use client"

import { EnhancedDocumentEditor } from "@/components/documents/enhanced-document-editor"

export default function NewDocumentPage() {
  return (
    <div className="h-screen flex flex-col">
      <EnhancedDocumentEditor isNewDocument={true} />
    </div>
  )
}
