import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env["VITE_SUPABASE_URL"] ??
  import.meta.env["NEXT_PUBLIC_SUPABASE_URL"] ??
  "https://byceifewwxvjicrrbdps.supabase.co";

const supabaseKey =
  import.meta.env["VITE_SUPABASE_ANON_KEY"] ??
  import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ??
  import.meta.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"] ??
  import.meta.env["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"] ??
  "sb_publishable_JiwS7sh_BtwIu75FRJkHIg_TNXo9R2P";


if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase URL or Key is missing. Check your .env.local file.");
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "sportsense-auth-token",
  },
});
