// components/timer.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Square, Clock } from "lucide-react";

interface TimerState {
  isRunning: boolean;
  startTime: number | null;
  elapsedSeconds: number;
  clientId: string | null;
  projectId: string | null;
  description: string;
}

const TIMER_STORAGE_KEY = "kleinekoning_timer";

export function Timer({
  onStop,
  onSetup,
  clients,
  projects,
}: {
  onStop: (data: {
    durationMinutes: number;
    clientId: string;
    projectId: string;
    description: string;
  }) => void;
  onSetup?: () => void;
  clients: Array<{ id: string; name: string }>;
  projects: Array<{ id: string; name: string }>;
}) {
  const [timerState, setTimerState] = useState<TimerState>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(TIMER_STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Check if timer was running and calculate elapsed time
          if (parsed.isRunning && parsed.startTime) {
            const elapsed = Math.floor((Date.now() - parsed.startTime) / 1000);
            return {
              ...parsed,
              elapsedSeconds: parsed.elapsedSeconds + elapsed,
              startTime: Date.now(), // Reset start time to now
            };
          }
          return parsed;
        } catch {
          // Invalid JSON, return default
        }
      }
    }
    return {
      isRunning: false,
      startTime: null,
      elapsedSeconds: 0,
      clientId: null,
      projectId: null,
      description: "",
    };
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(timerState));
    }
  }, [timerState]);

  // Timer tick
  useEffect(() => {
    if (timerState.isRunning) {
      intervalRef.current = setInterval(() => {
        setTimerState((prev) => ({
          ...prev,
          elapsedSeconds: prev.elapsedSeconds + 1,
        }));
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timerState.isRunning]);

  const handleStart = () => {
    if (!timerState.clientId || !timerState.projectId) {
      if (onSetup) {
        onSetup();
      } else {
        alert("Selecteer eerst een klant en project");
      }
      return;
    }
    setTimerState((prev) => ({
      ...prev,
      isRunning: true,
      startTime: Date.now(),
    }));
  };

  // Listen for storage changes (when setup dialog updates timer)
  useEffect(() => {
    const handleStorageChange = () => {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem(TIMER_STORAGE_KEY);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setTimerState((prev) => ({
              ...prev,
              clientId: parsed.clientId,
              projectId: parsed.projectId,
              description: parsed.description,
            }));
          } catch {
            // Ignore
          }
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    // Also check periodically (for same-tab updates)
    const interval = setInterval(handleStorageChange, 1000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const handleStop = () => {
    if (!timerState.isRunning) return;
    
    setTimerState((prev) => ({
      ...prev,
      isRunning: false,
      startTime: null,
    }));

    // Calculate total minutes
    const totalMinutes = Math.floor(timerState.elapsedSeconds / 60);
    
    if (totalMinutes > 0 && timerState.clientId && timerState.projectId) {
      onStop({
        durationMinutes: totalMinutes,
        clientId: timerState.clientId,
        projectId: timerState.projectId,
        description: timerState.description,
      });
    }
  };

  const handleReset = () => {
    setTimerState({
      isRunning: false,
      startTime: null,
      elapsedSeconds: 0,
      clientId: null,
      projectId: null,
      description: "",
    });
    if (typeof window !== "undefined") {
      localStorage.removeItem(TIMER_STORAGE_KEY);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const selectedClient = clients.find((c) => c.id === timerState.clientId);
  const selectedProject = projects.find((p) => p.id === timerState.projectId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Timer
        </CardTitle>
        <CardDescription>
          Start een timer voor je huidige werk
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center py-4">
          <div className="text-4xl font-mono font-bold">
            {formatTime(timerState.elapsedSeconds)}
          </div>
          <div className="text-sm text-muted-foreground mt-2">
            {timerState.isRunning ? "Timer loopt..." : "Timer gestopt"}
          </div>
        </div>

        {selectedClient && selectedProject && (
          <div className="text-sm space-y-1 p-3 bg-muted rounded-lg">
            <div>
              <span className="font-medium">Klant:</span> {selectedClient.name}
            </div>
            <div>
              <span className="font-medium">Project:</span> {selectedProject.name}
            </div>
            {timerState.description && (
              <div>
                <span className="font-medium">Omschrijving:</span> {timerState.description}
              </div>
            )}
          </div>
        )}

        {(!timerState.clientId || !timerState.projectId) && !timerState.isRunning && (
          <Button
            onClick={() => onSetup?.()}
            variant="outline"
            className="w-full"
          >
            Timer Instellen
          </Button>
        )}

        <div className="flex gap-2">
          {!timerState.isRunning ? (
            <Button
              onClick={handleStart}
              disabled={!timerState.clientId || !timerState.projectId}
              className="flex-1"
            >
              <Play className="h-4 w-4 mr-2" />
              Start
            </Button>
          ) : (
            <Button onClick={handleStop} variant="destructive" className="flex-1">
              <Square className="h-4 w-4 mr-2" />
              Stop
            </Button>
          )}
          {timerState.elapsedSeconds > 0 && (
            <Button onClick={handleReset} variant="outline">
              Reset
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

