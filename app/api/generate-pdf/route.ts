// app/api/generate-pdf/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { renderToBuffer } from "@react-pdf/renderer";
import { PDFStatement } from "@/components/pdf-statement";
import React from "react";

// Helper function to format date string (YYYY-MM-DD) to readable format
function formatDate(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return format(date, "d MMMM yyyy", { locale: nl });
  } catch {
    return dateStr;
  }
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

    // Prepare entries for PDF component
    const pdfEntries = entries.map((entry: any) => ({
      date: entry.date,
      project_name: entry.projects?.name || "-",
      description: entry.description,
      duration_minutes: entry.duration_minutes,
    }));

    // Generate real PDF using @react-pdf/renderer
    const pdfDocument = React.createElement(PDFStatement, {
      clientName,
      statementNumber,
      periodStart,
      periodEnd,
      entries: pdfEntries,
      totalMinutes,
    });

    // Render PDF to buffer
    // @ts-expect-error - PDFStatement returns a Document, but TypeScript doesn't recognize the type correctly
    const pdfBuffer = await renderToBuffer(pdfDocument);

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
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("statements")
        .upload(fileName, pdfBuffer, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (uploadError) {
        // If bucket doesn't exist, return PDF as base64
        if (uploadError.message?.includes("Bucket not found") || uploadError.message?.includes("bucket")) {
          console.warn("Storage bucket 'statements' not found, returning PDF as base64");
          const base64 = pdfBuffer.toString("base64");
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
        const base64 = pdfBuffer.toString("base64");
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

