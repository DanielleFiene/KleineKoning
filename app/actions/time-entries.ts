"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getTimeEntries(filters?: {
  clientId?: string;
  projectId?: string;
  startDate?: string;
  endDate?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  let query = supabase
    .from("time_entries")
    .select("*, clients(name), projects(name, rounding_rule)")
    .eq("owner_user_id", user.id)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters?.clientId) {
    query = query.eq("client_id", filters.clientId);
  }

  if (filters?.projectId) {
    query = query.eq("project_id", filters.projectId);
  }

  if (filters?.startDate) {
    query = query.gte("date", filters.startDate);
  }

  if (filters?.endDate) {
    query = query.lte("date", filters.endDate);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data;
}

export async function getTimeEntry(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data, error } = await supabase
    .from("time_entries")
    .select("*, clients(name), projects(name, rounding_rule)")
    .eq("id", id)
    .eq("owner_user_id", user.id)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

function applyRounding(
  minutes: number,
  rule: "none" | "nearest15" | "up15" | "down15"
): number {
  switch (rule) {
    case "none":
      return minutes;
    case "nearest15":
      return Math.round(minutes / 15) * 15;
    case "up15":
      return Math.ceil(minutes / 15) * 15;
    case "down15":
      return Math.floor(minutes / 15) * 15;
    default:
      return minutes;
  }
}

function convertToMinutes(value: number, unit: string): number {
  switch (unit) {
    case "minutes":
      return value;
    case "quarter":
      return value * 15;
    case "hour":
      return value * 60;
    case "day":
      return value * 480; // 8 hours
    default:
      return value;
  }
}

export async function createTimeEntry(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const clientId = formData.get("client_id") as string;
  const projectId = formData.get("project_id") as string;
  const date = formData.get("date") as string;
  const description = formData.get("description") as string;
  const durationValue = parseFloat(formData.get("duration_value") as string);
  const durationUnit = formData.get("duration_unit") as string;

  // Get project to check rounding rule
  const { data: project } = await supabase
    .from("projects")
    .select("rounding_rule")
    .eq("id", projectId)
    .eq("owner_user_id", user.id)
    .single();

  const roundingRule =
    (project?.rounding_rule as
      | "none"
      | "nearest15"
      | "up15"
      | "down15") || "none";

  // Convert to minutes
  let durationMinutes = convertToMinutes(durationValue, durationUnit);

  // Apply rounding
  durationMinutes = applyRounding(durationMinutes, roundingRule);

  const { error } = await supabase.from("time_entries").insert({
    owner_user_id: user.id,
    client_id: clientId,
    project_id: projectId,
    date,
    description,
    duration_minutes: durationMinutes,
  });

  if (error) {
    throw error;
  }

  revalidatePath("/time");
}

export async function updateTimeEntry(id: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const clientId = formData.get("client_id") as string;
  const projectId = formData.get("project_id") as string;
  const date = formData.get("date") as string;
  const description = formData.get("description") as string;
  const durationValue = parseFloat(formData.get("duration_value") as string);
  const durationUnit = formData.get("duration_unit") as string;

  // Get project to check rounding rule
  const { data: project } = await supabase
    .from("projects")
    .select("rounding_rule")
    .eq("id", projectId)
    .eq("owner_user_id", user.id)
    .single();

  const roundingRule =
    (project?.rounding_rule as
      | "none"
      | "nearest15"
      | "up15"
      | "down15") || "none";

  // Convert to minutes
  let durationMinutes = convertToMinutes(durationValue, durationUnit);

  // Apply rounding
  durationMinutes = applyRounding(durationMinutes, roundingRule);

  const { error } = await supabase
    .from("time_entries")
    .update({
      client_id: clientId,
      project_id: projectId,
      date,
      description,
      duration_minutes: durationMinutes,
    })
    .eq("id", id)
    .eq("owner_user_id", user.id);

  if (error) {
    throw error;
  }

  revalidatePath("/time");
}

export async function deleteTimeEntry(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { error } = await supabase
    .from("time_entries")
    .delete()
    .eq("id", id)
    .eq("owner_user_id", user.id);

  if (error) {
    throw error;
  }

  revalidatePath("/time");
}

