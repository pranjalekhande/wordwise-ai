import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { requireAuth } from "@/lib/auth"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = createServerSupabaseClient()
    const userId = await requireAuth()

    const body = await request.json()
    const { slide_number, content, title, tone } = body

    // Verify user owns this project
    const { data: project, error: projectError } = await supabase
      .from("carousel_projects")
      .select("id")
      .eq("id", id)
      .eq("user_id", userId)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const { data: slide, error } = await supabase
      .from("slides")
      .insert({
        project_id: id,
        slide_number: slide_number || 1,
        content: content || "",
        title: title || null,
        tone: tone || null,
        char_count: (content || "").length,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating slide:", error)
      return NextResponse.json({ error: "Failed to create slide", details: error }, { status: 500 })
    }

    return NextResponse.json({ slide })
  } catch (error) {
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    
    console.error("Error in POST /api/projects/[id]/slides:", error)
    return NextResponse.json({ error: "Internal server error", details: error }, { status: 500 })
  }
}
