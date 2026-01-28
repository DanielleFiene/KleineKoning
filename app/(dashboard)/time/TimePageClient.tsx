/**
 * app/(dashboard)/time/TimePageClient.tsx
 * 
 * Client component voor de time pagina. Haalt data op via client-side Supabase calls
 * en rendert TimeEntriesView. Dit voorkomt dat MUI en server logic in Edge Functions
 * terechtkomt, wat de bundle size aanzienlijk verkleint.
 */
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { startOfWeek, endOfWeek, format } from "date-fns";
import { getCurrentWeekMonday, parseDateString } from "@/lib/utils/date";
import { Box, CircularProgress, Typography } from "@mui/material";

const TimeEntriesView = dynamic(() => import("@/components/time-entries-view").then(mod => ({ default: mod.TimeEntriesView })));

export default function TimePageClient() {
  const searchParams = useSearchParams();
  const [entries, setEntries] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [weekStart, setWeekStart] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      
      // Get user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Parse week parameter
      const weekParam = searchParams.get("week");
      let monday: Date;
      
      if (weekParam) {
        try {
          const weekDate = parseDateString(weekParam);
          if (!isNaN(weekDate.getTime())) {
            monday = startOfWeek(weekDate, { weekStartsOn: 1 });
          } else {
            monday = getCurrentWeekMonday();
          }
        } catch (error) {
          monday = getCurrentWeekMonday();
        }
      } else {
        monday = getCurrentWeekMonday();
      }
      
      const sunday = endOfWeek(monday, { weekStartsOn: 1 });
      const formatLocalDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      const startDate = formatLocalDate(monday);
      const endDate = formatLocalDate(sunday);
      const clientId = searchParams.get("client_id") || undefined;
      const projectId = searchParams.get("project_id") || undefined;

      // Load clients
      const { data: clientsData, error: clientsError } = await supabase
        .from("clients")
        .select("*")
        .eq("owner_user_id", user.id)
        .order("name");

      if (clientsError) {
        console.error("Error loading clients:", clientsError);
      } else {
        setClients(clientsData || []);
      }

      // Load time entries
      let query = supabase
        .from("time_entries")
        .select(`
          *,
          clients(name, id),
          projects(name, rounding_rule, id)
        `)
        .eq("owner_user_id", user.id)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: false });

      if (clientId) {
        query = query.eq("client_id", clientId);
      }
      if (projectId) {
        query = query.eq("project_id", projectId);
      }

      const { data: entriesData, error: entriesError } = await query;

      if (entriesError) {
        console.error("Error loading entries:", entriesError);
      } else {
        setEntries(entriesData || []);
      }

      setWeekStart(format(monday, 'yyyy-MM-dd'));
      setLoading(false);
    }

    loadData();
  }, [searchParams]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <TimeEntriesView
      initialEntries={entries}
      clients={clients}
      weekStart={weekStart}
    />
  );
}

