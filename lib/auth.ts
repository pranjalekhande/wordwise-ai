import { auth, currentUser } from "@clerk/nextjs/server"
import { createServerSupabaseClient } from "./supabase"

/**
 * Get the authenticated user ID from Clerk
 * Returns null if user is not authenticated
 */
export async function getAuthUserId(): Promise<string | null> {
  try {
    const { userId } = await auth()
    return userId
  } catch (error) {
    console.error("Error getting auth user ID:", error)
    return null
  }
}

/**
 * Get the current authenticated user from Clerk
 * Returns null if user is not authenticated
 */
export async function getCurrentUser() {
  try {
    const user = await currentUser()
    return user
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

/**
 * Ensure the authenticated user exists in the database
 * Creates the user if they don't exist
 */
export async function ensureUserInDatabase(userId: string) {
  try {
    const supabase = createServerSupabaseClient()
    const user = await getCurrentUser()
    
    if (!user) {
      throw new Error("User not found in Clerk")
    }

    // Check if user exists in database
    const { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found"
      throw fetchError
    }

    // If user doesn't exist, create them
    if (!existingUser) {
      const { error: createError } = await supabase
        .from("users")
        .upsert({
          id: userId,
          email: user.emailAddresses[0]?.emailAddress || `${userId}@clerk.user`,
          name: user.fullName || user.firstName || "User",
          avatar_url: user.imageUrl,
          plan_type: "free",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (createError) {
        throw createError
      }

      console.log(`Created new user in database: ${userId}`)
    }

    return { success: true }
  } catch (error) {
    console.error("Error ensuring user in database:", error)
    return { success: false, error }
  }
}

/**
 * Get authenticated user ID and ensure they exist in database
 * Returns user ID or throws error if not authenticated
 */
export async function requireAuth(): Promise<string> {
  const userId = await getAuthUserId()
  
  if (!userId) {
    throw new Error("Authentication required")
  }

  // Ensure user exists in database
  const result = await ensureUserInDatabase(userId)
  if (!result.success) {
    throw new Error("Failed to sync user with database")
  }

  return userId
} 