/**
 * app/algemene-voorwaarden/page.tsx
 * 
 * Algemene Voorwaarden pagina met gebruiksvoorwaarden voor Kleine Koning.
 * Publiek toegankelijk (niet beschermd door middleware).
 */
"use client";

import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Link from "@mui/material/Link";
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

export default function AlgemeneVoorwaardenPage() {
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
              Algemene Voorwaarden
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  1. Aanbieder
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Deze algemene voorwaarden zijn van toepassing op het gebruik van Kleine Koning, een tijdregistratie en urenstaat export applicatie, aangeboden door Danielle Fiene / DF Digital.
                </Typography>
              </Box>

              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  2. Definities
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                  In deze voorwaarden wordt verstaan onder:
                </Typography>
                <Typography component="ul" variant="body1" color="text.secondary" sx={{ pl: 2 }}>
                  <li><strong>Gebruiker:</strong> de natuurlijke of rechtspersoon die gebruik maakt van de dienst</li>
                  <li><strong>Dienst:</strong> de Kleine Koning applicatie en alle daarbij behorende functionaliteiten</li>
                  <li><strong>Account:</strong> de gebruikersaccount waarmee toegang wordt verkregen tot de dienst</li>
                </Typography>
              </Box>

              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  3. Gebruik van de dienst
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                  Door gebruik te maken van Kleine Koning gaat u akkoord met:
                </Typography>
                <Typography component="ul" variant="body1" color="text.secondary" sx={{ pl: 2 }}>
                  <li>De dienst alleen te gebruiken voor legale doeleinden</li>
                  <li>Geen misbruik te maken van de dienst</li>
                  <li>Uw accountgegevens vertrouwelijk te houden</li>
                  <li>Verantwoordelijk te zijn voor alle activiteiten onder uw account</li>
                </Typography>
              </Box>

              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  4. Account en beveiliging
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  U bent verantwoordelijk voor het beveiligen van uw account. Wij raden aan om een sterk wachtwoord te gebruiken en uw account niet te delen met anderen. Wij zijn niet aansprakelijk voor onbevoegde toegang tot uw account als gevolg van nalatigheid aan uw zijde.
                </Typography>
              </Box>

              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  5. Beschikbaarheid
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Wij streven naar een hoge beschikbaarheid van de dienst, maar kunnen geen garantie geven voor 100% uptime. Wij behouden ons het recht voor om onderhoud uit te voeren, wat kan leiden tot tijdelijke onbeschikbaarheid.
                </Typography>
              </Box>

              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  6. Intellectueel eigendom
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Alle rechten op de Kleine Koning applicatie, inclusief maar niet beperkt tot software, design, logo's en documentatie, berusten bij Danielle Fiene / DF Digital. U verkrijgt geen eigendomsrechten door gebruik van de dienst.
                </Typography>
              </Box>

              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  7. Gebruikersgegevens
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  U behoudt alle rechten op uw gegevens. Wij gebruiken uw gegevens alleen voor het leveren van de dienst en zoals beschreven in onze privacyverklaring. U kunt uw gegevens op elk moment exporteren of verwijderen.
                </Typography>
              </Box>

              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  8. Aansprakelijkheid
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                  Wij leveren alleen de technische applicatie Kleine Koning. Wij zijn uitsluitend verantwoordelijk voor de technische beschikbaarheid en beveiliging van de applicatie zelf.
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                  Wij zijn niet aansprakelijk voor:
                </Typography>
                <Typography component="ul" variant="body1" color="text.secondary" sx={{ pl: 2 }}>
                  <li>De juistheid, volledigheid of actualiteit van door u ingevoerde gegevens</li>
                  <li>Fouten in tijdregistraties, berekeningen of exports</li>
                  <li>BTW-berekeningen, facturering of andere fiscale of juridische aspecten</li>
                  <li>Indirecte schade, gevolgschade, gederfde winst of gemiste besparingen</li>
                  <li>Schade als gevolg van onjuist gebruik van de applicatie</li>
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                  U bent zelf volledig verantwoordelijk voor de gegevens die u invoert en het gebruik van de applicatie. Wij zijn alleen verantwoordelijk voor technische storingen of beveiligingslekken in de applicatie zelf.
                </Typography>
              </Box>

              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  9. Wijzigingen
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Wij behouden ons het recht voor om deze algemene voorwaarden te wijzigen. Wijzigingen worden op deze pagina gepubliceerd. Door gebruik te blijven maken van de dienst na wijzigingen, gaat u akkoord met de gewijzigde voorwaarden.
                </Typography>
              </Box>

              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  10. Klachten
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Heeft u een klacht over de dienst? Neem dan eerst contact met ons op via{" "}
                  <Link href="mailto:info@dfdigital.eu" color="primary">info@dfdigital.eu</Link>. Voor klachten over de verwerking van persoonsgegevens verwijzen wij naar onze privacyverklaring en uw recht om een klacht in te dienen bij de toezichthouder (in Tsjechië: Úřad pro ochranu osobních údajů).
                </Typography>
              </Box>

              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  11. Toepasselijk recht
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Op deze voorwaarden is Tsjechisch recht van toepassing. Geschillen zullen worden voorgelegd aan de bevoegde rechter in Tsjechië.
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

