/**
 * components/timer-setup-dialog.tsx
 * 
 * Dialog component voor het instellen van timer parameters (klant, project, omschrijving).
 * Project is optioneel - "Algemeen" project wordt automatisch beschikbaar gemaakt als
 * optie. Slaat instellingen op in localStorage voor snelle hergebruik.
 */
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  DialogTitle,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Box,
} from "@mui/material";
import { useToast } from "@/components/toast-provider";

interface TimerSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Array<{ id: string; name: string }>;
  onSave: (data: {
    clientId: string;
    projectId: string;
    description: string;
  }) => void;
}

export function TimerSetupDialog({
  open,
  onOpenChange,
  clients,
  onSave,
}: TimerSetupDialogProps) {
  const toast = useToast();
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [projects, setProjects] = useState<any[]>([]);

  // Load current timer state when dialog opens
  useEffect(() => {
    if (open && typeof window !== "undefined") {
      const saved = localStorage.getItem("kleinekoning_timer");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.clientId) setSelectedClient(parsed.clientId);
          if (parsed.projectId) setSelectedProject(parsed.projectId);
          if (parsed.description) setDescription(parsed.description);
        } catch {
          // Ignore
        }
      }
    }
  }, [open]);

  useEffect(() => {
    if (selectedClient) {
      fetch(`/api/projects?client_id=${selectedClient}`)
        .then((res) => res.json())
        .then((data) => {
          // Check if "Algemeen" project exists, if not add it as an option
          const hasAlgemeen = data.some((p: any) => p.name === "Algemeen");
          if (!hasAlgemeen) {
            // Add "Algemeen" as a virtual option (will be created when needed)
            setProjects([{ id: "algemeen", name: "Algemeen", client_id: selectedClient }, ...data]);
          } else {
            setProjects(data);
          }
        })
        .catch(() => {
          // Even on error, show "Algemeen" as option
          setProjects([{ id: "algemeen", name: "Algemeen", client_id: selectedClient }]);
        });
    } else {
      setProjects([]);
      setSelectedProject("");
    }
  }, [selectedClient]);

  const handleSave = () => {
    if (!selectedClient || !description.trim()) {
      toast.showWarning("Vul klant en omschrijving in");
      return;
    }
    
    // If no project selected, use "algemeen"
    const projectId = selectedProject || "algemeen";

    onSave({
      clientId: selectedClient,
      projectId: projectId,
      description: description.trim(),
    });

    // Don't clear fields - keep them for next time so user can quickly start again!
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onClose={() => onOpenChange(false)} maxWidth="sm" fullWidth>
      <DialogTitle>Timer instellen</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 2 }}>
          <FormControl fullWidth>
            <InputLabel id="timer-client-label">Klant</InputLabel>
            <Select
              labelId="timer-client-label"
              id="timer-client"
              value={selectedClient}
              label="Klant"
              onChange={(e) => setSelectedClient(e.target.value)}
            >
              {clients.map((client) => (
                <MenuItem key={client.id} value={client.id}>
                  {client.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth disabled={!selectedClient}>
            <InputLabel id="timer-project-label">Project</InputLabel>
            <Select
              labelId="timer-project-label"
              id="timer-project"
              value={selectedProject}
              label="Project"
              onChange={(e) => setSelectedProject(e.target.value)}
            >
              {/* Only show hardcoded "Algemeen" if it doesn't already exist in projects */}
              {!projects.some((p) => p.id === "algemeen" || p.name === "Algemeen") && (
                <MenuItem value="algemeen">
                  Algemeen
                </MenuItem>
              )}
              {projects.map((project) => (
                <MenuItem key={project.id} value={project.id}>
                  {project.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            id="timer-description"
            label="Omschrijving"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Wat ga je doen?"
            fullWidth
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
        <Button onClick={() => onOpenChange(false)} sx={{ color: "text.primary" }}>Annuleren</Button>
        <Button onClick={handleSave} variant="contained">Opslaan</Button>
      </DialogActions>
    </Dialog>
  );
}