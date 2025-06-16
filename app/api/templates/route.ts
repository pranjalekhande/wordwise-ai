import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()

    const { data: templates, error } = await supabase
      .from("brand_voice_templates")
      .select("*")
      .eq("is_public", true)
      .order("usage_count", { ascending: false })

    if (error) {
      console.error("Error fetching templates:", error)
      return NextResponse.json({ error: "Failed to fetch templates", details: error }, { status: 500 })
    }

    return NextResponse.json({ templates: templates || [] })
  } catch (error) {
    console.error("Error in GET /api/templates:", error)
    return NextResponse.json({ error: "Internal server error", details: error }, { status: 500 })
  }
}
