/**
 * app/(dashboard)/clients/new/page.tsx
 * 
 * Nieuwe client aanmaken pagina. Toont formulier voor het toevoegen van een nieuwe klant.
 * Server component.
 */
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { ClientForm } from "@/components/client-form";

export default function NewClientPage() {
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
          Nieuwe Klant
        </Typography>
        <ClientForm />
      </Box>
    </Container>
  );
}
