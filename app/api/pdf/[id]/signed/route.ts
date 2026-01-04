/**
 * app/api/pdf/[id]/signed/route.ts
 * 
 * API route voor het genereren van signed URLs voor PDF urenstaten met expiration (7 dagen).
 * Maakt het mogelijk om PDFs te delen zonder authenticatie, maar met tijdsbeperkte toegang.
 * Controleert authenticatie en autorisatie voordat signed URL wordt gegenereerd.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStatement } from "@/app/actions/statements";

export const runtime = 'edge';
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

    // Get statement to verify ownership
    const statement = await getStatement(statementId);
    
    if (!statement) {
      return NextResponse.json({ error: "Statement not found" }, { status: 404 });
    }

    // Check if user owns this statement
    if (statement.owner_user_id !== user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Check if PDF exists in storage
    if (!statement.pdf_url || statement.pdf_url.startsWith("data:")) {
      return NextResponse.json({ 
        error: "PDF not available in storage. Please generate the PDF first." 
      }, { status: 404 });
    }

    // Extract file path from storage URL
    // Supabase storage URLs can be:
    // - Public: https://[project].supabase.co/storage/v1/object/public/statements/[user_id]/[statement_id].pdf
    // - Signed: https://[project].supabase.co/storage/v1/object/sign/statements/[user_id]/[statement_id].pdf?token=...
    // Files are stored as: [user_id]/[statement_id].pdf (without "statements/" prefix)
    // Note: .from("statements") already specifies the bucket, so fileName should NOT include "statements/"
    let fileName: string;
    
    if (statement.pdf_url.includes('/statements/')) {
      const urlParts = statement.pdf_url.split('/statements/');
      if (urlParts.length < 2) {
        return NextResponse.json({ error: "Invalid PDF URL format" }, { status: 400 });
      }
      // Remove query parameters if present (for signed URLs)
      const pathPart = urlParts[1].split('?')[0];
      fileName = pathPart; // No "statements/" prefix needed - .from("statements") already specifies the bucket
    } else {
      // Fallback: construct from user ID and statement ID (matches how files are stored in generate-pdf/route.ts)
      fileName = `${user.id}/${statementId}.pdf`;
    }

    // Create signed URL with 7 days expiration (604800 seconds)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("statements")
      .createSignedUrl(fileName, 604800); // 7 days in seconds

    if (signedUrlError || !signedUrlData) {
      console.error("Error creating signed URL:", signedUrlError);
      return NextResponse.json(
        { error: "Failed to create signed URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      signedUrl: signedUrlData.signedUrl,
      expiresIn: 604800, // 7 days in seconds
      expiresAt: new Date(Date.now() + 604800 * 1000).toISOString(),
    });
  } catch (error) {
    console.error("Error generating signed URL:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

