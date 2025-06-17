import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { requireAuth } from "@/lib/auth"

export async function GET() {
  try {
    const userId = await requireAuth()
    const supabase = createServerSupabaseClient()

    const { data: documents, error } = await supabase
      .from("documents")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("Error fetching documents:", error)
      return NextResponse.json({ error: "Failed to fetch documents", details: error }, { status: 500 })
    }

    return NextResponse.json({ documents: documents || [] })
  } catch (error) {
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    
    console.error("Error in GET /api/documents:", error)
    return NextResponse.json({ error: "Internal server error", details: error }, { status: 500 })
  }
}

/**
 * POST endpoint to create new documents
 * Supports documents created from uploaded files (.txt, .md) or manual text input
 * DOCX support temporarily disabled
 * For uploaded files, stores metadata (file_name, file_size, file_type) for tracking and display
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth()
    const supabase = createServerSupabaseClient()

    const body = await request.json()
    // Extract file metadata along with content - these fields are optional and only present for uploaded files
    // file_name: original filename (e.g., "notes.txt", "readme.md") - docx temporarily disabled
    // file_size: file size in bytes (helpful for storage tracking)
    // file_type: MIME type (e.g., "text/plain" for .txt, "text/markdown" for .md)
    const { title, content, file_name, file_size, file_type } = body

    // More lenient validation - require at least a title
    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const contentToSave = content || ""
    const wordCount = contentToSave.split(/\s+/).filter((word: string) => word.length > 0).length
    const charCount = contentToSave.length

    console.log("Attempting to create document with:", {
      user_id: userId,
      title: title.trim(),
      word_count: wordCount,
      char_count: charCount,
      content_length: contentToSave.length,
      // Log file metadata for debugging - helps track uploaded files (.txt, .md)
      file_name,
      file_size,
      file_type,
    })

    // Prepare base document data - required fields for all documents
    const documentData: any = {
      user_id: userId,
      title: title.trim(),
      content: contentToSave,
      word_count: wordCount,
      char_count: charCount,
      language: "en",
    }

    // Add file metadata if provided (only for uploaded files like .txt, .md - docx disabled)
    // This metadata helps with:
    // 1. Displaying file type indicators in the UI
    // 2. Tracking original file information
    // 3. Potential future features like re-export or file history
    if (file_name) documentData.file_name = file_name
    if (file_size) documentData.file_size = file_size
    if (file_type) documentData.file_type = file_type

    const { data: document, error } = await supabase
      .from("documents")
      .insert(documentData)
      .select()
      .single()

    if (error) {
      console.error("Error creating document:", error)
      return NextResponse.json(
        {
          error: "Failed to create document",
          details: error,
          message: error.message,
        },
        { status: 500 },
      )
    }

    console.log("Document created successfully:", document)
    return NextResponse.json({ document })
  } catch (error) {
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    
    console.error("Error in POST /api/documents:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error,
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
