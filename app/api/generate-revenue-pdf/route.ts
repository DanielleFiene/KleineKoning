/**
 * app/api/generate-revenue-pdf/route.ts
 * 
 * API route voor het genereren van revenue PDF overzichten. Roept Cloudflare Worker aan voor PDF generatie.
 * Genereert PDF met inkomsten per klant voor een specifieke periode.
 */
import { NextRequest, NextResponse } from "next/server";

export const runtime = 'edge';

const PDF_WORKER_URL = process.env.NEXT_PUBLIC_PDF_WORKER_URL || '';

function uint8ArrayToBase64(bytes: Uint8Array): string {
  const chunkSize = 8192;
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
      periodType,
      periodLabel,
      startDate,
      endDate,
      entries,
      totalHours,
      totalRevenue,
    } = body;

    if (!entries || !Array.isArray(entries)) {
      return NextResponse.json(
        { error: "Entries data is vereist" },
        { status: 400 }
      );
    }

    // Generate PDF via Cloudflare Worker
    if (!PDF_WORKER_URL) {
      return NextResponse.json(
        { error: "PDF Worker URL niet geconfigureerd. Voeg NEXT_PUBLIC_PDF_WORKER_URL toe aan je environment variables." },
        { status: 500 }
      );
    }

    const workerResponse = await fetch(`${PDF_WORKER_URL}/revenue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        periodType,
        periodLabel,
        startDate,
        endDate,
        entries,
        totalHours,
        totalRevenue,
      }),
    });

    if (!workerResponse.ok) {
      const errorText = await workerResponse.text();
      throw new Error(`PDF Worker error: ${workerResponse.status} - ${errorText}`);
    }

    const pdfBytes = new Uint8Array(await workerResponse.arrayBuffer());

    // Convert to base64 for download
    const pdfBase64 = uint8ArrayToBase64(pdfBytes);
    const pdfUrl = `data:application/pdf;base64,${pdfBase64}`;

    return NextResponse.json({
      success: true,
      pdfUrl,
    });
  } catch (error: any) {
    console.error("Error generating revenue PDF:", error);
    return NextResponse.json(
      { error: "Fout bij genereren PDF: " + error.message },
      { status: 500 }
    );
  }
}
