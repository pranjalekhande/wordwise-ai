import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Temporarily disabled authentication
    // const { userId } = await auth()
    // if (!userId) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    // }

    // Using demo user ID for now
    const userId = "demo-user-123"

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
      .eq("id", params.id)
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
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating slide:", error)
      return NextResponse.json({ error: "Failed to update slide" }, { status: 500 })
    }

    return NextResponse.json({ slide: updatedSlide })
  } catch (error) {
    console.error("Error in PUT /api/slides/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
