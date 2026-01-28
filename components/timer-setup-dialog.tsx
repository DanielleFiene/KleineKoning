/**
 * components/timer-setup-dialog.tsx
 * 
 * Dialog component voor het instellen van timer parameters (klant, project, omschrijving).
 * Project is optioneel - "Algemeen" project wordt automatisch beschikbaar gemaakt als
 * optie. Slaat instellingen op in localStorage voor snelle hergebruik.
 */
"use client";

import { useState, useEffect } from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
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
          // Don't set projectId here - wait until projects are loaded
          // It will be set in the projects loading effect if valid
          if (parsed.description) setDescription(parsed.description);
        } catch {
          // Ignore
        }
      }
    } else {
      // Reset when dialog closes
      setSelectedClient("");
      setSelectedProject("");
      setDescription("");
      setProjects([]);
    }
  }, [open]);

  useEffect(() => {
    if (selectedClient) {
      console.log("[TimerSetupDialog] Fetching projects for client:", selectedClient);
      fetch(`/api/projects?client_id=${selectedClient}`)
        .then(async (res) => {
          console.log("[TimerSetupDialog] Response status:", res.status, res.ok);
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            console.error("[TimerSetupDialog] HTTP error:", errorData);
            throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          console.log("[TimerSetupDialog] Received data:", data);
          
          // Handle error response from API
          if (data && data.error) {
            console.error("[TimerSetupDialog] API error:", data.error);
            // Even on error, show "Algemeen" as option
            setProjects([{ id: "algemeen", name: "Algemeen", client_id: selectedClient }]);
            return;
          }
          
          // Ensure data is an array
          if (!Array.isArray(data)) {
            console.error("[TimerSetupDialog] Invalid response format (not an array):", data);
            // Even on invalid response, show "Algemeen" as option
            setProjects([{ id: "algemeen", name: "Algemeen", client_id: selectedClient }]);
            return;
          }
          
          console.log("[TimerSetupDialog] Projects array length:", data.length);
          
          // Check if "Algemeen" project exists (by name or by id)
          const hasAlgemeen = data.some((p: any) => p.name === "Algemeen" || p.id === "algemeen");
          let finalProjects: any[];
          if (!hasAlgemeen) {
            // Add "Algemeen" as a virtual option (will be created when needed)
            // Add it to the array so it appears in the dropdown
            finalProjects = [{ id: "algemeen", name: "Algemeen", client_id: selectedClient }, ...data];
          } else {
            // "Algemeen" already exists in database, just use the data as-is
            // Filter out any duplicate entries (by id) to be safe
            // This removes duplicates while keeping all unique projects
            finalProjects = data.filter((p: any, index: number, self: any[]) => 
              index === self.findIndex((p2: any) => p2.id === p.id)
            );
          }
          
          console.log("[TimerSetupDialog] Final projects:", finalProjects);
          setProjects(finalProjects);
          
          // Now validate and set selectedProject from localStorage if it exists in the loaded projects
          if (typeof window !== "undefined") {
            const saved = localStorage.getItem("kleinekoning_timer");
            if (saved) {
              try {
                const parsed = JSON.parse(saved);
                // Only set projectId if it matches the selected client and exists in the projects list
                if (parsed.clientId === selectedClient && parsed.projectId) {
                  const projectExists = finalProjects.some((p: any) => p.id === parsed.projectId);
                  if (projectExists) {
                    console.log("[TimerSetupDialog] Setting selectedProject from localStorage:", parsed.projectId);
                    setSelectedProject(parsed.projectId);
                  } else {
                    // Project doesn't exist or doesn't belong to this client, reset it
                    console.log("[TimerSetupDialog] Project from localStorage not found, resetting");
                    setSelectedProject("");
                  }
                } else {
                  // Client changed or no projectId, reset it
                  console.log("[TimerSetupDialog] Client changed or no projectId, resetting");
                  setSelectedProject("");
                }
              } catch (e) {
                console.error("[TimerSetupDialog] Error parsing localStorage:", e);
              }
            }
          }
        })
        .catch((error) => {
          console.error("[TimerSetupDialog] Error fetching projects:", error);
          // Even on error, show "Algemeen" as option
          setProjects([{ id: "algemeen", name: "Algemeen", client_id: selectedClient }]);
        });
    } else {
      console.log("[TimerSetupDialog] No client selected, clearing projects");
      setProjects([]);
      setSelectedProject("");
    }
  }, [selectedClient]);

  const handleSave = () => {
    if (!selectedClient || !description.trim()) {
      toast.showWarning("Vul klant en omschrijving in");
      return;
    }
    
    if (description.trim().length > 75) {
      toast.showWarning("Omschrijving mag maximaal 75 karakters bevatten");
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
              value={selectedProject || ""}
              label="Project"
              onChange={(e) => {
                console.log("[TimerSetupDialog] Project selected:", e.target.value);
                setSelectedProject(e.target.value);
              }}
            >
              {projects.length === 0 ? (
                <MenuItem value="" disabled>
                  Geen projecten beschikbaar
                </MenuItem>
              ) : (
                projects.map((project) => {
                  console.log("[TimerSetupDialog] Rendering project:", project.id, project.name);
                  return (
                    <MenuItem key={project.id} value={project.id}>
                      {project.name}
                    </MenuItem>
                  );
                })
              )}
            </Select>
          </FormControl>

          <TextField
            id="timer-description"
            label="Omschrijving"
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
            placeholder="Wat ga je doen?"
            fullWidth
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