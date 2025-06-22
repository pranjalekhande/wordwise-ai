import { NextResponse, NextRequest } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { requireAuth } from "@/lib/auth"

export async function GET() {
  try {
    const userId = await requireAuth()
    const supabase = createServerSupabaseClient()

    // Get user settings
    const { data: settings, error } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", userId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error("Error fetching user settings:", error)
      return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
    }

    // Return default settings if none exist
    const defaultSettings = {
      preferences: {
        theme: "light",
        language: "en",
        auto_save: true,
        spell_check: true
      },
      notification_settings: {
        email_notifications: true,
        push_notifications: false,
        weekly_reports: true,
        carousel_completion: true,
        document_processing: true,
        system_updates: false
      }
    }

    return NextResponse.json({ 
      settings: settings || defaultSettings 
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    
    console.error("Error in GET /api/user/settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await requireAuth()
    const supabase = createServerSupabaseClient()
    
    const body = await request.json()
    const { preferences, notification_settings } = body

    // Validate input
    if (!preferences && !notification_settings) {
      return NextResponse.json({ error: "At least one of preferences or notification_settings is required" }, { status: 400 })
    }

    // First, try to get existing settings
    const { data: existingSettings } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", userId)
      .single()

    let result
    if (existingSettings) {
      // Update existing settings
      const updateData: any = {}
      if (preferences) updateData.preferences = preferences
      if (notification_settings) updateData.notification_settings = notification_settings

      const { data, error } = await supabase
        .from("user_settings")
        .update(updateData)
        .eq("user_id", userId)
        .select()
        .single()

      if (error) {
        console.error("Error updating user settings:", error)
        return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
      }
      result = data
    } else {
      // Create new settings
      const { data, error } = await supabase
        .from("user_settings")
        .insert({
          user_id: userId,
          preferences: preferences || {
            theme: "light",
            language: "en",
            auto_save: true,
            spell_check: true
          },
          notification_settings: notification_settings || {
            email_notifications: true,
            push_notifications: false,
            weekly_reports: true,
            carousel_completion: true,
            document_processing: true,
            system_updates: false
          }
        })
        .select()
        .single()

      if (error) {
        console.error("Error creating user settings:", error)
        return NextResponse.json({ error: "Failed to create settings" }, { status: 500 })
      }
      result = data
    }

    return NextResponse.json({ settings: result })
  } catch (error) {
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    
    console.error("Error in PUT /api/user/settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 