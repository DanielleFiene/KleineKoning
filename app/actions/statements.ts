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
  
  // Use a database function to atomically get the next statement number
  // This prevents race conditions by using a single atomic operation
  const { data, error } = await supabase.rpc('get_next_statement_number', {
    p_owner_user_id: ownerUserId
  });

  if (error) {
    // Fallback: if RPC doesn't exist, use the old method with retry logic
    // This handles the race condition by retrying on unique constraint violations
    return await generateStatementNumberWithRetry(ownerUserId, supabase);
  }

  return data as string;
}

async function generateStatementNumberWithRetry(
  ownerUserId: string,
  supabase: any,
  maxRetries: number = 5
): Promise<string> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Get the maximum statement number for this user
      const { data: statements, error: selectError } = await supabase
        .from("statements")
        .select("statement_number")
        .eq("owner_user_id", ownerUserId)
        .order("statement_number", { ascending: false })
        .limit(1);

      if (selectError) {
        throw selectError;
      }

      let nextNumber = 1;
      if (statements && statements.length > 0) {
        // Extract number from statement_number (format: ST-0001)
        const match = statements[0].statement_number.match(/ST-(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1], 10) + 1;
        }
      }

      const statementNumber = `ST-${String(nextNumber).padStart(4, "0")}`;
      return statementNumber;
    } catch (error: any) {
      // If it's a unique constraint violation, retry with a small delay
      if (error.code === '23505' && attempt < maxRetries - 1) {
        // Wait a random amount of time (10-50ms) before retrying to avoid thundering herd
        await new Promise(resolve => setTimeout(resolve, 10 + Math.random() * 40));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Failed to generate unique statement number after retries");
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

  // Generate statement number and create statement with retry logic
  // This handles race conditions where multiple requests try to create statements simultaneously
  let statement: { id: string; statement_number: string; [key: string]: any } | null = null;
  let statementError: any = null;
  const maxRetries = 5;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // Generate statement number
    const statementNumber = await generateStatementNumber(user.id);

    // Try to create statement
    const result = await supabase
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

    statement = result.data;
    statementError = result.error;

    // If successful or error is not a unique constraint violation, break
    if (!statementError || statementError.code !== '23505') {
      break;
    }

    // If unique constraint violation (duplicate statement_number), retry
    // Wait a random amount of time before retrying to avoid thundering herd
    if (attempt < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, 10 + Math.random() * 40));
    }
  }

  if (statementError) {
    throw statementError;
  }

  if (!statement) {
    throw new Error("Failed to create statement");
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

export async function deleteStatement(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Delete statement lines first (cascade should handle this, but being explicit)
  const { error: linesError } = await supabase
    .from("statement_lines")
    .delete()
    .eq("statement_id", id);

  if (linesError) {
    throw linesError;
  }

  // Delete statement
  const { error } = await supabase
    .from("statements")
    .delete()
    .eq("id", id)
    .eq("owner_user_id", user.id);

  if (error) {
    throw error;
  }

  revalidatePath("/exports");
}

