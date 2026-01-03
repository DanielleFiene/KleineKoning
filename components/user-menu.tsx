// components/user-menu.tsx
"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@mui/material";
import { Logout } from "@mui/icons-material";
import { useRouter } from "next/navigation";

export function UserMenu() {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <Button
      variant="text"
      size="small"
      onClick={handleLogout}
      startIcon={<Logout />}
    >
      Uitloggen
    </Button>
  );
}

