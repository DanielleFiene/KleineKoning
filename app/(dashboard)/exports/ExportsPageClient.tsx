/**
 * app/(dashboard)/exports/ExportsPageClient.tsx
 * 
 * Client component voor de exports pagina. Haalt data op via client-side Supabase calls
 * en rendert ExportsView. Dit voorkomt dat MUI en server logic in Edge Functions
 * terechtkomt, wat de bundle size aanzienlijk verkleint.
 */
"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { Box, CircularProgress } from "@mui/material";

const ExportsView = dynamic(() => import("@/components/exports-view").then(mod => ({ default: mod.ExportsView })));

export default function ExportsPageClient() {
  const [clients, setClients] = useState<any[]>([]);
  const [statements, setStatements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      
      // Get user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Load clients
      const { data: clientsData, error: clientsError } = await supabase
        .from("clients")
        .select("*")
        .eq("owner_user_id", user.id)
        .order("name");

      if (clientsError) {
        console.error("Error loading clients:", clientsError);
      } else {
        setClients(clientsData || []);
      }

      // Load statements
      const { data: statementsData, error: statementsError } = await supabase
        .from("statements")
        .select("*, clients(name)")
        .eq("owner_user_id", user.id)
        .order("generated_at", { ascending: false });

      if (statementsError) {
        console.error("Error loading statements:", statementsError);
      } else {
        setStatements(statementsData || []);
      }

      setLoading(false);
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return <ExportsView clients={clients} initialStatements={statements} />;
}

