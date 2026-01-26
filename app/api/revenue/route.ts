/**
 * app/api/revenue/route.ts
 * 
 * API route voor het ophalen van revenue data. Edge Runtime compatible.
 * Berekent inkomsten per klant voor een specifieke periode.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "startDate en endDate zijn verplicht" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get time entries with project rates and client BTW profile for the period
    const { data: timeEntries, error: entriesError } = await supabase
      .from("time_entries")
      .select(
        `
        id,
        client_id,
        project_id,
        duration_minutes,
        date,
        clients(name, btw_profile),
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
      return NextResponse.json([]);
    }

    // Aggregate by client and project
    const clientMap = new Map<
      string,
      {
        clientName: string;
        btwPercentage: number;
        totalHours: number;
        totalRevenue: number; // Netto (ex BTW)
        totalRevenueBruto: number; // Bruto (inc BTW)
        projects: Map<
          string,
          {
            projectName: string;
            hours: number;
            revenue: number; // Netto (ex BTW)
            revenueBruto: number; // Bruto (inc BTW)
            rateExBtw: number | null;
            rateIncBtw: number | null; // Bruto tarief (inc BTW)
          }
        >;
      }
    >();

    timeEntries.forEach((entry) => {
      const clientId = entry.client_id;
      const projectId = entry.project_id;
      const clientName = (entry.clients as any)?.name || "Onbekende klant";
      const btwProfile = (entry.clients as any)?.btw_profile || { percentage: 0 };
      const btwPercentage = btwProfile.percentage || 0;
      const projectName = (entry.projects as any)?.name || "Onbekend project";
      const rateExBtw = (entry.projects as any)?.rate_ex_btw as number | null;
      const hours = entry.duration_minutes / 60;

      // Calculate bruto rate (inc BTW) if netto rate exists
      const rateIncBtw = rateExBtw !== null && rateExBtw > 0
        ? rateExBtw * (1 + btwPercentage / 100)
        : null;

      // Initialize client if not exists
      if (!clientMap.has(clientId)) {
        clientMap.set(clientId, {
          clientName,
          btwPercentage,
          totalHours: 0,
          totalRevenue: 0,
          totalRevenueBruto: 0,
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
          revenueBruto: 0,
          rateExBtw,
          rateIncBtw,
        });
      }

      const project = client.projects.get(projectId)!;

      // Add hours
      project.hours += hours;
      client.totalHours += hours;

      // Calculate revenue (only if rate is set)
      if (rateExBtw !== null && rateExBtw > 0) {
        const projectRevenue = hours * rateExBtw; // Netto
        const projectRevenueBruto = hours * rateIncBtw!; // Bruto
        project.revenue += projectRevenue;
        project.revenueBruto += projectRevenueBruto;
        client.totalRevenue += projectRevenue;
        client.totalRevenueBruto += projectRevenueBruto;
      }
    });

    // Convert to array format
    const revenueEntries = Array.from(clientMap.entries()).map(
      ([clientId, data]) => ({
        clientId,
        clientName: data.clientName,
        btwPercentage: data.btwPercentage,
        totalHours: Math.round(data.totalHours * 100) / 100,
        totalRevenue: Math.round(data.totalRevenue * 100) / 100,
        totalRevenueBruto: Math.round(data.totalRevenueBruto * 100) / 100,
        projects: Array.from(data.projects.entries()).map(
          ([projectId, projectData]) => ({
            projectId,
            projectName: projectData.projectName,
            hours: Math.round(projectData.hours * 100) / 100,
            revenue: Math.round(projectData.revenue * 100) / 100,
            revenueBruto: Math.round(projectData.revenueBruto * 100) / 100,
            rateExBtw: projectData.rateExBtw,
            rateIncBtw: projectData.rateIncBtw !== null
              ? Math.round(projectData.rateIncBtw * 100) / 100
              : null,
          })
        ),
      })
    );

    // Sort by total revenue descending
    const sorted = revenueEntries.sort((a, b) => b.totalRevenue - a.totalRevenue);

    return NextResponse.json(sorted);
  } catch (error: any) {
    console.error("Error fetching revenue:", error);
    return NextResponse.json(
      { error: "Fout bij ophalen revenue data: " + error.message },
      { status: 500 }
    );
  }
}
