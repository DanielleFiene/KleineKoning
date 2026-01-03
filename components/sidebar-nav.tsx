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
import { AccessTime, Description, People, Folder } from "@mui/icons-material";

const menuItems = [
  {
    title: "Tijd",
    url: "/time",
    icon: AccessTime,
  },
  {
    title: "Export",
    url: "/exports",
    icon: Description,
  },
  {
    title: "Klanten",
    url: "/clients",
    icon: People,
  },
  {
    title: "Projecten",
    url: "/projects",
    icon: Folder,
  },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader>
        <Box
          sx={{
            p: 2,
            borderBottom: "1px solid",
            borderColor: "divider",
            background: "linear-gradient(90deg, #6366f1 0%, #9333ea 100%)",
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <Image
            src="/KleineKoning.jpg"
            alt="KleineKoning Logo"
            width={40}
            height={40}
            style={{
              borderRadius: "8px",
              border: "2px solid rgba(255, 255, 255, 0.2)",
            }}
          />
          <Box>
            <Typography variant="body2" sx={{ fontWeight: "bold", color: "white" }}>
              KleineKoning
            </Typography>
            <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.9)" }}>
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
                    <ListItemButton
                      component={Link}
                      href={item.url}
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
