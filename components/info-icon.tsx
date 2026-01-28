/**
 * components/info-icon.tsx
 * 
 * Herbruikbare info icon component met tooltip. Toont informatie iconen met
 * custom styling en hover effecten voor uitleg bij formuliervelden.
 */
"use client";

import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import { Info } from "lucide-react";

interface InfoIconProps {
  title: string;
  size?: "small" | "medium" | "large";
}

export function InfoIcon({ title, size = "medium" }: InfoIconProps) {
  const iconSize = size === "small" ? 16 : size === "large" ? 24 : 20;

  return (
    <Tooltip
      title={
        <Box
          component="span"
          sx={{
            fontSize: "1rem",
            lineHeight: 1.7,
            fontWeight: 400,
            display: "block",
          }}
        >
          {title}
        </Box>
      }
      arrow
      placement="top"
      componentsProps={{
        tooltip: {
          sx: {
            bgcolor: "rgba(0, 0, 0, 0.95)",
            fontSize: "1rem",
            padding: "12px 16px",
            maxWidth: "450px",
            lineHeight: 1.7,
            fontWeight: 400,
            boxShadow: "0 6px 20px rgba(0, 0, 0, 0.4)",
            border: "1px solid rgba(99, 102, 241, 0.3)",
            borderRadius: "8px",
          },
        },
        arrow: {
          sx: {
            color: "rgba(0, 0, 0, 0.95)",
            "&::before": {
              border: "1px solid rgba(99, 102, 241, 0.3)",
            },
          },
        },
      }}
    >
      <IconButton
        size="small"
        sx={{
          padding: 0.5,
          color: "primary.main",
          background: "linear-gradient(90deg, rgba(99, 102, 241, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)",
          "&:hover": {
            background: "linear-gradient(90deg, rgba(99, 102, 241, 0.2) 0%, rgba(147, 51, 234, 0.2) 100%)",
            color: "primary.dark",
            transform: "scale(1.1)",
            transition: "all 0.2s ease",
          },
          transition: "all 0.2s ease",
        }}
      >
        <Info size={iconSize} />
      </IconButton>
    </Tooltip>
  );
}

