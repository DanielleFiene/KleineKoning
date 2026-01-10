/**
 * app/api/time-entries/[id]/route.ts
 * 
 * API route voor het bijwerken en verwijderen van time entries. Edge Runtime compatible.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = 'edge';

function convertToMinutes(value: number, unit: string): number {
  switch (unit) {
    case "minutes":
      return value;
    case "quarter":
      return value * 15;
    case "hour":
      return value * 60;
    case "day":
      return value * 480;
    default:
      return value;
  }
}

function applyRounding(
  minutes: number,
  rule: "none" | "nearest15" | "up15" | "down15"
): number {
  if (rule === "none") return minutes;
  if (rule === "nearest15") return Math.round(minutes / 15) * 15;
  if (rule === "up15") return Math.ceil(minutes / 15) * 15;
  if (rule === "down15") return Math.floor(minutes / 15) * 15;
  return minutes;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: entryId } = await params;
    const body = await req.json();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { client_id, project_id, date, description, duration_value, duration_unit } = body;

    // Validate description length
    if (description && description.trim().length > 75) {
      return NextResponse.json(
        { error: "Omschrijving mag maximaal 75 karakters bevatten" },
        { status: 400 }
      );
    }

    // Get project to check rounding rule
    const { data: project } = await supabase
      .from("projects")
      .select("rounding_rule")
      .eq("id", project_id)
      .eq("owner_user_id", user.id)
      .single();

    const roundingRule =
      (project?.rounding_rule as
        | "none"
        | "nearest15"
        | "up15"
        | "down15") || "none";

    // Convert to minutes
    let durationMinutes = convertToMinutes(duration_value, duration_unit);

    // Apply rounding
    durationMinutes = applyRounding(durationMinutes, roundingRule);

    const { data, error } = await supabase
      .from("time_entries")
      .update({
        client_id,
        project_id,
        date,
        description,
        duration_minutes: durationMinutes,
      })
      .eq("id", entryId)
      .eq("owner_user_id", user.id)
      .select("*, clients(name), projects(name, rounding_rule)")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, entry: data });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: entryId } = await params;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { error } = await supabase
      .from("time_entries")
      .delete()
      .eq("id", entryId)
      .eq("owner_user_id", user.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

