"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Image from "next/image";

function createAppTheme(mode: "light" | "dark") {
  return createTheme({
    palette: {
      mode,
      primary: {
        main: "#6366f1", // indigo-500
      },
      secondary: {
        main: "#9333ea", // purple-600
      },
      background: {
        default: mode === "dark" ? "#121212" : "#f5f5f5",
        paper: mode === "dark" ? "#1e1e1e" : "#ffffff",
      },
    },
  });
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check localStorage for saved theme preference
    const savedMode = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedMode) {
      setMode(savedMode);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setMode(prefersDark ? "dark" : "light");
    }
  }, []);

  const theme = createAppTheme(mode);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setMessage(`Fout: ${error.message}`);
    } else {
      setMessage("Check je email voor de login link!");
    }

    setLoading(false);
  };

  if (!mounted) {
    // Prevent hydration mismatch
    return null;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 3,
          background:
            mode === "dark"
              ? "linear-gradient(135deg, rgba(30, 30, 30, 0.8) 0%, rgba(20, 20, 20, 0.8) 50%, rgba(30, 30, 30, 0.8) 100%)"
              : "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(99, 102, 241, 0.1) 50%, rgba(147, 51, 234, 0.1) 100%)",
        }}
      >
        <Container maxWidth="sm">
          <Box sx={{ maxWidth: 420, mx: "auto" }}>
            {/* Brand Section */}
            <Box sx={{ mb: 5, textAlign: "center" }}>
              <Box
                sx={{
                  mb: 2,
                  display: "inline-flex",
                }}
              >
                <Image
                  src="/KleineKoning.jpg"
                  alt="KleineKoning Logo"
                  width={150}
                  height={150}
                  style={{
                    borderRadius: "16px",
                    objectFit: "cover",
                  }}
                  priority
                />
              </Box>
              <Typography
                variant="h3"
                component="h1"
                sx={{
                  mb: 1,
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                }}
              >
                Kleine Koning
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Tijdregistratie en urenstaat
              </Typography>
            </Box>

            {/* Login Card */}
            <Paper
              elevation={1}
              sx={{
                p: 5,
                borderRadius: 3,
                transition: "box-shadow 0.2s ease-in-out",
                "&:hover": {
                  boxShadow: 3,
                },
              }}
            >
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {/* Header */}
                <Box sx={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 0.5 }}>
                  <Typography
                    variant="h5"
                    component="h2"
                    sx={{
                      fontWeight: 600,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    Inloggen
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Voer je email adres in om een magic link te ontvangen
                  </Typography>
                </Box>

                {/* Form */}
                <Box component="form" onSubmit={handleMagicLink} sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                  <TextField
                    id="email"
                    type="email"
                    label="Email adres"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jouw@email.nl"
                    required
                    disabled={loading}
                    fullWidth
                    variant="outlined"
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    fullWidth
                    sx={{
                      py: 1.5,
                      fontWeight: 500,
                      textTransform: "none",
                    }}
                    startIcon={
                      loading ? (
                        <CircularProgress size={16} sx={{ color: "inherit" }} />
                      ) : null
                    }
                  >
                    {loading ? "Verzenden..." : "Stuur magic link"}
                  </Button>

                  {message && (
                    <Alert
                      severity={message.includes("Fout") ? "error" : "success"}
                      sx={{
                        borderRadius: 2,
                      }}
                    >
                      {message}
                    </Alert>
                  )}
                </Box>
              </Box>
            </Paper>

            {/* Footer */}
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                mt: 3,
                display: "block",
                textAlign: "center",
              }}
            >
              Je ontvangt een beveiligde login link in je email
            </Typography>
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
}