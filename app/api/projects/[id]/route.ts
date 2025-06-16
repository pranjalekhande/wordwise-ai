import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerSupabaseClient()
    const userId = "demo-user-123"

    // Try to fetch project with relationships first
    let { data: project, error } = await supabase
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

    // If the relationship query fails, fall back to basic project query
    if (error) {
      console.log("Relationship query failed, trying basic query:", error)

      const { data: basicProject, error: basicError } = await supabase
        .from("carousel_projects")
        .select("*")
        .eq("id", params.id)
        .eq("user_id", userId)
        .single()

      if (basicError) {
        console.error("Error fetching project:", basicError)
        return NextResponse.json({ error: "Project not found", details: basicError }, { status: 404 })
      }

      // Manually fetch slides and template
      const { data: slides } = await supabase
        .from("slides")
        .select("id, slide_number, content, char_count, tone, created_at, updated_at")
        .eq("project_id", basicProject.id)
        .order("slide_number")

      const { data: template } = await supabase
        .from("brand_voice_templates")
        .select("id, name, voice_profile")
        .eq("id", basicProject.template_id)
        .single()

      project = {
        ...basicProject,
        slides: slides || [],
        brand_voice_templates: template,
      }
    }

    // Sort slides by slide_number
    if (project.slides) {
      project.slides.sort((a: any, b: any) => a.slide_number - b.slide_number)
    }

    return NextResponse.json({ project })
  } catch (error) {
    console.error("Error in GET /api/projects/[id]:", error)
    return NextResponse.json({ error: "Internal server error", details: error }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerSupabaseClient()
    const userId = "demo-user-123"

    const body = await request.json()
    const { title, description, template_id, document_id, target_audience } = body

    const { data: project, error } = await supabase
      .from("carousel_projects")
      .update({
        title,
        description: description || null,
        template_id: template_id || null,
        document_id: document_id || null,
        target_audience: target_audience || null,
      })
      .eq("id", params.id)
      .eq("user_id", userId)
      .select()
      .single()

    if (error) {
      console.error("Error updating project:", error)
      return NextResponse.json({ error: "Failed to update project", details: error }, { status: 500 })
    }

    return NextResponse.json({ project })
  } catch (error) {
    console.error("Error in PUT /api/projects/[id]:", error)
    return NextResponse.json({ error: "Internal server error", details: error }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerSupabaseClient()
    const userId = "demo-user-123"

    const { error } = await supabase.from("carousel_projects").delete().eq("id", params.id).eq("user_id", userId)

    if (error) {
      console.error("Error deleting project:", error)
      return NextResponse.json({ error: "Failed to delete project", details: error }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/projects/[id]:", error)
    return NextResponse.json({ error: "Internal server error", details: error }, { status: 500 })
  }
}
