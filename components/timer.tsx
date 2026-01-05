/**
 * components/timer.tsx
 * 
 * Timer component voor het bijhouden van tijd. Gebruikers kunnen een timer starten/stoppen
 * voor een specifieke klant en project. De timer slaat automatisch entries op met correcte
 * datum en afronding wanneer gestopt. Ondersteunt localStorage voor persistentie.
 */
"use client";

import { useState, useEffect, useRef } from "react";
import {
  Paper,
  Box,
  Typography,
  Button,
  IconButton,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import {
  Play,
  Square,
  RotateCcw,
  Settings,
} from "lucide-react";
import { useToast } from "@/components/toast-provider";

interface TimerSession {
  durationMinutes: number;
  clientId: string;
  projectId: string;
  description: string;
  timestamp: number;
  date: string; // Date when the timer session started (YYYY-MM-DD format)
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
    startDate?: string;
  }) => void;
  onSetup?: () => void;
  clients: Array<{ id: string; name: string }>;
  projects: Array<{ id: string; name: string }>;
}) {
  const toast = useToast();
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [timerState, setTimerState] = useState<TimerState>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(TIMER_STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.isRunning && parsed.startTime) {
            // Keep original startTime and calculate current elapsed time
            const elapsed = Math.floor((Date.now() - parsed.startTime) / 1000);
            return {
              ...parsed,
              elapsedSeconds: elapsed, // Calculate from original startTime
              startTime: parsed.startTime, // Keep original startTime!
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
      
      // Broadcast to other tabs using BroadcastChannel (more reliable than storage events)
      try {
        const channel = new BroadcastChannel("kleinekoning_timer");
        channel.postMessage({ type: "timer_update", state: timerState });
        channel.close();
      } catch {
        // BroadcastChannel not supported, fallback to storage event
        // Storage event is automatically fired when localStorage changes
      }
    }
  }, [timerState]);

  useEffect(() => {
    if (timerState.isRunning && timerState.startTime) {
      // Calculate elapsed time from startTime (works across tabs)
      const updateElapsed = () => {
        if (timerState.startTime) {
          const elapsed = Math.floor((Date.now() - timerState.startTime) / 1000);
          setTimerState((prev) => {
            // Only update if timer is still running and startTime matches
            if (prev.isRunning && prev.startTime === timerState.startTime) {
              return {
                ...prev,
                elapsedSeconds: elapsed,
              };
            }
            return prev;
          });
        }
      };
      
      // Update immediately
      updateElapsed();
      
      // Then update every second
      intervalRef.current = setInterval(updateElapsed, 1000);
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
  }, [timerState.isRunning, timerState.startTime]);

  const handleStart = () => {
    if (!timerState.clientId) {
      toast.showWarning("Selecteer eerst een klant");
      if (onSetup) {
        onSetup();
      }
      return;
    }
    // Project is optioneel - "Algemeen" is altijd beschikbaar
    setTimerState((prev) => ({
      ...prev,
      isRunning: true,
      startTime: Date.now(),
    }));
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Use BroadcastChannel for cross-tab communication (more reliable)
    let channel: BroadcastChannel | null = null;
    let storageInterval: NodeJS.Timeout | null = null;

    try {
      channel = new BroadcastChannel("kleinekoning_timer");
      
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === "timer_update") {
          const parsed = event.data.state;
          if (parsed) {
            // Update state from other tab, but preserve local running state
            setTimerState((prev) => {
              // Don't overwrite if timer is running locally (this tab is the active one)
              if (prev.isRunning && prev.startTime) {
                return prev;
              }
              
              // If timer was running in other tab, calculate elapsed time
              if (parsed.isRunning && parsed.startTime) {
                const elapsed = Math.floor((Date.now() - parsed.startTime) / 1000);
                return {
                  ...parsed,
                  elapsedSeconds: (parsed.elapsedSeconds || 0) + elapsed,
                  startTime: parsed.startTime,
                  sessions: parsed.sessions || [],
                };
              }
              
              return {
                ...parsed,
                sessions: parsed.sessions || [],
              };
            });
          }
        }
      };

      channel.addEventListener("message", handleMessage);

      // Fallback: also listen to storage events (for browsers without BroadcastChannel)
      const handleStorageChange = () => {
        const saved = localStorage.getItem(TIMER_STORAGE_KEY);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setTimerState((prev) => {
              // Don't overwrite if timer is running locally
              if (prev.isRunning && prev.startTime) {
                return prev;
              }
              
              if (parsed.isRunning && parsed.startTime) {
                const elapsed = Math.floor((Date.now() - parsed.startTime) / 1000);
                return {
                  ...parsed,
                  elapsedSeconds: (parsed.elapsedSeconds || 0) + elapsed,
                  startTime: parsed.startTime,
                  sessions: parsed.sessions || prev.sessions || [],
                };
              }
              
              return {
                ...parsed,
                sessions: parsed.sessions || prev.sessions || [],
              };
            });
          } catch {
            // Ignore
          }
        }
      };

      window.addEventListener("storage", handleStorageChange);
      
      // Poll localStorage as additional fallback (every 2 seconds, less aggressive)
      storageInterval = setInterval(handleStorageChange, 2000);

      return () => {
        if (channel) {
          channel.removeEventListener("message", handleMessage);
          channel.close();
        }
        window.removeEventListener("storage", handleStorageChange);
        if (storageInterval) {
          clearInterval(storageInterval);
        }
      };
    } catch {
      // BroadcastChannel not supported, use storage events only
      const handleStorageChange = () => {
        const saved = localStorage.getItem(TIMER_STORAGE_KEY);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setTimerState((prev) => {
              if (prev.isRunning && prev.startTime) {
                return prev;
              }
              
              if (parsed.isRunning && parsed.startTime) {
                const elapsed = Math.floor((Date.now() - parsed.startTime) / 1000);
                return {
                  ...parsed,
                  elapsedSeconds: (parsed.elapsedSeconds || 0) + elapsed,
                  startTime: parsed.startTime,
                  sessions: parsed.sessions || prev.sessions || [],
                };
              }
              
              return {
                ...parsed,
                sessions: parsed.sessions || prev.sessions || [],
              };
            });
          } catch {
            // Ignore
          }
        }
      };

      window.addEventListener("storage", handleStorageChange);
      storageInterval = setInterval(handleStorageChange, 2000);

      return () => {
        window.removeEventListener("storage", handleStorageChange);
        if (storageInterval) {
          clearInterval(storageInterval);
        }
      };
    }
  }, []);

  const handleStop = () => {
    if (!timerState.isRunning) return;
    
    if (!timerState.clientId) {
      toast.showWarning("Geen klant geselecteerd");
      return;
    }
    
    // Calculate current session time
    const currentElapsed = timerState.startTime 
      ? Math.floor((Date.now() - timerState.startTime) / 1000)
      : 0;
    const currentMinutes = Math.floor((timerState.elapsedSeconds + currentElapsed) / 60);
    
    // Get the date when timer started (use startTime to determine correct date)
    const startDate = timerState.startTime 
      ? new Date(timerState.startTime)
      : new Date();
    
    // Format date as YYYY-MM-DD (local date, not UTC)
    const year = startDate.getFullYear();
    const month = String(startDate.getMonth() + 1).padStart(2, "0");
    const day = String(startDate.getDate()).padStart(2, "0");
    const entryDate = `${year}-${month}-${day}`;
    
    // Combine all sessions including current one
    const allSessions = [...(timerState.sessions || [])];
    
    // Always add current session if timer was running (even if 0 minutes, for rounding)
    if (timerState.clientId) {
      allSessions.push({
        durationMinutes: currentMinutes, // Can be 0, will be rounded
        clientId: timerState.clientId,
        projectId: timerState.projectId || "algemeen",
        description: timerState.description,
        timestamp: timerState.startTime || Date.now(),
        date: entryDate, // Add date to session
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

    // Always call onStop if we have a client (even if 0 minutes, rounding might make it > 0)
    if (timerState.clientId && allSessions.length > 0) {
      // For now, combine all sessions into one entry
      const totalMinutes = allSessions.reduce((sum, s) => sum + s.durationMinutes, 0);
      const lastSession = allSessions[allSessions.length - 1];
      
      onStop({
        durationMinutes: totalMinutes,
        clientId: lastSession.clientId,
        projectId: lastSession.projectId || "algemeen",
        description: lastSession.description,
        sessions: allSessions, // Pass all sessions with dates
        startDate: entryDate, // Pass the date when timer started
      });
    } else if (timerState.clientId) {
      // Fallback: if no sessions but we have a client, still try to save
      onStop({
        durationMinutes: currentMinutes,
        clientId: timerState.clientId,
        projectId: timerState.projectId || "algemeen",
        description: timerState.description,
        sessions: [],
        startDate: entryDate,
      });
    }
  };

  const handleReset = () => {
    // Check if reset is dangerous (timer running or has time/sessions)
    const hasActiveTime = timerState.isRunning || timerState.elapsedSeconds > 0;
    const hasSessions = timerState.sessions && timerState.sessions.length > 0;
    
    if (hasActiveTime || hasSessions) {
      // Show confirmation dialog
      setResetConfirmOpen(true);
    } else {
      // Safe to reset immediately if no active time or sessions
      performReset();
    }
  };

  const performReset = () => {
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
    setResetConfirmOpen(false);
    toast.showSuccess("Timer gereset");
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
            <Settings size={18} />
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
              onClick={() => !timerState.isRunning && onSetup?.()}
              sx={{
                p: 2,
                background: "linear-gradient(135deg, rgba(147, 51, 234, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)",
                border: "1px solid",
                borderColor: "secondary.light",
                borderRadius: 2,
                cursor: timerState.isRunning ? "default" : "pointer",
                transition: "all 0.2s",
                "&:hover": timerState.isRunning ? {} : {
                  borderColor: "secondary.main",
                  background: "linear-gradient(135deg, rgba(147, 51, 234, 0.15) 0%, rgba(236, 72, 153, 0.15) 100%)",
                  transform: "translateY(-1px)",
                  boxShadow: 1,
                },
              }}
            >
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: "medium" }}>
                    Klant:
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: "bold", color: "secondary.main" }}>
                      {selectedClient.name}
                    </Typography>
                    {!timerState.isRunning && (
                      <Settings size={18} style={{ color: "inherit" }} />
                    )}
                  </Box>
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
          
          {/* Show clickable area even if no client/project selected yet */}
          {!selectedClient && !timerState.isRunning && (
            <Paper
              elevation={0}
              onClick={() => onSetup?.()}
              sx={{
                p: 2,
                background: "linear-gradient(135deg, rgba(147, 51, 234, 0.05) 0%, rgba(236, 72, 153, 0.05) 100%)",
                border: "1px dashed",
                borderColor: "divider",
                borderRadius: 2,
                cursor: "pointer",
                transition: "all 0.2s",
                "&:hover": {
                  borderColor: "secondary.main",
                  background: "linear-gradient(135deg, rgba(147, 51, 234, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)",
                },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
                <Settings size={18} style={{ color: "inherit" }} />
                <Typography variant="body2" color="text.secondary">
                  Klik om timer in te stellen
                </Typography>
              </Box>
            </Paper>
          )}

          <Box sx={{ display: "flex", gap: 1 }}>
            {!timerState.isRunning ? (
              <Button
                onClick={handleStart}
                disabled={!timerState.clientId}
                variant="contained"
                fullWidth
                startIcon={<Play size={18} />}
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
                startIcon={<Square size={18} />}
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
                startIcon={<RotateCcw size={18} />}
                sx={{ borderColor: "divider", "&:hover": { backgroundColor: "action.hover" } }}
              >
                Reset
              </Button>
            )}
          </Box>
        </Box>
      </Box>

      {/* Reset Confirmation Dialog */}
      <Dialog
        open={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        aria-labelledby="reset-dialog-title"
        aria-describedby="reset-dialog-description"
      >
        <DialogTitle id="reset-dialog-title">
          Timer resetten?
        </DialogTitle>
        <DialogContent>
          <Box id="reset-dialog-description">
            {timerState.isRunning ? (
              <>
                <DialogContentText>
                  De timer loopt nog. Als je reset, verlies je:
                </DialogContentText>
                <ul style={{ marginTop: 8, marginBottom: 8, paddingLeft: 20 }}>
                  <li>Alle getimede tijd ({formatTime(timerState.elapsedSeconds)})</li>
                  {timerState.sessions && timerState.sessions.length > 0 && (
                    <li>Alle opgebouwde sessions ({timerState.sessions.length})</li>
                  )}
                  <li>Je instellingen (klant, project, omschrijving)</li>
                </ul>
                <DialogContentText sx={{ fontWeight: "bold", mt: 1 }}>
                  Klik eerst op "Stop" om de tijd op te slaan!
                </DialogContentText>
              </>
            ) : (
              <>
                <DialogContentText>
                  Als je reset, verlies je:
                </DialogContentText>
                <ul style={{ marginTop: 8, marginBottom: 8, paddingLeft: 20 }}>
                  <li>Alle getimede tijd ({formatTime(timerState.elapsedSeconds)})</li>
                  {timerState.sessions && timerState.sessions.length > 0 && (
                    <li>Alle opgebouwde sessions ({timerState.sessions.length})</li>
                  )}
                  <li>Je instellingen (klant, project, omschrijving)</li>
                </ul>
                <DialogContentText sx={{ fontWeight: "bold", mt: 1 }}>
                  Weet je zeker dat je alles wilt wissen?
                </DialogContentText>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setResetConfirmOpen(false)} 
            color="primary"
            autoFocus
          >
            Annuleren
          </Button>
          <Button
            onClick={performReset}
            color="error"
            variant="contained"
          >
            Resetten
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}