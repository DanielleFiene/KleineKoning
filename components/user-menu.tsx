/**
 * components/user-menu.tsx
 * 
 * User menu component in de header. Toont gebruikersnaam/email en logout optie.
 * Gebruikt MUI Menu component voor dropdown functionaliteit.
 */
"use client";

import { createClient } from "@/lib/supabase/client";
import { Button, IconButton, Tooltip, Box } from "@mui/material";
import { LogOut, Sun, Moon } from "lucide-react";
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
            {themeMode === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </IconButton>
        </Tooltip>
      )}
      <Button
        variant="text"
        size="small"
        onClick={handleLogout}
        startIcon={<LogOut size={18} />}
      >
        Uitloggen
      </Button>
    </Box>
  );
}

