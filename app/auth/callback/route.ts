/**
 * app/auth/callback/route.ts
 * 
 * OAuth callback route voor Supabase authenticatie. Wisselt auth codes uit voor
 * sessies en redirect naar dashboard. Moet publiek toegankelijk zijn.
 */
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const runtime = 'edge';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/time";

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}

