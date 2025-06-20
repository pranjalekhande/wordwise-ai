import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient()
    const projectId = params.id

    // Get the current project
    const { data: project, error: projectError } = await supabase
      .from("carousel_projects")
      .select(`
        *,
        documents (
          id,
          title,
          content,
          word_count
        )
      `)
      .eq("id", projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      )
    }

    // Check if project has source content for regeneration
    if (!project.documents?.content) {
      return NextResponse.json(
        { error: "No source document found for regeneration" },
        { status: 400 }
      )
    }

    // Delete existing slides
    const { error: deleteError } = await supabase
      .from("slides")
      .delete()
      .eq("project_id", projectId)

    if (deleteError) {
      console.error("Error deleting existing slides:", deleteError)
      return NextResponse.json(
        { error: "Failed to clear existing slides" },
        { status: 500 }
      )
    }

    // Generate new slides using AI
    const generateResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/generate-slides`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source_text: project.documents.content,
        template_type: project.template_type || "PRODUCT",
        slide_count: project.slides?.length || 5,
        project_id: projectId,
      }),
    })

    if (!generateResponse.ok) {
      throw new Error("Failed to generate new slides")
    }

    const { slides: newSlides } = await generateResponse.json()

    // Save the generated slides to database
    const slidesToInsert = newSlides.map((slide: any) => ({
      project_id: projectId,
      slide_number: slide.slide_number,
      title: slide.title,
      content: slide.content,
      char_count: slide.content.length,
      tone: "ai_generated",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))

    const { error: insertError } = await supabase
      .from("slides")
      .insert(slidesToInsert)

    if (insertError) {
      console.error("Error inserting new slides:", insertError)
      return NextResponse.json(
        { error: "Failed to save regenerated slides" },
        { status: 500 }
      )
    }

    // Fetch the updated project with new slides
    const { data: updatedProject, error: fetchError } = await supabase
      .from("carousel_projects")
      .select(`
        *,
        slides (*),
        brand_voice_templates (*),
        documents (
          id,
          title,
          content,
          word_count,
          char_count,
          language,
          file_name,
          created_at,
          updated_at
        )
      `)
      .eq("id", projectId)
      .single()

    if (fetchError) {
      return NextResponse.json(
        { error: "Failed to fetch updated project" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      project: updatedProject,
      message: "All slides regenerated successfully"
    })

  } catch (error) {
    console.error("Error regenerating slides:", error)
    return NextResponse.json(
      { error: "Failed to regenerate slides" },
      { status: 500 }
    )
  }
} 