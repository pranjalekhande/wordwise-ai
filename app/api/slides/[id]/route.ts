import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { requireAuth } from "@/lib/auth"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const userId = await requireAuth()

    const body = await request.json()
    const { content, tone } = body

    // Verify user owns this slide through project ownership
    const { data: slide, error: slideError } = await supabase
      .from("slides")
      .select(`
        *,
        carousel_projects!inner (
          user_id
        )
      `)
      .eq("id", id)
      .single()

    if (slideError || slide.carousel_projects.user_id !== userId) {
      return NextResponse.json({ error: "Slide not found" }, { status: 404 })
    }

    const { data: updatedSlide, error } = await supabase
      .from("slides")
      .update({
        content,
        char_count: content.length,
        tone,
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating slide:", error)
      return NextResponse.json({ error: "Failed to update slide" }, { status: 500 })
    }

    return NextResponse.json({ slide: updatedSlide })
  } catch (error) {
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    
    console.error("Error in PUT /api/slides/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const userId = await requireAuth()

    // Verify user owns this slide through project ownership
    const { data: slide, error: slideError } = await supabase
      .from("slides")
      .select(`
        *,
        carousel_projects!inner (
          user_id
        )
      `)
      .eq("id", id)
      .single()

    if (slideError || slide.carousel_projects.user_id !== userId) {
      return NextResponse.json({ error: "Slide not found" }, { status: 404 })
    }

    // Delete the slide
    const { error } = await supabase
      .from("slides")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Error deleting slide:", error)
      return NextResponse.json({ error: "Failed to delete slide" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    
    console.error("Error in DELETE /api/slides/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
