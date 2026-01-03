"use client";

import { useState } from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface TimerStopDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  durationMinutes: number;
  clientName: string;
  projectName: string;
  roundingRule: "none" | "nearest15" | "up15" | "down15";
  onSave: (data: {
    date: string;
    description: string;
    durationMinutes: number;
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
  onSave,
}: TimerStopDialogProps) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");

  const roundedMinutes = applyRounding(durationMinutes, roundingRule);
  const wasRounded = roundedMinutes !== durationMinutes;

  const handleSave = () => {
    if (!description.trim()) {
      alert("Vul een omschrijving in");
      return;
    }

    onSave({
      date,
      description: description.trim(),
      durationMinutes: roundedMinutes,
    });

    // Reset
    setDate(new Date().toISOString().split("T")[0]);
    setDescription("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Timer Entry Opslaan</DialogTitle>
          <DialogDescription>
            Controleer de gegevens en sla de timer entry op
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Klant</Label>
            <div className="text-sm font-medium">{clientName}</div>
          </div>

          <div className="space-y-2">
            <Label>Project</Label>
            <div className="text-sm font-medium">{projectName}</div>
          </div>

          <div className="space-y-2">
            <Label>Duur</Label>
            <div className="space-y-1">
              <div className="text-sm font-medium">
                {formatDuration(roundedMinutes)}
              </div>
              {wasRounded && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Afgerond van {formatDuration(durationMinutes)} naar{" "}
                    {formatDuration(roundedMinutes)} ({roundingRule})
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stop-date">Datum *</Label>
            <Input
              id="stop-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stop-description">Omschrijving *</Label>
            <Input
              id="stop-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Wat heb je gedaan?"
              required
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
          <Button onClick={handleSave}>Opslaan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

