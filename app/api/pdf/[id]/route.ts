import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStatement } from "@/app/actions/statements";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { parseDateString } from "@/lib/utils/date";

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
          const content = await response.text();
          return new NextResponse(content, {
            headers: {
              "Content-Type": "text/html;charset=utf-8",
              "Content-Disposition": `inline; filename="urenstaat_${statement.clients?.name || "export"}_${statement.period_start}_${statement.period_end}.html"`,
            },
          });
        }
      } catch (fetchError) {
        console.warn("Could not fetch PDF from URL, generating new one:", fetchError);
      }
    }

    // Generate PDF HTML from statement data
    if (!statement.statement_lines || statement.statement_lines.length === 0) {
      return NextResponse.json({ error: "No data found for this statement" }, { status: 404 });
    }

    // Group entries by date
    const entriesByDate = statement.statement_lines.reduce((acc: any, line: any) => {
      const date = line.date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(line);
      return acc;
    }, {});

    // Calculate totals
    const totalMinutes = statement.statement_lines.reduce(
      (sum: number, line: any) => sum + line.duration_minutes,
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
            <p><strong>Klant:</strong> ${statement.clients?.name || "Onbekend"}</p>
            <p><strong>Statementnummer:</strong> ${statement.statement_number}</p>
            <p><strong>Periode:</strong> ${formatDate(statement.period_start)} - ${formatDate(statement.period_end)}</p>
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
                        <td>${entry.project_name || "-"}</td>
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

    // Return HTML directly
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html;charset=utf-8",
        "Content-Disposition": `inline; filename="urenstaat_${statement.clients?.name || "export"}_${statement.period_start}_${statement.period_end}.html"`,
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

