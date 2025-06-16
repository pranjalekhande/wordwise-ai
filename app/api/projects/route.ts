import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()
    const userId = "demo-user-123"

    // Ensure the demo user exists
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

    // Try to fetch projects with relationships first
    let { data: projects, error } = await supabase
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
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })

    // If the relationship query fails, fall back to basic project query
    if (error) {
      console.log("Relationship query failed, trying basic query:", error)

      const { data: basicProjects, error: basicError } = await supabase
        .from("carousel_projects")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })

      if (basicError) {
        console.error("Error fetching projects:", basicError)
        return NextResponse.json({ error: "Failed to fetch projects", details: basicError }, { status: 500 })
      }

      // Manually fetch slides for each project
      const projectsWithSlides = await Promise.all(
        (basicProjects || []).map(async (project) => {
          const { data: slides } = await supabase
            .from("slides")
            .select("id, slide_number, content, char_count, tone, created_at, updated_at")
            .eq("project_id", project.id)
            .order("slide_number")

          const { data: template } = await supabase
            .from("brand_voice_templates")
            .select("id, name, voice_profile")
            .eq("id", project.template_id)
            .single()

          return {
            ...project,
            slides: slides || [],
            brand_voice_templates: template,
          }
        }),
      )

      projects = projectsWithSlides
    }

    return NextResponse.json({ projects: projects || [] })
  } catch (error) {
    console.error("Error in GET /api/projects:", error)
    return NextResponse.json({ error: "Internal server error", details: error }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const userId = "demo-user-123"

    const body = await request.json()
    const { title, description, template_id, document_id, target_audience } = body

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    // Ensure the demo user exists
    const { data: user, error: userError } = await supabase.from("users").select("id").eq("id", userId).single()

    if (userError || !user) {
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

    // Create project
    const { data: project, error: projectError } = await supabase
      .from("carousel_projects")
      .insert({
        user_id: userId,
        title,
        description: description || null,
        template_id: template_id || null,
        document_id: document_id || null,
        target_audience: target_audience || null,
      })
      .select()
      .single()

    if (projectError) {
      console.error("Error creating project:", projectError)
      return NextResponse.json({ error: "Failed to create project", details: projectError }, { status: 500 })
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
      return NextResponse.json({ error: "Failed to create initial slide", details: slideError }, { status: 500 })
    }

    return NextResponse.json({ project })
  } catch (error) {
    console.error("Error in POST /api/projects:", error)
    return NextResponse.json({ error: "Internal server error", details: error }, { status: 500 })
  }
}
