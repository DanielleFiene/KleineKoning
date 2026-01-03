// components/timer-stop-dialog.tsx
"use client";

import { useState } from "react";

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

    setDate(new Date().toISOString().split("T")[0]);
    setDescription("");
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div>
      <div>
        <div>Timer Entry Opslaan</div>
        <div>Controleer de gegevens en sla de timer entry op</div>
      </div>
      <div>
        <div>
          <label>Klant</label>
          <div>{clientName}</div>
        </div>

        <div>
          <label>Project</label>
          <div>{projectName}</div>
        </div>

        <div>
          <label>Duur</label>
          <div>
            <div>{formatDuration(roundedMinutes)}</div>
            {wasRounded && (
              <div>
                Afgerond van {formatDuration(durationMinutes)} naar{" "}
                {formatDuration(roundedMinutes)} ({roundingRule})
              </div>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="stop-date">Datum *</label>
          <input
            id="stop-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="stop-description">Omschrijving *</label>
          <input
            id="stop-description"
            type="text"
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
      <div>
        <button onClick={() => onOpenChange(false)}>
          Annuleren
        </button>
        <button onClick={handleSave}>Opslaan</button>
      </div>
    </div>
  );
}
