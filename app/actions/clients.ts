/**
 * app/actions/clients.ts
 * 
 * Server actions voor het beheren van klanten. Functies voor aanmaken, ophalen,
 * updaten en verwijderen van klanten met BTW profielen. Controleert authenticatie
 * en gebruikt Row Level Security voor data separatie.
 */
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getClients() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("owner_user_id", user.id)
    .order("name");

  if (error) {
    throw error;
  }

  return data;
}

export async function getClient(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .eq("owner_user_id", user.id)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function addClient(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const name = formData.get("name") as string;
  const btwLabel = formData.get("btw_label") as string;
  const btwPercentage = parseFloat(formData.get("btw_percentage") as string) || 0;
  const btwRule = formData.get("btw_rule") as string || "none";
  const rateExBtw = formData.get("rate_ex_btw")
    ? parseFloat(formData.get("rate_ex_btw") as string)
    : null;

  // Insert client and get the created client ID
  const { data: newClient, error } = await supabase
    .from("clients")
    .insert({
      owner_user_id: user.id,
      name,
      btw_profile: {
        label: btwLabel,
        percentage: btwPercentage,
        rule: btwRule,
      },
      rate_ex_btw: rateExBtw,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  // Automatically create a default "Algemeen" project for the new client
  if (newClient) {
    const { error: projectError } = await supabase.from("projects").insert({
      owner_user_id: user.id,
      client_id: newClient.id,
      name: "Algemeen",
      default_unit: "minutes",
      rounding_rule: "none",
    });

    if (projectError) {
      // Log error but don't fail client creation if project creation fails
      console.error("Error creating default project:", projectError);
    }
  }

  revalidatePath("/clients");
  revalidatePath("/projects");
}

export async function updateClient(id: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const name = formData.get("name") as string;
  const btwLabel = formData.get("btw_label") as string;
  const btwPercentage = parseFloat(formData.get("btw_percentage") as string) || 0;
  const btwRule = formData.get("btw_rule") as string || "none";
  const rateExBtw = formData.get("rate_ex_btw")
    ? parseFloat(formData.get("rate_ex_btw") as string)
    : null;

  const { error } = await supabase
    .from("clients")
    .update({
      name,
      btw_profile: {
        label: btwLabel,
        percentage: btwPercentage,
        rule: btwRule,
      },
      rate_ex_btw: rateExBtw,
    })
    .eq("id", id)
    .eq("owner_user_id", user.id);

  if (error) {
    throw error;
  }

  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
}

export async function deleteClient(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { error } = await supabase
    .from("clients")
    .delete()
    .eq("id", id)
    .eq("owner_user_id", user.id);

  if (error) {
    throw error;
  }

  revalidatePath("/clients");
}

export async function getClientsWithStats() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Get all clients
  const { data: clients, error: clientsError } = await supabase
    .from("clients")
    .select("*")
    .eq("owner_user_id", user.id)
    .order("name");

  if (clientsError) {
    throw clientsError;
  }

  // Get project counts per client
  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("client_id")
    .eq("owner_user_id", user.id);

  if (projectsError) {
    throw projectsError;
  }

  // Get time entries for hours calculation and last activity
  const { data: timeEntries, error: entriesError } = await supabase
    .from("time_entries")
    .select("client_id, duration_minutes, date, created_at")
    .eq("owner_user_id", user.id)
    .order("date", { ascending: false });

  if (entriesError) {
    throw entriesError;
  }

  // Calculate stats per client
  const statsMap = new Map<string, { projectCount: number; totalHours: number; lastActivity: Date | null }>();

  // Initialize all clients
  clients.forEach((client) => {
    statsMap.set(client.id, { projectCount: 0, totalHours: 0, lastActivity: null });
  });

  // Count projects
  projects?.forEach((project) => {
    const stats = statsMap.get(project.client_id);
    if (stats) {
      stats.projectCount++;
    }
  });

  // Calculate hours and last activity
  timeEntries?.forEach((entry) => {
    const stats = statsMap.get(entry.client_id);
    if (stats) {
      stats.totalHours += entry.duration_minutes / 60;
      // Use date field for last activity (most recent time entry date)
      const entryDate = typeof entry.date === 'string' ? new Date(entry.date) : entry.date;
      if (entryDate && (!stats.lastActivity || entryDate > stats.lastActivity)) {
        stats.lastActivity = entryDate;
      }
    }
  });

  // Combine clients with stats
  return clients.map((client) => {
    const stats = statsMap.get(client.id) || { projectCount: 0, totalHours: 0, lastActivity: null };
    return {
      ...client,
      projectCount: stats.projectCount,
      totalHours: Math.round(stats.totalHours * 100) / 100, // Round to 2 decimals
      lastActivity: stats.lastActivity,
    };
  });
}

