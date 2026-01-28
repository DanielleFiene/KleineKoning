/**
 * components/label-with-info.tsx
 * 
 * Label component met geïntegreerde info icon. Combineert een label tekst met
 * een info icon voor extra uitleg bij formuliervelden.
 */
"use client";

import Box from "@mui/material/Box";
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

