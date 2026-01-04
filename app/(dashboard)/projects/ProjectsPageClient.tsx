/**
 * app/(dashboard)/projects/ProjectsPageClient.tsx
 * 
 * Client component wrapper voor de projects pagina. Bevat alle MUI imports en UI.
 * Wordt gerenderd door de Server Component page.tsx.
 */
"use client";

import { Container, Box, Typography, Button, Paper, Tooltip } from "@mui/material";
import { Plus, Info } from "lucide-react";
import Link from "next/link";
import { ProjectSearch } from "@/components/project-search";

interface ProjectsPageClientProps {
  projects: any[];
  clients: any[];
}

export default function ProjectsPageClient({ projects, clients }: ProjectsPageClientProps) {
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

