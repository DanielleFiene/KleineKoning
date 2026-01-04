"use client";

import { Container, Box, Typography, Paper, Link } from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { useState, useEffect } from "react";

export const runtime = 'edge';

function createAppTheme(mode: "light" | "dark") {
  return createTheme({
    palette: {
      mode,
      primary: {
        main: "#6366f1",
      },
      secondary: {
        main: "#9333ea",
      },
      background: {
        default: mode === "dark" ? "#121212" : "#f5f5f5",
        paper: mode === "dark" ? "#1e1e1e" : "#ffffff",
      },
    },
  });
}

export default function PrivacyPage() {
  const [mode, setMode] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedMode = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedMode) {
      setMode(savedMode);
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setMode(prefersDark ? "dark" : "light");
    }
  }, []);

  const theme = createAppTheme(mode);

  if (!mounted) {
    return null;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: "100vh",
          background:
            mode === "dark"
              ? "linear-gradient(135deg, rgba(30, 30, 30, 0.8) 0%, rgba(20, 20, 20, 0.8) 50%, rgba(30, 30, 30, 0.8) 100%)"
              : "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(99, 102, 241, 0.1) 50%, rgba(147, 51, 234, 0.1) 100%)",
        }}
      >
        <Container maxWidth="md" sx={{ py: { xs: 3, sm: 4 } }}>
          <Paper elevation={1} sx={{ p: { xs: 3, sm: 4 } }}>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: "bold",
                mb: 3,
                background: "linear-gradient(90deg, #6366f1 0%, #9333ea 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Privacy & AVG
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  1. Verantwoordelijke
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Kleine Koning wordt beheerd door Danielle Fiene / DF Digital. Voor vragen over privacy of het uitoefenen van uw rechten kunt u contact met ons opnemen via{" "}
                  <Link href="mailto:info@dfdigital.eu" color="primary">
                    info@dfdigital.eu
                  </Link>
                  .
                </Typography>
              </Box>

              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  2. Gegevens die wij verzamelen
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                  Wij verzamelen de volgende gegevens:
                </Typography>
                <Typography component="ul" variant="body1" color="text.secondary" sx={{ pl: 2 }}>
                  <li>E-mailadres (voor authenticatie via magic link)</li>
                  <li>Klantgegevens (naam, BTW-profiel, tarieven)</li>
                  <li>Projectgegevens (naam, tarieven, afrondingsregels)</li>
                  <li>Tijdregistraties (datum, beschrijving, duur)</li>
                  <li>Urenstaten (PDF exports)</li>
                </Typography>
              </Box>

              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  3. Doel van gegevensverwerking
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Uw gegevens worden uitsluitend gebruikt voor het functioneren van de tijdregistratie applicatie. Wij gebruiken uw gegevens niet voor marketingdoeleinden of delen deze met derden.
                </Typography>
              </Box>

              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  4. Data opslag en beveiliging
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                  Uw gegevens worden opgeslagen op:
                </Typography>
                <Typography component="ul" variant="body1" color="text.secondary" sx={{ pl: 2 }}>
                  <li><strong>Backend:</strong> Supabase (PostgreSQL database) op EU servers</li>
                  <li><strong>Frontend:</strong> Cloudflare Pages (CDN en Edge Runtime)</li>
                  <li><strong>PDF opslag:</strong> Supabase Storage op EU servers</li>
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                  Alle data wordt versleuteld in transit (HTTPS) en in rust. Wij gebruiken Row Level Security (RLS) om ervoor te zorgen dat u alleen toegang heeft tot uw eigen gegevens.
                </Typography>
              </Box>

              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  5. Uw rechten
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                  Onder de AVG heeft u de volgende rechten:
                </Typography>
                <Typography component="ul" variant="body1" color="text.secondary" sx={{ pl: 2 }}>
                  <li>Recht op inzage: u kunt al uw gegevens inzien in de applicatie</li>
                  <li>Recht op rectificatie: u kunt uw gegevens zelf aanpassen (klanten, projecten, tijdregistraties)</li>
                  <li>Recht op verwijdering: u kunt individuele gegevens verwijderen via de applicatie. Voor volledige accountverwijdering kunt u contact met ons opnemen via <Link href="mailto:info@dfdigital.eu" color="primary">info@dfdigital.eu</Link></li>
                  <li>Recht op dataportabiliteit: u kunt uw gegevens exporteren via de exports functionaliteit</li>
                  <li>Recht op bezwaar: u kunt bezwaar maken tegen verwerking door contact met ons op te nemen via <Link href="mailto:info@dfdigital.eu" color="primary">info@dfdigital.eu</Link></li>
                </Typography>
              </Box>

              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  6. Cookies
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Wij gebruiken alleen essentiële cookies voor authenticatie en sessiebeheer. Deze cookies zijn noodzakelijk voor het functioneren van de applicatie.
                </Typography>
              </Box>

              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  7. Bewaartermijn
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Uw gegevens worden bewaard zolang uw account actief is. U kunt individuele gegevens (klanten, projecten, tijdregistraties) zelf verwijderen via de applicatie. Voor volledige verwijdering van uw account en alle bijbehorende gegevens kunt u contact met ons opnemen via <Link href="mailto:info@dfdigital.eu" color="primary">info@dfdigital.eu</Link>. Na accountverwijdering worden alle gegevens permanent verwijderd, tenzij wij wettelijk verplicht zijn deze langer te bewaren.
                </Typography>
              </Box>

              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  8. Wijzigingen
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Wij behouden ons het recht voor om deze privacyverklaring aan te passen. Wijzigingen worden op deze pagina gepubliceerd. Het is raadzaam deze pagina regelmatig te raadplegen.
                </Typography>
              </Box>

              <Box sx={{ mt: 2, p: 2, bgcolor: "action.hover", borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Laatste update:</strong> {new Date().toLocaleDateString("nl-NL", { year: "numeric", month: "long", day: "numeric" })}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

