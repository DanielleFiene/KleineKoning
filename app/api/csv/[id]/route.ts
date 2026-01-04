/**
 * app/api/csv/[id]/route.ts
 * 
 * API route voor het serveren van CSV exports van urenstaten. Genereert CSV met alle entries,
 * totaal aantal minuten en geformatteerd totaal (uren en minuten). Controleert authenticatie
 * en autorisatie. Retourneert CSV met UTF-8 BOM voor Excel compatibiliteit.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStatement } from "@/app/actions/statements";

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: statementId } = await params;
    
    if (!statementId) {
      return NextResponse.json({ error: "Statement ID is required" }, { status: 400 });
    }

    // Check authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get statement with lines
    const statement = await getStatement(statementId);
    
    if (!statement || !statement.statement_lines) {
      return NextResponse.json({ error: "Statement not found" }, { status: 404 });
    }

    // Check if user owns this statement
    if (statement.owner_user_id !== user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Generate CSV
    const csvRows = [];
    csvRows.push(["Datum", "Project", "Omschrijving", "Duur (minuten)"]);
    
    let totalMinutes = 0;
    statement.statement_lines.forEach((line: any) => {
      csvRows.push([
        line.date,
        line.project_name || "",
        line.description,
        line.duration_minutes.toString(),
      ]);
      totalMinutes += line.duration_minutes;
    });
    
    // Add total row
    csvRows.push([]); // Empty row for spacing
    csvRows.push(["Totaal", "", "", totalMinutes.toString()]);
    
    // Format total duration (hours and minutes)
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const totalFormatted = minutes > 0 ? `${hours}u ${minutes}min` : `${hours}u`;
    csvRows.push(["Totaal (geformatteerd)", "", "", totalFormatted]);
    
    const csvContent = csvRows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    // Add UTF-8 BOM for Excel compatibility
    const csvWithBom = "\uFEFF" + csvContent;

    // Return CSV file with proper headers
    // Use application/csv or text/csv - some browsers prefer application/csv
    return new NextResponse(csvWithBom, {
      headers: {
        "Content-Type": "application/csv;charset=utf-8",
        "Content-Disposition": `attachment; filename="urenstaat_${(statement.clients?.name || "export").replace(/[^a-zA-Z0-9]/g, "_")}_${statement.period_start}_${statement.period_end}.csv"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (error) {
    console.error("Error serving CSV:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

