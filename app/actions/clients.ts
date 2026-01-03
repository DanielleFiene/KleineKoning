// app/actions/clients.ts
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

  const { error } = await supabase.from("clients").insert({
    owner_user_id: user.id,
    name,
    btw_profile: {
      label: btwLabel,
      percentage: btwPercentage,
      rule: btwRule,
    },
  });

  if (error) {
    throw error;
  }

  revalidatePath("/clients");
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

  const { error } = await supabase
    .from("clients")
    .update({
      name,
      btw_profile: {
        label: btwLabel,
        percentage: btwPercentage,
        rule: btwRule,
      },
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

