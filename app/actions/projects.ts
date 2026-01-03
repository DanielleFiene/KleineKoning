// app/actions/projects.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getProjects() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data, error } = await supabase
    .from("projects")
    .select("*, clients(name)")
    .eq("owner_user_id", user.id)
    .order("name");

  if (error) {
    throw error;
  }

  return data;
}

export async function getProjectsByClient(clientId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("client_id", clientId)
    .eq("owner_user_id", user.id)
    .order("name");

  if (error) {
    throw error;
  }

  return data;
}

export async function getProject(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data, error } = await supabase
    .from("projects")
    .select("*, clients(name)")
    .eq("id", id)
    .eq("owner_user_id", user.id)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function createProject(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const clientId = formData.get("client_id") as string;
  const name = formData.get("name") as string;
  const rateExBtw = formData.get("rate_ex_btw")
    ? parseFloat(formData.get("rate_ex_btw") as string)
    : null;
  const defaultUnit = (formData.get("default_unit") as string) || "minutes";
  const roundingRule = (formData.get("rounding_rule") as string) || "none";

  const { error } = await supabase.from("projects").insert({
    owner_user_id: user.id,
    client_id: clientId,
    name,
    rate_ex_btw: rateExBtw,
    default_unit: defaultUnit,
    rounding_rule: roundingRule,
  });

  if (error) {
    throw error;
  }

  revalidatePath("/projects");
  revalidatePath(`/clients/${clientId}`);
}

export async function updateProject(id: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const name = formData.get("name") as string;
  const rateExBtw = formData.get("rate_ex_btw")
    ? parseFloat(formData.get("rate_ex_btw") as string)
    : null;
  const defaultUnit = (formData.get("default_unit") as string) || "minutes";
  const roundingRule = (formData.get("rounding_rule") as string) || "none";

  const { error } = await supabase
    .from("projects")
    .update({
      name,
      rate_ex_btw: rateExBtw,
      default_unit: defaultUnit,
      rounding_rule: roundingRule,
    })
    .eq("id", id)
    .eq("owner_user_id", user.id);

  if (error) {
    throw error;
  }

  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
}

export async function deleteProject(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id)
    .eq("owner_user_id", user.id);

  if (error) {
    throw error;
  }

  revalidatePath("/projects");
}

export async function getProjectsWithStats() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Get all projects with client info
  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("*, clients(name)")
    .eq("owner_user_id", user.id)
    .order("name");

  if (projectsError) {
    throw projectsError;
  }

  // Get time entries for hours calculation and last activity
  const { data: timeEntries, error: entriesError } = await supabase
    .from("time_entries")
    .select("project_id, duration_minutes, date, created_at")
    .eq("owner_user_id", user.id)
    .order("date", { ascending: false });

  if (entriesError) {
    throw entriesError;
  }

  // Calculate stats per project
  const statsMap = new Map<string, { totalHours: number; lastActivity: Date | null }>();

  // Initialize all projects
  projects.forEach((project) => {
    statsMap.set(project.id, { totalHours: 0, lastActivity: null });
  });

  // Calculate hours and last activity
  timeEntries?.forEach((entry) => {
    const stats = statsMap.get(entry.project_id);
    if (stats) {
      stats.totalHours += entry.duration_minutes / 60;
      // Use date field for last activity (most recent time entry date)
      const entryDate = typeof entry.date === 'string' ? new Date(entry.date) : entry.date;
      if (entryDate && (!stats.lastActivity || entryDate > stats.lastActivity)) {
        stats.lastActivity = entryDate;
      }
    }
  });

  // Combine projects with stats
  return projects.map((project) => {
    const stats = statsMap.get(project.id) || { totalHours: 0, lastActivity: null };
    return {
      ...project,
      totalHours: Math.round(stats.totalHours * 100) / 100, // Round to 2 decimals
      lastActivity: stats.lastActivity,
    };
  });
}

