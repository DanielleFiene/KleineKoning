/**
 * app/(dashboard)/projects/[id]/edit/page.tsx
 * 
 * Project edit pagina. Toont formulier voor het bewerken van projectgegevens.
 * Server component met Edge Runtime support.
 */
import { getProject, getProjects } from "@/app/actions/projects";
import { getClients } from "@/app/actions/clients";
import { Container, Box, Typography } from "@mui/material";
import { ProjectForm } from "@/components/project-form";

export const runtime = 'edge';

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Await params (Next.js 15+)
  const { id } = await params;
  const project = await getProject(id);
  const clients = await getClients();

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 } }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
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
          Project bewerken
        </Typography>
        <ProjectForm
          clients={clients}
          project={{
            id: project.id,
            client_id: project.client_id,
            name: project.name,
            rate_ex_btw: project.rate_ex_btw,
            default_unit: project.default_unit,
            rounding_rule: project.rounding_rule,
          }}
        />
      </Box>
    </Container>
  );
}
