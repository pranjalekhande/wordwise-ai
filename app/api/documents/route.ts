import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    const userId = "demo-user-123"

    const { data: documents, error } = await supabase
      .from("documents")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("Error fetching documents:", error)
      return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 })
    }

    return NextResponse.json({ documents })
  } catch (error) {
    console.error("Error in GET /api/documents:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = "demo-user-123"

    const body = await request.json()
    const { title, content } = body

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 })
    }

    const wordCount = content.split(/\s+/).filter((word: string) => word.length > 0).length
    const charCount = content.length

    const { data: document, error } = await supabase
      .from("documents")
      .insert({
        user_id: userId,
        title,
        content,
        word_count: wordCount,
        char_count: charCount,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating document:", error)
      return NextResponse.json({ error: "Failed to create document" }, { status: 500 })
    }

    return NextResponse.json({ document })
  } catch (error) {
    console.error("Error in POST /api/documents:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
