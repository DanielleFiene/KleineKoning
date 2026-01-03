// components/timer-setup-dialog.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [loading, setLoading] = useState(false);

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

    // Reset form
    setSelectedClient("");
    setSelectedProject("");
    setDescription("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Timer Instellen</DialogTitle>
          <DialogDescription>
            Selecteer klant en project om de timer te starten
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="timer-client">Klant *</Label>
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger>
                <SelectValue placeholder="Selecteer klant" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timer-project">Project *</Label>
            <Select
              value={selectedProject}
              onValueChange={setSelectedProject}
              disabled={!selectedClient}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecteer project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timer-description">Omschrijving *</Label>
            <Input
              id="timer-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Wat ga je doen?"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSave();
                }
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuleren
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            Opslaan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

