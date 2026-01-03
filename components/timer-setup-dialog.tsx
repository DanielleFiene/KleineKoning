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
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    if (selectedClient) {
      fetch(`/api/projects?client_id=${selectedClient}`)
        .then((res) => res.json())
        .then((data) => setProjects(data))
        .catch(() => setProjects([]));
    } else {
      setProjects([]);
      setSelectedProject("");
    }
  }, [selectedClient]);

  const handleSave = () => {
    if (!selectedClient || !selectedProject || !description.trim()) {
      alert("Vul alle velden in");
      return;
    }

    onSave({
      clientId: selectedClient,
      projectId: selectedProject,
      description: description.trim(),
    });

    setSelectedClient("");
    setSelectedProject("");
    setDescription("");
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
        <Button onClick={() => onOpenChange(false)}>Annuleren</Button>
        <Button onClick={handleSave} variant="contained">Opslaan</Button>
      </DialogActions>
    </Dialog>
  );
}