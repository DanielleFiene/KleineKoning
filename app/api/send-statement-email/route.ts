import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      statementId,
      emailAddresses,
      customMessage,
    } = body;

    if (!statementId || !emailAddresses || !Array.isArray(emailAddresses) || emailAddresses.length === 0) {
      return NextResponse.json(
        { error: "Statement ID en minstens één email adres zijn verplicht" },
        { status: 400 }
      );
    }

    // Check authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get statement with client info
    const { data: statement, error: statementError } = await supabase
      .from("statements")
      .select("*, clients(name)")
      .eq("id", statementId)
      .eq("owner_user_id", user.id)
      .single();

    if (statementError || !statement) {
      return NextResponse.json({ error: "Statement niet gevonden" }, { status: 404 });
    }

    // Get attachments to include
    const { includePdf, includeCsv } = body;
    
    if (!includePdf && !includeCsv) {
      return NextResponse.json({ error: "Selecteer minstens PDF of CSV om te versturen" }, { status: 400 });
    }

    // If only PDF is selected but doesn't exist, return error
    if (includePdf && !includeCsv && !statement.pdf_url) {
      return NextResponse.json({ error: "PDF is nog niet gegenereerd. Selecteer ook CSV of genereer eerst de PDF." }, { status: 400 });
    }
    
    // If PDF is selected but doesn't exist, just skip it (user probably wants CSV only)
    const actuallyIncludePdf = includePdf && !!statement.pdf_url;

    // Format dates
    const periodStart = format(new Date(statement.period_start), "d MMMM yyyy", { locale: nl });
    const periodEnd = format(new Date(statement.period_end), "d MMMM yyyy", { locale: nl });
    const clientName = statement.clients?.name || "Onbekend";

    // Default email message
    const defaultMessage = `Beste,

Hierbij de urenstaat voor ${clientName} voor de periode ${periodStart} tot ${periodEnd}.

Met vriendelijke groet`;

    const emailBody = customMessage || defaultMessage;

    // Use Resend API or similar email service
    // For now, we'll use a simple approach with Resend (you'll need to install and configure it)
    // Alternative: Use Supabase Edge Functions or a third-party email service
    
    const emailServiceUrl = process.env.EMAIL_SERVICE_URL;
    const emailServiceKey = process.env.EMAIL_SERVICE_API_KEY;

    // Build attachment URLs
    const attachments: string[] = [];
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
    
    if (actuallyIncludePdf && statement.pdf_url) {
      attachments.push(`PDF: ${statement.pdf_url}`);
    }
    if (includeCsv) {
      attachments.push(`CSV: ${siteUrl}/api/csv/${statementId}`);
    }

    if (!emailServiceUrl || !emailServiceKey) {
      // Fallback: Return email data for client-side sending (mailto links)
      const attachmentText = attachments.length > 0 ? `\n\nBijlagen:\n${attachments.join('\n')}` : '';
      return NextResponse.json({
        success: false,
        fallback: true,
        emailData: {
          to: emailAddresses,
          subject: `Urenstaat ${statement.statement_number} - ${clientName}`,
          body: emailBody + attachmentText,
          pdfUrl: actuallyIncludePdf ? statement.pdf_url : null,
          csvUrl: includeCsv ? `${siteUrl}/api/csv/${statementId}` : null,
        },
        message: "Email service niet geconfigureerd. Gebruik mailto links.",
      });
    }

    // Send emails via email service
    try {
      const emailPromises = emailAddresses.map((email: string) =>
        fetch(emailServiceUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${emailServiceKey}`,
          },
            body: JSON.stringify({
            to: email,
            subject: `Urenstaat ${statement.statement_number} - ${clientName}`,
            html: `
              <p>${emailBody.replace(/\n/g, "<br>")}</p>
              ${actuallyIncludePdf && statement.pdf_url ? `<p><a href="${statement.pdf_url}">Download urenstaat PDF</a></p>` : ''}
              ${includeCsv ? `<p><a href="${siteUrl}/api/csv/${statementId}">Download urenstaat CSV</a></p>` : ''}
            `,
            text: `${emailBody}\n\n${attachments.map(a => `Download: ${a.split(': ')[1]}`).join('\n')}`,
          }),
        })
      );

      const results = await Promise.allSettled(emailPromises);
      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      return NextResponse.json({
        success: true,
        sent: successful,
        failed,
        total: emailAddresses.length,
      });
    } catch (error: any) {
      console.error("Email sending error:", error);
      return NextResponse.json(
        { error: "Fout bij versturen email: " + error.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Send email error:", error);
    return NextResponse.json(
      { error: "Fout: " + error.message },
      { status: 500 }
    );
  }
}

