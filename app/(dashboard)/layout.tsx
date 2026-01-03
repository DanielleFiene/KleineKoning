"use client";

import { SidebarProvider, SidebarInset, useSidebar } from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/sidebar-nav";
import { UserMenu } from "@/components/user-menu";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { Box, AppBar, Toolbar, IconButton, useMediaQuery, useTheme } from "@mui/material";
import { Menu as MenuIcon } from "@mui/icons-material";

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
      <MenuIcon />
    </IconButton>
  );
}

const theme = createTheme({
  palette: {
    primary: {
      main: "#6366f1", // indigo-500
    },
    secondary: {
      main: "#9333ea", // purple-600
    },
  },
});

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SidebarProvider defaultOpen={true}>
        <SidebarNav />
        <SidebarInset>
          <AppBar
            position="sticky"
            elevation={1}
            sx={{
              backgroundColor: "white",
              color: "text.primary",
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            <Toolbar sx={{ justifyContent: "space-between", px: 3 }}>
              <SidebarToggleButton />
              <UserMenu />
            </Toolbar>
          </AppBar>
          <Box
            component="main"
            sx={{
              minHeight: "100vh",
              background: "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(99, 102, 241, 0.1) 50%, rgba(147, 51, 234, 0.1) 100%)",
            }}
          >
            {children}
          </Box>
        </SidebarInset>
      </SidebarProvider>
    </ThemeProvider>
  );
}