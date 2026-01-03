// components/time-entries-view.tsx
"use client";

import { useState, useEffect } from "react";
import { createTimeEntry, deleteTimeEntry } from "@/app/actions/time-entries";
import { useRouter, useSearchParams } from "next/navigation";
import { format, startOfWeek, addWeeks, subWeeks, eachDayOfInterval, endOfWeek, isSameWeek } from "date-fns";
import { nl } from "date-fns/locale";
import { Timer } from "@/components/timer";
import { TimerSetupDialog } from "@/components/timer-setup-dialog";
import { TimerStopDialog } from "@/components/timer-stop-dialog";
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
} from "@mui/material";
import { ChevronLeft, ChevronRight, Add, Delete } from "@mui/icons-material";

interface TimeEntry {
  id: string;
  date: string;
  description: string;
  duration_minutes: number;
  clients: { name: string };
  projects: { name: string; rounding_rule: string };
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
  const [entries, setEntries] = useState<TimeEntry[]>(initialEntries);
  const [filterClient, setFilterClient] = useState<string>("all");
  const [filterProject, setFilterProject] = useState<string>("all");
  const [projects, setProjects] = useState<any[]>([]);
  const [entryModalOpen, setEntryModalOpen] = useState(false);
  
  // Entry form state
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [durationValue, setDurationValue] = useState("");
  const [durationUnit, setDurationUnit] = useState("minutes");
  const [loading, setLoading] = useState(false);
  
  // Timer state
  const [timerSetupOpen, setTimerSetupOpen] = useState(false);
  const [timerStopOpen, setTimerStopOpen] = useState(false);
  const [timerData, setTimerData] = useState<{
    durationMinutes: number;
    clientId: string;
    projectId: string;
    description: string;
  } | null>(null);
  const [allProjects, setAllProjects] = useState<any[]>([]);

  const weekStartDate = new Date(weekStart);
  const currentWeek = startOfWeek(weekStartDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({
    start: currentWeek,
    end: endOfWeek(currentWeek, { weekStartsOn: 1 }),
  });

  useEffect(() => {
    setEntries(initialEntries);
  }, [initialEntries]);

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
  };

  const handleFilterProjectChange = (projectId: string) => {
    setFilterProject(projectId);
    const params = new URLSearchParams();
    params.set("week", format(currentWeek, "yyyy-MM-dd"));
    if (filterClient && filterClient !== "all") params.set("client_id", filterClient);
    if (projectId && projectId !== "all") params.set("project_id", projectId);
    router.push(`/time?${params.toString()}`);
  };

  const handleClientChange = async (clientId: string) => {
    setSelectedClient(clientId);
    setSelectedProject("");
    if (clientId) {
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !selectedProject || !durationValue) {
      alert("Vul alle velden in");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("client_id", selectedClient);
      formData.set("project_id", selectedProject);
      formData.set("date", date);
      formData.set("description", description);
      formData.set("duration_value", durationValue);
      formData.set("duration_unit", durationUnit);

      await createTimeEntry(formData);
      
      setDescription("");
      setDurationValue("");
      setSelectedProject("");
      setEntryModalOpen(false);
      
      router.refresh();
    } catch (error) {
      alert("Fout: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Weet je zeker dat je deze entry wilt verwijderen?")) {
      try {
        await deleteTimeEntry(id);
        setEntries(entries.filter((e) => e.id !== id));
        router.refresh();
      } catch (error) {
        alert("Fout: " + (error as Error).message);
      }
    }
  };

  const navigateWeek = (direction: "prev" | "next") => {
    const newWeek = direction === "next" 
      ? addWeeks(currentWeek, 1)
      : subWeeks(currentWeek, 1);
    const params = new URLSearchParams();
    params.set("week", format(newWeek, "yyyy-MM-dd"));
    if (filterClient && filterClient !== "all") params.set("client_id", filterClient);
    if (filterProject && filterProject !== "all") params.set("project_id", filterProject);
    router.push(`/time?${params.toString()}`);
  };

  const navigateToToday = () => {
    const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
    const params = new URLSearchParams();
    params.set("week", format(monday, "yyyy-MM-dd"));
    if (filterClient && filterClient !== "all") params.set("client_id", filterClient);
    if (filterProject && filterProject !== "all") params.set("project_id", filterProject);
    router.push(`/time?${params.toString()}`);
  };

  const isCurrentWeek = isSameWeek(currentWeek, new Date(), { weekStartsOn: 1 });

  const entriesByDate = entries.reduce((acc, entry) => {
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
    return entries.reduce((sum, e) => sum + e.duration_minutes, 0);
  };

  const getProjectRoundingRule = (projectId: string) => {
    const project = allProjects.find((p) => p.id === projectId);
    return (project?.rounding_rule as "none" | "nearest15" | "up15" | "down15") || "none";
  };

  const applyRounding = (minutes: number, rule: "none" | "nearest15" | "up15" | "down15"): number => {
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
          updated = {
            ...parsed,
            clientId: data.clientId,
            projectId: data.projectId,
            description: data.description,
          };
        } catch {
          updated = {
            isRunning: false,
            startTime: null,
            elapsedSeconds: 0,
            clientId: data.clientId,
            projectId: data.projectId,
            description: data.description,
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
        };
      }
      localStorage.setItem("kleinekoning_timer", JSON.stringify(updated));
      window.dispatchEvent(new Event("storage"));
    }
    setTimerSetupOpen(false);
  };

  const handleTimerStop = (data: {
    durationMinutes: number;
    clientId: string;
    projectId: string;
    description: string;
  }) => {
    setTimerData(data);
    setTimerStopOpen(true);
  };

  const handleTimerSave = async (data: {
    date: string;
    description: string;
    durationMinutes: number;
  }) => {
    if (!timerData) return;

    try {
      const formData = new FormData();
      formData.set("client_id", timerData.clientId);
      formData.set("project_id", timerData.projectId);
      formData.set("date", data.date);
      formData.set("description", data.description);
      formData.set("duration_value", data.durationMinutes.toString());
      formData.set("duration_unit", "minutes");

      await createTimeEntry(formData);
      
      if (typeof window !== "undefined") {
        localStorage.removeItem("kleinekoning_timer");
      }
      
      router.refresh();
    } catch (error) {
      alert("Fout bij opslaan timer entry: " + (error as Error).message);
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
    setDate(new Date().toISOString().split("T")[0]);
    setDescription("");
    setDurationValue("");
    setDurationUnit("minutes");
    setEntryModalOpen(true);
  };

  const weekTotal = calculateWeekTotal();
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayEntries = entriesByDate[todayStr] || [];
  const todayTotal = todayEntries.reduce((sum, e) => sum + e.duration_minutes, 0);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, mb: 4, gap: 2 }}>
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
            startIcon={<Add />}
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
              <ChevronLeft />
            </IconButton>
            <Box sx={{ textAlign: "center", flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                {format(currentWeek, "d MMM", { locale: nl })} - {format(endOfWeek(currentWeek, { weekStartsOn: 1 }), "d MMM yyyy", { locale: nl })}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Week {format(currentWeek, "w", { locale: nl })}
              </Typography>
            </Box>
            <IconButton onClick={() => navigateWeek("next")} size="small">
              <ChevronRight />
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
              <Typography variant="caption" color="text.secondary">
                Week
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: "bold", color: "primary.main" }}>
                {formatDuration(weekTotal)}
              </Typography>
            </Box>
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="caption" color="text.secondary">
                Vandaag
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: "bold", color: "secondary.main" }}>
                {formatDuration(todayTotal)}
              </Typography>
            </Box>
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="caption" color="text.secondary">
                Gemiddeld
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                {formatDuration(Math.round(weekTotal / 7))}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Filters + Timer */}
      <Box sx={{ display: "flex", flexDirection: { xs: "column", lg: "row" }, gap: 3, mb: 3 }}>
        <Box sx={{ flex: { xs: "1", lg: "2" } }}>
          <Paper elevation={1} sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2 }}>
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
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: "bold", color: "white" }}>
            Week overzicht
          </Typography>
        </Box>
        <Box sx={{ borderTop: "1px solid", borderColor: "divider" }}>
          {weekDays.map((day) => {
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
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: "bold",
                          textTransform: "capitalize",
                          color: isToday ? "primary.dark" : "text.primary",
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
                            <TableCell sx={{ fontWeight: "bold" }}>Project</TableCell>
                            <TableCell sx={{ fontWeight: "bold" }}>Omschrijving</TableCell>
                            <TableCell align="right" sx={{ fontWeight: "bold" }}>
                              Duur
                            </TableCell>
                            <TableCell width={60}></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {dayEntries.map((entry) => (
                            <TableRow key={entry.id} hover>
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
                                <IconButton
                                  size="small"
                                  onClick={() => handleDelete(entry.id)}
                                  sx={{
                                    color: "error.main",
                                    "&:hover": { backgroundColor: "error.light", color: "error.dark" },
                                  }}
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
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
          })}
        </Box>
      </Paper>

      {/* Entry Modal */}
      <Dialog open={entryModalOpen} onClose={() => setEntryModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nieuwe entry</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Voeg een nieuwe tijdregistratie toe
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <TextField
              id="entry-date"
              label="Datum"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

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

            <FormControl fullWidth required disabled={!selectedClient}>
              <InputLabel>Project</InputLabel>
              <Select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                label="Project"
              >
                {projects.map((project) => (
                  <MenuItem key={project.id} value={project.id}>
                    {project.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              id="entry-description"
              label="Omschrijving"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              placeholder="Wat heb je gedaan?"
              fullWidth
            />

            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                id="entry-duration-value"
                label="Duur"
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

            {selectedProject && durationValue && (
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  backgroundColor: "grey.100",
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                  Afronding preview
                </Typography>
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
          <Button onClick={() => setEntryModalOpen(false)}>Annuleren</Button>
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

      {timerData && (
        <TimerStopDialog
          open={timerStopOpen}
          onOpenChange={setTimerStopOpen}
          durationMinutes={timerData.durationMinutes}
          clientName={getClientName(timerData.clientId)}
          projectName={getProjectName(timerData.projectId)}
          roundingRule={getProjectRoundingRule(timerData.projectId)}
          onSave={handleTimerSave}
        />
      )}
    </Container>
  );
}