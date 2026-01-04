/**
 * app/(dashboard)/clients/ClientsPageClient.tsx
 * 
 * Client component voor de clients pagina. Haalt data op via client-side Supabase calls
 * en rendert ClientSearch. Dit voorkomt dat MUI en server logic in Edge Functions
 * terechtkomt, wat de bundle size aanzienlijk verkleint.
 */
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Container, Box, Typography, Button, Paper, Tooltip, CircularProgress } from "@mui/material";
import { Plus, Info } from "lucide-react";
import Link from "next/link";
import { ClientSearch } from "@/components/client-search";

export default function ClientsPageClient() {
  const [clients, setClients] = useState<any[]>([]);
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

      // Get all clients
      const { data: clientsData, error: clientsError } = await supabase
        .from("clients")
        .select("*")
        .eq("owner_user_id", user.id)
        .order("name");

      if (clientsError) {
        console.error("Error loading clients:", clientsError);
        setLoading(false);
        return;
      }

      // Get project counts per client
      const { data: projects, error: projectsError } = await supabase
        .from("projects")
        .select("client_id")
        .eq("owner_user_id", user.id);

      if (projectsError) {
        console.error("Error loading projects:", projectsError);
      }

      // Get time entries for hours calculation and last activity
      const { data: timeEntries, error: entriesError } = await supabase
        .from("time_entries")
        .select("client_id, duration_minutes, date, created_at")
        .eq("owner_user_id", user.id)
        .order("date", { ascending: false });

      if (entriesError) {
        console.error("Error loading time entries:", entriesError);
      }

      // Calculate stats per client
      const statsMap = new Map<string, { projectCount: number; totalHours: number; lastActivity: Date | null }>();

      // Initialize all clients
      clientsData?.forEach((client) => {
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
      const clientsWithStats = (clientsData || []).map((client) => {
        const stats = statsMap.get(client.id) || { projectCount: 0, totalHours: 0, lastActivity: null };
        return {
          ...client,
          projectCount: stats.projectCount,
          totalHours: Math.round(stats.totalHours * 100) / 100, // Round to 2 decimals
          lastActivity: stats.lastActivity,
        };
      });

      setClients(clientsWithStats);
      setLoading(false);
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 } }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {/* Page Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: "bold",
                background: "linear-gradient(90deg, #6366f1 0%, #9333ea 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Klanten
            </Typography>
            <Tooltip title="Beheer je klanten. Voeg klanten toe, bewerk BTW-profielen en tarieven. Voor internationale klanten kun je een handmatig tarief instellen.">
              <Info size={20} style={{ color: "inherit", cursor: "help" }} />
            </Tooltip>
          </Box>
          <Link href="/clients/new" style={{ textDecoration: "none" }}>
            <Button variant="contained" startIcon={<Plus size={18} />}>
              Nieuwe Klant
            </Button>
          </Link>
        </Box>

        {/* Content Card */}
        <Paper elevation={1} sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            Klantenlijst
          </Typography>
          <ClientSearch initialClients={clients} />
        </Paper>
      </Box>
    </Container>
  );
}

