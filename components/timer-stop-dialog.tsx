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
  FormControlLabel,
  Checkbox,
  Chip,
} from "@mui/material";
import { useToast } from "@/components/toast-provider";

interface TimerSession {
  durationMinutes: number;
  clientId: string;
  projectId: string;
  description: string;
  timestamp: number;
}

interface TimerStopDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  durationMinutes: number;
  clientName: string;
  projectName: string;
  roundingRule: "none" | "nearest15" | "up15" | "down15";
  sessions?: TimerSession[];
  onSave: (data: {
    date: string;
    description: string;
    durationMinutes: number;
    saveForLater?: boolean;
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
  sessions = [],
  onSave,
}: TimerStopDialogProps) {
  const toast = useToast();
  const [date, setDate] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });
  const [description, setDescription] = useState("");
  const [saveForLater, setSaveForLater] = useState(false);

  const roundedMinutes = applyRounding(durationMinutes, roundingRule);
  const wasRounded = roundedMinutes !== durationMinutes;

  const handleSave = (forLater: boolean = false) => {
    if (!description.trim()) {
      toast.showWarning("Vul een omschrijving in");
      return;
    }

    if (description.trim().length > 75) {
      toast.showWarning("Omschrijving mag maximaal 75 karakters bevatten");
      return;
    }

    onSave({
      date,
      description: description.trim(),
      durationMinutes: roundedMinutes,
      saveForLater: forLater,
    });

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    setDate(`${year}-${month}-${day}`);
    setDescription("");
    setSaveForLater(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onClose={() => onOpenChange(false)} maxWidth="sm" fullWidth>
      <DialogTitle>Timer entry opslaan</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 2 }}>
          <Paper sx={{ p: 2, backgroundColor: "action.hover" }}>
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
              {sessions.length > 1 && (
                <Box sx={{ pt: 1, mt: 1, borderTop: 1, borderColor: "divider" }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                    {sessions.length} sessies opgeteld:
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {sessions.map((session, idx) => (
                      <Chip
                        key={idx}
                        label={`${formatDuration(session.durationMinutes)}`}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>
              )}
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
            onChange={(e) => {
              const newValue = e.target.value;
              if (newValue.length <= 75) {
                setDescription(newValue);
              } else {
                // Show warning if trying to exceed limit
                toast.showWarning("Omschrijving mag maximaal 75 karakters bevatten");
              }
            }}
            placeholder="Wat heb je gedaan?"
            fullWidth
            required
            inputProps={{ maxLength: 75 }}
            helperText={
              <Typography
                component="span"
                sx={{
                  fontWeight: description.length >= 75 ? "bold" : "normal",
                  color: description.length >= 75 ? "error.main" : "text.secondary",
                }}
              >
                {description.length}/75 karakters
              </Typography>
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSave(false);
              }
            }}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={saveForLater}
                onChange={(e) => setSaveForLater(e.target.checked)}
              />
            }
            label={
              <Box>
                <Typography variant="body2" fontWeight={500}>
                  Opslaan voor deze dag (later exporteren)
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  De entry wordt opgeslagen maar niet direct toegevoegd aan de tijdregistratie. Je kunt deze later exporteren.
                </Typography>
              </Box>
            }
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onOpenChange(false)} sx={{ color: "text.primary" }}>Annuleren</Button>
        <Button onClick={() => handleSave(true)} variant="outlined" color="secondary">
          Opslaan voor later
        </Button>
        <Button onClick={() => handleSave(false)} variant="contained">
          Direct opslaan
        </Button>
      </DialogActions>
    </Dialog>
  );
}
