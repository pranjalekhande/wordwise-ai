import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { requireAuth } from "@/lib/auth"
import type { CarouselProject } from "@/lib/types"

export async function GET() {
  try {
    const userId = await requireAuth()
    const supabase = createServerSupabaseClient()

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
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    
    console.error("Error in GET /api/projects:", error)
    return NextResponse.json({ error: "Internal server error", details: error }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth()
    const supabase = createServerSupabaseClient()

    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error("Error parsing request body:", parseError)
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 })
    }

    const { title, description, template_id, document_id, target_audience } = body

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: "Title is required and must be a non-empty string" }, { status: 400 })
    }

    // Validate optional foreign key references
    if (template_id && typeof template_id !== 'string') {
      return NextResponse.json({ error: "template_id must be a string" }, { status: 400 })
    }

    if (document_id && typeof document_id !== 'string') {
      return NextResponse.json({ error: "document_id must be a string" }, { status: 400 })
    }

    console.log("Creating project for user:", userId, "with data:", {
      title: title.trim(),
      description: description || null,
      template_id: template_id || null,
      document_id: document_id || null,
      target_audience: target_audience || null,
    })

    // Create project
    const { data: project, error: projectError } = await supabase
      .from("carousel_projects")
      .insert({
        user_id: userId,
        title: title.trim(),
        description: description || null,
        template_id: template_id || null,
        document_id: document_id || null,
        target_audience: target_audience || null,
      })
      .select()
      .single()

    if (projectError) {
      console.error("Error creating project:", projectError)
      
      // Provide more specific error messages based on error code
      if (projectError.code === '23503') {
        if (projectError.message.includes('template_id')) {
          return NextResponse.json({ error: "Selected template does not exist" }, { status: 400 })
        }
        if (projectError.message.includes('document_id')) {
          return NextResponse.json({ error: "Selected document does not exist" }, { status: 400 })
        }
        if (projectError.message.includes('user_id')) {
          return NextResponse.json({ error: "User authentication error" }, { status: 401 })
        }
        return NextResponse.json({ error: "Referenced item does not exist" }, { status: 400 })
      }
      
      return NextResponse.json({ 
        error: "Failed to create project", 
        details: process.env.NODE_ENV === 'development' ? projectError : undefined 
      }, { status: 500 })
    }

    if (!project) {
      return NextResponse.json({ error: "Project creation failed - no data returned" }, { status: 500 })
    }

    console.log("Project created successfully:", project.id)

    // Create initial slide
    const { error: slideError } = await supabase.from("slides").insert({
      project_id: project.id,
      slide_number: 1,
      content: "",
      char_count: 0,
    })

    if (slideError) {
      console.error("Error creating initial slide:", slideError)
      // Note: Project was created but slide failed - this is a warning, not a complete failure
      console.warn("Project created but initial slide creation failed. User can add slides manually.")
    }

    return NextResponse.json({ project })
  } catch (error) {
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    
    if (error instanceof Error && error.message === "Failed to sync user with database") {
      return NextResponse.json({ error: "User setup error. Please try signing in again." }, { status: 401 })
    }
    
    console.error("Error in POST /api/projects:", error)
    return NextResponse.json({ 
      error: "Internal server error", 
      details: process.env.NODE_ENV === 'development' ? error : undefined 
    }, { status: 500 })
  }
}
