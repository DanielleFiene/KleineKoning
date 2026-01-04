/**
 * app/api/pdf/expired/page.tsx
 * 
 * Error page die wordt getoond wanneer een PDF signed URL is verlopen (na 7 dagen).
 * Toont een duidelijke foutmelding met uitleg en acties (inloggen, naar dashboard).
 */
"use client";

import { Box, Container, Typography, Button, Paper } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

export default function ExpiredLinkPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 3,
        background:
          isDark
            ? "linear-gradient(135deg, rgba(30, 30, 30, 0.8) 0%, rgba(20, 20, 20, 0.8) 50%, rgba(30, 30, 30, 0.8) 100%)"
            : "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(99, 102, 241, 0.1) 50%, rgba(147, 51, 234, 0.1) 100%)",
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={3}
          sx={{
            p: 4,
            textAlign: "center",
            backgroundColor: isDark ? "rgba(30, 30, 30, 0.95)" : "rgba(255, 255, 255, 0.95)",
          }}
        >
          <AlertCircle
            size={64}
            style={{
              color: theme.palette.error.main,
              marginBottom: 16,
            }}
          />
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
            Link is verlopen
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Deze PDF link is niet meer geldig. Links zijn 7 dagen geldig om de veiligheid te waarborgen.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Neem contact op met de verzender om een nieuwe link te ontvangen, of log in om de PDF direct te downloaden.
          </Typography>
          <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
            <Button
              component={Link}
              href="/login"
              variant="contained"
              sx={{
                background: "linear-gradient(90deg, #9333ea 0%, #ec4899 100%)",
                "&:hover": {
                  background: "linear-gradient(90deg, #7e22ce 0%, #db2777 100%)",
                },
              }}
            >
              Inloggen
            </Button>
            <Button
              component={Link}
              href="/time"
              variant="outlined"
            >
              Naar Dashboard
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
