// app/api/generate-pdf/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateStatementHTML } from "@/lib/utils/pdf-html";

export const runtime = 'edge';

// Convert HTML to PDF using Edge-compatible service
async function htmlToPdf(html: string): Promise<Uint8Array> {
  // Use a PDF generation service that works with Edge Runtime
  // Options:
  // 1. PDFShift (https://pdfshift.io) - Free tier available
  // 2. PDF.co (https://pdf.co) - Free tier available
  // 3. Cloudflare Browser Rendering API (if available)
  
  const pdfServiceUrl = process.env.PDF_SERVICE_URL;
  const pdfServiceKey = process.env.PDF_SERVICE_API_KEY;
  
  // Try PDFShift API (most Edge-compatible)
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
      } else {
        const errorText = await response.text();
        console.error('PDF service error:', errorText);
      }
    } catch (error) {
      console.warn('PDF service failed:', error);
    }
  }
  
  // Fallback: Return HTML as data URL (client can print to PDF)
  // This allows the app to work without a PDF service configured
  // The client can use window.print() or a client-side PDF library
  console.warn('PDF service not configured, returning HTML for client-side conversion');
  const htmlBase64 = btoa(unescape(encodeURIComponent(html)));
  const dataUrl = `data:text/html;base64,${htmlBase64}`;
  
  // Return a minimal PDF-like response that the client can handle
  // In practice, the client should convert HTML to PDF using window.print() or jsPDF
  throw new Error('PDF_SERVICE_NOT_CONFIGURED:' + dataUrl);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      statementId,
      clientName,
      statementNumber,
      periodStart,
      periodEnd,
      entries,
    } = body;

    // Group entries by date
    const entriesByDate = entries.reduce((acc: any, entry: any) => {
      const date = entry.date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(entry);
      return acc;
    }, {});

    // Calculate totals
    const totalMinutes = entries.reduce(
      (sum: number, e: any) => sum + e.duration_minutes,
      0
    );

    // Prepare entries for PDF
    const pdfEntries = entries.map((entry: any) => ({
      date: entry.date,
      project_name: entry.projects?.name || "-",
      description: entry.description,
      duration_minutes: entry.duration_minutes,
    }));

    // Generate HTML for PDF
    const html = generateStatementHTML(
      clientName,
      statementNumber,
      periodStart,
      periodEnd,
      pdfEntries,
      totalMinutes
    );

    // Convert HTML to PDF (Edge Runtime compatible)
    let pdfBytes: Uint8Array;
    let isHtmlFallback = false;
    
    try {
      pdfBytes = await htmlToPdf(html);
    } catch (error: any) {
      // If PDF service is not configured, return HTML as data URL
      if (error.message?.startsWith('PDF_SERVICE_NOT_CONFIGURED:')) {
        const htmlDataUrl = error.message.replace('PDF_SERVICE_NOT_CONFIGURED:', '');
        return NextResponse.json({ 
          pdfUrl: htmlDataUrl,
          isHtml: true,
          message: 'PDF service niet geconfigureerd. HTML wordt teruggegeven voor client-side conversie.'
        });
      }
      throw error;
    }

    // Upload to Supabase Storage
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Not authenticated");
    }

    // Try to upload to Supabase Storage
    let pdfUrl: string;
    
    try {
      // Path must include user ID folder to match storage policy: auth.uid()::text = (storage.foldername(name))[1]
      const fileName = `${user.id}/${statementId}.pdf`;
      
      // Convert Uint8Array to Blob for Supabase upload
      const arrayBuffer = pdfBytes.buffer instanceof ArrayBuffer
        ? pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength)
        : new Uint8Array(pdfBytes).buffer;
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("statements")
        .upload(fileName, blob, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (uploadError) {
        // If bucket doesn't exist, return PDF as base64
        if (uploadError.message?.includes("Bucket not found") || uploadError.message?.includes("bucket")) {
          console.warn("Storage bucket 'statements' not found, returning PDF as base64");
          // Convert Uint8Array to base64
          const base64 = btoa(String.fromCharCode(...pdfBytes));
          const dataUrl = `data:application/pdf;base64,${base64}`;
          return NextResponse.json({ pdfUrl: dataUrl });
        }
        throw uploadError;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("statements").getPublicUrl(fileName);
      
      pdfUrl = publicUrl;
    } catch (error: any) {
      // Fallback to base64 if storage fails
      if (error.message?.includes("Bucket not found") || error.message?.includes("bucket")) {
        console.warn("Storage bucket 'statements' not found, returning PDF as base64");
        const base64 = btoa(String.fromCharCode(...pdfBytes));
        const dataUrl = `data:application/pdf;base64,${base64}`;
        return NextResponse.json({ pdfUrl: dataUrl });
      }
      throw error;
    }

    return NextResponse.json({ pdfUrl });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

