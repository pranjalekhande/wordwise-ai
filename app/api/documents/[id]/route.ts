import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { requireAuth } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    
    // Handle the "new" case - return empty response for new documents
    if (id === "new") {
      return NextResponse.json({ document: null })
    }

    const userId = await requireAuth()

    const { data: document, error } = await supabase
      .from("documents")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single()

    if (error) {
      console.error("Error fetching document:", error)
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    return NextResponse.json({ document })
  } catch (error) {
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    
    console.error("Error in GET /api/documents/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    
    // Don't allow PUT on "new" - should use POST instead
    if (id === "new") {
      return NextResponse.json({ error: "Cannot update new document" }, { status: 400 })
    }

    const userId = await requireAuth()

    const body = await request.json()
    const { title, content } = body

    // More lenient validation - require at least a title
    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const contentToSave = content || ""
    const wordCount = contentToSave.split(/\s+/).filter((word: string) => word.length > 0).length
    const charCount = contentToSave.length

    const { data: document, error } = await supabase
      .from("documents")
      .update({
        title: title.trim(),
        content: contentToSave,
        word_count: wordCount,
        char_count: charCount,
      })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single()

    if (error) {
      console.error("Error updating document:", error)
      return NextResponse.json({ error: "Failed to update document" }, { status: 500 })
    }

    return NextResponse.json({ document })
  } catch (error) {
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    
    console.error("Error in PUT /api/documents/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    
    // Don't allow DELETE on "new"
    if (id === "new") {
      return NextResponse.json({ error: "Cannot delete new document" }, { status: 400 })
    }

    const userId = await requireAuth()

    const { error } = await supabase.from("documents").delete().eq("id", id).eq("user_id", userId)

    if (error) {
      console.error("Error deleting document:", error)
      return NextResponse.json({ error: "Failed to delete document" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    
    console.error("Error in DELETE /api/documents/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
