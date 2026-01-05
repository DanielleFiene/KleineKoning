/**
 * app/auth/callback/route.ts
 * 
 * OAuth callback route voor Supabase authenticatie. Wisselt auth codes uit voor
 * sessies en redirect naar dashboard. Moet publiek toegankelijk zijn.
 * 
 * Gebruikt request-based cookie handling (zoals middleware) voor Edge Runtime compatibiliteit.
 */
import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/time";

  let response = NextResponse.redirect(new URL(next, url.origin));

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=no_code", url.origin));
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    // Pass through specific error message (e.g., "invalid_code", "expired", etc.)
    const errorMessage = encodeURIComponent(error.message || "code_exchange_failed");
    return NextResponse.redirect(new URL(`/login?error=${errorMessage}`, url.origin));
  }

  return response;
}

