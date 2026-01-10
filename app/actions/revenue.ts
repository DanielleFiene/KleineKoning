/**
 * app/actions/revenue.ts
 * 
 * Server actions voor het berekenen van revenue (inkomsten) per klant. Aggregeert
 * tijdentries met project tarieven om bruto inkomsten te berekenen per periode.
 * Ondersteunt filtering op week, maand, kwartaal en jaar.
 */
"use server";

import { createClient } from "@/lib/supabase/server";

export interface RevenueEntry {
  clientId: string;
  clientName: string;
  totalHours: number;
  totalRevenue: number;
  projects: {
    projectId: string;
    projectName: string;
    hours: number;
    revenue: number;
    rateExBtw: number | null;
  }[];
}

export async function getRevenueByPeriod(
  startDate: string,
  endDate: string
): Promise<RevenueEntry[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Get time entries with project rates for the period
  const { data: timeEntries, error: entriesError } = await supabase
    .from("time_entries")
    .select(
      `
      id,
      client_id,
      project_id,
      duration_minutes,
      date,
      clients(name),
      projects(name, rate_ex_btw)
    `
    )
    .eq("owner_user_id", user.id)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: false });

  if (entriesError) {
    throw entriesError;
  }

  if (!timeEntries || timeEntries.length === 0) {
    return [];
  }

  // Aggregate by client and project
  const clientMap = new Map<
    string,
    {
      clientName: string;
      totalHours: number;
      totalRevenue: number;
      projects: Map<
        string,
        {
          projectName: string;
          hours: number;
          revenue: number;
          rateExBtw: number | null;
        }
      >;
    }
  >();

  timeEntries.forEach((entry) => {
    const clientId = entry.client_id;
    const projectId = entry.project_id;
    const clientName = (entry.clients as any)?.name || "Onbekende klant";
    const projectName = (entry.projects as any)?.name || "Onbekend project";
    const rateExBtw = (entry.projects as any)?.rate_ex_btw as number | null;
    const hours = entry.duration_minutes / 60;

    // Initialize client if not exists
    if (!clientMap.has(clientId)) {
      clientMap.set(clientId, {
        clientName,
        totalHours: 0,
        totalRevenue: 0,
        projects: new Map(),
      });
    }

    const client = clientMap.get(clientId)!;

    // Initialize project if not exists
    if (!client.projects.has(projectId)) {
      client.projects.set(projectId, {
        projectName,
        hours: 0,
        revenue: 0,
        rateExBtw,
      });
    }

    const project = client.projects.get(projectId)!;

    // Add hours
    project.hours += hours;
    client.totalHours += hours;

    // Calculate revenue (only if rate is set)
    if (rateExBtw !== null && rateExBtw > 0) {
      const projectRevenue = hours * rateExBtw;
      project.revenue += projectRevenue;
      client.totalRevenue += projectRevenue;
    }
  });

  // Convert to array format
  const revenueEntries: RevenueEntry[] = Array.from(clientMap.entries()).map(
    ([clientId, data]) => ({
      clientId,
      clientName: data.clientName,
      totalHours: Math.round(data.totalHours * 100) / 100,
      totalRevenue: Math.round(data.totalRevenue * 100) / 100,
      projects: Array.from(data.projects.entries()).map(
        ([projectId, projectData]) => ({
          projectId,
          projectName: projectData.projectName,
          hours: Math.round(projectData.hours * 100) / 100,
          revenue: Math.round(projectData.revenue * 100) / 100,
          rateExBtw: projectData.rateExBtw,
        })
      ),
    })
  );

  // Sort by total revenue descending
  return revenueEntries.sort((a, b) => b.totalRevenue - a.totalRevenue);
}
