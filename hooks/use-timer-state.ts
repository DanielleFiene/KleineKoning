/**
 * hooks/use-timer-state.ts
 * 
 * Custom hook voor timer state management met localStorage persistentie
 * en cross-tab synchronisatie.
 */
"use client";

import { useState, useEffect, useRef } from "react";

export interface TimerSession {
  durationMinutes: number;
  clientId: string;
  projectId: string;
  description: string;
  timestamp: number;
  date: string; // Date when the timer session started (YYYY-MM-DD format)
}

export interface TimerState {
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
}

const TIMER_STORAGE_KEY = "kleinekoning_timer";
const TAB_ID_KEY = "kleinekoning_tab_id";

// Generate or retrieve unique tab ID
export const getTabId = (): string => {
  if (typeof window === "undefined") return "";
  let tabId = sessionStorage.getItem(TAB_ID_KEY);
  if (!tabId) {
    tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem(TAB_ID_KEY, tabId);
  }
  return tabId;
};

const getInitialState = (): TimerState => {
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
};

export function useTimerState() {
  const tabId = typeof window !== "undefined" ? getTabId() : "";
  const [timerState, setTimerState] = useState<TimerState>(getInitialState);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);

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

  // Update elapsed time when timer is running
  useEffect(() => {
    if (timerState.isRunning && timerState.startTime) {
      // Calculate elapsed time from startTime (works across tabs)
      const startTime = timerState.startTime; // Capture startTime in closure
      let lastUpdateTime = Date.now();
      
      const updateElapsed = () => {
        const now = Date.now();
        // Use requestAnimationFrame for smooth updates and prevent throttling
        // But only update the display every ~100ms to avoid excessive re-renders
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
        
        // Continue animation loop
        if (timerState.isRunning && timerState.startTime === startTime) {
          animationFrameRef.current = requestAnimationFrame(updateElapsed);
        }
      };
      
      // Update immediately
      updateElapsed();
      
      // Also use setInterval as fallback for accuracy (every second)
      // Only set interval if we don't already have one (prevent duplicate intervals)
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
        if (animationFrameRef.current !== null) {
          cancelAnimationFrame(animationFrameRef.current);
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
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [timerState.isRunning, timerState.startTime]);

  return { timerState, setTimerState, tabId, intervalRef };
}
