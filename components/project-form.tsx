// components/project-form.tsx
"use client";

import { useFormStatus } from "react-dom";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createProject, updateProject } from "@/app/actions/projects";
import { useRouter } from "next/navigation";

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
    <Button type="submit" disabled={pending}>
      {pending ? "Opslaan..." : isEdit ? "Bijwerken" : "Aanmaken"}
    </Button>
  );
}

export function ProjectForm({
  clients,
  project,
  defaultClientId,
}: ProjectFormProps) {
  const router = useRouter();
  const isEdit = !!project;

  async function formAction(formData: FormData) {
    try {
      if (isEdit && project) {
        await updateProject(project.id, formData);
      } else {
        await createProject(formData);
      }
      if (project) {
        router.push(`/clients/${project.client_id}`);
      } else {
        const clientId = formData.get("client_id") as string;
        router.push(`/clients/${clientId}`);
      }
      router.refresh();
    } catch (error) {
      alert("Fout: " + (error as Error).message);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? "Project bewerken" : "Nieuw project"}</CardTitle>
        <CardDescription>
          {isEdit
            ? "Wijzig de instellingen van dit project"
            : "Voeg een nieuw project toe aan een klant"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2 max-w-md">
            <Label htmlFor="client_id">Klant *</Label>
            <Select
              name="client_id"
              defaultValue={project?.client_id || defaultClientId || ""}
              required
              disabled={isEdit}
            >
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

          <div className="space-y-2 max-w-md">
            <Label htmlFor="name">Naam *</Label>
            <Input
              id="name"
              name="name"
              defaultValue={project?.name}
              required
              placeholder="Project naam"
            />
          </div>

          <div className="space-y-2 max-w-md">
            <Label htmlFor="rate_ex_btw">Tarief (ex BTW)</Label>
            <Input
              id="rate_ex_btw"
              name="rate_ex_btw"
              type="number"
              step="0.01"
              min="0"
              defaultValue={project?.rate_ex_btw || ""}
              placeholder="0.00"
            />
            <p className="text-xs text-muted-foreground">
              Intern tarief, niet zichtbaar in exports
            </p>
          </div>

          <div className="space-y-2 max-w-md">
            <Label htmlFor="default_unit">Standaard Unit *</Label>
            <Select
              name="default_unit"
              defaultValue={project?.default_unit || "minutes"}
              required
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minutes">Minuten</SelectItem>
                <SelectItem value="quarter">Kwartier</SelectItem>
                <SelectItem value="hour">Uur</SelectItem>
                <SelectItem value="day">Dag</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 max-w-md">
            <Label htmlFor="rounding_rule">Afrondingsregel *</Label>
            <Select
              name="rounding_rule"
              defaultValue={project?.rounding_rule || "none"}
              required
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Geen afronding</SelectItem>
                <SelectItem value="nearest15">Naar dichtstbijzijnde 15 min</SelectItem>
                <SelectItem value="up15">Naar boven afronden (15 min)</SelectItem>
                <SelectItem value="down15">Naar beneden afronden (15 min)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Wordt toegepast bij het opslaan van tijdentries
            </p>
          </div>

          <div className="flex gap-2">
            <SubmitButton isEdit={isEdit} />
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Annuleren
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

