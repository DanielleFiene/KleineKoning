/**
 * app/api/generate-pdf/route.ts
 * 
 * API route voor het genereren van PDF urenstaten. Roept Cloudflare Worker aan voor PDF generatie.
 * Uploadt PDFs naar Supabase Storage. Valt terug op base64 data URLs als storage bucket niet beschikbaar is.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = 'edge';

const PDF_WORKER_URL = process.env.NEXT_PUBLIC_PDF_WORKER_URL || '';

/**
 * Convert Uint8Array to base64 string in chunks to avoid "Maximum call stack size exceeded" error
 * for large files (>64KB). This works by processing the bytes in smaller chunks.
 */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  const chunkSize = 8192; // Process 8KB at a time
  let binary = '';
  
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.slice(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  
  return btoa(binary);
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

    // Generate PDF via Cloudflare Worker
    if (!PDF_WORKER_URL) {
      throw new Error("PDF Worker URL niet geconfigureerd. Voeg NEXT_PUBLIC_PDF_WORKER_URL toe aan je environment variables.");
    }

    const workerResponse = await fetch(`${PDF_WORKER_URL}/statement`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clientName,
        statementNumber,
        periodStart,
        periodEnd,
        entries: pdfEntries,
        totalMinutes,
      }),
    });

    if (!workerResponse.ok) {
      const errorText = await workerResponse.text();
      throw new Error(`PDF Worker error: ${workerResponse.status} - ${errorText}`);
    }

    const pdfBytes = new Uint8Array(await workerResponse.arrayBuffer());

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
          // Convert Uint8Array to base64 (chunked to handle large files)
          const base64 = uint8ArrayToBase64(pdfBytes);
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
        const base64 = uint8ArrayToBase64(pdfBytes);
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

