/**
 * components/timer.tsx
 * 
 * Timer component voor het bijhouden van tijd. Gebruikers kunnen een timer starten/stoppen
 * voor een specifieke klant en project. De timer slaat automatisch entries op met correcte
 * datum en afronding wanneer gestopt. Ondersteunt localStorage voor persistentie.
 */
"use client";

import { useState, useEffect, useRef } from "react";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
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
  lastSaved?: number; // Timestamp when timer was last saved (prevents duplicate saves)
  ownerTabId?: string; // ID of the tab that owns/started the timer
  manuallyPaused?: boolean; // True if timer was manually paused (not by tab close)
  lastSetupUpdate?: number; // Timestamp when setup (client/project/description) was last updated
}

const TIMER_STORAGE_KEY = "kleinekoning_timer";
const TAB_ID_KEY = "kleinekoning_tab_id";

// Generate or retrieve unique tab ID
const getTabId = (): string => {
  if (typeof window === "undefined") return "";
  let tabId = sessionStorage.getItem(TAB_ID_KEY);
  if (!tabId) {
    tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem(TAB_ID_KEY, tabId);
  }
  return tabId;
};

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
  projects: Array<{ id: string; name: string; client_id?: string }>;
}) {
  const toast = useToast();
  const tabId = typeof window !== "undefined" ? getTabId() : "";
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [stopConfirmOpen, setStopConfirmOpen] = useState(false);
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

  // Check if owner tab still exists and take ownership if needed
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const checkAndTakeOwnership = () => {
      const saved = localStorage.getItem(TIMER_STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // If timer is running and has an owner that's not this tab
          if (parsed.isRunning && parsed.ownerTabId && parsed.ownerTabId !== tabId) {
            // Check if owner tab still exists by checking if we can find it in BroadcastChannel
            // If all tabs were closed, sessionStorage would be empty, so owner doesn't exist
            // Simple check: if ownerTabId doesn't match any active tab, take ownership
            // We'll use a simpler approach: if timer is running but owner tab is gone, take ownership
            // This happens when all tabs are closed and a new one opens
            
            // Use BroadcastChannel to check if owner exists
            try {
              const checkChannel = new BroadcastChannel("kleinekoning_timer");
              let ownerFound = false;
              
              // Listen briefly for any message from owner tab
              const timeout = setTimeout(() => {
                if (!ownerFound) {
                  // Owner didn't respond - assume it doesn't exist
                  console.log("[Timer] Owner tab not found, taking ownership");
                  const updatedState = {
                    ...parsed,
                    ownerTabId: tabId,
                  };
                  localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(updatedState));
                  setTimerState((prev) => ({
                    ...prev,
                    ownerTabId: tabId,
                  }));
                }
                checkChannel.close();
              }, 500);
              
              // If we receive any message, owner exists
              const handleAnyMessage = () => {
                ownerFound = true;
                clearTimeout(timeout);
              };
              
              checkChannel.addEventListener("message", handleAnyMessage);
              
              setTimeout(() => {
                checkChannel.removeEventListener("message", handleAnyMessage);
                if (!ownerFound) {
                  clearTimeout(timeout);
                }
              }, 1000);
            } catch {
              // BroadcastChannel not supported - use simpler check
              // If this is a fresh tab (no sessionStorage), owner doesn't exist
              // But we can't reliably check this, so we'll allow pause in handlePause instead
            }
          }
        } catch {
          // Ignore parse errors
        }
      }
    };
    
    // Check on mount
    checkAndTakeOwnership();
  }, [tabId]);

  // Save state to localStorage and broadcast updates
  // Skip saving if state is being reset (empty state)
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Only save if timer has meaningful state or is explicitly reset
      // If all fields are empty/null, it's a reset - remove from storage
      if (!timerState.isRunning && 
          !timerState.startTime && 
          timerState.elapsedSeconds === 0 && 
          !timerState.clientId && 
          !timerState.projectId && 
          !timerState.description && 
          timerState.sessions.length === 0) {
        // This is a reset state - remove from storage
        localStorage.removeItem(TIMER_STORAGE_KEY);
      } else {
        localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(timerState));
      }
      
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
      // This approach prevents throttling issues because we always calculate from startTime,
      // not by counting increments, so even if updates are throttled, the timer stays accurate
      const startTime = timerState.startTime; // Capture startTime in closure
      let animationFrameId: number | null = null;
      let lastUpdateTime = Date.now();
      
      const updateElapsed = () => {
        const now = Date.now();
        // Use requestAnimationFrame for smooth updates
        // Update display every ~100ms to avoid excessive re-renders
        // Note: Browser may throttle requestAnimationFrame in background tabs,
        // but timer accuracy is maintained because we calculate from startTime
        if (now - lastUpdateTime >= 100) {
          setTimerState((prev) => {
            // Only update if timer is still running and startTime matches
            if (prev.isRunning && prev.startTime === startTime && prev.startTime) {
              const elapsed = Math.floor((Date.now() - prev.startTime) / 1000);
              return {
                ...prev,
                elapsedSeconds: elapsed,
              };
            }
            return prev;
          });
          lastUpdateTime = now;
        }
        
        // Continue animation loop (may be throttled by browser in background tabs)
        if (timerState.isRunning && timerState.startTime === startTime) {
          animationFrameId = requestAnimationFrame(updateElapsed);
        }
      };
      
      // Update immediately
      updateElapsed();
      
      // Use setInterval for guaranteed updates every second
      // This ensures the timer updates even if requestAnimationFrame is throttled
      // Browser may throttle this in background tabs, but accuracy is maintained
      // because we calculate elapsed time from startTime, not by counting
      if (!intervalRef.current) {
        intervalRef.current = setInterval(() => {
          setTimerState((prev) => {
            // Only update if timer is still running and startTime matches
            if (prev.isRunning && prev.startTime === startTime && prev.startTime) {
              const elapsed = Math.floor((Date.now() - prev.startTime) / 1000);
              return {
                ...prev,
                elapsedSeconds: elapsed,
              };
            }
            return prev;
          });
        }, 1000);
      }
      
      return () => {
        if (animationFrameId !== null) {
          cancelAnimationFrame(animationFrameId);
        }
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
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
    
    // If timer was paused, resume from where it was
    // Otherwise, start fresh
    const now = Date.now();
    const pausedElapsed = timerState.elapsedSeconds;
    
    // Adjust startTime so that elapsedSeconds will be correct when we resume
    // If we have elapsed time, we need to adjust startTime to account for it
    const adjustedStartTime = pausedElapsed > 0 
      ? now - (pausedElapsed * 1000)
      : now;
    
    // This tab becomes the owner of the timer
    setTimerState((prev) => ({
      ...prev,
      isRunning: true,
      startTime: adjustedStartTime,
      ownerTabId: tabId, // Set this tab as the owner
      manuallyPaused: false, // Clear manual pause flag when starting
    }));
  };

  // Listen for custom event when timer setup is saved (same tab)
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const handleTimerSetupUpdate = (event: Event) => {
      // Get data from event detail if available (newer approach) or from localStorage (fallback)
      const customEvent = event as CustomEvent;
      const updatedData = customEvent.detail;
      
      const saved = updatedData || localStorage.getItem(TIMER_STORAGE_KEY);
      let parsed;
      
      if (updatedData) {
        // Use data directly from event (already parsed)
        parsed = updatedData;
      } else if (typeof saved === "string") {
        // Parse from localStorage string
        try {
          parsed = JSON.parse(saved);
        } catch (e) {
          console.error("[Timer] Error parsing localStorage:", e);
          return;
        }
      } else {
        return;
      }
      
      console.log("[Timer] Timer setup updated, new data:", parsed);
      
      // Always update when timer is not running, or if timer is running but we're not the owner
      setTimerState((prev) => {
        // Only skip update if this tab owns a running timer (don't interrupt running timer)
        if (prev.isRunning && prev.ownerTabId === tabId) {
          console.log("[Timer] Timer is running and we own it, not updating");
          return prev; // Don't update if this tab owns a running timer
        }
        
        // Check if this update is newer than what we have
        // If we have a lastSetupUpdate timestamp, compare it
        const prevLastUpdate = (prev as any).lastSetupUpdate || 0;
        const newLastUpdate = parsed.lastSetupUpdate || Date.now();
        
        // If new update is older than what we have, don't overwrite (unless timer is stopped)
        if (!prev.isRunning && newLastUpdate < prevLastUpdate) {
          console.log("[Timer] Update is older than current state, skipping");
          return prev;
        }
        
        // Timer is not running OR we're not the owner - safe to update
        console.log("[Timer] Updating timer state (timer not running or not owner)");
        
        // Check if client/project changed - if so, clear sessions
        const clientChanged = prev.clientId !== parsed.clientId;
        const projectChanged = prev.projectId !== parsed.projectId;
        
        console.log("[Timer] Updating timer state:", {
          clientChanged,
          projectChanged,
          newClientId: parsed.clientId,
          newProjectId: parsed.projectId,
          newDescription: parsed.description,
          currentIsRunning: prev.isRunning,
          lastSetupUpdate: newLastUpdate,
        });
        
        // Update clientId, projectId, description from parsed data
        // Always use the new values (use nullish coalescing to handle null/undefined, but keep empty strings)
        // If client or project changed, also clear sessions to prevent mixing old/new data
        return {
          ...prev,
          clientId: parsed.clientId ?? null,
          projectId: parsed.projectId ?? null,
          description: parsed.description ?? "",
          lastSetupUpdate: newLastUpdate, // Store timestamp
          // Clear sessions if client/project changed (prevents old sessions from being saved with new client/project)
          sessions: (clientChanged || projectChanged) ? [] : (parsed.sessions || prev.sessions || []),
          // Also reset elapsed time if client/project changed
          elapsedSeconds: (clientChanged || projectChanged) ? 0 : prev.elapsedSeconds,
        };
      });
    };
    
    window.addEventListener("timerSetupUpdated", handleTimerSetupUpdate as EventListener);
    return () => {
      window.removeEventListener("timerSetupUpdated", handleTimerSetupUpdate as EventListener);
    };
  }, [tabId]);

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
              // Don't overwrite if this tab is the owner and timer is running
              if (prev.isRunning && prev.ownerTabId === tabId) {
                return prev;
              }
              
              // Don't overwrite if this tab is the owner and we just paused (prevent race condition)
              if (!prev.isRunning && prev.ownerTabId === tabId && prev.manuallyPaused) {
                // Keep our local state if we're the owner and manually paused
                return prev;
              }
              
              // Don't overwrite if we just reset (empty state)
              if (!prev.isRunning && 
                  !prev.startTime && 
                  prev.elapsedSeconds === 0 && 
                  !prev.clientId && 
                  !prev.projectId && 
                  !prev.description && 
                  prev.sessions.length === 0) {
                // This is a reset state - don't overwrite it
                return prev;
              }
              
              // If timer was running in other tab, calculate elapsed time
              if (parsed.isRunning && parsed.startTime) {
                const elapsed = Math.floor((Date.now() - parsed.startTime) / 1000);
                return {
                  ...parsed,
                  elapsedSeconds: elapsed, // Calculate from startTime, don't add to old value
                  startTime: parsed.startTime,
                  ownerTabId: parsed.ownerTabId, // Preserve owner tab ID
                  sessions: parsed.sessions || [],
                };
              }
              
              // Timer is stopped, just sync state without updating elapsedSeconds
              // Also sync clientId, projectId, description when timer is stopped
              // But don't overwrite if this tab is the owner and we just paused
              if (!parsed.isRunning && parsed.ownerTabId === tabId && parsed.manuallyPaused) {
                // If we're the owner and manually paused, keep our state
                return prev;
              }
              
              return {
                ...parsed,
                elapsedSeconds: parsed.elapsedSeconds || 0, // Keep existing value
                ownerTabId: parsed.ownerTabId, // Preserve owner tab ID
                clientId: parsed.clientId || null, // Sync clientId
                projectId: parsed.projectId || null, // Sync projectId
                description: parsed.description || "", // Sync description
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
              // Don't overwrite if this tab is the owner and timer is running
              if (prev.isRunning && prev.ownerTabId === tabId) {
                return prev;
              }
              
              // Don't overwrite if this tab is the owner and we just paused (prevent race condition)
              if (!prev.isRunning && prev.ownerTabId === tabId && prev.manuallyPaused) {
                // Keep our local state if we're the owner and manually paused
                return prev;
              }
              
              // Don't overwrite if we just reset (empty state)
              if (!prev.isRunning && 
                  !prev.startTime && 
                  prev.elapsedSeconds === 0 && 
                  !prev.clientId && 
                  !prev.projectId && 
                  !prev.description && 
                  prev.sessions.length === 0) {
                // This is a reset state - don't overwrite it
                return prev;
              }
              
              if (parsed.isRunning && parsed.startTime) {
                const elapsed = Math.floor((Date.now() - parsed.startTime) / 1000);
                return {
                  ...parsed,
                  elapsedSeconds: elapsed, // Calculate from startTime, don't add to old value
                  startTime: parsed.startTime,
                  ownerTabId: parsed.ownerTabId, // Preserve owner tab ID
                  sessions: parsed.sessions || [],
                };
              }
              
              // Timer is stopped, just sync state without updating elapsedSeconds
              // Also sync clientId, projectId, description when timer is stopped
              // But don't overwrite if this tab is the owner and we just paused
              if (!parsed.isRunning && parsed.ownerTabId === tabId && parsed.manuallyPaused) {
                // If we're the owner and manually paused, keep our state
                return prev;
              }
              
              return {
                ...parsed,
                elapsedSeconds: parsed.elapsedSeconds || 0, // Keep existing value
                ownerTabId: parsed.ownerTabId, // Preserve owner tab ID
                clientId: parsed.clientId || null, // Sync clientId
                projectId: parsed.projectId || null, // Sync projectId
                description: parsed.description || "", // Sync description
                sessions: parsed.sessions || [],
              };
            });
          } catch {
            // Ignore
          }
        } else {
          // localStorage was removed - this might be a reset
          // Only sync if we're not the owner or if we didn't just reset
          setTimerState((prev) => {
            // If we're the owner and just reset, keep our state
            if (!prev.isRunning && 
                !prev.startTime && 
                prev.elapsedSeconds === 0 && 
                !prev.clientId && 
                !prev.projectId && 
                !prev.description && 
                prev.sessions.length === 0) {
              return prev; // Keep reset state
            }
            // Otherwise, sync to empty state
            return {
              isRunning: false,
              startTime: null,
              elapsedSeconds: 0,
              clientId: null,
              projectId: null,
              description: "",
              sessions: [],
              ownerTabId: undefined,
              manuallyPaused: false,
            };
          });
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
              // Don't overwrite if this tab is the owner and timer is running
              if (prev.isRunning && prev.ownerTabId === tabId) {
                return prev;
              }
              
              if (parsed.isRunning && parsed.startTime) {
                const elapsed = Math.floor((Date.now() - parsed.startTime) / 1000);
                return {
                  ...parsed,
                  elapsedSeconds: elapsed, // Calculate from startTime, don't add to old value
                  startTime: parsed.startTime,
                  ownerTabId: parsed.ownerTabId, // Preserve owner tab ID
                  sessions: parsed.sessions || prev.sessions || [],
                };
              }
              
              // Timer is stopped, just sync state without updating elapsedSeconds
              // Also sync clientId, projectId, description when timer is stopped
              return {
                ...parsed,
                elapsedSeconds: parsed.elapsedSeconds || 0, // Keep existing value
                ownerTabId: parsed.ownerTabId, // Preserve owner tab ID
                clientId: parsed.clientId || null, // Sync clientId
                projectId: parsed.projectId || null, // Sync projectId
                description: parsed.description || "", // Sync description
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
  }, [tabId]);

  // Handle tab close - pause timer if running
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Check current state from localStorage to get most up-to-date info
      const saved = localStorage.getItem(TIMER_STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Only warn if this tab owns the timer and it's running
          if (parsed.isRunning && parsed.ownerTabId === tabId) {
            // Pause the timer before the tab closes
            // Calculate current elapsed time
            const currentElapsed = parsed.startTime 
              ? Math.floor((Date.now() - parsed.startTime) / 1000)
              : parsed.elapsedSeconds || 0;
            
            // Save paused state to localStorage
            const pausedState = {
              ...parsed,
              isRunning: false, // Pause but keep elapsed time
              elapsedSeconds: currentElapsed, // Update to current elapsed time
              manuallyPaused: false, // Paused by tab close, not manually
            };
            localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(pausedState));
            
            // Standard way to show warning
            e.preventDefault();
            e.returnValue = "De timer loopt nog. Als je deze tab sluit, wordt de timer gepauzeerd en niet automatisch opgeslagen. Weet je zeker dat je wilt doorgaan?";
            return e.returnValue;
          }
        } catch {
          // Ignore parse errors
        }
      }
    };

    // Check if timer was running when page loads (user came back after closing tab)
    // Only show warning if timer was paused by beforeunload (tab close), not by manual pause
    const checkResumedTimer = () => {
      const saved = localStorage.getItem(TIMER_STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // If timer was running but is now paused, and we're the owner tab
          // Only show warning if it was NOT manually paused (i.e., paused by tab close)
          if (!parsed.isRunning && parsed.ownerTabId === tabId && parsed.elapsedSeconds > 0 && !parsed.manuallyPaused) {
            // Check if it was recently paused (within last 2 seconds)
            // This indicates the tab was just closed/reopened (beforeunload pauses it)
            const lastSaved = parsed.lastSaved || 0;
            const timeSincePause = Date.now() - lastSaved;
            
            // Only show warning if paused very recently (within 2 seconds) and has lastSaved timestamp
            // This means it was paused by beforeunload, not manually
            if (timeSincePause < 2000 && lastSaved > 0) {
              toast.showWarning(
                "De timer is gepauzeerd omdat de tab werd gesloten. Klik op 'Verder timen' om door te gaan."
              );
            }
          }
        } catch {
          // Ignore parse errors
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    
    // Check on mount if timer was paused due to tab close
    checkResumedTimer();

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [tabId, toast]);

  const handlePause = () => {
    if (!timerState.isRunning) return;
    
    // CRITICAL: Only the owner tab can pause the timer
    // But if owner doesn't exist (checked on mount), we should be the owner now
    if (timerState.ownerTabId && timerState.ownerTabId !== tabId) {
      // Double-check in localStorage - owner might have been updated by mount effect
      const saved = localStorage.getItem(TIMER_STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // If localStorage shows we're now the owner, proceed
          if (parsed.ownerTabId === tabId) {
            // We're the owner now, continue with pause
          } else if (parsed.ownerTabId && parsed.ownerTabId !== tabId) {
            // Owner still exists and it's not us
            toast.showWarning("Alleen de tab waar de timer is gestart kan deze pauzeren");
            return;
          }
        } catch {
          // Ignore parse errors
        }
      } else {
        // No saved state - shouldn't happen if timer is running
        toast.showWarning("Timer status niet gevonden");
        return;
      }
    }
    
    // Pause the timer (stop counting but keep the elapsed time)
    // CRITICAL: Stop the interval FIRST before any state updates
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Calculate current elapsed time before pausing
    const currentElapsed = timerState.startTime 
      ? Math.floor((Date.now() - timerState.startTime) / 1000)
      : timerState.elapsedSeconds;
    
    // Create paused state directly (not in setState callback to avoid race conditions)
    const pausedState = {
      ...timerState,
      isRunning: false, // Pause the timer
      elapsedSeconds: currentElapsed, // Update to current elapsed time
      manuallyPaused: true, // Mark as manually paused to prevent false warning
      // Keep startTime so we can resume from the same point
    };
    
    // Save to localStorage immediately BEFORE updating state
    if (typeof window !== "undefined") {
      localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(pausedState));
    }
    
    // Then update state - this will trigger useEffect but localStorage is already correct
    setTimerState(pausedState);
    
    toast.showSuccess("Timer gepauzeerd");
  };

  const handleSave = () => {
    // Open the save dialog
    if (!timerState.clientId) {
      toast.showWarning("Geen klant geselecteerd");
      return;
    }
    
    if (timerState.elapsedSeconds === 0) {
      toast.showWarning("Geen tijd om op te slaan");
      return;
    }
    
    setStopConfirmOpen(true);
  };

  const handleStopAndSave = () => {
    if (!timerState.clientId) {
      toast.showWarning("Geen klant geselecteerd");
      setStopConfirmOpen(false);
      return;
    }
    
    // Calculate current session time
    // elapsedSeconds already contains the full elapsed time
    const currentMinutes = Math.floor(timerState.elapsedSeconds / 60);
    
    // Get the date when timer started (use startTime if available, otherwise use current date)
    // If timer was paused, startTime might be null, so we need to track the original start time
    // For now, use current date if startTime is not available
    const startDate = timerState.startTime 
      ? new Date(timerState.startTime)
      : new Date();
    
    // Format date as YYYY-MM-DD (local date, not UTC)
    const year = startDate.getFullYear();
    const month = String(startDate.getMonth() + 1).padStart(2, "0");
    const day = String(startDate.getDate()).padStart(2, "0");
    const entryDate = `${year}-${month}-${day}`;
    
    // Filter sessions to only include those for the current client/project
    // This prevents old sessions from being saved when client/project was changed
    const currentClientId = timerState.clientId;
    const currentProjectId = timerState.projectId || "algemeen";
    const relevantSessions = (timerState.sessions || []).filter(
      (s) => s.clientId === currentClientId && s.projectId === currentProjectId
    );
    
    // Combine filtered sessions with current one
    const allSessions = [...relevantSessions];
    
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
    
    // Save original values before updating state
    const originalClientId = timerState.clientId;
    const originalProjectId = timerState.projectId;
    const originalDescription = timerState.description;
    
    // Reset timer but KEEP client, project, and description for next start
    const now = Date.now();
    setTimerState((prev) => ({
      ...prev,
      isRunning: false,
      startTime: null,
      elapsedSeconds: 0,
      // KEEP clientId, projectId, description - user can start again with same settings
      sessions: [], // Clear accumulated sessions after saving
      lastSaved: now, // Mark when timer was saved (prevents duplicate saves from other tabs)
      ownerTabId: undefined, // Clear ownership when stopped
    }));

    setStopConfirmOpen(false);

    // Always call onStop if we have sessions to save (even if 0 minutes, rounding might make it > 0)
    if (originalClientId && allSessions.length > 0) {
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
    } else if (originalClientId) {
      // Fallback: if no sessions but we have a client, still try to save
      onStop({
        durationMinutes: currentMinutes,
        clientId: originalClientId,
        projectId: originalProjectId || "algemeen",
        description: originalDescription,
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
    // Stop interval first
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    const resetState = {
      isRunning: false,
      startTime: null,
      elapsedSeconds: 0,
      clientId: null,
      projectId: null,
      description: "",
      sessions: [],
      ownerTabId: undefined,
      manuallyPaused: false,
    };
    
    // Clear localStorage first BEFORE updating state
    if (typeof window !== "undefined") {
      localStorage.removeItem(TIMER_STORAGE_KEY);
    }
    
    // Then update state - this will trigger useEffect but localStorage is already cleared
    setTimerState(resetState);
    
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
  // Handle "algemeen" project - find the "Algemeen" project for the selected client
  // If projectId is "algemeen", show "Algemeen" as the project name
  const selectedProject = timerState.projectId === "algemeen" 
    ? (timerState.clientId ? { id: "algemeen", name: "Algemeen" } : null)
    : projects.find((p) => p.id === timerState.projectId);

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
            ) : timerState.elapsedSeconds > 0 ? (
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 1,
                  px: 1.5,
                  py: 0.75,
                  background: "rgba(251, 191, 36, 0.1)",
                  color: "warning.main",
                  borderRadius: "9999px",
                  fontWeight: "bold",
                  fontSize: "0.875rem",
                }}
              >
                Timer gepauzeerd
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Timer gestopt
              </Typography>
            )}
          </Box>

          {/* Always show timer setup info if client/project/description is set */}
          {(selectedClient || selectedProject || timerState.description) && (
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
                {selectedClient && (
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: "medium" }}>
                      Klant:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: "bold", color: "secondary.main" }}>
                      {selectedClient.name}
                    </Typography>
                  </Box>
                )}
                {selectedProject && (
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: "medium" }}>
                      Project:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: "bold", color: "secondary.main" }}>
                      {selectedProject.name}
                    </Typography>
                  </Box>
                )}
                {timerState.description && (
                  <>
                    {(selectedClient || selectedProject) && <Divider sx={{ my: 0.5 }} />}
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

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Box sx={{ display: "flex", gap: 1 }}>
              {!timerState.isRunning ? (
                <>
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
                    {timerState.elapsedSeconds > 0 ? "Hervat" : "Start"}
                  </Button>
                  {timerState.elapsedSeconds > 0 && (
                    <Button
                      onClick={handleSave}
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
                      Opslaan
                    </Button>
                  )}
                </>
              ) : (
                <Button
                  onClick={handlePause}
                  variant="contained"
                  fullWidth
                  disabled={!!(timerState.isRunning && timerState.ownerTabId && timerState.ownerTabId !== tabId)}
                  startIcon={<Square size={18} />}
                  sx={{
                    background: "linear-gradient(90deg, #f59e0b 0%, #eab308 100%)",
                    "&:hover": {
                      background: "linear-gradient(90deg, #d97706 0%, #ca8a04 100%)",
                    },
                  }}
                >
                  Pauzeer
                </Button>
              )}
            </Box>
            {timerState.elapsedSeconds > 0 && (
              <Button
                onClick={handleReset}
                variant="outlined"
                fullWidth
                startIcon={<RotateCcw size={18} />}
                sx={{ borderColor: "divider", "&:hover": { backgroundColor: "action.hover" } }}
              >
                Reset
              </Button>
            )}
          </Box>
        </Box>
      </Box>

      {/* Save Dialog */}
      <Dialog
        open={stopConfirmOpen}
        onClose={() => setStopConfirmOpen(false)}
        aria-labelledby="stop-dialog-title"
        aria-describedby="stop-dialog-description"
      >
        <DialogTitle id="stop-dialog-title">
          Tijdregistratie opslaan
        </DialogTitle>
        <DialogContent>
          <Box id="stop-dialog-description">
            <DialogContentText sx={{ mb: 2 }}>
              Wil je de getimede tijd opslaan?
            </DialogContentText>
            <Paper sx={{ p: 2, backgroundColor: "action.hover", mb: 2 }}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">Getimede tijd:</Typography>
                  <Typography variant="body2" fontWeight="bold" color="secondary.main">
                    {formatTime(timerState.elapsedSeconds)}
                  </Typography>
                </Box>
                {selectedClient && (
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Klant:</Typography>
                    <Typography variant="body2" fontWeight="medium">{selectedClient.name}</Typography>
                  </Box>
                )}
                {selectedProject && (
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Project:</Typography>
                    <Typography variant="body2" fontWeight="medium">{selectedProject.name}</Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setStopConfirmOpen(false)}
            color="primary"
            variant="outlined"
          >
            Annuleren
          </Button>
          <Button
            onClick={handleStopAndSave}
            color="primary"
            variant="contained"
            startIcon={<Square size={18} />}
            autoFocus
          >
            Opslaan
          </Button>
        </DialogActions>
      </Dialog>

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