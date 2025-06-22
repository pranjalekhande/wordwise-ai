"use client"

import { DocumentsList } from "@/components/documents/documents-list"
import { useEffect } from "react"

export default function DocumentsPage() {
  // Set document title on client side
  useEffect(() => {
    document.title = "My Documents - WordWise AI"
  }, [])

  return (
    <div className="container mx-auto p-6">
      <DocumentsList />
    </div>
  )
}
