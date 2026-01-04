/**
 * components/app-footer.tsx
 * 
 * Herbruikbare footer component voor alle pagina's. Toont copyright, links naar
 * legal pages (Privacy, Algemene Voorwaarden, Verwerkersovereenkomst), contact info,
 * en een korte disclaimer. Dynamisch jaar en dark mode support.
 */
"use client";

import { Box, Container, Typography, Link, Divider } from "@mui/material";
import { useTheme } from "@mui/material/styles";

export function AppFooter() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Box
      component="footer"
      sx={{
        mt: "auto",
        py: 4,
        borderTop: "1px solid",
        borderColor: "divider",
        backgroundColor: isDark ? "rgba(30, 30, 30, 0.95)" : "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(10px)",
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", md: "center" },
            gap: 3,
          }}
        >
          {/* Copyright */}
          <Box>
            <Typography variant="body2" color="text.secondary">
              © {new Date().getFullYear()} Kleine Koning
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Door Danielle Fiene / DF Digital
            </Typography>
          </Box>

          {/* Links */}
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: { xs: 1, sm: 3 },
              alignItems: { xs: "flex-start", sm: "center" },
            }}
          >
            <Link
              href="/privacy"
              color="text.secondary"
              underline="hover"
              sx={{
                fontSize: "0.875rem",
                "&:hover": {
                  color: "primary.main",
                },
              }}
            >
              Privacy & AVG
            </Link>
            <Link
              href="/algemene-voorwaarden"
              color="text.secondary"
              underline="hover"
              sx={{
                fontSize: "0.875rem",
                "&:hover": {
                  color: "primary.main",
                },
              }}
            >
              Algemene Voorwaarden
            </Link>
            <Link
              href="/verwerkersovereenkomst"
              color="text.secondary"
              underline="hover"
              sx={{
                fontSize: "0.875rem",
                "&:hover": {
                  color: "primary.main",
                },
              }}
            >
              Verwerkersovereenkomst
            </Link>
            <Link
              href="mailto:info@dfdigital.eu"
              color="text.secondary"
              underline="hover"
              sx={{
                fontSize: "0.875rem",
                "&:hover": {
                  color: "primary.main",
                },
              }}
            >
              Contact
            </Link>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Disclaimer text */}
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", fontSize: "0.75rem" }}>
          Kleine Koning is een tijdregistratie tool. Wij zijn alleen verantwoordelijk voor de technische beschikbaarheid van de applicatie. 
          U bent zelf verantwoordelijk voor de juistheid van uw gegevens en het voldoen aan alle toepasselijke wet- en regelgeving.
        </Typography>
      </Container>
    </Box>
  );
}

