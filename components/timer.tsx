// components/timer.tsx
"use client";

import { useState, useEffect, useRef } from "react";

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
          if (parsed.isRunning && parsed.startTime) {
            const elapsed = Math.floor((Date.now() - parsed.startTime) / 1000);
            return {
              ...parsed,
              elapsedSeconds: parsed.elapsedSeconds + elapsed,
              startTime: Date.now(),
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

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(timerState));
    }
  }, [timerState]);

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
    <div>
      <div>
        <div>Timer</div>
        <div>Start een timer voor je huidige werk</div>
      </div>
      <div>
        <div>
          <div>{formatTime(timerState.elapsedSeconds)}</div>
          <div>{timerState.isRunning ? "Timer loopt..." : "Timer gestopt"}</div>
        </div>

        {selectedClient && selectedProject && (
          <div>
            <div>
              <span>Klant:</span>
              <span>{selectedClient.name}</span>
            </div>
            <div>
              <span>Project:</span>
              <span>{selectedProject.name}</span>
            </div>
            {timerState.description && (
              <div>
                <span>Omschrijving:</span>
                <span>{timerState.description}</span>
              </div>
            )}
          </div>
        )}

        {(!timerState.clientId || !timerState.projectId) && !timerState.isRunning && (
          <button onClick={() => onSetup?.()}>
            Timer Instellen
          </button>
        )}

        <div>
          {!timerState.isRunning ? (
            <button
              onClick={handleStart}
              disabled={!timerState.clientId || !timerState.projectId}
            >
              Start
            </button>
          ) : (
            <button onClick={handleStop}>
              Stop
            </button>
          )}
          {timerState.elapsedSeconds > 0 && (
            <button onClick={handleReset}>
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
