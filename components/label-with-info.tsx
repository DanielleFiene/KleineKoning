"use client";

import { Box } from "@mui/material";
import { InfoIcon } from "./info-icon";

interface LabelWithInfoProps {
  label: string;
  info: string;
  required?: boolean;
}

export function LabelWithInfo({ label, info, required = false }: LabelWithInfoProps) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
      <span>
        {label}
        {required && <span style={{ color: "red" }}> *</span>}
      </span>
      <InfoIcon title={info} size="small" />
    </Box>
  );
}

