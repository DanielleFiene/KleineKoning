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
import { Box, Typography, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import { AccessTime, CloudDownload, Diversity3, Assignment } from "@mui/icons-material";

const menuItems = [
  {
    title: "Tijd",
    url: "/time",
    icon: AccessTime,
  },
  {
    title: "Export",
    url: "/exports",
    icon: CloudDownload,
  },
  {
    title: "Klanten",
    url: "/clients",
    icon: Diversity3,
  },
  {
    title: "Projecten",
    url: "/projects",
    icon: Assignment,
  },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader>
        <Box
          sx={{
            p: 2.5,
            borderBottom: "1px solid",
            borderColor: "divider",
            background: "linear-gradient(90deg, #6366f1 0%, #9333ea 100%)",
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Image
            src="/KleineKoning.jpg"
            alt="KleineKoning Logo"
            width={64}
            height={64}
            style={{
              borderRadius: "12px",
              border: "2px solid rgba(255, 255, 255, 0.3)",
              objectFit: "cover",
            }}
          />
          <Box>
            <Typography variant="body1" sx={{ fontWeight: "bold", color: "white", fontSize: "1rem" }}>
              Kleine Koning
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.9)", fontSize: "0.75rem" }}>
              Tijdregistratie
            </Typography>
          </Box>
        </Box>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            <Typography variant="overline" sx={{ px: 2, py: 1.5, fontWeight: "bold" }}>
              Navigatie
            </Typography>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.url}>
                    <Link href={item.url} style={{ textDecoration: "none", width: "100%" }}>
                      <ListItemButton
                        selected={isActive}
                        sx={{
                          mx: 1,
                          borderRadius: 1,
                          "&.Mui-selected": {
                            background: "linear-gradient(90deg, #6366f1 0%, #9333ea 100%)",
                            color: "white",
                            "&:hover": {
                              background: "linear-gradient(90deg, #4f46e5 0%, #7e22ce 100%)",
                            },
                          },
                          "&:hover": {
                            backgroundColor: isActive ? "rgba(99, 102, 241, 0.8)" : "action.hover",
                          },
                        }}
                      >
                        <ListItemIcon sx={{ color: isActive ? "white" : "inherit", minWidth: 40 }}>
                          <item.icon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={item.title} />
                      </ListItemButton>
                    </Link>
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
