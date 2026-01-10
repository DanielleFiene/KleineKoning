/**
 * components/time-entries-view.tsx
 * 
 * Hoofdcomponent voor het weergeven en beheren van tijdentries. Toont weekoverzicht
 * met filter opties (klant, project, zoekquery). Integreert timer component en
 * ondersteunt bulk delete. Verbergt dagen zonder entries bij filtering.
 */
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, startOfWeek, addWeeks, subWeeks, eachDayOfInterval, endOfWeek, isSameWeek } from "date-fns";
import { nl } from "date-fns/locale";
import { getTodayString, getTodayDate, getCurrentWeekMonday, parseDateString } from "@/lib/utils/date";
import { Timer } from "@/components/timer";
import { TimerSetupDialog } from "@/components/timer-setup-dialog";
import { InfoIcon } from "@/components/info-icon";
import { useToast } from "@/components/toast-provider";
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  useTheme,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
  Checkbox,
} from "@mui/material";
import { ChevronLeft, ChevronRight, Plus, Trash2, Copy, Search, Edit, Calendar, Info } from "lucide-react";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

interface TimeEntry {
  id: string;
  date: string;
  description: string;
  duration_minutes: number;
  client_id?: string;
  project_id?: string;
  clients: { name: string; id?: string };
  projects: { name: string; rounding_rule: string; id?: string };
}

interface Client {
  id: string;
  name: string;
}

export function TimeEntriesView({
  initialEntries,
  clients,
  weekStart,
}: {
  initialEntries: any[];
  clients: Client[];
  weekStart: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const theme = useTheme();
  const [entries, setEntries] = useState<TimeEntry[]>(initialEntries);
  const [filterClient, setFilterClient] = useState<string>("all");
  const [filterProject, setFilterProject] = useState<string>("all");
  const [projects, setProjects] = useState<any[]>([]);
  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  
  // Entry form state
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [date, setDate] = useState(getTodayString());
  const [description, setDescription] = useState("");
  const [durationValue, setDurationValue] = useState("");
  const [durationUnit, setDurationUnit] = useState("minutes");
  const [loading, setLoading] = useState(false);
  
  // Timer state
  const [timerSetupOpen, setTimerSetupOpen] = useState(false);
  const [allProjects, setAllProjects] = useState<any[]>([]);

  // Parse weekStart string (yyyy-MM-dd) to Date object without timezone issues
  const weekStartDate = parseDateString(weekStart);
  const currentWeek = startOfWeek(weekStartDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({
    start: currentWeek,
    end: endOfWeek(currentWeek, { weekStartsOn: 1 }),
  });
  
  // Initialize week state

  // Ensure DatePicker always shows the correct date when weekStart changes
  useEffect(() => {
    setEntries(initialEntries);
  }, [initialEntries, weekStart]);

  useEffect(() => {
    const clientId = searchParams.get("client_id");
    const projectId = searchParams.get("project_id");
    
    if (clientId) {
      setFilterClient(clientId);
      // Load projects for this client
      fetch(`/api/projects?client_id=${clientId}`)
        .then((res) => res.json())
        .then((projs) => {
          setProjects(projs);
          if (projectId) {
            setFilterProject(projectId);
          } else {
            setFilterProject("all");
          }
        })
        .catch(() => {
          setProjects([]);
          setFilterProject("all");
        });
    } else {
      setFilterClient("all");
      setProjects([]);
      setFilterProject("all");
    }
  }, [searchParams]);

  useEffect(() => {
    const loadAllProjects = async () => {
      const allProjs: any[] = [];
      for (const client of clients) {
        try {
          const response = await fetch(`/api/projects?client_id=${client.id}`);
          const projs = await response.json();
          allProjs.push(...projs);
        } catch (error) {
          console.error(`Error loading projects for client ${client.id}:`, error);
        }
      }
      setAllProjects(allProjs);
    };
    loadAllProjects();
  }, [clients]);

  const handleFilterClientChange = async (clientId: string) => {
    setFilterClient(clientId);
    setFilterProject("all");
    if (clientId && clientId !== "all") {
      try {
        const response = await fetch(`/api/projects?client_id=${clientId}`);
        const projs = await response.json();
        setProjects(projs);
      } catch (error) {
        console.error("Error fetching projects:", error);
        setProjects([]);
      }
    } else {
      setProjects([]);
    }
    const params = new URLSearchParams();
    params.set("week", format(currentWeek, "yyyy-MM-dd"));
    if (clientId && clientId !== "all") params.set("client_id", clientId);
    router.push(`/time?${params.toString()}`);
    // No scrolling - entries are filtered and hidden automatically via filteredEntries
  };

  const handleFilterProjectChange = (projectId: string) => {
    setFilterProject(projectId);
    const params = new URLSearchParams();
    params.set("week", format(currentWeek, "yyyy-MM-dd"));
    if (filterClient && filterClient !== "all") params.set("client_id", filterClient);
    if (projectId && projectId !== "all") params.set("project_id", projectId);
    router.push(`/time?${params.toString()}`);
    // No scrolling - entries are filtered and hidden automatically via filteredEntries
  };

  const handleClientChange = async (clientId: string) => {
    setSelectedClient(clientId);
    setSelectedProject("");
    setDurationUnit("minutes"); // Reset to default when client changes
    if (clientId) {
      try {
        const response = await fetch(`/api/projects?client_id=${clientId}`);
        const projs = await response.json();
        setProjects(projs);
        // Also update allProjects for default_unit lookup
        setAllProjects((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const newProjects = projs.filter((p: any) => !existingIds.has(p.id));
          return [...prev, ...newProjects];
        });
      } catch (error) {
        console.error("Error fetching projects:", error);
        setProjects([]);
      }
    } else {
      setProjects([]);
    }
  };

  const handleEdit = async (entry: TimeEntry) => {
    setEditingEntry(entry);
    setSelectedClient(entry.client_id || "");
    setDate(entry.date.split("T")[0]);
    setDescription(entry.description);
    setDurationValue(entry.duration_minutes.toString());
    setDurationUnit("minutes");
    
    // Load projects for the client first, then set the project
    if (entry.client_id) {
      try {
        const response = await fetch(`/api/projects?client_id=${entry.client_id}`);
        const projs = await response.json();
        setProjects(projs);
        // Also update allProjects for default_unit lookup
        setAllProjects((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const newProjects = projs.filter((p: any) => !existingIds.has(p.id));
          return [...prev, ...newProjects];
        });
        // Now set the project after projects are loaded
        setSelectedProject(entry.project_id || "");
      } catch (error) {
        console.error("Error fetching projects:", error);
        setProjects([]);
        setSelectedProject(entry.project_id || "");
      }
    } else {
      setSelectedProject(entry.project_id || "");
    }
    
    setEntryModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !selectedProject || !durationValue) {
      toast.showWarning("Vul alle velden in");
      return;
    }

    if (description.trim().length > 75) {
      toast.showWarning("Omschrijving mag maximaal 75 karakters bevatten");
      return;
    }

    setLoading(true);
    try {
      if (editingEntry) {
        // Update existing entry
        const res = await fetch(`/api/time-entries/${editingEntry.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client_id: selectedClient,
            project_id: selectedProject,
            date: date,
            description: description,
            duration_value: parseFloat(durationValue),
            duration_unit: durationUnit,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Bijwerken mislukt");
        }
        
        const responseData = await res.json();
        const updatedEntry = responseData.entry;
        
        // Update entry in local state
        setEntries((prevEntries) =>
          prevEntries.map((e) =>
            e.id === editingEntry.id
              ? {
                  ...updatedEntry,
                  clients: updatedEntry.clients || { name: "" },
                  projects: updatedEntry.projects || { name: "", rounding_rule: "none" },
                }
              : e
          )
        );
        
        toast.showSuccess("Tijdentry bijgewerkt");
      } else {
        // Create new entry
        const res = await fetch("/api/time-entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client_id: selectedClient,
            project_id: selectedProject,
            date: date,
            description: description,
            duration_value: parseFloat(durationValue),
            duration_unit: durationUnit,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Opslaan mislukt");
        }
        
        const responseData = await res.json();
        const newEntry = responseData.entry;
        
        // Check if the saved date is in the current week
        const savedDate = parseDateString(date);
        const savedDateWeekStart = startOfWeek(savedDate, { weekStartsOn: 1 });
        const isInCurrentWeek = isSameWeek(savedDateWeekStart, currentWeek, { weekStartsOn: 1 });
        
        if (isInCurrentWeek) {
          // Entry is in current week: add it locally to avoid refresh
          // The API response already includes clients and projects relations
          const entryWithRelations: TimeEntry = {
            ...newEntry,
            clients: newEntry.clients || { name: "" },
            projects: newEntry.projects || { name: "", rounding_rule: "none" },
          };
          
          // Add new entry to the list (sorted by date, then created_at)
          setEntries((prevEntries) => {
            const updated = [...prevEntries, entryWithRelations];
            // Sort by date descending, then by created_at descending
            return updated.sort((a, b) => {
              if (a.date !== b.date) {
                return b.date.localeCompare(a.date);
              }
              return (b as any).created_at?.localeCompare((a as any).created_at) || 0;
            });
          });
          
          toast.showSuccess("Tijdentry opgeslagen");
        } else {
          // Entry is in different week: navigate to that week
          const params = new URLSearchParams();
          const year = savedDateWeekStart.getFullYear();
          const month = String(savedDateWeekStart.getMonth() + 1).padStart(2, "0");
          const day = String(savedDateWeekStart.getDate()).padStart(2, "0");
          params.set("week", `${year}-${month}-${day}`);
          if (filterClient && filterClient !== "all") params.set("client_id", filterClient);
          if (filterProject && filterProject !== "all") params.set("project_id", filterProject);
          router.push(`/time?${params.toString()}`);
          
          toast.showSuccess("Tijdentry opgeslagen");
        }
      }
      
      // Reset form
      setDescription("");
      setDurationValue("");
      setSelectedProject("");
      setSelectedClient("");
      setEditingEntry(null);
      setEntryModalOpen(false);
    } catch (error) {
      toast.showError("Fout: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setEntryToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!entryToDelete) return;
    try {
      const res = await fetch(`/api/time-entries/${entryToDelete}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Verwijderen mislukt");
      }

      setEntries(entries.filter((e) => e.id !== entryToDelete));
      setDeleteConfirmOpen(false);
      setEntryToDelete(null);
      toast.showSuccess("Tijdentry verwijderd");
      router.refresh();
    } catch (error) {
      toast.showError("Fout: " + (error as Error).message);
      setDeleteConfirmOpen(false);
      setEntryToDelete(null);
    }
  };

  const handleSelectEntry = (entryId: string) => {
    setSelectedEntries((prev) => {
      const next = new Set(prev);
      if (next.has(entryId)) {
        next.delete(entryId);
      } else {
        next.add(entryId);
      }
      return next;
    });
  };

  const handleSelectAllEntries = () => {
    if (selectedEntries.size === filteredEntries.length) {
      setSelectedEntries(new Set());
    } else {
      setSelectedEntries(new Set(filteredEntries.map((e) => e.id)));
    }
  };

  const handleBulkDeleteEntries = async () => {
    if (selectedEntries.size === 0) return;
    const message = `Weet je zeker dat je ${selectedEntries.size} entry(s) wilt verwijderen?\n\n⚠️ Let op: Deze actie kan niet ongedaan worden gemaakt. Controleer of je voldoet aan de bewaarplicht voor administratieve gegevens (minimaal 7 jaar voor de belastingdienst). Zorg voor een backup voordat je verwijdert.`;
    if (!confirm(message)) {
      return;
    }
    try {
      await Promise.all(
        Array.from(selectedEntries).map(async (id) => {
          const res = await fetch(`/api/time-entries/${id}`, {
            method: "DELETE",
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || "Verwijderen mislukt");
          }
        })
      );
      setEntries(entries.filter((e) => !selectedEntries.has(e.id)));
      const count = selectedEntries.size;
      setSelectedEntries(new Set());
      toast.showSuccess(`${count} entry(s) verwijderd`);
      router.refresh();
    } catch (error) {
      toast.showError("Fout bij verwijderen: " + (error as Error).message);
    }
  };

  const handleDuplicate = async (entry: TimeEntry) => {
    try {
      const formData = new FormData();
      const clientId = entry.client_id || (entry.clients as any).id || "";
      const projectId = entry.project_id || (entry.projects as any).id || "";
      
      if (!clientId || !projectId) {
        toast.showWarning("Kan entry niet dupliceren: client of project ID ontbreekt");
        return;
      }
      
      formData.set("client_id", clientId);
      formData.set("project_id", projectId);
      formData.set("date", entry.date.split("T")[0]);
      formData.set("description", entry.description);
      const res = await fetch("/api/time-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          project_id: projectId,
          date: entry.date,
          description: entry.description,
          duration_value: entry.duration_minutes,
          duration_unit: "minutes",
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Dupliceren mislukt");
      }

      toast.showSuccess("Tijdentry gedupliceerd");
      router.refresh();
    } catch (error) {
      toast.showError("Fout bij dupliceren: " + (error as Error).message);
    }
  };

  const navigateWeek = (direction: "prev" | "next") => {
    const newWeek = direction === "next" 
      ? addWeeks(currentWeek, 1)
      : subWeeks(currentWeek, 1);
    const params = new URLSearchParams();
    // Format using local date components to avoid timezone issues
    const year = newWeek.getFullYear();
    const month = String(newWeek.getMonth() + 1).padStart(2, "0");
    const day = String(newWeek.getDate()).padStart(2, "0");
    params.set("week", `${year}-${month}-${day}`);
    if (filterClient && filterClient !== "all") params.set("client_id", filterClient);
    if (filterProject && filterProject !== "all") params.set("project_id", filterProject);
    router.push(`/time?${params.toString()}`);
  };

  const navigateToToday = () => {
    // Use getCurrentWeekMonday() which uses getTodayDate() - no timezone issues
    const monday = getCurrentWeekMonday();
    
    const params = new URLSearchParams();
    // Format using local date components to avoid timezone issues
    const year = monday.getFullYear();
    const month = String(monday.getMonth() + 1).padStart(2, "0");
    const day = String(monday.getDate()).padStart(2, "0");
    const weekString = `${year}-${month}-${day}`;
    
    params.set("week", weekString);
    if (filterClient && filterClient !== "all") params.set("client_id", filterClient);
    if (filterProject && filterProject !== "all") params.set("project_id", filterProject);
    
    router.push(`/time?${params.toString()}`);
  };

  const isCurrentWeek = isSameWeek(currentWeek, getTodayDate(), { weekStartsOn: 1 });

  // Filter entries by client, project, and search query
  const filteredEntries = entries.filter((entry) => {
    // Filter by client
    if (filterClient && filterClient !== "all" && entry.client_id !== filterClient) {
      return false;
    }
    // Filter by project
    if (filterProject && filterProject !== "all" && entry.project_id !== filterProject) {
      return false;
    }
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        entry.description.toLowerCase().includes(query) ||
        entry.clients.name.toLowerCase().includes(query) ||
        entry.projects.name.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const entriesByDate = filteredEntries.reduce((acc, entry) => {
    const date = entry.date.split("T")[0];
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(entry);
    return acc;
  }, {} as Record<string, TimeEntry[]>);

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}u ${mins}min` : `${hours}u`;
  };

  const calculateWeekTotal = () => {
    return filteredEntries.reduce((sum, e) => sum + e.duration_minutes, 0);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if ((e.target as HTMLElement).tagName === "INPUT" || (e.target as HTMLElement).tagName === "TEXTAREA") {
        return;
      }

      // Ctrl/Cmd + N for new entry
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        openEntryModal();
      }
      // Ctrl/Cmd + F for search
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        const searchInput = document.getElementById("entry-search");
        searchInput?.focus();
      }
      // Escape to close modals
      if (e.key === "Escape") {
        if (entryModalOpen) setEntryModalOpen(false);
        if (deleteConfirmOpen) {
          setDeleteConfirmOpen(false);
          setEntryToDelete(null);
        }
      }
      // Arrow keys for week navigation
      if (e.key === "ArrowLeft" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        navigateWeek("prev");
      }
      if (e.key === "ArrowRight" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        navigateWeek("next");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [entryModalOpen, deleteConfirmOpen]);

  const getProjectRoundingRule = (projectId: string) => {
    const project = allProjects.find((p) => p.id === projectId);
    const rule = (project?.rounding_rule as "none" | "nearest15" | "up15" | "down15" | "up1") || "none";
    // Special case: "Algemeen" projects should use "up1" (round up to nearest minute)
    if (project?.name === "Algemeen" && rule === "none") {
      return "up1";
    }
    return rule;
  };

  const getProjectDefaultUnit = (projectId: string) => {
    const project = allProjects.find((p) => p.id === projectId);
    return (project?.default_unit as "minutes" | "quarter" | "hour" | "day") || "minutes";
  };

  const applyRounding = (minutes: number, rule: "none" | "nearest15" | "up15" | "down15" | "up1"): number => {
    switch (rule) {
      case "none":
        return minutes;
      case "up1":
        return Math.ceil(minutes); // Round up to nearest minute
      case "nearest15":
        return Math.round(minutes / 15) * 15;
      case "up15":
        return Math.ceil(minutes / 15) * 15;
      case "down15":
        return Math.floor(minutes / 15) * 15;
      default:
        return minutes;
    }
  };

  const handleTimerSetup = (data: {
    clientId: string;
    projectId: string;
    description: string;
  }) => {
    if (typeof window !== "undefined") {
      const currentTimer = localStorage.getItem("kleinekoning_timer");
      let updated;
      if (currentTimer) {
        try {
          const parsed = JSON.parse(currentTimer);
          const isRunning = parsed.isRunning && parsed.startTime;
          const isChanging = parsed.clientId !== data.clientId || 
                            parsed.projectId !== data.projectId;
          
          // If timer is running and client/project is changing, accumulate current time
          if (isRunning && isChanging) {
            const currentElapsed = parsed.startTime 
              ? Math.floor((Date.now() - parsed.startTime) / 1000)
              : 0;
            const currentMinutes = Math.floor((parsed.elapsedSeconds + currentElapsed) / 60);
            
            if (currentMinutes > 0 && parsed.clientId && parsed.projectId) {
              // Add current session to accumulated sessions
              const newSession = {
                durationMinutes: currentMinutes,
                clientId: parsed.clientId,
                projectId: parsed.projectId,
                description: parsed.description,
                timestamp: parsed.startTime || Date.now(),
                date: parsed.startTime 
                  ? (() => {
                      const d = new Date(parsed.startTime);
                      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                    })()
                  : (() => {
                      const d = new Date();
                      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                    })(),
              };
              
              updated = {
                ...parsed,
                sessions: [...(parsed.sessions || []), newSession],
                elapsedSeconds: 0,
                startTime: Date.now(), // Reset timer for new session
                clientId: data.clientId,
                projectId: data.projectId,
                description: data.description,
              };
            } else {
              // Just update the fields and reset timer
              updated = {
                ...parsed,
                elapsedSeconds: 0,
                startTime: Date.now(), // Reset timer for new client/project
                clientId: data.clientId,
                projectId: data.projectId,
                description: data.description,
              };
            }
          } else if (!isRunning && isChanging) {
            // Timer is stopped and client/project is changing - clear sessions and reset
            updated = {
              ...parsed,
              elapsedSeconds: 0,
              startTime: null,
              clientId: data.clientId,
              projectId: data.projectId,
              description: data.description,
              sessions: [], // Clear sessions when changing client/project while stopped
            };
          } else {
            // Just update the fields (description only or no change)
            updated = {
              ...parsed,
              clientId: data.clientId,
              projectId: data.projectId,
              description: data.description,
            };
          }
        } catch {
          updated = {
            isRunning: false,
            startTime: null,
            elapsedSeconds: 0,
            clientId: data.clientId,
            projectId: data.projectId,
            description: data.description,
            sessions: [],
          };
        }
      } else {
        updated = {
          isRunning: false,
          startTime: null,
          elapsedSeconds: 0,
          clientId: data.clientId,
          projectId: data.projectId,
          description: data.description,
          sessions: [],
        };
      }
      localStorage.setItem("kleinekoning_timer", JSON.stringify(updated));
      window.dispatchEvent(new Event("storage"));
      // Also dispatch custom event for same-tab updates
      window.dispatchEvent(new Event("timerSetupUpdated"));
    }
    setTimerSetupOpen(false);
  };

  const handleTimerStop = async (data: {
    durationMinutes: number;
    clientId: string;
    projectId: string;
    description: string;
    sessions?: any[];
    startDate?: string;
  }) => {
    // If we have multiple sessions, save each one separately (grouped by client+project)
    if (data.sessions && data.sessions.length > 0) {
      // Group sessions by client+project combination
      const sessionGroups = new Map<string, any[]>();
      
      data.sessions.forEach((session) => {
        const key = `${session.clientId}_${session.projectId}`;
        if (!sessionGroups.has(key)) {
          sessionGroups.set(key, []);
        }
        sessionGroups.get(key)!.push(session);
      });
      
      // Save each group as a separate entry
      const savedEntries: string[] = [];
      
      for (const [key, sessions] of sessionGroups.entries()) {
        const [clientId, projectIdRaw] = key.split("_");
        // Handle "algemeen" project - need to find or create it
        let projectId = projectIdRaw === "algemeen" ? null : projectIdRaw;
        
        // If "algemeen", find or create the "Algemeen" project for this client
        if (projectIdRaw === "algemeen" || !projectId) {
          // Find "Algemeen" project for this client
          let algemeenProject = allProjects.find(
            (p) => p.client_id === clientId && p.name === "Algemeen"
          );
          
          if (!algemeenProject) {
            // Create "Algemeen" project if it doesn't exist
            try {
              const createFormData = new FormData();
              createFormData.set("client_id", clientId);
              const createRes = await fetch("/api/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  client_id: clientId,
                  name: "Algemeen",
                  default_unit: "minutes",
                  rounding_rule: "up1",
                }),
              });

              if (!createRes.ok) {
                const err = await createRes.json().catch(() => ({}));
                throw new Error(err.error || "Project aanmaken mislukt");
              }
              
              // Refresh projects list
              const allProjs: any[] = [];
              for (const client of clients) {
                try {
                  const response = await fetch(`/api/projects?client_id=${client.id}`);
                  const projs = await response.json();
                  allProjs.push(...projs);
                } catch (error) {
                  console.error(`Error loading projects for client ${client.id}:`, error);
                }
              }
              setAllProjects(allProjs);
              
              // Find the newly created project
              algemeenProject = allProjs.find(
                (p) => p.client_id === clientId && p.name === "Algemeen"
              );
            } catch (error) {
              console.error("Error creating Algemeen project:", error);
              toast.showError("Fout bij aanmaken 'Algemeen' project: " + (error as Error).message);
              continue;
            }
          }
          
          if (algemeenProject) {
            projectId = algemeenProject.id;
          } else {
            toast.showError("Kon 'Algemeen' project niet vinden of aanmaken");
            continue;
          }
        }
        
        const totalMinutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);
        
        // Apply rounding BEFORE checking if > 0
        const roundingRule = projectId ? getProjectRoundingRule(projectId) : "none";
        const roundedMinutes = applyRounding(totalMinutes, roundingRule);
        
        // Only save if rounded minutes > 0
        if (roundedMinutes > 0 && clientId && projectId) {
          try {
            // Use date from session (when timer started) or fallback to today
            const entryDate = sessions[0]?.date || data.startDate || getTodayString();
            
            const formData = new FormData();
            formData.set("client_id", clientId);
            formData.set("project_id", projectId);
            formData.set("date", entryDate);
            const res = await fetch("/api/time-entries", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                client_id: clientId,
                project_id: projectId,
                date: entryDate,
                description: sessions[sessions.length - 1].description || "",
                duration_value: roundedMinutes,
                duration_unit: "minutes",
              }),
            });

            if (!res.ok) {
              const err = await res.json().catch(() => ({}));
              throw new Error(err.error || "Opslaan mislukt");
            }
            
            const clientName = getClientName(clientId);
            const projectName = projectIdRaw === "algemeen" ? "Algemeen" : getProjectName(projectId);
            savedEntries.push(`${clientName} - ${projectName}: ${roundedMinutes} min`);
          } catch (error) {
            console.error(`Error saving entry for ${key}:`, error);
            toast.showError(`Fout bij opslaan: ${(error as Error).message}`);
          }
        }
      }
      
      if (savedEntries.length > 0) {
        toast.showSuccess(`${savedEntries.length} timer entr${savedEntries.length === 1 ? 'y' : 'ies'} opgeslagen`);
        router.refresh();
      } else {
        toast.showWarning("Geen entries opgeslagen (mogelijk afgerond naar 0 minuten)");
      }
      return;
    }
    
    // Single session - apply rounding and save automatically
    if (!data.clientId) {
      toast.showError("Geen klant geselecteerd");
      return;
    }

    // Handle "algemeen" project
    let projectId = data.projectId;
    if (projectId === "algemeen" || !projectId) {
      // Find "Algemeen" project for this client
      let algemeenProject = allProjects.find(
        (p) => p.client_id === data.clientId && p.name === "Algemeen"
      );
      
      if (!algemeenProject) {
        // Create "Algemeen" project if it doesn't exist
        try {
          const projectFormData = new FormData();
          projectFormData.set("client_id", data.clientId);
          const createRes = await fetch("/api/projects", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              client_id: data.clientId,
              name: "Algemeen",
              default_unit: "minutes",
              rounding_rule: "none",
            }),
          });

          if (!createRes.ok) {
            const err = await createRes.json().catch(() => ({}));
            throw new Error(err.error || "Project aanmaken mislukt");
          }
          
          // Refresh projects list
          const allProjs: any[] = [];
          for (const client of clients) {
            try {
              const response = await fetch(`/api/projects?client_id=${client.id}`);
              const projs = await response.json();
              allProjs.push(...projs);
            } catch (error) {
              console.error(`Error loading projects for client ${client.id}:`, error);
            }
          }
          setAllProjects(allProjs);
          
          // Find the newly created project
          algemeenProject = allProjs.find(
            (p) => p.client_id === data.clientId && p.name === "Algemeen"
          );
        } catch (error) {
          toast.showError("Fout bij aanmaken 'Algemeen' project: " + (error as Error).message);
          return;
        }
      }
      
      if (algemeenProject) {
        projectId = algemeenProject.id;
      } else {
        toast.showError("Kon 'Algemeen' project niet vinden of aanmaken");
        return;
      }
    }

    try {
      // Apply rounding BEFORE checking if > 0
      const roundingRule = getProjectRoundingRule(projectId);
      const roundedMinutes = applyRounding(data.durationMinutes, roundingRule);
      
      // Only save if rounded minutes > 0
      if (roundedMinutes <= 0) {
        toast.showWarning("Timer entry niet opgeslagen: afgerond naar 0 minuten");
        return;
      }

      // Use date from timer start (when timer was started) or fallback to today
      const entryDate = data.startDate || getTodayString();
      
      const formData = new FormData();
      formData.set("client_id", data.clientId);
      formData.set("project_id", projectId);
      formData.set("date", entryDate);
      const res = await fetch("/api/time-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: data.clientId,
          project_id: projectId,
          date: entryDate,
          description: data.description || "",
          duration_value: roundedMinutes,
          duration_unit: "minutes",
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Opslaan mislukt");
      }
      
      // Show success notification
      const clientName = getClientName(data.clientId);
      const projectName = data.projectId === "algemeen" ? "Algemeen" : getProjectName(projectId);
      const formatDuration = (minutes: number) => {
        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}u ${mins}min` : `${hours}u`;
      };
      
      toast.showSuccess(`Timer entry opgeslagen: ${formatDuration(roundedMinutes)} voor ${clientName} - ${projectName}`);
      router.refresh();
    } catch (error) {
      console.error("[handleTimerStop] Error saving entry:", error);
      toast.showError("Fout bij opslaan timer entry: " + (error as Error).message);
    }
  };

  const getClientName = (clientId: string) => {
    return clients.find((c) => c.id === clientId)?.name || "";
  };

  const getProjectName = (projectId: string) => {
    return allProjects.find((p) => p.id === projectId)?.name || "";
  };

  const openEntryModal = () => {
    setSelectedClient("");
    setSelectedProject("");
    setDate(getTodayString());
    setDescription("");
    setDurationValue("");
    setDurationUnit("minutes");
    setEntryModalOpen(true);
  };

  const weekTotal = calculateWeekTotal();
  const todayStr = getTodayString();
  const todayEntries = entriesByDate[todayStr] || [];
  const todayTotal = todayEntries.reduce((sum, e) => sum + e.duration_minutes, 0);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, mb: 4, gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontWeight: "bold",
              background: "linear-gradient(90deg, #6366f1 0%, #9333ea 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Tijdregistratie
          </Typography>
          <InfoIcon title="Registreer je gewerkte uren per project. Selecteer een klant en project, voer de duur in en de afrondingsregel wordt automatisch toegepast." />
        </Box>
        <Box sx={{ display: "flex", gap: 2, width: { xs: "100%", sm: "auto" } }}>
          <Button
            variant="outlined"
            onClick={navigateToToday}
            disabled={isCurrentWeek}
            sx={{ flex: { xs: 1, sm: "none" } }}
          >
            Vandaag
          </Button>
          <Button
            variant="contained"
            onClick={openEntryModal}
            startIcon={<Plus size={18} />}
            sx={{
              flex: { xs: 1, sm: "none" },
              background: "linear-gradient(90deg, #6366f1 0%, #9333ea 100%)",
              "&:hover": {
                background: "linear-gradient(90deg, #4f46e5 0%, #7e22ce 100%)",
              },
            }}
          >
            Nieuwe entry
          </Button>
        </Box>
      </Box>

      {/* Week Navigation + Stats */}
      <Paper elevation={1} sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
        <Box sx={{ display: "flex", flexDirection: { xs: "column", lg: "row" }, gap: 3 }}>
          <Box sx={{ flex: { xs: "1", lg: "2" }, display: "flex", alignItems: "center", justifyContent: "center", gap: 2 }}>
            <IconButton onClick={() => navigateWeek("prev")} size="small">
              <ChevronLeft size={20} />
            </IconButton>
            <Box sx={{ textAlign: "center", flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Typography variant="body2" fontWeight={500} color="text.secondary">
                  Selecteer datum
                </Typography>
                <InfoIcon title="Selecteer een datum in de kalender om naar die week te navigeren. De kalender toont altijd vandaag, maar je kunt naar elke week navigeren." size="small" />
              </Box>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={nl}>
                <DatePicker
                  key={weekStart} // Force re-render when weekStart changes
                  value={getTodayDate()}
                  onChange={(newDate) => {
                    if (newDate) {
                      const monday = startOfWeek(newDate, { weekStartsOn: 1 });
                      
                      const params = new URLSearchParams();
                      // Format using local date components to avoid timezone issues
                      const year = monday.getFullYear();
                      const month = String(monday.getMonth() + 1).padStart(2, "0");
                      const day = String(monday.getDate()).padStart(2, "0");
                      const weekString = `${year}-${month}-${day}`;
                      
                      params.set("week", weekString);
                      if (filterClient && filterClient !== "all") params.set("client_id", filterClient);
                      if (filterProject && filterProject !== "all") params.set("project_id", filterProject);
                      
                      router.push(`/time?${params.toString()}`);
                    }
                  }}
                  slotProps={{
                    textField: {
                      size: "small",
                      sx: {
                        "& .MuiInputBase-root": {
                          cursor: "pointer",
                        },
                        "& .MuiInputBase-input": {
                          textAlign: "center",
                          fontWeight: "bold",
                          fontSize: "1.1rem",
                          cursor: "pointer",
                        },
                      },
                    },
                    openPickerButton: {
                      sx: { color: "primary.main" },
                    },
                  }}
                  format="d MMM yyyy"
                  views={["year", "month", "day"]}
                />
              </LocalizationProvider>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: "medium" }}>
                {format(currentWeek, "d MMM", { locale: nl })} - {format(endOfWeek(currentWeek, { weekStartsOn: 1 }), "d MMM yyyy", { locale: nl })}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
                Week {format(currentWeek, "w", { locale: nl })}
              </Typography>
            </Box>
            <IconButton onClick={() => navigateWeek("next")} size="small">
              <ChevronRight size={20} />
            </IconButton>
          </Box>
          <Box
            sx={{
              flex: { xs: "1", lg: "1" },
              display: "flex",
              alignItems: "center",
              justifyContent: { xs: "space-around", lg: "flex-end" },
              gap: { xs: 2, lg: 4 },
              borderTop: { xs: "1px solid", lg: "none" },
              borderLeft: { xs: "none", lg: "1px solid" },
              borderColor: "divider",
              pt: { xs: 2, lg: 0 },
              pl: { xs: 0, lg: 3 },
            }}
          >
            <Box sx={{ textAlign: "center" }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Week
                </Typography>
                <InfoIcon title="Totaal aantal uren geregistreerd in de huidige week (maandag t/m zondag)." size="small" />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: "bold", color: "primary.main" }}>
                {formatDuration(weekTotal)}
              </Typography>
            </Box>
            <Box sx={{ textAlign: "center" }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Vandaag
                </Typography>
                <InfoIcon title="Totaal aantal uren geregistreerd vandaag." size="small" />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: "bold", color: "secondary.main" }}>
                {formatDuration(todayTotal)}
              </Typography>
            </Box>
            <Box sx={{ textAlign: "center" }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Gemiddeld
                </Typography>
                <InfoIcon title="Gemiddeld aantal uren per dag in de huidige week (weektotaal gedeeld door 7)." size="small" />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                {formatDuration(Math.round(weekTotal / 7))}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Search Results */}
      {searchQuery && filteredEntries.length > 0 && (
        <Paper 
          elevation={2} 
          sx={{ 
            p: 2, 
            mb: 2, 
            backgroundColor: (theme) => theme.palette.mode === 'dark' 
              ? 'rgba(33, 150, 243, 0.15)' 
              : 'rgba(33, 150, 243, 0.1)',
            border: '1px solid',
            borderColor: (theme) => theme.palette.mode === 'dark'
              ? 'rgba(33, 150, 243, 0.3)'
              : 'rgba(33, 150, 243, 0.3)',
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <Search size={20} style={{ color: 'inherit' }} />
            <Typography 
              variant="body2" 
              fontWeight={600}
              sx={{ 
                color: (theme) => theme.palette.mode === 'dark' ? 'info.light' : 'info.dark',
              }}
            >
              {filteredEntries.length} {filteredEntries.length === 1 ? "entry gevonden" : "entries gevonden"}
            </Typography>
            <Box sx={{ flex: 1 }} />
            <Button 
              size="small" 
              onClick={() => setSearchQuery("")}
              variant="outlined"
              sx={{
                borderColor: (theme) => theme.palette.mode === 'dark' ? 'info.light' : 'info.dark',
                color: (theme) => theme.palette.mode === 'dark' ? 'info.light' : 'info.dark',
                '&:hover': {
                  borderColor: (theme) => theme.palette.mode === 'dark' ? 'info.main' : 'info.main',
                  backgroundColor: (theme) => theme.palette.mode === 'dark' 
                    ? 'rgba(33, 150, 243, 0.1)' 
                    : 'rgba(33, 150, 243, 0.05)',
                },
              }}
            >
              Wissen
            </Button>
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {filteredEntries.map((entry) => {
              const entryDate = parseDateString(entry.date);
              const entryWeekStart = startOfWeek(entryDate, { weekStartsOn: 1 });
              const isCurrentWeek = isSameWeek(entryDate, currentWeek, { weekStartsOn: 1 });
              
              return (
                <Paper
                  key={entry.id}
                  elevation={0}
                  sx={{
                    p: 1.5,
                    backgroundColor: isCurrentWeek ? "rgba(99, 102, 241, 0.1)" : "white",
                    border: isCurrentWeek ? "1px solid" : "1px solid",
                    borderColor: isCurrentWeek ? "primary.main" : "divider",
                    cursor: "pointer",
                    "&:hover": {
                      backgroundColor: isCurrentWeek ? "rgba(99, 102, 241, 0.15)" : "action.hover",
                      borderColor: "primary.main",
                    },
                    transition: "all 0.2s",
                  }}
                  onClick={() => {
                    if (!isCurrentWeek) {
                      const year = entryWeekStart.getFullYear();
                      const month = String(entryWeekStart.getMonth() + 1).padStart(2, "0");
                      const day = String(entryWeekStart.getDate()).padStart(2, "0");
                      const weekString = `${year}-${month}-${day}`;
                      const params = new URLSearchParams();
                      params.set("week", weekString);
                      if (filterClient && filterClient !== "all") params.set("client_id", filterClient);
                      if (filterProject && filterProject !== "all") params.set("project_id", filterProject);
                      router.push(`/time?${params.toString()}`);
                      // Scroll to entry after navigation
                      setTimeout(() => {
                        const element = document.getElementById(`entry-${entry.id}`);
                        if (element) {
                          element.scrollIntoView({ behavior: "smooth", block: "center" });
                          element.style.backgroundColor = "rgba(99, 102, 241, 0.2)";
                          setTimeout(() => {
                            element.style.backgroundColor = "";
                          }, 2000);
                        }
                      }, 100);
                    } else {
                      // Scroll to entry in current week
                      const element = document.getElementById(`entry-${entry.id}`);
                      if (element) {
                        element.scrollIntoView({ behavior: "smooth", block: "center" });
                        element.style.backgroundColor = "rgba(99, 102, 241, 0.2)";
                        setTimeout(() => {
                          element.style.backgroundColor = "";
                        }, 2000);
                      }
                    }
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flex: 1, minWidth: 0 }}>
                      <Calendar size={18} style={{ color: isCurrentWeek ? undefined : 'inherit' }} />
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="body2" fontWeight={500} noWrap>
                          {format(entryDate, "EEEE d MMMM yyyy", { locale: nl })}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {entry.clients.name} • {entry.projects.name}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ minWidth: "fit-content" }}>
                        {entry.description}
                      </Typography>
                      <Chip
                        label={formatDuration(entry.duration_minutes)}
                        size="small"
                        color={isCurrentWeek ? "primary" : "default"}
                        variant={isCurrentWeek ? "filled" : "outlined"}
                      />
                    </Box>
                  </Box>
                </Paper>
              );
            })}
          </Box>
        </Paper>
      )}
      
      {/* No Results Message */}
      {searchQuery && filteredEntries.length === 0 && (
        <Paper 
          elevation={1} 
          sx={{ 
            p: 2, 
            mb: 2, 
            backgroundColor: (theme) => theme.palette.mode === 'dark' 
              ? 'rgba(255, 193, 7, 0.15)' 
              : 'rgba(255, 193, 7, 0.1)',
            border: '1px solid',
            borderColor: (theme) => theme.palette.mode === 'dark'
              ? 'rgba(255, 193, 7, 0.3)'
              : 'rgba(255, 193, 7, 0.3)',
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Search size={20} style={{ color: 'inherit' }} />
            <Typography 
              variant="body2"
              sx={{ 
                color: (theme) => theme.palette.mode === 'dark' ? 'warning.light' : 'warning.dark',
                fontWeight: 500,
              }}
            >
              Geen entries gevonden voor "{searchQuery}"
            </Typography>
            <Box sx={{ flex: 1 }} />
            <Button 
              size="small" 
              onClick={() => setSearchQuery("")}
              variant="outlined"
              sx={{
                borderColor: (theme) => theme.palette.mode === 'dark' ? 'warning.light' : 'warning.dark',
                color: (theme) => theme.palette.mode === 'dark' ? 'warning.light' : 'warning.dark',
                '&:hover': {
                  borderColor: (theme) => theme.palette.mode === 'dark' ? 'warning.main' : 'warning.main',
                  backgroundColor: (theme) => theme.palette.mode === 'dark' 
                    ? 'rgba(255, 193, 7, 0.1)' 
                    : 'rgba(255, 193, 7, 0.05)',
                },
              }}
            >
              Wissen
            </Button>
          </Box>
        </Paper>
      )}

      {/* Filters + Timer */}
      <Box sx={{ display: "flex", flexDirection: { xs: "column", lg: "row" }, gap: 3, mb: 3 }}>
        <Box sx={{ flex: { xs: "1", lg: "2" } }}>
          <Paper elevation={1} sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                  <Typography variant="body2" fontWeight={500}>
                    Zoeken
                  </Typography>
                  <InfoIcon title="Zoek in tijdentries op omschrijving, klantnaam of projectnaam. Gebruik Ctrl+F om snel te zoeken. De zoekresultaten worden direct gefilterd." size="small" />
                </Box>
                <TextField
                  id="entry-search"
                  placeholder="Zoeken in entries... (Ctrl+F)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: <Search size={18} style={{ marginRight: 8, color: 'inherit' }} />,
                  }}
                  fullWidth
                  size="small"
                />
              </Box>
              <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                    <Typography variant="body2" fontWeight={500}>
                      Filter op klant
                    </Typography>
                    <InfoIcon title="Filter de tijdentries op een specifieke klant. Selecteer 'Alle klanten' om alle entries te zien." size="small" />
                  </Box>
                  <FormControl fullWidth>
                    <InputLabel>Klant</InputLabel>
                    <Select
                      value={filterClient}
                      onChange={(e) => handleFilterClientChange(e.target.value)}
                      label="Klant"
                    >
                      <MenuItem value="all">Alle klanten</MenuItem>
                      {clients.map((client) => (
                        <MenuItem key={client.id} value={client.id}>
                          {client.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                    <Typography variant="body2" fontWeight={500}>
                      Filter op project
                    </Typography>
                    <InfoIcon title="Filter de tijdentries op een specifiek project. Dit is alleen beschikbaar als je eerst een klant selecteert." size="small" />
                  </Box>
                  <FormControl fullWidth disabled={!filterClient || filterClient === "all"}>
                    <InputLabel>Project</InputLabel>
                    <Select
                      value={filterProject}
                      onChange={(e) => handleFilterProjectChange(e.target.value)}
                      label="Project"
                    >
                      <MenuItem value="all">Alle projecten</MenuItem>
                      {projects.map((project) => (
                        <MenuItem key={project.id} value={project.id}>
                          {project.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Box>
        <Box sx={{ flex: { xs: "1", lg: "1" } }}>
          <Timer
            onStop={handleTimerStop}
            onSetup={() => setTimerSetupOpen(true)}
            clients={clients}
            projects={allProjects}
          />
        </Box>
      </Box>

      {/* Week Overview */}
      <Paper elevation={1} sx={{ overflow: "hidden" }}>
        <Box
          sx={{
            background: "linear-gradient(90deg, #6366f1 0%, #9333ea 100%)",
            px: 3,
            py: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: "bold", color: "white" }}>
            Week overzicht
          </Typography>
          {selectedEntries.size > 0 && (
            <Button
              variant="contained"
              color="error"
              onClick={handleBulkDeleteEntries}
              size="small"
              sx={{ bgcolor: "error.main", "&:hover": { bgcolor: "error.dark" } }}
            >
              Verwijder ({selectedEntries.size})
            </Button>
          )}
        </Box>
        <Box sx={{ borderTop: "1px solid", borderColor: "divider" }}>
          {filteredEntries.length === 0 && (filterClient !== "all" || filterProject !== "all" || searchQuery.trim()) ? (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                Geen entries gevonden met de huidige filters
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Probeer andere filters of wis de filters om alle entries te zien.
              </Typography>
              <Button
                variant="outlined"
                onClick={() => {
                  setFilterClient("all");
                  setFilterProject("all");
                  setSearchQuery("");
                }}
              >
                Wis alle filters
              </Button>
            </Box>
          ) : (
            weekDays
              .filter((day) => {
                // If filtering, only show days that have entries matching the filter
                const dayStr = format(day, "yyyy-MM-dd");
                const dayEntries = entriesByDate[dayStr] || [];
                const isFiltering = filterClient !== "all" || filterProject !== "all" || searchQuery.trim();
                // If filtering, hide days without entries; if not filtering, show all days
                return !isFiltering || dayEntries.length > 0;
              })
              .map((day) => {
                const dayStr = format(day, "yyyy-MM-dd");
                const dayEntries = entriesByDate[dayStr] || [];
                const dayTotal = dayEntries.reduce((sum, e) => sum + e.duration_minutes, 0);
                const isToday = dayStr === todayStr;

            return (
              <Box
                key={dayStr}
                sx={{
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  borderLeft: isToday ? "4px solid" : "none",
                  borderLeftColor: isToday ? "primary.main" : "transparent",
                  background: isToday
                    ? "linear-gradient(90deg, rgba(99, 102, 241, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)"
                    : "transparent",
                  "&:hover": {
                    backgroundColor: isToday ? "rgba(99, 102, 241, 0.15)" : "action.hover",
                  },
                  transition: "background-color 0.2s",
                }}
              >
                <Box sx={{ px: 3, py: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      {dayEntries.length > 0 && !isToday && (
                        <Checkbox
                          checked={dayEntries.length > 0 && dayEntries.every((e: TimeEntry) => selectedEntries.has(e.id))}
                          indeterminate={dayEntries.some((e: TimeEntry) => selectedEntries.has(e.id)) && !dayEntries.every((e: TimeEntry) => selectedEntries.has(e.id))}
                          onChange={() => {
                            const allSelected = dayEntries.every((e: TimeEntry) => selectedEntries.has(e.id));
                            if (allSelected) {
                              setSelectedEntries((prev) => {
                                const next = new Set(prev);
                                dayEntries.forEach((e: TimeEntry) => next.delete(e.id));
                                return next;
                              });
                            } else {
                              setSelectedEntries((prev) => {
                                const next = new Set(prev);
                                dayEntries.forEach((e: TimeEntry) => next.add(e.id));
                                return next;
                              });
                            }
                          }}
                          size="small"
                        />
                      )}
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: "bold",
                          textTransform: "capitalize",
                          color: isToday ? (theme.palette.mode === "dark" ? "text.primary" : "primary.dark") : "text.primary",
                        }}
                      >
                        {format(day, "EEEE d MMMM", { locale: nl })}
                      </Typography>
                      {isToday && (
                        <Chip
                          label="Vandaag"
                          size="small"
                          sx={{
                            background: "linear-gradient(90deg, #6366f1 0%, #9333ea 100%)",
                            color: "white",
                            fontWeight: "bold",
                            fontSize: "0.7rem",
                          }}
                        />
                      )}
                    </Box>
                    {dayTotal > 0 && (
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: "bold",
                          color: isToday ? "primary.main" : "text.primary",
                        }}
                      >
                        {formatDuration(dayTotal)}
                      </Typography>
                    )}
                  </Box>

                  {dayEntries.length > 0 ? (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell padding="checkbox" width={50}>
                              <Checkbox
                                checked={dayEntries.length > 0 && dayEntries.every((e: TimeEntry) => selectedEntries.has(e.id))}
                                indeterminate={dayEntries.some((e: TimeEntry) => selectedEntries.has(e.id)) && !dayEntries.every((e: TimeEntry) => selectedEntries.has(e.id))}
                                onChange={() => {
                                  const allSelected = dayEntries.every((e: TimeEntry) => selectedEntries.has(e.id));
                                  if (allSelected) {
                                    setSelectedEntries((prev) => {
                                      const next = new Set(prev);
                                      dayEntries.forEach((e: TimeEntry) => next.delete(e.id));
                                      return next;
                                    });
                                  } else {
                                    setSelectedEntries((prev) => {
                                      const next = new Set(prev);
                                      dayEntries.forEach((e: TimeEntry) => next.add(e.id));
                                      return next;
                                    });
                                  }
                                }}
                                size="small"
                              />
                            </TableCell>
                            <TableCell sx={{ fontWeight: "bold" }}>Klant</TableCell>
                            <TableCell sx={{ fontWeight: "bold" }}>Project</TableCell>
                            <TableCell sx={{ fontWeight: "bold" }}>Omschrijving</TableCell>
                            <TableCell align="right" sx={{ fontWeight: "bold" }}>
                              Duur
                            </TableCell>
                            <TableCell width={60} sx={{ fontWeight: "bold" }}>Acties</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {dayEntries.map((entry) => (
                            <TableRow key={entry.id} id={`entry-${entry.id}`} hover selected={selectedEntries.has(entry.id)}>
                              <TableCell padding="checkbox">
                                <Checkbox
                                  checked={selectedEntries.has(entry.id)}
                                  onChange={() => handleSelectEntry(entry.id)}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {entry.clients?.name || "-"}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={entry.projects.name}
                                  size="small"
                                  sx={{
                                    backgroundColor: "primary.light",
                                    color: "primary.dark",
                                    fontWeight: "bold",
                                    fontSize: "0.75rem",
                                  }}
                                />
                              </TableCell>
                              <TableCell>{entry.description}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                                {formatDuration(entry.duration_minutes)}
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: "flex", gap: 0.5 }}>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleEdit(entry)}
                                    title="Bewerken"
                                    sx={{
                                      color: "primary.main",
                                      "&:hover": { backgroundColor: "primary.light", color: "primary.dark" },
                                    }}
                                  >
                                    <Edit size={18} />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDuplicate(entry)}
                                    title="Dupliceren"
                                    sx={{
                                      color: "primary.main",
                                      "&:hover": { backgroundColor: "primary.light", color: "primary.dark" },
                                    }}
                                  >
                                    <Copy size={18} />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDelete(entry.id)}
                                    title="Verwijderen"
                                    sx={{
                                      color: "error.main",
                                      "&:hover": { backgroundColor: "error.light", color: "error.dark" },
                                    }}
                                  >
                                    <Trash2 size={18} />
                                  </IconButton>
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Box sx={{ py: 2, textAlign: "center" }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
                        Geen entries voor deze dag
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            );
          }))}
        </Box>
      </Paper>

      {/* Entry Modal */}
      <Dialog open={entryModalOpen} onClose={() => {
        setEntryModalOpen(false);
        setEditingEntry(null);
        setDescription("");
        setDurationValue("");
        setSelectedProject("");
        setSelectedClient("");
      }} maxWidth="sm" fullWidth>
        <DialogTitle>{editingEntry ? "Entry bewerken" : "Nieuwe entry"}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Voeg een nieuwe tijdregistratie toe
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                <Typography variant="body2" fontWeight={500}>
                  Datum <span style={{ color: "red" }}>*</span>
                </Typography>
                <InfoIcon title="Selecteer de datum waarop je hebt gewerkt. Dit kan vandaag zijn of een datum in het verleden." size="small" />
              </Box>
              <TextField
                id="entry-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Box>

            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                <Typography variant="body2" fontWeight={500}>
                  Klant <span style={{ color: "red" }}>*</span>
                </Typography>
                <InfoIcon title="Selecteer de klant waarvoor je hebt gewerkt. Na selectie worden de bijbehorende projecten getoond." size="small" />
              </Box>
              <FormControl fullWidth required>
                <InputLabel>Klant</InputLabel>
                <Select
                  value={selectedClient}
                  onChange={(e) => handleClientChange(e.target.value)}
                  label="Klant"
                >
                  {clients.map((client) => (
                    <MenuItem key={client.id} value={client.id}>
                      {client.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                <Typography variant="body2" fontWeight={500}>
                  Project <span style={{ color: "red" }}>*</span>
                </Typography>
                <InfoIcon title="Selecteer het project waarvoor je hebt gewerkt. De standaard unit van het project wordt automatisch ingesteld." size="small" />
              </Box>
              <FormControl fullWidth required disabled={!selectedClient}>
                <InputLabel>Project</InputLabel>
                <Select
                  value={selectedProject}
                  onChange={(e) => {
                    const projectId = e.target.value;
                    setSelectedProject(projectId);
                    // Set default unit from project
                    if (projectId) {
                      // First check in projects (recently fetched)
                      const project = projects.find((p) => p.id === projectId);
                      if (project?.default_unit) {
                        setDurationUnit(project.default_unit);
                      } else {
                        // Fallback to allProjects
                        const defaultUnit = getProjectDefaultUnit(projectId);
                        setDurationUnit(defaultUnit);
                      }
                    }
                  }}
                  label="Project"
                >
                  {projects.map((project) => (
                    <MenuItem key={project.id} value={project.id}>
                      {project.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                <Typography variant="body2" fontWeight={500}>
                  Omschrijving <span style={{ color: "red" }}>*</span>
                </Typography>
                <InfoIcon title="Beschrijf kort wat je hebt gedaan. Dit wordt getoond in de urenstaat en exports." size="small" />
              </Box>
              <TextField
                id="entry-description"
                value={description}
                onChange={(e) => {
                  const newValue = e.target.value;
                  if (newValue.length <= 75) {
                    setDescription(newValue);
                  } else {
                    // Show warning if trying to exceed limit
                    toast.showWarning("Omschrijving mag maximaal 75 karakters bevatten");
                  }
                }}
                required
                placeholder="Wat heb je gedaan?"
                fullWidth
                inputProps={{ maxLength: 75 }}
                helperText={
                  <Typography
                    component="span"
                    sx={{
                      fontWeight: description.length >= 75 ? "bold" : "normal",
                      color: description.length >= 75 ? "error.main" : "text.secondary",
                    }}
                  >
                    {description.length}/75 karakters
                  </Typography>
                }
              />
            </Box>

            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                <Typography variant="body2" fontWeight={500}>
                  Duur <span style={{ color: "red" }}>*</span>
                </Typography>
                <InfoIcon title="Voer de duur in. Kies de eenheid (minuten, kwartier, uur of dag). De afrondingsregel van het project wordt automatisch toegepast." size="small" />
              </Box>
              <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
                <TextField
                  id="entry-duration-value"
                  type="number"
                  inputProps={{ step: 0.25, min: 0 }}
                  value={durationValue}
                  onChange={(e) => setDurationValue(e.target.value)}
                  required
                  placeholder="1.5"
                  sx={{ flex: 1 }}
                />
                <FormControl sx={{ flex: 1 }}>
                  <InputLabel>Eenheid</InputLabel>
                  <Select
                    value={durationUnit}
                    onChange={(e) => setDurationUnit(e.target.value)}
                    label="Eenheid"
                  >
                    <MenuItem value="minutes">Minuten</MenuItem>
                    <MenuItem value="quarter">Kwartier</MenuItem>
                    <MenuItem value="hour">Uur</MenuItem>
                    <MenuItem value="day">Dag</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>

            {selectedProject && durationValue && (
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  backgroundColor: (theme) => theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.05)" : "grey.100",
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                    Afronding preview
                  </Typography>
                  <InfoIcon title="Dit toont hoe je invoer wordt afgerond volgens de afrondingsregel van het geselecteerde project. De afronding wordt automatisch toegepast bij het opslaan." size="small" />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Invoer: {durationValue} {durationUnit}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Wordt: {formatDuration(
                    applyRounding(
                      parseFloat(durationValue) * (durationUnit === "minutes" ? 1 : durationUnit === "quarter" ? 15 : durationUnit === "hour" ? 60 : 480),
                      getProjectRoundingRule(selectedProject)
                    )
                  )} ({getProjectRoundingRule(selectedProject)})
                </Typography>
              </Paper>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEntryModalOpen(false)} sx={{ color: "text.primary" }}>Annuleren</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            onClick={handleSubmit}
            sx={{
              background: "linear-gradient(90deg, #6366f1 0%, #9333ea 100%)",
              "&:hover": {
                background: "linear-gradient(90deg, #4f46e5 0%, #7e22ce 100%)",
              },
            }}
          >
            {loading ? "Opslaan..." : "Opslaan"}
          </Button>
        </DialogActions>
      </Dialog>

      <TimerSetupDialog
        open={timerSetupOpen}
        onOpenChange={setTimerSetupOpen}
        clients={clients}
        onSave={handleTimerSetup}
      />


      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => { setDeleteConfirmOpen(false); setEntryToDelete(null); }}>
        <DialogTitle>Entry verwijderen?</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Weet je zeker dat je deze entry wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt en alle gegevens worden permanent verwijderd.
          </Typography>
          <Typography variant="body2" color="warning.main" sx={{ fontWeight: 600 }}>
            ⚠️ Let op: Controleer of je voldoet aan de bewaarplicht voor administratieve gegevens (minimaal 7 jaar voor de belastingdienst). Zorg voor een backup voordat je verwijdert.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDeleteConfirmOpen(false); setEntryToDelete(null); }} sx={{ color: "text.primary" }}>
            Annuleren
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Verwijderen
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}