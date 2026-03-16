import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client with service role key.
 * Bypasses RLS — use only in API routes, never in client code.
 * Lazy-initialized to ensure env vars are available.
 */
let _admin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!_admin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error("Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
    }
    _admin = createClient(url, key);
  }
  return _admin;
}
