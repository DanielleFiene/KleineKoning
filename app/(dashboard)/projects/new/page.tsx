/**
 * app/(dashboard)/projects/new/page.tsx
 * 
 * Nieuw project aanmaken pagina. Toont formulier voor het toevoegen van een nieuw project.
 * Ondersteunt pre-selectie van klant via query parameter. Server component met Edge Runtime support.
 */
import { getClients } from "@/app/actions/clients";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { ProjectForm } from "@/components/project-form";

export const runtime = 'edge';

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ client_id?: string }>;
}) {
  // Await searchParams (Next.js 15+)
  const params = await searchParams;
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
          Nieuw Project
        </Typography>
        <ProjectForm clients={clients} defaultClientId={params.client_id} />
      </Box>
    </Container>
  );
}
