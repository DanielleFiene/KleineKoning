/**
 * components/project-form.tsx
 * 
 * Form component voor het aanmaken en bewerken van projecten. Bevat velden voor
 * klant selectie, naam (max 20 karakters), tarief, standaard unit en afrondingsregel.
 * Valideert input en gebruikt server actions voor opslaan.
 */
"use client";

import { useFormStatus } from "react-dom";
import { useState } from "react";
import {
  Paper,
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
} from "@mui/material";
import { InfoIcon } from "@/components/info-icon";
import { createProject, updateProject } from "@/app/actions/projects";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast-provider";

interface ProjectFormProps {
  clients: Array<{
    id: string;
    name: string;
  }>;
  project?: {
    id: string;
    client_id: string;
    name: string;
    rate_ex_btw: number | null;
    default_unit: "minutes" | "quarter" | "hour" | "day";
    rounding_rule: "none" | "nearest15" | "up15" | "down15";
  };
  defaultClientId?: string;
}

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} variant="contained">
      {pending ? (
        <>
          <CircularProgress size={16} sx={{ mr: 1 }} />
          Opslaan...
        </>
      ) : isEdit ? (
        "Bijwerken"
      ) : (
        "Aanmaken"
      )}
    </Button>
  );
}

export function ProjectForm({
  clients,
  project,
  defaultClientId,
}: ProjectFormProps) {
  const router = useRouter();
  const toast = useToast();
  const isEdit = !!project;
  const [projectName, setProjectName] = useState(project?.name || "");

  async function formAction(formData: FormData) {
    try {
      const name = formData.get("name") as string;
      if (name && name.trim().length > 20) {
        toast.showWarning("Project naam mag maximaal 20 karakters bevatten");
        return;
      }

      if (isEdit && project) {
        await updateProject(project.id, formData);
        toast.showSuccess("Project bijgewerkt");
      } else {
        await createProject(formData);
        toast.showSuccess("Project aangemaakt");
      }
      if (project) {
        router.push(`/clients/${project.client_id}`);
      } else {
        const clientId = formData.get("client_id") as string;
        router.push(`/clients/${clientId}`);
      }
      router.refresh();
    } catch (error) {
      toast.showError("Fout: " + (error as Error).message);
    }
  }

  return (
    <Paper elevation={1} sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
        {isEdit ? "Project bewerken" : "Nieuw project"}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {isEdit
          ? "Wijzig de instellingen van dit project"
          : "Voeg een nieuw project toe aan een klant"}
      </Typography>
      <Box component="form" action={formAction} sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
            <Typography variant="body2" fontWeight={500}>
              Klant <span style={{ color: "red" }}>*</span>
            </Typography>
            <InfoIcon title="Selecteer de klant waaraan dit project gekoppeld is. Dit kan niet worden gewijzigd na het aanmaken." size="small" />
          </Box>
          <FormControl fullWidth required sx={{ maxWidth: 400 }} disabled={isEdit}>
            <InputLabel id="client-id-label">Klant *</InputLabel>
            <Select
              labelId="client-id-label"
              id="client_id"
              name="client_id"
              label="Klant *"
              defaultValue={project?.client_id || defaultClientId || ""}
              required
            >
              {clients.map((client) => (
                <MenuItem key={client.id} value={client.id}>
                  {client.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
            <Typography variant="body2" fontWeight={500}>
              Naam <span style={{ color: "red" }}>*</span>
            </Typography>
            <InfoIcon title="De naam van het project. Dit wordt gebruikt in tijdregistraties en exports." size="small" />
          </Box>
          <TextField
            id="name"
            name="name"
            value={projectName}
            onChange={(e) => {
              const newValue = e.target.value;
              if (newValue.length <= 20) {
                setProjectName(newValue);
              } else {
                // Show warning if trying to exceed limit
                toast.showWarning("Project naam mag maximaal 20 karakters bevatten");
              }
            }}
            required
            placeholder="Project naam"
            fullWidth
            sx={{ maxWidth: 400 }}
            inputProps={{ maxLength: 20 }}
            helperText={
              <Typography
                component="span"
                sx={{
                  fontWeight: projectName.length >= 20 ? "bold" : "normal",
                  color: projectName.length >= 20 ? "error.main" : "text.secondary",
                }}
              >
                {projectName.length}/20 karakters
              </Typography>
            }
          />
        </Box>

        <Box sx={{ maxWidth: 400 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
            <Typography variant="body2" fontWeight={500}>
              Tarief (ex BTW)
            </Typography>
            <InfoIcon title="Optioneel: intern tarief per standaard unit. Bijvoorbeeld: als standaard unit 'uur' is en tarief €75, dan is het tarief €75 per uur. Dit wordt niet getoond in exports." size="small" />
          </Box>
          <TextField
            id="rate_ex_btw"
            name="rate_ex_btw"
            type="number"
            inputProps={{ step: "0.01", min: "0" }}
            defaultValue={project?.rate_ex_btw || ""}
            placeholder="0.00"
            fullWidth
          />
        </Box>

        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
            <Typography variant="body2" fontWeight={500}>
              Standaard Unit <span style={{ color: "red" }}>*</span>
            </Typography>
            <InfoIcon title="De standaard eenheid voor dit project. Wanneer je een tijdentry maakt voor dit project, wordt deze unit automatisch geselecteerd. Kies de unit die het meest gebruikt wordt voor dit project." size="small" />
          </Box>
          <FormControl fullWidth required sx={{ maxWidth: 400 }}>
            <InputLabel id="default-unit-label">Standaard Unit *</InputLabel>
            <Select
              labelId="default-unit-label"
              id="default_unit"
              name="default_unit"
              label="Standaard Unit *"
              defaultValue={project?.default_unit || "minutes"}
              required
            >
              <MenuItem value="minutes">Minuten</MenuItem>
              <MenuItem value="quarter">Kwartier</MenuItem>
              <MenuItem value="hour">Uur</MenuItem>
              <MenuItem value="day">Dag</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ maxWidth: 400 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
            <Typography variant="body2" fontWeight={500}>
              Afrondingsregel <span style={{ color: "red" }}>*</span>
            </Typography>
            <InfoIcon title="Hoe tijdentries worden afgerond bij het opslaan. Geen afronding: exacte tijd. Nearest15: naar dichtstbijzijnde 15 minuten. Up15: altijd naar boven naar 15 minuten. Down15: altijd naar beneden naar 15 minuten." size="small" />
          </Box>
          <FormControl fullWidth required>
            <InputLabel id="rounding-rule-label">Afrondingsregel *</InputLabel>
            <Select
              labelId="rounding-rule-label"
              id="rounding_rule"
              name="rounding_rule"
              label="Afrondingsregel *"
              defaultValue={project?.rounding_rule || "none"}
              required
            >
              <MenuItem value="none">Geen afronding</MenuItem>
              <MenuItem value="nearest15">Naar dichtstbijzijnde 15 min</MenuItem>
              <MenuItem value="up15">Naar boven afronden (15 min)</MenuItem>
              <MenuItem value="down15">Naar beneden afronden (15 min)</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ display: "flex", gap: 2 }}>
          <SubmitButton isEdit={isEdit} />
          <Button type="button" variant="outlined" onClick={() => router.back()}>
            Annuleren
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}

