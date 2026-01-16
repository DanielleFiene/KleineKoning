/**
 * app/api/statements/route.ts
 * 
 * API route voor het beheren van statements. GET haalt alle statements op,
 * POST maakt een nieuwe statement aan. Edge Runtime compatible.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = 'edge';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("statements")
      .select("*, clients(name)")
      .eq("owner_user_id", user.id)
      .order("generated_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json(data ?? []);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { clientId, periodStart, periodEnd, entries } = await req.json();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Generate statement number
    const { data: statements } = await supabase
      .from("statements")
      .select("statement_number")
      .eq("owner_user_id", user.id)
      .order("statement_number", { ascending: false })
      .limit(1);

    let nextNumber = 1;
    if (statements && statements.length > 0) {
      const match = statements[0].statement_number.match(/ST-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    const statementNumber = `ST-${String(nextNumber).padStart(4, "0")}`;

    // Create statement
    const { data: statement, error: statementError } = await supabase
      .from("statements")
      .insert({
        owner_user_id: user.id,
        client_id: clientId,
        statement_number: statementNumber,
        period_start: periodStart,
        period_end: periodEnd,
      })
      .select()
      .single();

    if (statementError) {
      throw statementError;
    }

    if (!statement) {
      throw new Error("Failed to create statement");
    }

    // Get client
    const { data: client } = await supabase
      .from("clients")
      .select("name")
      .eq("id", clientId)
      .single();

    // Create statement lines (snapshot)
    const statementLines = entries.map((entry: any) => ({
      statement_id: statement.id,
      date: entry.date,
      description: entry.description,
      duration_minutes: entry.duration_minutes,
      project_name: entry.projects?.name || "Onbekend project",
    }));

    const { error: linesError } = await supabase
      .from("statement_lines")
      .insert(statementLines);

    if (linesError) {
      throw linesError;
    }

    return NextResponse.json({ statement, client });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
