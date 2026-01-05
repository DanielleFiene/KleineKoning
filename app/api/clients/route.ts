/**
 * app/api/clients/route.ts
 * 
 * API route voor het aanmaken en ophalen van clients. Edge Runtime compatible.
 * Vervangt server actions om compatibel te zijn met Cloudflare/next-on-pages setup.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, btw_label, btw_percentage, btw_rule, rate_ex_btw } = body;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Insert client and get the created client ID
    const { data: newClient, error } = await supabase
      .from("clients")
      .insert({
        owner_user_id: user.id,
        name,
        btw_profile: {
          label: btw_label || "Geen BTW",
          percentage: btw_percentage || 0,
          rule: btw_rule || "none",
        },
        rate_ex_btw: rate_ex_btw ? parseFloat(rate_ex_btw) : null,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Automatically create a default "Algemeen" project for the new client
    if (newClient) {
      const { error: projectError } = await supabase.from("projects").insert({
        owner_user_id: user.id,
        client_id: newClient.id,
        name: "Algemeen",
        default_unit: "minutes",
        rounding_rule: "none",
      });

      if (projectError) {
        // Log error but don't fail client creation if project creation fails
        console.error("Error creating default project:", projectError);
      }
    }

    return NextResponse.json({ client: newClient });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

