import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    // Temporarily disabled authentication
    // const { userId } = await auth()
    // if (!userId) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    // }

    // Using demo user ID for now
    const userId = "demo-user-123"

    const { data: projects, error } = await supabase
      .from("carousel_projects")
      .select(`
        *,
        slides (
          id,
          slide_number,
          content,
          char_count
        ),
        brand_voice_templates (
          id,
          name,
          voice_profile
        )
      `)
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("Error fetching projects:", error)
      return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 })
    }

    return NextResponse.json({ projects })
  } catch (error) {
    console.error("Error in GET /api/projects:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    // Create project
    const { data: project, error: projectError } = await supabase
      .from("carousel_projects")
      .insert({
        user_id: userId,
        title,
        template_id: template_id || null,
      })
      .select()
      .single()

    if (projectError) {
      console.error("Error creating project:", projectError)
      return NextResponse.json({ error: "Failed to create project" }, { status: 500 })
    }

    // Create initial slide
    const { error: slideError } = await supabase.from("slides").insert({
      project_id: project.id,
      slide_number: 1,
      content: "",
      char_count: 0,
    })

    if (slideError) {
      console.error("Error creating initial slide:", slideError)
      return NextResponse.json({ error: "Failed to create initial slide" }, { status: 500 })
    }

    return NextResponse.json({ project })
  } catch (error) {
    console.error("Error in POST /api/projects:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
