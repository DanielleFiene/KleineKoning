// app/(dashboard)/projects/page.tsx
import { getProjectsWithStats } from "@/app/actions/projects";
import { getClients } from "@/app/actions/clients";
import { Container, Box, Typography, Button, Paper, Tooltip } from "@mui/material";
import { Add, Info } from "@mui/icons-material";
import Link from "next/link";
import { ProjectSearch } from "@/components/project-search";

export const runtime = 'edge';

export default async function ProjectsPage() {
  const projects = await getProjectsWithStats();
  const clients = await getClients();

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
              <Info sx={{ color: "text.secondary", fontSize: 20, cursor: "help" }} />
            </Tooltip>
          </Box>
          <Link href="/projects/new" style={{ textDecoration: "none" }}>
            <Button variant="contained" startIcon={<Add />}>
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
