import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check if required environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ Supabase environment variables are not configured. Running in demo mode with limited functionality.")
}

// Create a dummy client if environment variables are missing (for demo mode)
const createDummyClient = () => {
  return {
    from: () => ({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: { message: "Demo mode - configure Supabase" } }) }) }),
      insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: { message: "Demo mode - configure Supabase" } }) }) }),
      update: () => ({ eq: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: { message: "Demo mode - configure Supabase" } }) }) }) }),
      delete: () => ({ eq: () => Promise.resolve({ error: { message: "Demo mode - configure Supabase" } }) }),
      upsert: () => Promise.resolve({ error: { message: "Demo mode - configure Supabase" } }),
      order: () => Promise.resolve({ data: [], error: null }),
    }),
  } as any
}

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createDummyClient()

// Server-side client for API routes
export const createServerSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    return createDummyClient()
  }
  
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
