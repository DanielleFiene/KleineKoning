/**
 * app/api/generate-revenue-pdf/route.ts
 * 
 * API route voor het genereren van revenue PDF overzichten. Gebruikt pdf-lib voor Edge Runtime
 * compatibele PDF generatie. Genereert PDF met inkomsten per klant voor een specifieke periode.
 */
import { NextRequest, NextResponse } from "next/server";
import { generateRevenuePDF } from "@/lib/utils/revenue-pdf-generator";

export const runtime = 'edge';

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

    // Generate PDF
    const pdfBytes = await generateRevenuePDF(
      periodType,
      periodLabel,
      startDate,
      endDate,
      entries,
      totalHours,
      totalRevenue
    );

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
