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
        (basicProjects || []).map(async (project: any) => {
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

    const { title, description, source_text, template_type, slide_count, template_id, document_id, target_audience } = body

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: "Title is required and must be a non-empty string" }, { status: 400 })
    }

    // Validate source_text if provided
    if (source_text && (typeof source_text !== 'string' || source_text.trim().length < 50)) {
      return NextResponse.json({ error: "Source text must be at least 50 characters long" }, { status: 400 })
    }

    // Validate template_type if provided
    if (template_type && !['NEWS', 'STORY', 'PRODUCT'].includes(template_type)) {
      return NextResponse.json({ error: "Template type must be NEWS, STORY, or PRODUCT" }, { status: 400 })
    }

    // Validate slide_count if provided
    if (slide_count && (typeof slide_count !== 'number' || slide_count < 3 || slide_count > 10)) {
      return NextResponse.json({ error: "Slide count must be between 3 and 10" }, { status: 400 })
    }

    // Validate optional foreign key references
    if (template_id && typeof template_id !== 'string') {
      return NextResponse.json({ error: "template_id must be a string" }, { status: 400 })
    }

    if (document_id && typeof document_id !== 'string') {
      return NextResponse.json({ error: "document_id must be a string" }, { status: 400 })
    }

    // Store source_text in description if provided (temporary solution)
    const finalDescription = source_text ? `${source_text}\n\n---\n\n${description || ''}`.trim() : (description || null)

    console.log("Creating project for user:", userId, "with data:", {
      title: title.trim(),
      description: finalDescription,
      template_type: template_type || 'STORY',
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
        description: finalDescription,
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

    // Create initial slides based on slide_count
    const numberOfSlides = slide_count || 5
    const slidesToCreate = Array.from({ length: numberOfSlides }, (_, index) => ({
      project_id: project.id,
      slide_number: index + 1,
      content: source_text && index === 0 ? `Generated from: ${template_type || 'STORY'} template\n\n[Slide content will be generated here]` : "",
      char_count: 0,
    }))

    const { error: slideError } = await supabase.from("slides").insert(slidesToCreate)

    if (slideError) {
      console.error("Error creating initial slides:", slideError)
      // Note: Project was created but slides failed - this is a warning, not a complete failure
      console.warn("Project created but initial slide creation failed. User can add slides manually.")
    } else {
      console.log(`Created ${numberOfSlides} initial slides for project ${project.id}`)
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
