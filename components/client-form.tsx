/**
 * components/client-form.tsx
 * 
 * Form component voor het aanmaken en bewerken van klanten. Bevat velden voor
 * naam, BTW nummer, BTW profiel (NL/EU/Buitenland), en adresgegevens.
 * Valideert input en gebruikt server actions voor opslaan.
 */
"use client";

import { useFormStatus } from "react-dom";
import { useState } from "react";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Link from "@mui/material/Link";
import { InfoIcon } from "@/components/info-icon";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast-provider";

interface ClientFormProps {
  client?: {
    id: string;
    name: string;
    rate_ex_btw?: number | null;
    btw_profile: {
      label: string;
      percentage: number;
      rule: string;
    };
  };
}

const btwProfiles = [
  { 
    label: "Geen BTW", 
    percentage: 0, 
    rule: "none",
    description: "Voor particulieren of klanten die niet BTW-plichtig zijn. Geen BTW wordt berekend of getoond."
  },
  { 
    label: "BTW 0% (verlegd/export)", 
    percentage: 0, 
    rule: "zero",
    description: "Voor internationale klanten, export of verlegde BTW. BTW-tarief is 0% maar moet wel worden vermeld op facturen."
  },
  { 
    label: "BTW 9%", 
    percentage: 9, 
    rule: "low",
    description: "Laag BTW-tarief (9%) voor bepaalde diensten zoals voedingsmiddelen, boeken, medicijnen, en openbaar vervoer."
  },
  { 
    label: "BTW 21%", 
    percentage: 21, 
    rule: "standard",
    description: "Standaard BTW-tarief (21%) voor de meeste diensten en producten."
  },
];

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

export function ClientForm({ client }: ClientFormProps) {
  const router = useRouter();
  const toast = useToast();
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
      const name = formData.get("name") as string;
      const rateExBtw = formData.get("rate_ex_btw") as string;

      const body = {
        name,
        btw_label: selectedProfile.label,
        btw_percentage: selectedProfile.percentage,
        btw_rule: selectedProfile.rule,
        rate_ex_btw: rateExBtw || null,
      };

      const url = isEdit && client 
        ? `/api/clients/${client.id}`
        : "/api/clients";
      
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Opslaan mislukt");
      }

      toast.showSuccess(isEdit ? "Klant bijgewerkt" : "Klant aangemaakt");
      router.push("/clients");
      router.refresh();
    } catch (error) {
      toast.showError("Fout: " + (error as Error).message);
    }
  }

  return (
    <Paper elevation={1} sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
        {isEdit ? "Klant bewerken" : "Nieuwe klant"}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {isEdit
          ? "Wijzig de gegevens van deze klant"
          : "Voeg een nieuwe klant toe aan je lijst"}
      </Typography>
      <Box component="form" action={formAction} sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
            <Typography variant="body2" fontWeight={500}>
              Naam <span style={{ color: "red" }}>*</span>
            </Typography>
            <InfoIcon title="De naam van de klant. Dit wordt gebruikt in alle exports en urenstaten." size="small" />
          </Box>
          <TextField
            id="name"
            name="name"
            defaultValue={client?.name}
            required
            placeholder="Klant naam"
            fullWidth
            sx={{ maxWidth: 400 }}
          />
        </Box>

        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5, flexWrap: "wrap" }}>
            <Typography variant="body2" fontWeight={500}>
              BTW Profiel
            </Typography>
            <InfoIcon title="Selecteer het BTW-profiel voor deze klant. Dit bepaalt welk BTW-percentage wordt gebruikt in berekeningen. Zie 'Meer uitleg' voor uitgebreide informatie over wanneer je welk tarief gebruikt." size="small" />
            <Link 
              href="/btw-uitleg" 
              target="_blank" 
              rel="noopener"
              sx={{ fontSize: "0.75rem", ml: 0.5 }}
            >
              (Meer uitleg)
            </Link>
          </Box>
          <FormControl fullWidth sx={{ maxWidth: { xs: "100%", sm: 400 } }}>
            <InputLabel id="btw-profile-label">BTW Profiel</InputLabel>
            <Select
              labelId="btw-profile-label"
              id="btw_profile"
              value={selectedProfileIndex.toString()}
              label="BTW Profiel"
              onChange={(e) => setSelectedProfileIndex(parseInt(e.target.value))}
            >
              {btwProfiles.map((profile, index) => (
                <MenuItem key={index} value={index.toString()} sx={{ whiteSpace: "normal", py: 1.5 }}>
                  <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 0.5 }}>
                    <Typography variant="body2" fontWeight={500}>
                      {profile.label} ({profile.percentage}%)
                    </Typography>
                    <Typography 
                      variant="caption" 
                      color="text.secondary" 
                      sx={{ 
                        fontSize: "0.7rem",
                        lineHeight: 1.4,
                        display: "block"
                      }}
                    >
                      {profile.description.split(/\.\s+/).map((sentence, idx, arr) => (
                        <span key={idx}>
                          {sentence}{idx < arr.length - 1 ? "." : ""}
                          {idx < arr.length - 1 && <br />}
                        </span>
                      ))}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <input type="hidden" name="btw_label" value={selectedProfile.label} />
        <input type="hidden" name="btw_percentage" value={selectedProfile.percentage} />
        <input type="hidden" name="btw_rule" value={selectedProfile.rule} />

        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
            <Typography variant="body2" fontWeight={500}>
              Tarief (ex BTW)
            </Typography>
            <InfoIcon title="Optioneel: handmatig tarief voor deze klant. Handig voor internationale klanten met een ander tarief. Dit is een standaard tarief dat gebruikt kan worden voor alle projecten van deze klant." size="small" />
          </Box>
          <TextField
            id="rate_ex_btw"
            name="rate_ex_btw"
            type="number"
            inputProps={{ step: "0.01", min: "0" }}
            defaultValue={client?.rate_ex_btw || ""}
            placeholder="Bijv. 75.00 voor buitenland"
            fullWidth
            sx={{ maxWidth: 400 }}
          />
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

