import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStatement } from "@/app/actions/statements";
import { generateStatementHTML } from "@/lib/utils/pdf-html";

export const runtime = 'edge';

// Convert HTML to PDF using Edge-compatible service
async function htmlToPdf(html: string): Promise<Uint8Array> {
  // Use a PDF generation service that works with Edge Runtime
  const pdfServiceUrl = process.env.PDF_SERVICE_URL || 'https://api.pdfshift.io/v3/convert/pdf';
  const pdfServiceKey = process.env.PDF_SERVICE_API_KEY;
  
  if (pdfServiceKey && pdfServiceUrl) {
    try {
      const response = await fetch(pdfServiceUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`api:${pdfServiceKey}`)}`,
        },
        body: JSON.stringify({
          source: html,
          format: 'pdf',
        }),
      });
      
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        return new Uint8Array(arrayBuffer);
      }
    } catch (error) {
      console.warn('PDF service failed, falling back to HTML:', error);
    }
  }
  
  // Fallback: Return HTML for client-side conversion
  // This allows the app to work without a PDF service configured
  console.warn('PDF service not configured, returning HTML for client-side conversion');
  const htmlBase64 = btoa(unescape(encodeURIComponent(html)));
  const dataUrl = `data:text/html;base64,${htmlBase64}`;
  
  // Return HTML instead of PDF when service is not configured
  throw new Error('PDF_SERVICE_NOT_CONFIGURED:' + dataUrl);
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
          const uint8Array = new Uint8Array(arrayBuffer);
          // Check if it's actually a PDF (starts with %PDF)
          const header = String.fromCharCode(...uint8Array.slice(0, 4));
          if (header === "%PDF") {
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

    // Prepare entries for PDF
    const pdfEntries = statement.statement_lines.map((line: any) => ({
      date: line.date,
      project_name: line.project_name || "-",
      description: line.description,
      duration_minutes: line.duration_minutes,
    }));

    // Generate HTML for PDF
    const html = generateStatementHTML(
      statement.clients?.name || "Onbekend",
      statement.statement_number,
      statement.period_start,
      statement.period_end,
      pdfEntries,
      totalMinutes
    );

    // Convert HTML to PDF (Edge Runtime compatible)
    let pdfBytes: Uint8Array;
    
    try {
      pdfBytes = await htmlToPdf(html);
    } catch (error: any) {
      // If PDF service is not configured, return HTML
      if (error.message?.startsWith('PDF_SERVICE_NOT_CONFIGURED:')) {
        const htmlDataUrl = error.message.replace('PDF_SERVICE_NOT_CONFIGURED:', '');
        // Decode base64 HTML (Edge Runtime compatible)
        const base64Content = htmlDataUrl.replace('data:text/html;base64,', '');
        // Use TextDecoder for Edge Runtime compatibility
        const binaryString = atob(base64Content);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const htmlContent = new TextDecoder('utf-8').decode(bytes);
        return new NextResponse(htmlContent, {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Content-Disposition": `inline; filename="urenstaat_${statement.clients?.name || "export"}_${statement.period_start}_${statement.period_end}.html"`,
          },
        });
      }
      throw error;
    }

    // Convert to ArrayBuffer for NextResponse
    const arrayBuffer = pdfBytes.buffer instanceof ArrayBuffer
      ? pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength)
      : new Uint8Array(pdfBytes).buffer;

    // Return PDF directly
    return new NextResponse(arrayBuffer, {
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

