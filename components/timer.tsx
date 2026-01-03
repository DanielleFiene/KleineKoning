// components/timer.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import {
  Paper,
  Box,
  Typography,
  Button,
  IconButton,
  Divider,
} from "@mui/material";
import {
  PlayArrow,
  Stop,
  Refresh,
  Settings,
} from "@mui/icons-material";

interface TimerSession {
  durationMinutes: number;
  clientId: string;
  projectId: string;
  description: string;
  timestamp: number;
}

interface TimerState {
  isRunning: boolean;
  startTime: number | null;
  elapsedSeconds: number;
  clientId: string | null;
  projectId: string | null;
  description: string;
  sessions: TimerSession[]; // Accumulated sessions
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
    sessions?: TimerSession[];
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
              sessions: parsed.sessions || [],
            };
          }
          return {
            ...parsed,
            sessions: parsed.sessions || [],
          };
        } catch {
          // Invalid JSON
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
      sessions: [],
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
              sessions: parsed.sessions || prev.sessions || [],
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
    
    // Calculate current session time
    const currentElapsed = timerState.startTime 
      ? Math.floor((Date.now() - timerState.startTime) / 1000)
      : 0;
    const currentMinutes = Math.floor((timerState.elapsedSeconds + currentElapsed) / 60);
    
    // Combine all sessions including current one
    const allSessions = [...(timerState.sessions || [])];
    if (currentMinutes > 0 && timerState.clientId && timerState.projectId) {
      allSessions.push({
        durationMinutes: currentMinutes,
        clientId: timerState.clientId,
        projectId: timerState.projectId,
        description: timerState.description,
        timestamp: Date.now(),
      });
    }
    
    // Reset timer but KEEP client, project, and description for next start
    setTimerState((prev) => ({
      ...prev,
      isRunning: false,
      startTime: null,
      elapsedSeconds: 0,
      sessions: [], // Clear accumulated sessions after saving
    }));

    // Pass all sessions to onStop (will be handled in stop dialog)
    if (allSessions.length > 0) {
      // For now, combine all sessions into one entry
      // The stop dialog will handle showing options
      const totalMinutes = allSessions.reduce((sum, s) => sum + s.durationMinutes, 0);
      const lastSession = allSessions[allSessions.length - 1];
      
      onStop({
        durationMinutes: totalMinutes,
        clientId: lastSession.clientId,
        projectId: lastSession.projectId,
        description: lastSession.description,
        sessions: allSessions, // Pass all sessions for later use
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
      sessions: [],
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
    <Paper elevation={1} sx={{ overflow: "hidden" }}>
      <Box
        sx={{
          background: "linear-gradient(90deg, #9333ea 0%, #ec4899 100%)",
          px: 2,
          py: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: "bold", color: "white" }}>
          Timer
        </Typography>
        {(selectedClient || selectedProject) && (
          <IconButton
            size="small"
            onClick={() => onSetup?.()}
            sx={{ color: "white", "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.2)" } }}
          >
            <Settings fontSize="small" />
          </IconButton>
        )}
      </Box>
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box sx={{ textAlign: "center", py: 1 }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: "bold",
                fontFamily: "monospace",
                mb: 1.5,
                color: timerState.isRunning ? "secondary.main" : "text.primary",
              }}
            >
              {formatTime(timerState.elapsedSeconds)}
            </Typography>
            {timerState.isRunning ? (
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 1,
                  px: 1.5,
                  py: 0.75,
                  background: "linear-gradient(90deg, rgba(147, 51, 234, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)",
                  color: "secondary.main",
                  borderRadius: "9999px",
                  fontWeight: "bold",
                  fontSize: "0.875rem",
                }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: "secondary.main",
                    animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                    "@keyframes pulse": {
                      "0%, 100%": { opacity: 1 },
                      "50%": { opacity: 0.5 },
                    },
                  }}
                />
                Timer loopt...
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Timer gestopt
              </Typography>
            )}
          </Box>

          {selectedClient && selectedProject && (
            <Paper
              elevation={0}
              sx={{
                p: 2,
                background: "linear-gradient(135deg, rgba(147, 51, 234, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)",
                border: "1px solid",
                borderColor: "secondary.light",
                borderRadius: 2,
              }}
            >
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: "medium" }}>
                    Klant:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: "bold", color: "secondary.main" }}>
                    {selectedClient.name}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: "medium" }}>
                    Project:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: "bold", color: "secondary.main" }}>
                    {selectedProject.name}
                  </Typography>
                </Box>
                {timerState.description && (
                  <>
                    <Divider sx={{ my: 0.5 }} />
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: "medium" }}>
                        Omschrijving:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: "medium", textAlign: "right", maxWidth: "60%" }}>
                        {timerState.description}
                      </Typography>
                    </Box>
                  </>
                )}
              </Box>
            </Paper>
          )}

          {(!timerState.clientId || !timerState.projectId) && !timerState.isRunning && (
            <Button
              onClick={() => onSetup?.()}
              variant="outlined"
              fullWidth
              startIcon={<Settings />}
              sx={{
                borderColor: "secondary.light",
                "&:hover": {
                  backgroundColor: "secondary.main",
                  borderColor: "secondary.main",
                  color: "white",
                  "& .MuiSvgIcon-root": {
                    color: "white",
                  },
                },
              }}
            >
              Timer instellen
            </Button>
          )}

          <Box sx={{ display: "flex", gap: 1 }}>
            {!timerState.isRunning ? (
              <Button
                onClick={handleStart}
                disabled={!timerState.clientId || !timerState.projectId}
                variant="contained"
                fullWidth
                startIcon={<PlayArrow />}
                sx={{
                  background: "linear-gradient(90deg, #9333ea 0%, #ec4899 100%)",
                  "&:hover": {
                    background: "linear-gradient(90deg, #7e22ce 0%, #db2777 100%)",
                  },
                }}
              >
                Start
              </Button>
            ) : (
              <Button
                onClick={handleStop}
                variant="contained"
                fullWidth
                startIcon={<Stop />}
                sx={{
                  background: "linear-gradient(90deg, #ef4444 0%, #e11d48 100%)",
                  "&:hover": {
                    background: "linear-gradient(90deg, #dc2626 0%, #be185d 100%)",
                  },
                }}
              >
                Stop
              </Button>
            )}
            {timerState.elapsedSeconds > 0 && (
              <Button
                onClick={handleReset}
                variant="outlined"
                startIcon={<Refresh />}
                sx={{ borderColor: "divider", "&:hover": { backgroundColor: "action.hover" } }}
              >
                Reset
              </Button>
            )}
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}