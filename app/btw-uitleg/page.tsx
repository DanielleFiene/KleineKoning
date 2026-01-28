/**
 * app/btw-uitleg/page.tsx
 * 
 * BTW uitleg pagina met uitgebreide informatie over BTW-tarieven en wanneer je welk tarief gebruikt.
 * Publiek toegankelijk (niet beschermd door middleware).
 */
"use client";

import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Link from "@mui/material/Link";
import Alert from "@mui/material/Alert";
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

export default function BtwUitlegPage() {
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
              BTW-tarieven: Wanneer gebruik je welk tarief?
            </Typography>

            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Belangrijk:</strong> Deze uitleg is bedoeld als algemene richtlijn. Voor specifieke fiscale vragen raadpleeg altijd een belastingadviseur of de Belastingdienst.
              </Typography>
            </Alert>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Geen BTW (0% - geen BTW-plicht)
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                  <strong>Wanneer gebruik je dit?</strong>
                </Typography>
                <Typography component="ul" variant="body1" color="text.secondary" sx={{ pl: 2, mb: 1 }}>
                  <li>Voor particuliere klanten (B2C) die niet BTW-plichtig zijn</li>
                  <li>Voor klanten die zelf geen BTW kunnen aftrekken</li>
                  <li>Voor diensten die volledig vrijgesteld zijn van BTW</li>
                  <li>Als je zelf niet BTW-plichtig bent (kleine ondernemersregeling)</li>
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
                  <strong>Voorbeeld:</strong> Je werkt voor een particulier die een website laat bouwen. Deze klant kan geen BTW aftrekken. Als je zelf BTW-plichtig bent, reken je 21% BTW. Als je niet BTW-plichtig bent (bijv. onder de kleine ondernemersregeling), reken je geen BTW.
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  <strong>Op facturen:</strong> Geen BTW wordt vermeld. Je rekent alleen het netto bedrag. Let op: dit geldt alleen als je zelf niet BTW-plichtig bent.
                </Typography>
              </Box>

              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  BTW 0% (verlegd/export)
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                  <strong>Wanneer gebruik je dit?</strong>
                </Typography>
                <Typography component="ul" variant="body1" color="text.secondary" sx={{ pl: 2, mb: 1 }}>
                  <li>Voor klanten buiten de EU (export)</li>
                  <li>Voor klanten binnen de EU met een geldig EU-BTW-nummer (intracommunautaire levering)</li>
                  <li>Voor verlegde BTW (reverse charge) bij B2B diensten binnen de EU</li>
                  <li>Voor bepaalde diensten aan buitenlandse klanten (bijv. digitale diensten)</li>
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
                  <strong>Voorbeeld:</strong> Je levert een dienst aan een bedrijf in Duitsland met een geldig EU-BTW-nummer. Je rekent 0% BTW, maar vermeldt wel "BTW verlegd" of "Intracommunautaire levering" op de factuur.
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  <strong>Op facturen:</strong> Je vermeldt "BTW 0% (verlegd)" of "BTW 0% (export)" en het BTW-nummer van de klant. De klant betaalt de BTW in hun eigen land.
                </Typography>
                <Alert severity="warning" sx={{ mt: 1 }}>
                  <Typography variant="body2">
                    <strong>Let op:</strong> Voor intracommunautaire leveringen moet je het EU-BTW-nummer van de klant controleren via de{" "}
                    <Link href="https://ec.europa.eu/taxation_customs/vies/" target="_blank" rel="noopener">
                      VIES-database
                    </Link>
                    .
                  </Typography>
                </Alert>
              </Box>

              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  BTW 9% (laag tarief)
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                  <strong>Wanneer gebruik je dit?</strong>
                </Typography>
                <Typography component="ul" variant="body1" color="text.secondary" sx={{ pl: 2, mb: 1 }}>
                  <li>Voor voedingsmiddelen (behalve alcohol en luxe producten)</li>
                  <li>Voor boeken, kranten en tijdschriften</li>
                  <li>Voor medicijnen en medische hulpmiddelen</li>
                  <li>Voor openbaar vervoer</li>
                  <li>Voor bepaalde culturele diensten (bijv. toegang tot musea, theaters)</li>
                  <li>Voor bepaalde diensten aan de landbouw</li>
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic", mb: 1 }}>
                  <strong>Voorbeeld IT/Web:</strong> Je ontwikkelt een webshop voor een lokale bakker. De website-ontwikkeling zelf is altijd 21% BTW. Alleen als je zelf brood verkoopt (het product), geldt 9% BTW. Adviesdiensten blijven altijd 21%.
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
                  <strong>Voorbeeld Horeca:</strong> Een restaurant serveert eten (9%) en alcoholische dranken (21%). Als loodgieter repareer je een lekkende kraan in een restaurant: dit is 21% (installatiedienst), niet 9%.
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  <strong>Op facturen:</strong> Je vermeldt "BTW 9%" en het BTW-bedrag apart.
                </Typography>
                <Alert severity="info" sx={{ mt: 1 }}>
                  <Typography variant="body2">
                    <strong>Tip:</strong> Voor de meeste IT-diensten, consultancy en webdevelopment geldt het standaard tarief van 21%, niet 9%.
                  </Typography>
                </Alert>
              </Box>

              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  BTW 21% (standaard tarief)
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                  <strong>Wanneer gebruik je dit?</strong>
                </Typography>
                <Typography component="ul" variant="body1" color="text.secondary" sx={{ pl: 2, mb: 1 }}>
                  <li>Voor de meeste diensten en producten (standaard regel)</li>
                  <li>Voor IT-diensten, webdevelopment, software ontwikkeling</li>
                  <li>Voor consultancy en adviesdiensten</li>
                  <li>Voor marketing en communicatiediensten</li>
                  <li>Voor de meeste B2B diensten binnen Nederland</li>
                  <li>Voor installatiediensten (loodgieterswerk, elektriciteit, verwarming)</li>
                  <li>Voor reparatiediensten (altijd 21%, ongeacht wat je repareert)</li>
                  <li>Voor horeca-diensten zoals catering, evenementen organisatie</li>
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic", mb: 1 }}>
                  <strong>Voorbeeld IT/Web:</strong> Je bouwt een website voor een Nederlands bedrijf. Je rekent 21% BTW over je uurtarief. Het bedrijf kan deze BTW meestal terugvorderen.
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic", mb: 1 }}>
                  <strong>Voorbeeld Loodgieter:</strong> Je repareert een lekkende leiding bij een particulier of bedrijf. Dit is altijd 21% BTW, ongeacht of het een keuken, badkamer of bedrijfsruimte is.
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
                  <strong>Voorbeeld Horeca:</strong> Je organiseert een catering evenement of verzorgt een feest. De dienstverlening (catering, bediening) is 21% BTW. Het eten zelf dat je serveert is 9% BTW, maar de dienstverlening blijft 21%.
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  <strong>Op facturen:</strong> Je vermeldt "BTW 21%" en het BTW-bedrag apart. Het totaalbedrag (bruto) is het netto bedrag + 21% BTW.
                </Typography>
              </Box>

              <Box sx={{ mt: 2, p: 2, bgcolor: "action.hover", borderRadius: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Netto vs. Bruto
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                  In Kleine Koning werken we met twee begrippen:
                </Typography>
                <Typography component="ul" variant="body1" color="text.secondary" sx={{ pl: 2 }}>
                  <li><strong>Netto:</strong> Het bedrag exclusief BTW (wat je daadwerkelijk verdient)</li>
                  <li><strong>Bruto:</strong> Het bedrag inclusief BTW (wat de klant betaalt)</li>
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontStyle: "italic" }}>
                  <strong>Voorbeeld:</strong> Je uurtarief is €100 netto. Met 21% BTW wordt dit €121 bruto (€100 + €21 BTW). De klant betaalt €121, jij ontvangt €100, en €21 gaat naar de Belastingdienst.
                </Typography>
              </Box>

              <Box 
                sx={{ 
                  mt: 2, 
                  p: 2, 
                  bgcolor: mode === "dark" ? "rgba(99, 102, 241, 0.1)" : "rgba(99, 102, 241, 0.05)",
                  border: `1px solid ${mode === "dark" ? "rgba(99, 102, 241, 0.3)" : "rgba(99, 102, 241, 0.2)"}`,
                  borderRadius: 1 
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: "text.primary" }}>
                  Belangrijke waarschuwingen
                </Typography>
                <Typography component="ul" variant="body1" sx={{ pl: 2, color: "text.secondary" }}>
                  <li>Kies altijd het juiste BTW-tarief op basis van de dienst die je levert en de klant</li>
                  <li>Voor twijfelgevallen: raadpleeg een belastingadviseur of de Belastingdienst</li>
                  <li>Voor intracommunautaire leveringen: controleer altijd het EU-BTW-nummer</li>
                  <li>Houd rekening met wijzigingen in BTW-wetgeving</li>
                  <li>Kleine Koning berekent alleen de bedragen - je bent zelf verantwoordelijk voor de juiste BTW-afdracht</li>
                </Typography>
              </Box>

              <Box sx={{ mt: 2, p: 2, bgcolor: "action.hover", borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Meer informatie:</strong>{" "}
                  <Link href="https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/btw" target="_blank" rel="noopener">
                    Belastingdienst - BTW voor ondernemers
                  </Link>
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
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
