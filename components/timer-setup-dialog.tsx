// components/timer-setup-dialog.tsx
"use client";

import { useState, useEffect } from "react";

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

    setSelectedClient("");
    setSelectedProject("");
    setDescription("");
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div>
      <div>
        <div>Timer Instellen</div>
        <div>Selecteer klant en project om de timer te starten</div>
      </div>
      <div>
        <div>
          <label htmlFor="timer-client">Klant *</label>
          <select
            id="timer-client"
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
          >
            <option value="">Selecteer klant</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="timer-project">Project *</label>
          <select
            id="timer-project"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            disabled={!selectedClient}
          >
            <option value="">Selecteer project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="timer-description">Omschrijving *</label>
          <input
            id="timer-description"
            type="text"
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
      <div>
        <button onClick={() => onOpenChange(false)}>
          Annuleren
        </button>
        <button onClick={handleSave} disabled={loading}>
          Opslaan
        </button>
      </div>
    </div>
  );
}
