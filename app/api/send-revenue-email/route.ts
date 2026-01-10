/**
 * app/api/send-revenue-email/route.ts
 * 
 * API route voor het versturen van revenue/inkomsten overzichten per email. Ondersteunt PDF
 * en/of CSV attachments. Gebruikt email service indien geconfigureerd, anders mailto fallback.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

export const runtime = 'edge';

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
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
      emailAddresses,
      customMessage,
      periodType,
      periodLabel,
      startDate,
      endDate,
      includePdf,
      includeCsv,
      pdfUrl,
      csvContent,
    } = body;

    if (!emailAddresses || !Array.isArray(emailAddresses) || emailAddresses.length === 0) {
      return NextResponse.json(
        { error: "Minstens één email adres is verplicht" },
        { status: 400 }
      );
    }

    if (!includePdf && !includeCsv) {
      return NextResponse.json(
        { error: "Selecteer minstens PDF of CSV om te versturen" },
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

    // Format dates
    const dateStart = format(new Date(startDate), "d MMMM yyyy", { locale: nl });
    const dateEnd = format(new Date(endDate), "d MMMM yyyy", { locale: nl });

    // Default email message
    const defaultMessage = `Beste,

Hierbij het inkomsten overzicht voor de periode ${periodLabel} (${dateStart} - ${dateEnd}).

Met vriendelijke groet`;

    const emailBody = customMessage || defaultMessage;

    const emailServiceUrl = process.env.EMAIL_SERVICE_URL;
    const emailServiceKey = process.env.EMAIL_SERVICE_API_KEY;

    // Prepare attachments
    const attachments: Array<{ filename: string; content: string; type: string }> = [];

    if (includePdf && pdfUrl) {
      try {
        if (pdfUrl.startsWith("data:")) {
          // Extract base64 from data URL
          const base64Match = pdfUrl.match(/base64,(.+)/);
          if (base64Match) {
            attachments.push({
              filename: `inkomsten-${startDate}-${endDate}.pdf`,
              content: base64Match[1],
              type: "application/pdf",
            });
          }
        } else {
          // Fetch PDF if it's a URL
          const pdfResponse = await fetch(pdfUrl);
          if (pdfResponse.ok) {
            const pdfArrayBuffer = await pdfResponse.arrayBuffer();
            const pdfBase64 = arrayBufferToBase64(pdfArrayBuffer);
            attachments.push({
              filename: `inkomsten-${startDate}-${endDate}.pdf`,
              content: pdfBase64,
              type: "application/pdf",
            });
          }
        }
      } catch (error) {
        console.warn("Could not process PDF for attachment:", error);
      }
    }

    if (includeCsv && csvContent) {
      try {
        const csvBase64 = btoa(unescape(encodeURIComponent(csvContent)));
        attachments.push({
          filename: `inkomsten-${startDate}-${endDate}.csv`,
          content: csvBase64,
          type: "text/csv",
        });
      } catch (error) {
        console.warn("Could not process CSV for attachment:", error);
      }
    }

    if (!emailServiceUrl || !emailServiceKey) {
      // Fallback: Return email data for client-side sending (mailto links)
      const attachmentLinks: string[] = [];
      if (includePdf && pdfUrl) {
        attachmentLinks.push(`PDF downloaden:\n${pdfUrl}`);
      }
      if (includeCsv && csvContent) {
        // For CSV, we can't include it in mailto, so just mention it
        attachmentLinks.push("CSV bijlage (zie email client)");
      }

      const linkText = attachmentLinks.length === 1 ? "link" : "links";
      const attachmentText = attachmentLinks.length > 0
        ? `\n\n---\nBijlagen (klik op de ${linkText} om te downloaden):\n\n${attachmentLinks.join('\n\n')}\n\n---`
        : '';

      return NextResponse.json({
        success: false,
        fallback: true,
        emailData: {
          to: emailAddresses,
          subject: `Inkomsten Overzicht - ${periodLabel}`,
          body: emailBody + attachmentText,
        },
        message: "Email service niet geconfigureerd. Gebruik mailto links.",
      });
    }

    // Send emails via email service
    try {
      const emailPromises = emailAddresses.map((email: string) => {
        const emailPayload: any = {
          to: email,
          subject: `Inkomsten Overzicht - ${periodLabel}`,
          html: `
            <p>${emailBody.replace(/\n/g, "<br>")}</p>
            ${attachments.length > 0 ? '<p>De bijlagen zijn toegevoegd aan deze email.</p>' : ''}
          `,
          text: `${emailBody}${attachments.length > 0 ? '\n\nDe bijlagen zijn toegevoegd aan deze email.' : ''}`,
        };

        if (attachments.length > 0) {
          emailPayload.attachments = attachments.map((att) => ({
            filename: att.filename,
            content: att.content,
            type: att.type,
          }));
        }

        return fetch(emailServiceUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${emailServiceKey}`,
          },
          body: JSON.stringify(emailPayload),
        });
      });

      const results = await Promise.allSettled(emailPromises);
      const successful = results.filter((r) => {
        if (r.status === "fulfilled") {
          return r.value.ok;
        }
        return false;
      }).length;

      const failed = results.length - successful;

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
    console.error("Send revenue email error:", error);
    return NextResponse.json(
      { error: "Fout: " + error.message },
      { status: 500 }
    );
  }
}
