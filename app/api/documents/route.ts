import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()
    const userId = "demo-user-123"

    // First, ensure the demo user exists
    const { data: user, error: userError } = await supabase.from("users").select("id").eq("id", userId).single()

    if (userError || !user) {
      console.log("Demo user not found, creating...")
      const { error: createUserError } = await supabase.from("users").upsert({
        id: userId,
        email: "demo@wordwise.ai",
        name: "Demo User",
        plan_type: "pro",
      })

      if (createUserError) {
        console.error("Error creating demo user:", createUserError)
      }
    }

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
    console.error("Error in GET /api/documents:", error)
    return NextResponse.json({ error: "Internal server error", details: error }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const userId = "demo-user-123"

    const body = await request.json()
    const { title, content } = body

    // More lenient validation - require at least a title
    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    // Ensure the demo user exists first
    const { data: user, error: userError } = await supabase.from("users").select("id").eq("id", userId).single()

    if (userError || !user) {
      console.log("Demo user not found, creating...")
      const { error: createUserError } = await supabase.from("users").upsert({
        id: userId,
        email: "demo@wordwise.ai",
        name: "Demo User",
        plan_type: "pro",
      })

      if (createUserError) {
        console.error("Error creating demo user:", createUserError)
        return NextResponse.json({ error: "Failed to create user", details: createUserError }, { status: 500 })
      }
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
    })

    const { data: document, error } = await supabase
      .from("documents")
      .insert({
        user_id: userId,
        title: title.trim(),
        content: contentToSave,
        word_count: wordCount,
        char_count: charCount,
        language: "en",
      })
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
