/**
 * app/(dashboard)/clients/[id]/edit/page.tsx
 * 
 * Client edit pagina. Toont formulier voor het bewerken van klantgegevens.
 * Server component met Edge Runtime support.
 */
import { getClient } from "@/app/actions/clients";
import { Container, Box, Typography } from "@mui/material";
import { ClientForm } from "@/components/client-form";

export const runtime = 'edge';

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Await params (Next.js 15+)
  const { id } = await params;
  const client = await getClient(id);

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
          Klant bewerken
        </Typography>
        <ClientForm client={client} />
      </Box>
    </Container>
  );
}
