import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.warn("Service role key not found, auto-migration disabled");
}

const supabase = serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : null;

export async function runMigrations() {
  if (!supabase) {
    console.log("Skipping migrations - no service role key");
    return;
  }

  try {
    console.log("Running database migrations...");

    // Add display_name_color column if not exists
    try {
      await supabase.rpc('exec_sql', { 
        sql: `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name_color TEXT DEFAULT '#ffffff'` 
      });
    } catch (e) {
      console.log("display_name_color column may already exist or exec_sql not available");
    }

    // Add likes_count column if not exists
    try {
      await supabase.rpc('exec_sql', { 
        sql: `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0` 
      });
    } catch (e) {
      console.log("likes_count column may already exist or exec_sql not available");
    }

    // Create profile_likes table if not exists
    try {
      await supabase.rpc('exec_sql', { 
        sql: `
          CREATE TABLE IF NOT EXISTS profile_likes (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, profile_id)
          )
        `
      });
    } catch (e) {
      console.log("profile_likes table may already exist or exec_sql not available");
    }

    // Create profile_comments table if not exists
    try {
      await supabase.rpc('exec_sql', { 
        sql: `
          CREATE TABLE IF NOT EXISTS profile_comments (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
            content TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `
      });
    } catch (e) {
      console.log("profile_comments table may already exist or exec_sql not available");
    }

    console.log("Migrations completed");
  } catch (error) {
    console.error("Migration error:", error);
  }
}
