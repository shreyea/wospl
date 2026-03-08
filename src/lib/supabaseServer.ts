import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _supabaseServer: SupabaseClient | null = null;

export function getSupabaseServer(): SupabaseClient {
  if (!_supabaseServer) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error(
        "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables."
      );
    }
    _supabaseServer = createClient(url, key);
  }
  return _supabaseServer;
}
