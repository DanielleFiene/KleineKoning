import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

export const runtime = 'edge';

/**
 * Convert ArrayBuffer to base64 string in chunks to avoid "Maximum call stack size exceeded" error
 * for large files (>64KB). This works by processing the bytes in smaller chunks.
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
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
    
    // Prepare attachments for email service (if configured)
    const attachments: Array<{ filename: string; content: string; type: string }> = [];

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

    // Build attachment URLs (use signed URLs for PDF, regular API routes for CSV)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : request.nextUrl.origin);
    
    // Generate signed URL for PDF (7 days expiration) if PDF is included
    let pdfUrl: string | null = null;
    if (actuallyIncludePdf && statement.pdf_url && !statement.pdf_url.startsWith("data:")) {
      try {
        // Extract file path from storage URL
        // Supabase storage URLs can be:
        // - Public: https://[project].supabase.co/storage/v1/object/public/statements/[user_id]/[statement_id].pdf
        // - Signed: https://[project].supabase.co/storage/v1/object/sign/statements/[user_id]/[statement_id].pdf?token=...
        // Files are stored as: [user_id]/[statement_id].pdf (without "statements/" prefix)
        // Note: .from("statements") already specifies the bucket, so fileName should NOT include "statements/"
        let fileName: string;
        
        if (statement.pdf_url.includes('/statements/')) {
          const urlParts = statement.pdf_url.split('/statements/');
          if (urlParts.length >= 2) {
            // Remove query parameters if present (for signed URLs)
            const pathPart = urlParts[1].split('?')[0];
            fileName = pathPart; // No "statements/" prefix needed - .from("statements") already specifies the bucket
          } else {
            throw new Error("Invalid PDF URL format");
          }
        } else {
          // Fallback: construct from user ID and statement ID (matches how files are stored in generate-pdf/route.ts)
          fileName = `${user.id}/${statementId}.pdf`;
        }
        
        // Create signed URL with 7 days expiration (604800 seconds)
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from("statements")
          .createSignedUrl(fileName, 604800); // 7 days in seconds
        
        if (!signedUrlError && signedUrlData) {
          pdfUrl = signedUrlData.signedUrl;
        }
      } catch (error) {
        console.warn("Could not create signed URL, using regular API route:", error);
      }
    }
    
    // Fallback to regular API route if signed URL generation failed
    if (actuallyIncludePdf && !pdfUrl) {
      pdfUrl = `${siteUrl}/api/pdf/${statementId}`;
    }
    
    const csvUrl = includeCsv ? `${siteUrl}/api/csv/${statementId}` : null;

    if (!emailServiceUrl || !emailServiceKey) {
      // Fallback: Return email data for client-side sending (mailto links)
      // Format links to be clickable in email clients
      const attachmentLinks: string[] = [];
      if (pdfUrl) {
        attachmentLinks.push(`PDF downloaden:\n${pdfUrl}`);
      }
      if (csvUrl) {
        attachmentLinks.push(`CSV downloaden:\n${csvUrl}`);
      }
      const attachmentText = attachmentLinks.length > 0 
        ? `\n\n---\nBijlagen (klik op de links om te downloaden):\n\n${attachmentLinks.join('\n\n')}\n\n---` 
        : '';
      
      return NextResponse.json({
        success: false,
        fallback: true,
        emailData: {
          to: emailAddresses,
          subject: `Urenstaat ${statement.statement_number} - ${clientName}`,
          body: emailBody + attachmentText,
          pdfUrl: pdfUrl,
          csvUrl: csvUrl,
        },
        message: "Email service niet geconfigureerd. Gebruik mailto links.",
      });
    }

    // Fetch PDF and CSV as base64 for attachments (if email service supports it)
    if (actuallyIncludePdf && pdfUrl) {
      try {
        const pdfResponse = await fetch(pdfUrl);
        if (pdfResponse.ok) {
          const pdfArrayBuffer = await pdfResponse.arrayBuffer();
          const pdfBase64 = arrayBufferToBase64(pdfArrayBuffer);
          attachments.push({
            filename: `urenstaat_${statement.statement_number}_${clientName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`,
            content: pdfBase64,
            type: "application/pdf",
          });
        }
      } catch (error) {
        console.warn("Could not fetch PDF for attachment:", error);
      }
    }
    
    if (includeCsv && csvUrl) {
      try {
        const csvResponse = await fetch(csvUrl);
        if (csvResponse.ok) {
          const csvText = await csvResponse.text();
          const csvBase64 = btoa(unescape(encodeURIComponent(csvText)));
          attachments.push({
            filename: `urenstaat_${statement.statement_number}_${clientName.replace(/[^a-zA-Z0-9]/g, "_")}.csv`,
            content: csvBase64,
            type: "text/csv",
          });
        }
      } catch (error) {
        console.warn("Could not fetch CSV for attachment:", error);
      }
    }

    // Send emails via email service
    try {
      const emailPromises = emailAddresses.map((email: string) => {
        // Build email payload - different services have different formats
        // Resend format: { attachments: [{ filename, content, type }] }
        // SendGrid format: { attachments: [{ content, filename, type }] }
        // We'll use a generic format that should work with most services
        const emailPayload: any = {
          to: email,
          subject: `Urenstaat ${statement.statement_number} - ${clientName}`,
          html: `
            <p>${emailBody.replace(/\n/g, "<br>")}</p>
            ${attachments.length > 0 ? '<p>De bijlagen zijn toegevoegd aan deze email.</p>' : ''}
            ${attachments.length === 0 && pdfUrl ? `<p><a href="${pdfUrl}">Download urenstaat PDF</a> (link geldig 7 dagen)</p>` : ''}
            ${attachments.length === 0 && csvUrl ? `<p><a href="${csvUrl}">Download urenstaat CSV</a></p>` : ''}
          `,
          text: `${emailBody}${attachments.length > 0 ? '\n\nDe bijlagen zijn toegevoegd aan deze email.' : ''}${attachments.length === 0 && pdfUrl ? `\n\nPDF downloaden (link geldig 7 dagen):\n${pdfUrl}` : ''}${attachments.length === 0 && csvUrl ? `\n\nCSV downloaden:\n${csvUrl}` : ''}`,
        };
        
        // Add attachments if available (format depends on email service)
        if (attachments.length > 0) {
          emailPayload.attachments = attachments.map(att => ({
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
      
      // Check both fulfillment and HTTP response status
      // fetch() resolves even on HTTP errors (400, 500, etc.), so we need to check response.ok
      const successful = results.filter((r) => {
        if (r.status === "fulfilled") {
          // Check if the HTTP response was successful (status 200-299)
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
    console.error("Send email error:", error);
    return NextResponse.json(
      { error: "Fout: " + error.message },
      { status: 500 }
    );
  }
}

