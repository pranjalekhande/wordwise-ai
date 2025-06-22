import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { requireAuth } from "@/lib/auth"

export async function GET() {
  try {
    const userId = await requireAuth()
    const supabase = createServerSupabaseClient()

    // Get projects count (carousels created)
    const { count: projectsCount } = await supabase
      .from("carousel_projects")
      .select("*", { count: 'exact', head: true })
      .eq("user_id", userId)

    // Get documents count
    const { count: documentsCount } = await supabase
      .from("documents")
      .select("*", { count: 'exact', head: true })
      .eq("user_id", userId)

    // Calculate writing score based on recent documents
    const { data: recentDocuments } = await supabase
      .from("documents")
      .select("word_count, content")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(10)

    let writingScore = 0
    if (recentDocuments && recentDocuments.length > 0) {
      const totalWords = recentDocuments.reduce((sum: number, doc: any) => sum + (doc.word_count || 0), 0)
      const avgWordsPerDoc = totalWords / recentDocuments.length
      const consistencyBonus = recentDocuments.length >= 5 ? 20 : recentDocuments.length * 4
      writingScore = Math.min(100, Math.round((avgWordsPerDoc / 100) * 60 + consistencyBonus))
    }

    return NextResponse.json({ 
      projectsCount: projectsCount || 0,
      documentsCount: documentsCount || 0,
      writingScore 
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    
    console.error("Error fetching user stats:", error)
    return NextResponse.json({ error: "Failed to fetch user stats" }, { status: 500 })
  }
}

