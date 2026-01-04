import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStatement } from "@/app/actions/statements";
import { generateStatementPDF } from "@/lib/utils/pdf-generator";

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

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get full statement with lines
    const statement = await getStatement(statementId);
    
    if (!statement) {
      return NextResponse.json({ error: "Statement not found" }, { status: 404 });
    }

    // Check if user owns this statement
    if (statement.owner_user_id !== user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // If we have a PDF URL from storage, try to fetch and serve it
    if (statement.pdf_url && !statement.pdf_url.startsWith("data:")) {
      try {
        // Try to fetch the PDF from the URL
        const response = await fetch(statement.pdf_url);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          // Check if it's actually a PDF (starts with %PDF)
          const header = String.fromCharCode(...uint8Array.slice(0, 4));
          if (header === "%PDF") {
            return new NextResponse(uint8Array, {
              headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="urenstaat_${statement.clients?.name || "export"}_${statement.period_start}_${statement.period_end}.pdf"`,
              },
            });
          }
        }
      } catch (fetchError) {
        console.warn("Could not fetch PDF from URL, generating new one:", fetchError);
      }
    }

    // Generate real PDF from statement data
    if (!statement.statement_lines || statement.statement_lines.length === 0) {
      return NextResponse.json({ error: "No data found for this statement" }, { status: 404 });
    }

    // Calculate totals
    const totalMinutes = statement.statement_lines.reduce(
      (sum: number, line: any) => sum + line.duration_minutes,
      0
    );

    // Prepare entries for PDF
    const pdfEntries = statement.statement_lines.map((line: any) => ({
      date: line.date,
      project_name: line.project_name || "-",
      description: line.description,
      duration_minutes: line.duration_minutes,
    }));

    // Generate PDF directly using pdf-lib (Edge Runtime compatible)
    const pdfBytes = await generateStatementPDF(
      statement.clients?.name || "Onbekend",
      statement.statement_number,
      statement.period_start,
      statement.period_end,
      pdfEntries,
      totalMinutes
    );

    // Convert to ArrayBuffer for NextResponse
    const arrayBuffer = pdfBytes.buffer instanceof ArrayBuffer
      ? pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength)
      : new Uint8Array(pdfBytes).buffer;

    // Return PDF directly
    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="urenstaat_${statement.clients?.name || "export"}_${statement.period_start}_${statement.period_end}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error serving PDF:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

