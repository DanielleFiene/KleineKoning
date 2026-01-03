// components/time-entries-view.tsx
"use client";

import { useState, useEffect } from "react";
import { createTimeEntry, deleteTimeEntry } from "@/app/actions/time-entries";
import { useRouter } from "next/navigation";
import { format, startOfWeek, addWeeks, subWeeks, eachDayOfInterval, endOfWeek, isSameWeek } from "date-fns";
import { nl } from "date-fns/locale";
import { Timer } from "@/components/timer";
import { TimerSetupDialog } from "@/components/timer-setup-dialog";
import { TimerStopDialog } from "@/components/timer-stop-dialog";

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
  const [entries, setEntries] = useState<TimeEntry[]>(initialEntries);
  const [filterClient, setFilterClient] = useState<string>("");
  const [filterProject, setFilterProject] = useState<string>("");
  const [projects, setProjects] = useState<any[]>([]);
  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);

  // Update entries when weekStart changes (from URL)
  useEffect(() => {
    setEntries(initialEntries);
  }, [initialEntries]);

  // Ensure URL has week parameter on initial load, and redirect to current week if missing
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.has("week")) {
      // Calculate current week (Monday) - use today's date
      const today = new Date();
      const monday = startOfWeek(today, { weekStartsOn: 1 });
      // Update URL with current week
      const params = new URLSearchParams();
      params.set("week", format(monday, "yyyy-MM-dd"));
      if (filterClient) params.set("client_id", filterClient);
      if (filterProject) params.set("project_id", filterProject);
      router.replace(`/time?${params.toString()}`, { scroll: false });
    }
  }, []); // Only run once on mount
  
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

  // Parse weekStart string to Date, ensuring it's valid
  const weekStartDate = new Date(weekStart);
  const currentWeek = startOfWeek(isNaN(weekStartDate.getTime()) ? new Date() : weekStartDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({
    start: currentWeek,
    end: endOfWeek(currentWeek, { weekStartsOn: 1 }),
  });

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
    setFilterProject("");
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
    // Update URL with filter
    const params = new URLSearchParams();
    if (clientId) params.set("client_id", clientId);
    router.push(`/time?week=${format(currentWeek, "yyyy-MM-dd")}&${params.toString()}`);
  };

  const handleFilterProjectChange = (projectId: string) => {
    setFilterProject(projectId);
    const params = new URLSearchParams();
    if (filterClient) params.set("client_id", filterClient);
    if (projectId) params.set("project_id", projectId);
    router.push(`/time?week=${format(currentWeek, "yyyy-MM-dd")}&${params.toString()}`);
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
      
      // Reset form
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
    if (filterClient) params.set("client_id", filterClient);
    if (filterProject) params.set("project_id", filterProject);
    router.push(`/time?week=${format(newWeek, "yyyy-MM-dd")}&${params.toString()}`);
  };

  const navigateToToday = () => {
    const today = new Date();
    const monday = startOfWeek(today, { weekStartsOn: 1 });
    const params = new URLSearchParams();
    params.set("week", format(monday, "yyyy-MM-dd"));
    if (filterClient) params.set("client_id", filterClient);
    if (filterProject) params.set("project_id", filterProject);
    router.push(`/time?${params.toString()}`);
  };

  const isCurrentWeek = isSameWeek(currentWeek, new Date(), { weekStartsOn: 1 });

  // Group entries by date (YYYY-MM-DD format)
  const entriesByDate = entries.reduce((acc, entry) => {
    // Ensure date is in YYYY-MM-DD format
    const date = entry.date.split("T")[0]; // Handle ISO datetime strings
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
    setEditingEntry(null);
    setSelectedClient("");
    setSelectedProject("");
    setDate(new Date().toISOString().split("T")[0]);
    setDescription("");
    setDurationValue("");
    setDurationUnit("minutes");
    setEntryModalOpen(true);
  };

  return (
    <div>
      {/* Bovenbalk */}
      <div>
        <div>
          {/* Week selector */}
          <div>
            <button onClick={() => navigateWeek("prev")}>
              &lt;
            </button>
            <span>
              {format(currentWeek, "d MMM", { locale: nl })} -{" "}
              {format(endOfWeek(currentWeek, { weekStartsOn: 1 }), "d MMM yyyy", { locale: nl })}
            </span>
            <button onClick={() => navigateWeek("next")}>
              &gt;
            </button>
            <button onClick={navigateToToday} disabled={isCurrentWeek}>
              Vandaag
            </button>
          </div>

          {/* Filters */}
          <div>
            <label htmlFor="filter-client">Klant</label>
            <select
              id="filter-client"
              value={filterClient}
              onChange={(e) => handleFilterClientChange(e.target.value)}
            >
              <option value="">Alle klanten</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>

            <label htmlFor="filter-project">Project</label>
            <select
              id="filter-project"
              value={filterProject}
              onChange={(e) => handleFilterProjectChange(e.target.value)}
              disabled={!filterClient}
            >
              <option value="">Alle projecten</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* CTA: + Entry */}
          <button onClick={openEntryModal}>
            + Entry
          </button>
        </div>
      </div>

      {/* Timer */}
      <div>
        <Timer
          onStop={handleTimerStop}
          onSetup={() => setTimerSetupOpen(true)}
          clients={clients}
          projects={allProjects}
        />
      </div>

      {/* Weekoverzicht */}
      <div>
        <div>
          <h2>Week Overzicht</h2>
          <div>
            <span>Week totaal: {formatDuration(calculateWeekTotal())}</span>
          </div>
        </div>

        <div>
          {weekDays.map((day) => {
            const dayStr = format(day, "yyyy-MM-dd");
            const dayEntries = entriesByDate[dayStr] || [];
            const dayTotal = dayEntries.reduce(
              (sum, e) => sum + e.duration_minutes,
              0
            );

            return (
              <div key={dayStr}>
                <div>
                  <h3>{format(day, "EEEE d MMMM", { locale: nl })}</h3>
                  <div>
                    <span>Totaal: {formatDuration(dayTotal)}</span>
                  </div>
                </div>
                {dayEntries.length === 0 ? (
                  <div>
                    <p>Geen entries voor deze dag</p>
                  </div>
                ) : (
                  <div>
                    <table>
                      <thead>
                        <tr>
                          <th>Project</th>
                          <th>Omschrijving</th>
                          <th>Duur</th>
                          <th>Acties</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dayEntries.map((entry) => (
                          <tr key={entry.id}>
                            <td>{entry.projects.name}</td>
                            <td>{entry.description}</td>
                            <td>{formatDuration(entry.duration_minutes)}</td>
                            <td>
                              <button onClick={() => handleDelete(entry.id)}>
                                Verwijderen
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Entry Modal */}
      {entryModalOpen && (
        <div>
          <div>
            <div>
              <div>{editingEntry ? "Entry bewerken" : "Nieuwe Entry"}</div>
              <button onClick={() => setEntryModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div>
                <label htmlFor="entry-date">Datum *</label>
                <input
                  id="entry-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="entry-client">Klant *</label>
                <select
                  id="entry-client"
                  value={selectedClient}
                  onChange={(e) => handleClientChange(e.target.value)}
                  required
                >
                  <option value="">Selecteer klant</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="entry-project">Project *</label>
                <select
                  id="entry-project"
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  required
                  disabled={!selectedClient}
                >
                  <option value="">Selecteer project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="entry-description">Omschrijving *</label>
                <input
                  id="entry-description"
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  placeholder="Wat heb je gedaan?"
                />
              </div>

              <div>
                <label htmlFor="entry-duration-value">Duur *</label>
                <input
                  id="entry-duration-value"
                  type="number"
                  step="0.25"
                  min="0"
                  value={durationValue}
                  onChange={(e) => setDurationValue(e.target.value)}
                  required
                  placeholder="1.5"
                />
                <select
                  id="entry-duration-unit"
                  value={durationUnit}
                  onChange={(e) => setDurationUnit(e.target.value)}
                  required
                >
                  <option value="minutes">Minuten</option>
                  <option value="quarter">Kwartier</option>
                  <option value="hour">Uur</option>
                  <option value="day">Dag</option>
                </select>
              </div>

              {selectedProject && durationValue && (
                <div>
                  <div>
                    Afronding preview:
                  </div>
                  <div>
                    Invoer: {durationValue} {durationUnit}
                  </div>
                  <div>
                    Wordt: {formatDuration(
                      applyRounding(
                        parseFloat(durationValue) * (durationUnit === "minutes" ? 1 : durationUnit === "quarter" ? 15 : durationUnit === "hour" ? 60 : 480),
                        getProjectRoundingRule(selectedProject)
                      )
                    )} ({getProjectRoundingRule(selectedProject)})
                  </div>
                </div>
              )}

              <div>
                <button type="button" onClick={() => setEntryModalOpen(false)}>
                  Annuleren
                </button>
                <button type="submit" disabled={loading}>
                  {loading ? "Opslaan..." : "Opslaan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
    </div>
  );
}
