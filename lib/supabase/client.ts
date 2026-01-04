/**
 * lib/supabase/client.ts
 * 
 * Supabase browser client voor client-side operaties (Client Components).
 * Gebruikt localStorage voor authenticatie state.
 */
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

