import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStatement } from "@/app/actions/statements";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { parseDateString } from "@/lib/utils/date";
import { renderToBuffer } from "@react-pdf/renderer";
import { PDFStatement } from "@/components/pdf-statement";
import React from "react";

// Helper function to format date string (YYYY-MM-DD) to readable format
function formatDate(dateStr: string): string {
  try {
    const date = parseDateString(dateStr);
    return format(date, "d MMMM yyyy", { locale: nl });
  } catch {
    return dateStr;
  }
}

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
          const buffer = Buffer.from(arrayBuffer);
          // Check if it's actually a PDF (starts with %PDF)
          if (buffer.toString("utf8", 0, 4) === "%PDF") {
            const uint8Array = new Uint8Array(
              buffer.buffer,
              buffer.byteOffset,
              buffer.byteLength
            );
            return new NextResponse(uint8Array, {
              headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `inline; filename="urenstaat_${statement.clients?.name || "export"}_${statement.period_start}_${statement.period_end}.pdf"`,
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

    // Prepare entries for PDF component
    const pdfEntries = statement.statement_lines.map((line: any) => ({
      date: line.date,
      project_name: line.project_name || "-",
      description: line.description,
      duration_minutes: line.duration_minutes,
    }));

    // Generate real PDF using @react-pdf/renderer
    const pdfDocument = React.createElement(PDFStatement, {
      clientName: statement.clients?.name || "Onbekend",
      statementNumber: statement.statement_number,
      periodStart: statement.period_start,
      periodEnd: statement.period_end,
      entries: pdfEntries,
      totalMinutes,
    });

    // Render PDF to buffer
    // @ts-expect-error - PDFStatement returns a Document, but TypeScript doesn't recognize the type correctly
    const pdfBuffer = await renderToBuffer(pdfDocument);

    // Convert Buffer to Uint8Array for NextResponse
    const uint8Array = new Uint8Array(
      pdfBuffer.buffer,
      pdfBuffer.byteOffset,
      pdfBuffer.byteLength
    );

    // Return PDF directly
    // @ts-expect-error - Uint8Array should be valid BodyInit, but TypeScript doesn't recognize it
    return new NextResponse(uint8Array, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="urenstaat_${statement.clients?.name || "export"}_${statement.period_start}_${statement.period_end}.pdf"`,
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

