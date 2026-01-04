/**
 * app/api/statements/[id]/route.ts
 * 
 * API route voor het updaten en verwijderen van statements. Edge Runtime compatible.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = 'edge';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { pdfUrl } = await req.json();
    const { id: statementId } = await params;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { error } = await supabase
      .from("statements")
      .update({ pdf_url: pdfUrl })
      .eq("id", statementId)
      .eq("owner_user_id", user.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: statementId } = await params;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get statement to check for PDF URL before deletion
    const { data: statement } = await supabase
      .from("statements")
      .select("pdf_url")
      .eq("id", statementId)
      .eq("owner_user_id", user.id)
      .single();

    // Delete PDF from storage if it exists (and is in storage, not base64)
    if (statement?.pdf_url && !statement.pdf_url.startsWith("data:")) {
      try {
        const fileName = `${user.id}/${statementId}.pdf`;
        await supabase.storage.from("statements").remove([fileName]);
      } catch (storageError) {
        // Log but don't fail - PDF might not exist in storage
        console.warn("Could not delete PDF from storage:", storageError);
      }
    }

    // Delete statement lines first
    const { error: linesError } = await supabase
      .from("statement_lines")
      .delete()
      .eq("statement_id", statementId);

    if (linesError) {
      throw linesError;
    }

    // Delete statement
    const { error } = await supabase
      .from("statements")
      .delete()
      .eq("id", statementId)
      .eq("owner_user_id", user.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

