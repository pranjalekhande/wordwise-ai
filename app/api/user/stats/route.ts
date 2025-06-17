import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { requireAuth } from "@/lib/auth"

export async function GET() {
  try {
    const userId = await requireAuth()
    const supabase = createServerSupabaseClient()

    // Get user settings with default values
    let { data: userSettings } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", userId)
      .single()

    // If no settings exist, create default ones
    if (!userSettings) {
      const defaultSettings = {
        user_id: userId,
        preferences: {
          theme: "light",
          language: "en",
          auto_save: true,
          spell_check: true
        },
        notification_settings: {
          email_notifications: true,
          push_notifications: false,
          weekly_reports: true
        },
        writing_goals: {
          daily_word_target: 500,
          weekly_projects: 3,
          preferred_writing_time: "morning"
        }
      }

      const { data: newSettings, error: createError } = await supabase
        .from("user_settings")
        .insert(defaultSettings)
        .select()
        .single()

      if (createError) {
        console.error("Error creating default user settings:", createError)
        userSettings = defaultSettings as any
      } else {
        userSettings = newSettings
      }
    }

    // Calculate today's word count from documents updated today
    const today = new Date().toISOString().split('T')[0]
    const { data: todayDocuments } = await supabase
      .from("documents")
      .select("word_count, updated_at")
      .eq("user_id", userId)
      .gte("updated_at", today)

    const todayWordCount = todayDocuments?.reduce((sum: number, doc: any) => {
      const docDate = new Date(doc.updated_at).toISOString().split('T')[0]
      return docDate === today ? sum + (doc.word_count || 0) : sum
    }, 0) || 0

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

    // Get project count for this week
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    weekStart.setHours(0, 0, 0, 0)

    const { data: weeklyProjects } = await supabase
      .from("carousel_projects")
      .select("id")
      .eq("user_id", userId)
      .gte("created_at", weekStart.toISOString())

    const weeklyProjectCount = weeklyProjects?.length || 0

    const stats = {
      todayWordCount,
      dailyWordTarget: userSettings.writing_goals?.daily_word_target || 500,
      writingScore,
      weeklyProjectCount,
      weeklyProjectTarget: userSettings.writing_goals?.weekly_projects || 3,
      userSettings: {
        dailyWordTarget: userSettings.writing_goals?.daily_word_target || 500,
        weeklyProjectTarget: userSettings.writing_goals?.weekly_projects || 3,
        preferredWritingTime: userSettings.writing_goals?.preferred_writing_time || "morning"
      }
    }

    return NextResponse.json(stats)
  } catch (error) {
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    
    console.error("Error fetching user stats:", error)
    return NextResponse.json({ error: "Failed to fetch user stats" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await requireAuth()
    const supabase = createServerSupabaseClient()
    const body = await request.json()

    const { dailyWordTarget, weeklyProjectTarget, preferredWritingTime } = body

    // Update user settings
    const { error } = await supabase
      .from("user_settings")
      .upsert({
        user_id: userId,
        writing_goals: {
          daily_word_target: dailyWordTarget || 500,
          weekly_projects: weeklyProjectTarget || 3,
          preferred_writing_time: preferredWritingTime || "morning"
        },
        updated_at: new Date().toISOString()
      })

    if (error) {
      console.error("Error updating user settings:", error)
      return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    
    console.error("Error updating user settings:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}

