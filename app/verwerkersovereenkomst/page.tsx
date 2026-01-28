/**
 * app/verwerkersovereenkomst/page.tsx
 * 
 * Verwerkersovereenkomst pagina met informatie over data processing agreement tussen
 * gebruiker (Controller) en Kleine Koning (Processor). Publiek toegankelijk.
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

export default function VerwerkersovereenkomstPage() {
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
              Verwerkersovereenkomst
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Partijen
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                  <strong>Verwerkingsverantwoordelijke:</strong> De gebruiker van Kleine Koning (u)
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  <strong>Verwerker:</strong> Danielle Fiene / DF Digital, beheerder van Kleine Koning
                </Typography>
              </Box>

              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Doel van de verwerking
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Kleine Koning is een tijdregistratie applicatie. Als gebruiker van de applicatie bent u verwerkingsverantwoordelijke voor de persoonsgegevens die u invoert (bijvoorbeeld klantgegevens, projectgegevens, tijdregistraties). Wij fungeren als verwerker door het technisch beheer en de hosting van de applicatie te verzorgen.
                </Typography>
              </Box>

              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Verwerkte gegevens
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                  Wij verwerken de volgende categorieën van persoonsgegevens namens u:
                </Typography>
                <Typography component="ul" variant="body1" color="text.secondary" sx={{ pl: 2 }}>
                  <li>E-mailadres (voor authenticatie)</li>
                  <li>Klantgegevens (naam, contactgegevens, BTW-profiel)</li>
                  <li>Projectgegevens</li>
                  <li>Tijdregistraties</li>
                  <li>Urenstaten en exports</li>
                </Typography>
              </Box>

              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Technische verwerkers
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                  Voor de technische infrastructuur maken wij gebruik van de volgende sub-verwerkers:
                </Typography>
                <Typography component="ul" variant="body1" color="text.secondary" sx={{ pl: 2 }}>
                  <li><strong>Supabase:</strong> Database en storage hosting op EU servers (GDPR compliant)</li>
                  <li><strong>Cloudflare:</strong> CDN en Edge Runtime hosting (GDPR compliant)</li>
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                  Deze sub-verwerkers hebben hun eigen verwerkersovereenkomsten en voldoen aan de AVG. Wij hebben geen toegang tot de inhoud van uw gegevens, behalve voor technisch onderhoud en beveiliging.
                </Typography>
              </Box>

              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Beveiligingsmaatregelen
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                  Wij treffen de volgende beveiligingsmaatregelen:
                </Typography>
                <Typography component="ul" variant="body1" color="text.secondary" sx={{ pl: 2 }}>
                  <li>Versleuteling in transit (HTTPS/TLS)</li>
                  <li>Versleuteling in rust (database en storage)</li>
                  <li>Row Level Security (RLS) zodat gebruikers alleen toegang hebben tot eigen gegevens</li>
                  <li>Regelmatige security updates</li>
                  <li>Backup procedures</li>
                </Typography>
              </Box>

              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Verplichtingen van de verwerker
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                  Wij verbinden ons ertoe:
                </Typography>
                <Typography component="ul" variant="body1" color="text.secondary" sx={{ pl: 2 }}>
                  <li>Uw gegevens alleen te verwerken in overeenstemming met uw instructies</li>
                  <li>Geheimhouding te waarborgen</li>
                  <li>Passende technische en organisatorische maatregelen te treffen</li>
                  <li>U te ondersteunen bij het voldoen aan uw verplichtingen als verwerkingsverantwoordelijke</li>
                  <li>U te informeren bij datalekken</li>
                  <li>Bij beëindiging van de dienst alle gegevens te verwijderen of terug te geven</li>
                </Typography>
              </Box>

              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Rechten van de verwerkingsverantwoordelijke
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Als verwerkingsverantwoordelijke behoudt u alle rechten op uw gegevens. U kunt uw gegevens op elk moment exporteren, aanpassen of individueel verwijderen via de applicatie. Voor volledige accountverwijdering kunt u contact met ons opnemen via <Link href="mailto:info@dfdigital.eu" color="primary">info@dfdigital.eu</Link>. Wij hebben geen toegang tot de inhoud van uw gegevens voor andere doeleinden dan technisch beheer.
                </Typography>
              </Box>

              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Duur en beëindiging
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Deze verwerkersovereenkomst is van kracht zolang u gebruik maakt van Kleine Koning. U kunt uw account beëindigen door contact met ons op te nemen via <Link href="mailto:info@dfdigital.eu" color="primary">info@dfdigital.eu</Link>. Bij beëindiging van uw account worden alle gegevens permanent verwijderd, tenzij u expliciet om export vraagt of wij wettelijk verplicht zijn deze langer te bewaren.
                </Typography>
              </Box>

              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Aansprakelijkheid
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Wij zijn alleen verantwoordelijk voor de technische beschikbaarheid en beveiliging van de applicatie. Als verwerkingsverantwoordelijke bent u zelf verantwoordelijk voor de rechtmatigheid van de verwerking en het voldoen aan de AVG voor de gegevens die u invoert.
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

