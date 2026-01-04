/**
 * app/(dashboard)/clients/ClientsPageClient.tsx
 * 
 * Client component wrapper voor de clients pagina. Bevat alle MUI imports en UI.
 * Wordt gerenderd door de Server Component page.tsx.
 */
"use client";

import { Container, Box, Typography, Button, Paper, Tooltip } from "@mui/material";
import { Add, Info } from "@mui/icons-material";
import Link from "next/link";
import { ClientSearch } from "@/components/client-search";

interface ClientsPageClientProps {
  clients: any[];
}

export default function ClientsPageClient({ clients }: ClientsPageClientProps) {
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
              <Info sx={{ color: "text.secondary", fontSize: 20, cursor: "help" }} />
            </Tooltip>
          </Box>
          <Link href="/clients/new" style={{ textDecoration: "none" }}>
            <Button variant="contained" startIcon={<Add />}>
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

