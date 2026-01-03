"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Clock, Users, FolderKanban, FileText } from "lucide-react";

const menuItems = [
  {
    title: "Tijd",
    url: "/time",
    icon: Clock,
  },
  {
    title: "Klanten",
    url: "/clients",
    icon: Users,
  },
  {
    title: "Projecten",
    url: "/projects",
    icon: FolderKanban,
  },
  {
    title: "Exports",
    url: "/exports",
    icon: FileText,
  },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-4">
        <div className="flex items-center gap-3">
          <Image
            src="/KleineKoning.jpg"
            alt="KleineKoning Logo"
            width={40}
            height={40}
            className="rounded-lg object-contain"
          />
          <div className="flex flex-col">
            <span className="text-sm font-semibold">KleineKoning</span>
            <span className="text-xs text-muted-foreground">Tijdregistratie</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigatie</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.url}>
                        <Icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

