/**
 * app/(dashboard)/layout.tsx
 * 
 * Dashboard layout component met sidebar navigatie, user menu, en responsive design.
 * Bevat AppFooter component. Ondersteunt mobile sidebar toggle en dark mode.
 */
"use client";

import { SidebarProvider, SidebarInset, useSidebar } from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/sidebar-nav";
import { UserMenu } from "@/components/user-menu";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { Menu as MenuIcon } from "lucide-react";
import { ToastProvider } from "@/components/toast-provider";
import { AppFooter } from "@/components/app-footer";
import { useState, useEffect } from "react";

function SidebarToggleButton() {
  const { toggleSidebar } = useSidebar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  
  // Alleen tonen op mobile
  if (!isMobile) {
    return null;
  }
  
  return (
    <IconButton edge="start" onClick={toggleSidebar} sx={{ mr: 2 }}>
      <MenuIcon size={24} />
    </IconButton>
  );
}

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
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: mode === "dark" ? "#1e1e1e" : "#ffffff",
            color: mode === "dark" ? "#ffffff" : "inherit",
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: mode === "dark" ? "#1e1e1e" : "#ffffff",
          },
        },
      },
    },
  });
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("theme", mode);
    }
  }, [mode, mounted]);

  const theme = createAppTheme(mode);

  const toggleTheme = () => {
    setMode((prev) => (prev === "light" ? "dark" : "light"));
  };

  if (!mounted) {
    // Prevent hydration mismatch
    return null;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ToastProvider>
        <SidebarProvider defaultOpen={true}>
          <SidebarNav />
          <SidebarInset>
            <AppBar
              position="sticky"
              elevation={1}
              sx={{
                backgroundColor: mode === "dark" ? "#1e1e1e" : "#ffffff",
                color: mode === "dark" ? "#ffffff" : "text.primary",
                borderBottom: "1px solid",
                borderColor: "divider",
              }}
            >
              <Toolbar sx={{ justifyContent: "space-between", px: 3 }}>
                <SidebarToggleButton />
                <UserMenu onToggleTheme={toggleTheme} themeMode={mode} />
              </Toolbar>
            </AppBar>
            <Box
              component="main"
              sx={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                background:
                  mode === "dark"
                    ? "linear-gradient(135deg, rgba(30, 30, 30, 0.8) 0%, rgba(20, 20, 20, 0.8) 50%, rgba(30, 30, 30, 0.8) 100%)"
                    : "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(99, 102, 241, 0.1) 50%, rgba(147, 51, 234, 0.1) 100%)",
              }}
            >
              <Box sx={{ flex: 1 }}>
                {children}
              </Box>
              <AppFooter />
            </Box>
          </SidebarInset>
        </SidebarProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}