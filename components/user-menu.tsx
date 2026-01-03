// components/user-menu.tsx
"use client";

import { createClient } from "@/lib/supabase/client";
import { Button, IconButton, Tooltip, Box } from "@mui/material";
import { Logout, LightMode, DarkMode } from "@mui/icons-material";
import { useRouter } from "next/navigation";

interface UserMenuProps {
  onToggleTheme?: () => void;
  themeMode?: "light" | "dark";
}

export function UserMenu({ onToggleTheme, themeMode = "light" }: UserMenuProps) {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      {onToggleTheme && (
        <Tooltip title={themeMode === "light" ? "Donker thema" : "Licht thema"}>
          <IconButton onClick={onToggleTheme} size="small" color="inherit">
            {themeMode === "light" ? <DarkMode /> : <LightMode />}
          </IconButton>
        </Tooltip>
      )}
      <Button
        variant="text"
        size="small"
        onClick={handleLogout}
        startIcon={<Logout />}
      >
        Uitloggen
      </Button>
    </Box>
  );
}

