"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  DialogTitle,
  TextField,
  Button,
  Box,
  Paper,
  Typography,
} from "@mui/material";

interface TimerStopDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  durationMinutes: number;
  clientName: string;
  projectName: string;
  roundingRule: "none" | "nearest15" | "up15" | "down15";
  onSave: (data: {
    date: string;
    description: string;
    durationMinutes: number;
  }) => void;
}

function applyRounding(
  minutes: number,
  rule: "none" | "nearest15" | "up15" | "down15"
): number {
  switch (rule) {
    case "none":
      return minutes;
    case "nearest15":
      return Math.round(minutes / 15) * 15;
    case "up15":
      return Math.ceil(minutes / 15) * 15;
    case "down15":
      return Math.floor(minutes / 15) * 15;
    default:
      return minutes;
  }
}

const formatDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}u ${mins}min` : `${hours}u`;
};

export function TimerStopDialog({
  open,
  onOpenChange,
  durationMinutes,
  clientName,
  projectName,
  roundingRule,
  onSave,
}: TimerStopDialogProps) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");

  const roundedMinutes = applyRounding(durationMinutes, roundingRule);
  const wasRounded = roundedMinutes !== durationMinutes;

  const handleSave = () => {
    if (!description.trim()) {
      alert("Vul een omschrijving in");
      return;
    }

    onSave({
      date,
      description: description.trim(),
      durationMinutes: roundedMinutes,
    });

    setDate(new Date().toISOString().split("T")[0]);
    setDescription("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onClose={() => onOpenChange(false)} maxWidth="sm" fullWidth>
      <DialogTitle>Timer entry opslaan</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 2 }}>
          <Paper sx={{ p: 2, backgroundColor: "grey.100" }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">Klant:</Typography>
                <Typography variant="body2" fontWeight="medium">{clientName}</Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">Project:</Typography>
                <Typography variant="body2" fontWeight="medium">{projectName}</Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">Duur:</Typography>
                <Typography variant="body2" fontWeight="medium">{formatDuration(roundedMinutes)}</Typography>
              </Box>
              {wasRounded && (
                <Box sx={{ pt: 1, mt: 1, borderTop: 1, borderColor: "divider" }}>
                  <Typography variant="caption" color="text.secondary">
                    Afgerond van {formatDuration(durationMinutes)} naar {formatDuration(roundedMinutes)} ({roundingRule})
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>

          <TextField
            id="stop-date"
            label="Datum"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
            required
          />

          <TextField
            id="stop-description"
            label="Omschrijving"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Wat heb je gedaan?"
            fullWidth
            required
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSave();
              }
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onOpenChange(false)}>Annuleren</Button>
        <Button onClick={handleSave} variant="contained">Opslaan</Button>
      </DialogActions>
    </Dialog>
  );
}
