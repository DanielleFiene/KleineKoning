/**
 * app/api/time-entries/route.ts
 * 
 * API route voor het ophalen en aanmaken van time entries. Vervangt server actions
 * om compatibel te zijn met Cloudflare/next-on-pages setup.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "edge";

function applyRounding(
  minutes: number,
  rule: "none" | "nearest15" | "up15" | "down15"
): number {
  switch (rule) {
    case "none":
      return minutes;
    case "nearest15":
      return Math.round(minutes / 15) * 15;
    case "up15":
      return Math.ceil(minutes / 15) * 15;
    case "down15":
      return Math.floor(minutes / 15) * 15;
    default:
      return minutes;
  }
}

function convertToMinutes(value: number, unit: string): number {
  switch (unit) {
    case "minutes":
      return value;
    case "quarter":
      return value * 15;
    case "hour":
      return value * 60;
    case "day":
      return value * 480; // 8 hours
    default:
      return value;
  }
}

// POST voor ophalen (query) of aanmaken (create)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Check if this is a create request (has client_id, project_id, date, etc.)
    if (body.client_id && body.project_id && body.date) {
      // CREATE time entry
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
      }

      const { client_id, project_id, date, description, duration_value, duration_unit } = body;

      // Get project to check rounding rule
      const { data: project } = await supabase
        .from("projects")
        .select("rounding_rule")
        .eq("id", project_id)
        .eq("owner_user_id", user.id)
        .single();

      const roundingRule =
        (project?.rounding_rule as "none" | "nearest15" | "up15" | "down15") || "none";

      // Convert to minutes
      let durationMinutes = convertToMinutes(duration_value, duration_unit);

      // Apply rounding
      durationMinutes = applyRounding(durationMinutes, roundingRule);

      const { data, error } = await supabase.from("time_entries").insert({
        owner_user_id: user.id,
        client_id,
        project_id,
        date,
        description,
        duration_minutes: durationMinutes,
      }).select(`
        *,
        clients(name, id),
        projects(name, rounding_rule, id)
      `).single();

      if (error) {
        throw error;
      }

      return NextResponse.json({ entry: data });
    } else {
      // QUERY time entries (existing behavior)
      const { clientId, projectId, startDate, endDate } = body;

      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
      }

      let query = supabase
        .from("time_entries")
        .select("*, clients(name), projects(name, rounding_rule)")
        .eq("owner_user_id", user.id)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });

      if (clientId) {
        query = query.eq("client_id", clientId);
      }

      if (projectId) {
        query = query.eq("project_id", projectId);
      }

      if (startDate) {
        query = query.gte("date", startDate);
      }

      if (endDate) {
        query = query.lte("date", endDate);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return NextResponse.json({ entries: data ?? [] });
    }
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

