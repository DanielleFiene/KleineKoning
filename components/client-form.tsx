"use client";

import { useFormStatus } from "react-dom";
import { useState } from "react";
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
import { createClient, updateClient } from "@/app/actions/clients";
import { useRouter } from "next/navigation";

interface ClientFormProps {
  client?: {
    id: string;
    name: string;
    btw_profile: {
      label: string;
      percentage: number;
      rule: string;
    };
  };
}

const btwProfiles = [
  { label: "Geen BTW", percentage: 0, rule: "none" },
  { label: "BTW 0%", percentage: 0, rule: "zero" },
  { label: "BTW 9%", percentage: 9, rule: "low" },
  { label: "BTW 21%", percentage: 21, rule: "standard" },
];

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Opslaan..." : isEdit ? "Bijwerken" : "Aanmaken"}
    </Button>
  );
}

export function ClientForm({ client }: ClientFormProps) {
  const router = useRouter();
  const isEdit = !!client;
  const initialProfileIndex = client
    ? btwProfiles.findIndex(
        (p) => p.percentage === client.btw_profile.percentage
      )
    : 0;
  const [selectedProfileIndex, setSelectedProfileIndex] = useState(
    initialProfileIndex >= 0 ? initialProfileIndex : 0
  );
  const selectedProfile = btwProfiles[selectedProfileIndex];

  async function formAction(formData: FormData) {
    try {
      // Override with selected profile values
      formData.set("btw_label", selectedProfile.label);
      formData.set("btw_percentage", selectedProfile.percentage.toString());
      formData.set("btw_rule", selectedProfile.rule);

      if (isEdit && client) {
        await updateClient(client.id, formData);
      } else {
        await createClient(formData);
      }
      router.push("/clients");
      router.refresh();
    } catch (error) {
      alert("Fout: " + (error as Error).message);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? "Klant bewerken" : "Nieuwe klant"}</CardTitle>
        <CardDescription>
          {isEdit
            ? "Wijzig de gegevens van deze klant"
            : "Voeg een nieuwe klant toe aan je lijst"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Naam *</Label>
            <Input
              id="name"
              name="name"
              defaultValue={client?.name}
              required
              placeholder="Klant naam"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="btw_profile">BTW Profiel</Label>
            <Select
              value={selectedProfileIndex.toString()}
              onValueChange={(value) => setSelectedProfileIndex(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecteer BTW profiel" />
              </SelectTrigger>
              <SelectContent>
                {btwProfiles.map((profile, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {profile.label} ({profile.percentage}%)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input
              type="hidden"
              name="btw_label"
              value={selectedProfile.label}
            />
            <input
              type="hidden"
              name="btw_percentage"
              value={selectedProfile.percentage}
            />
            <input
              type="hidden"
              name="btw_rule"
              value={selectedProfile.rule}
            />
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

