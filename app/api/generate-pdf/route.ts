// app/api/generate-pdf/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

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

    const formatDuration = (minutes: number) => {
      if (minutes < 60) return `${minutes} min`;
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}u ${mins}min` : `${hours}u`;
    };

    // Generate HTML for PDF
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              color: #333;
            }
            .header {
              margin-bottom: 30px;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .header p {
              margin: 5px 0;
              color: #666;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th, td {
              padding: 10px;
              text-align: left;
              border-bottom: 1px solid #ddd;
            }
            th {
              background-color: #f5f5f5;
              font-weight: bold;
            }
            .day-header {
              background-color: #e9e9e9;
              font-weight: bold;
              margin-top: 20px;
            }
            .day-total {
              text-align: right;
              font-weight: bold;
            }
            .total {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 2px solid #333;
              text-align: right;
              font-size: 18px;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Urenstaat</h1>
            <p><strong>Klant:</strong> ${clientName}</p>
            <p><strong>Statementnummer:</strong> ${statementNumber}</p>
            <p><strong>Periode:</strong> ${formatDate(periodStart)} - ${formatDate(periodEnd)}</p>
            <p><strong>Opgesteld op:</strong> ${new Date().toLocaleDateString("nl-NL")}</p>
          </div>

          ${Object.entries(entriesByDate)
            .map(([date, dayEntries]: [string, any]) => {
              const dayTotal = dayEntries.reduce(
                (sum: number, e: any) => sum + e.duration_minutes,
                0
              );
              return `
                <div class="day-header">
                  ${formatDate(date)}
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Project</th>
                      <th>Omschrijving</th>
                      <th style="text-align: right;">Duur</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${dayEntries
                      .map(
                        (entry: any) => `
                      <tr>
                        <td>${entry.projects?.name || "-"}</td>
                        <td>${entry.description}</td>
                        <td style="text-align: right;">${formatDuration(entry.duration_minutes)}</td>
                      </tr>
                    `
                      )
                      .join("")}
                    <tr class="day-total">
                      <td colspan="2"><strong>Dagtotaal</strong></td>
                      <td style="text-align: right;"><strong>${formatDuration(dayTotal)}</strong></td>
                    </tr>
                  </tbody>
                </table>
              `;
            })
            .join("")}

          <div class="total">
            Totaal: ${formatDuration(totalMinutes)}
          </div>
        </body>
      </html>
    `;

    // For now, we'll store the HTML and return a URL
    // In production, you'd use a service like Puppeteer or a PDF service
    // For simplicity, we'll create a data URL that can be downloaded
    
    // Upload to Supabase Storage
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Not authenticated");
    }

    // Convert HTML to blob
    const blob = new Blob([html], { type: "text/html" });
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Try to upload to Supabase Storage, fallback to data URL if bucket doesn't exist
    let pdfUrl: string;
    
    try {
      // Path must include user ID folder to match storage policy: auth.uid()::text = (storage.foldername(name))[1]
      const fileName = `${user.id}/${statementId}.html`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("statements")
        .upload(fileName, buffer, {
          contentType: "text/html",
          upsert: true,
        });

      if (uploadError) {
        // If bucket doesn't exist, use data URL instead
        if (uploadError.message?.includes("Bucket not found") || uploadError.message?.includes("bucket")) {
          console.warn("Storage bucket 'statements' not found, using data URL instead");
          const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
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
      // Fallback to data URL if storage fails
      if (error.message?.includes("Bucket not found") || error.message?.includes("bucket")) {
        console.warn("Storage bucket 'statements' not found, using data URL instead");
        const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
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

