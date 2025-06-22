import { EnhancedDocumentEditor } from "@/components/documents/enhanced-document-editor"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "New Document - WordWise AI",
  description: "Create a new document with AI-powered writing assistance. Upload files, get grammar checking, and transform content into Instagram carousels.",
}

export default function NewDocumentPage() {
  return (
    <div className="h-screen flex flex-col">
      <EnhancedDocumentEditor isNewDocument={true} />
    </div>
  )
}
