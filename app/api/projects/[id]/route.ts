import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Temporarily disabled authentication
    // const { userId } = await auth()
    // if (!userId) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    // }

    // Using demo user ID for now
    const userId = "demo-user-123"

    const { data: project, error } = await supabase
      .from("carousel_projects")
      .select(`
        *,
        slides (
          id,
          slide_number,
          content,
          char_count,
          tone,
          created_at,
          updated_at
        ),
        brand_voice_templates (
          id,
          name,
          voice_profile
        )
      `)
      .eq("id", params.id)
      .eq("user_id", userId)
      .single()

    if (error) {
      console.error("Error fetching project:", error)
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Sort slides by slide_number
    if (project.slides) {
      project.slides.sort((a: any, b: any) => a.slide_number - b.slide_number)
    }

    return NextResponse.json({ project })
  } catch (error) {
    console.error("Error in GET /api/projects/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

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
    const { title, template_id } = body

    const { data: project, error } = await supabase
      .from("carousel_projects")
      .update({
        title,
        template_id: template_id || null,
      })
      .eq("id", params.id)
      .eq("user_id", userId)
      .select()
      .single()

    if (error) {
      console.error("Error updating project:", error)
      return NextResponse.json({ error: "Failed to update project" }, { status: 500 })
    }

    return NextResponse.json({ project })
  } catch (error) {
    console.error("Error in PUT /api/projects/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Temporarily disabled authentication
    // const { userId } = await auth()
    // if (!userId) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    // }

    // Using demo user ID for now
    const userId = "demo-user-123"

    const { error } = await supabase.from("carousel_projects").delete().eq("id", params.id).eq("user_id", userId)

    if (error) {
      console.error("Error deleting project:", error)
      return NextResponse.json({ error: "Failed to delete project" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/projects/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
