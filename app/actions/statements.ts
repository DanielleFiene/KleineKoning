// app/actions/statements.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getStatements() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data, error } = await supabase
    .from("statements")
    .select("*, clients(name)")
    .eq("owner_user_id", user.id)
    .order("generated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

export async function getStatement(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data, error } = await supabase
    .from("statements")
    .select("*, clients(name), statement_lines(*)")
    .eq("id", id)
    .eq("owner_user_id", user.id)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function generateStatementNumber(ownerUserId: string): Promise<string> {
  const supabase = await createClient();
  
  const { count } = await supabase
    .from("statements")
    .select("*", { count: "exact", head: true })
    .eq("owner_user_id", ownerUserId);

  const statementNumber = `ST-${String((count || 0) + 1).padStart(4, "0")}`;
  return statementNumber;
}

export async function createStatement(
  clientId: string,
  periodStart: string,
  periodEnd: string,
  entries: any[]
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Generate statement number
  const statementNumber = await generateStatementNumber(user.id);

  // Create statement
  const { data: statement, error: statementError } = await supabase
    .from("statements")
    .insert({
      owner_user_id: user.id,
      client_id: clientId,
      statement_number: statementNumber,
      period_start: periodStart,
      period_end: periodEnd,
    })
    .select()
    .single();

  if (statementError) {
    throw statementError;
  }

  // Get client and project names for snapshot
  const { data: client } = await supabase
    .from("clients")
    .select("name")
    .eq("id", clientId)
    .single();

  // Create statement lines (snapshot)
  const statementLines = entries.map((entry: any) => ({
    statement_id: statement.id,
    date: entry.date,
    description: entry.description,
    duration_minutes: entry.duration_minutes,
    project_name: entry.projects?.name || "Onbekend project",
  }));

  const { error: linesError } = await supabase
    .from("statement_lines")
    .insert(statementLines);

  if (linesError) {
    throw linesError;
  }

  revalidatePath("/exports");
  return { statement, client };
}

export async function updateStatementPdfUrl(statementId: string, pdfUrl: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { error } = await supabase
    .from("statements")
    .update({ pdf_url: pdfUrl })
    .eq("id", statementId)
    .eq("owner_user_id", user.id);

  if (error) {
    throw error;
  }

  revalidatePath("/exports");
}

