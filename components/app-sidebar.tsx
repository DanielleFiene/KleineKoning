/**
 * components/app-sidebar.tsx
 * 
 * Sidebar wrapper component voor het dashboard. Gebruikt Radix UI Sidebar primitives
 * en integreert SidebarNav voor navigatie. Ondersteunt responsive gedrag.
 */
"use client";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/sidebar-nav";

export function AppSidebar() {
  return (
    <SidebarProvider>
      <SidebarNav />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
        </header>
      </SidebarInset>
    </SidebarProvider>
  );
}

