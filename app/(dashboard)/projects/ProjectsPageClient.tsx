/**
 * app/(dashboard)/projects/ProjectsPageClient.tsx
 * 
 * Client component voor de projects pagina. Haalt data op via client-side Supabase calls
 * en rendert ProjectSearch. Dit voorkomt dat MUI en server logic in Edge Functions
 * terechtkomt, wat de bundle size aanzienlijk verkleint.
 */
"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { Container, Box, Typography, Button, Paper, Tooltip, CircularProgress } from "@mui/material";
import { Plus, Info } from "lucide-react";
import Link from "next/link";

const ProjectSearch = dynamic(() => import("@/components/project-search").then(mod => ({ default: mod.ProjectSearch })));

export default function ProjectsPageClient() {
  const [projects, setProjects] = useState<any[]>([]);
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

      // Load clients
      const { data: clientsData, error: clientsError } = await supabase
        .from("clients")
        .select("id, name")
        .eq("owner_user_id", user.id)
        .order("name");

      if (clientsError) {
        console.error("Error loading clients:", clientsError);
      } else {
        setClients(clientsData || []);
      }

      // Get all projects with client info including BTW profile
      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select("*, clients(name, btw_profile)")
        .eq("owner_user_id", user.id)
        .order("name");

      if (projectsError) {
        console.error("Error loading projects:", projectsError);
        setLoading(false);
        return;
      }

      // Get time entries for hours calculation and last activity
      const { data: timeEntries, error: entriesError } = await supabase
        .from("time_entries")
        .select("project_id, duration_minutes, date, created_at")
        .eq("owner_user_id", user.id)
        .order("date", { ascending: false });

      if (entriesError) {
        console.error("Error loading time entries:", entriesError);
      }

      // Calculate stats per project
      const statsMap = new Map<string, { totalHours: number; lastActivity: Date | null }>();

      // Initialize all projects
      projectsData?.forEach((project) => {
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
      const projectsWithStats = (projectsData || []).map((project) => {
        const stats = statsMap.get(project.id) || { totalHours: 0, lastActivity: null };
        return {
          ...project,
          totalHours: Math.round(stats.totalHours * 100) / 100, // Round to 2 decimals
          lastActivity: stats.lastActivity,
        };
      });

      setProjects(projectsWithStats);
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
              Projecten
            </Typography>
            <Tooltip title="Beheer je projecten per klant. Stel standaard units in (minuten/kwartier/uur/dag), afrondingsregels en optionele tarieven. Het tarief is per standaard unit (bijv. €75/uur).">
              <Info size={20} style={{ color: "inherit", cursor: "help" }} />
            </Tooltip>
          </Box>
          <Link href="/projects/new" style={{ textDecoration: "none" }}>
            <Button variant="contained" startIcon={<Plus size={18} />}>
              Nieuw Project
            </Button>
          </Link>
        </Box>

        {/* Content Card */}
        <Paper elevation={1} sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            Alle Projecten
          </Typography>
          <ProjectSearch initialProjects={projects} clients={clients} />
        </Paper>
      </Box>
    </Container>
  );
}

